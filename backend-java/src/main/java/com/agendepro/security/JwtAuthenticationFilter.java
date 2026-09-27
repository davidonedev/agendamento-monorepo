package com.agendepro.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Porta de {@code authenticate()} (middleware/auth.middleware.ts). Só define o
 * usuário autenticado no SecurityContext quando há um Bearer token válido; nunca
 * bloqueia a requisição sozinho — isso fica a cargo do SecurityConfig + RestAuthEntryPoint,
 * para que rotas públicas com um header Authorization inválido continuem funcionando
 * (mesmo comportamento do Express, onde o middleware só roda nas rotas protegidas).
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** Marcado na request quando havia um Bearer token mas ele era inválido/expirado —
     *  lido pelo RestAuthEntryPoint para distinguir UNAUTHORIZED de INVALID_TOKEN. */
    public static final String INVALID_TOKEN_ATTRIBUTE = "com.agendepro.security.INVALID_TOKEN";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                AuthenticatedUser user = jwtService.parseToken(token);
                var authorities = List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority(user.role().authority()));
                var authentication = new UsernamePasswordAuthenticationToken(user, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtService.InvalidTokenException ex) {
                request.setAttribute(INVALID_TOKEN_ATTRIBUTE, Boolean.TRUE);
            }
        }

        filterChain.doFilter(request, response);
    }
}
