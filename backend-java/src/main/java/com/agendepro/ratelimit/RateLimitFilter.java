package com.agendepro.ratelimit;

import com.agendepro.common.ClientIp;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Porta de express-rate-limit (app.ts): 20 requisições / 15 min em /api/auth/**,
 * 200 requisições / min no restante de /api/**. Um "bucket" por IP de origem, em
 * memória (equivalente ao MemoryStore default do express-rate-limit).
 *
 * Rotas sensíveis (login, esqueci a senha, reset...) podem ter um limite próprio,
 * mais restrito, aplicado além do limite geral de /api/auth (ver {@link #withRouteLimit}).
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> apiBuckets = new ConcurrentHashMap<>();
    private final Map<String, RouteLimit> routeLimits = new LinkedHashMap<>();

    private final int authCapacity;
    private final Duration authRefill;
    private final int apiCapacity;
    private final Duration apiRefill;

    private record RouteLimit(int capacity, Duration refill, String message, Map<String, Bucket> buckets) {
    }

    public RateLimitFilter(int authCapacity, int authRefillMinutes, int apiCapacity, int apiRefillMinutes) {
        this.authCapacity = authCapacity;
        this.authRefill = Duration.ofMinutes(authRefillMinutes);
        this.apiCapacity = apiCapacity;
        this.apiRefill = Duration.ofMinutes(apiRefillMinutes);
    }

    /** Limite adicional para uma rota exata (POST), por IP. */
    public RateLimitFilter withRouteLimit(String path, int capacity, int refillMinutes) {
        routeLimits.put(path, new RouteLimit(capacity, Duration.ofMinutes(refillMinutes),
                "Muitas tentativas. Tente novamente em " + refillMinutes + " minutos.", new ConcurrentHashMap<>()));
        return this;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        String ip = ClientIp.of(request);

        RouteLimit routeLimit = "POST".equalsIgnoreCase(request.getMethod()) ? routeLimits.get(path) : null;
        if (routeLimit != null
                && !bucketFor(routeLimit.buckets(), ip, routeLimit.capacity(), routeLimit.refill()).tryConsume(1)) {
            reject(response, routeLimit.message());
            return;
        }

        if (path.startsWith("/api/auth")) {
            if (!bucketFor(authBuckets, ip, authCapacity, authRefill).tryConsume(1)) {
                reject(response, "Muitas tentativas. Tente novamente em 15 minutos.");
                return;
            }
        } else if (path.startsWith("/api")) {
            if (!bucketFor(apiBuckets, ip, apiCapacity, apiRefill).tryConsume(1)) {
                reject(response, "Limite de requisições atingido.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private Bucket bucketFor(Map<String, Bucket> store, String ip, int capacity, Duration refill) {
        return store.computeIfAbsent(ip, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(capacity, Refill.intervally(capacity, refill)))
                .build());
    }

    private void reject(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(Map.of("error", message)));
    }
}
