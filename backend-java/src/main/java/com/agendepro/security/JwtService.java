package com.agendepro.security;

import com.agendepro.user.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Geração e validação de JWT — porta de jsonwebtoken (jwt.sign/jwt.verify) usado em
 * auth.middleware.ts e auth.controller.ts. Mesmas claims: sub, role, tenantId,
 * professionalId.
 */
@Component
public class JwtService {

    private static final Pattern DURATION_PATTERN = Pattern.compile("^(\\d+)([smhd])$");

    private final SecretKey key;
    private final Duration expiresIn;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expires-in}") String expiresIn
    ) {
        // Node usa o segredo como string UTF-8 crua com HS256 — HMAC-SHA aceita chaves
        // de qualquer tamanho, então isso é compatível byte a byte.
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiresIn = parseDuration(expiresIn);
    }

    public String generateToken(AuthenticatedUser user) {
        Instant now = Instant.now();
        var builder = Jwts.builder()
                .subject(user.userId().toString())
                .claim("role", user.role().getValue())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiresIn)))
                .signWith(key, Jwts.SIG.HS256);

        if (user.tenantId() != null) builder.claim("tenantId", user.tenantId().toString());
        if (user.professionalId() != null) builder.claim("professionalId", user.professionalId().toString());

        return builder.compact();
    }

    public AuthenticatedUser parseToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            UUID userId = UUID.fromString(claims.getSubject());
            UserRole role = UserRole.fromValue(claims.get("role", String.class));
            UUID tenantId = claims.get("tenantId", String.class) != null
                    ? UUID.fromString(claims.get("tenantId", String.class)) : null;
            UUID professionalId = claims.get("professionalId", String.class) != null
                    ? UUID.fromString(claims.get("professionalId", String.class)) : null;

            return new AuthenticatedUser(userId, role, tenantId, professionalId);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new InvalidTokenException("Token inválido ou expirado", ex);
        }
    }

    /** Aceita o mesmo formato usado em JWT_EXPIRES_IN do Node (ex: "7d", "24h", "30m"). */
    private static Duration parseDuration(String raw) {
        Matcher m = DURATION_PATTERN.matcher(raw.trim());
        if (!m.matches()) {
            throw new IllegalArgumentException(
                    "app.jwt.expires-in inválido: '" + raw + "' — use o formato <número><s|m|h|d>, ex: 7d");
        }
        long amount = Long.parseLong(m.group(1));
        return switch (m.group(2)) {
            case "s" -> Duration.ofSeconds(amount);
            case "m" -> Duration.ofMinutes(amount);
            case "h" -> Duration.ofHours(amount);
            case "d" -> Duration.ofDays(amount);
            default -> throw new IllegalStateException("unreachable");
        };
    }

    public static class InvalidTokenException extends RuntimeException {
        public InvalidTokenException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
