package com.agendepro.security;

import com.agendepro.user.UserRole;

import java.util.UUID;

/**
 * Payload do JWT já decodificado — porta de {@code JwtPayload}/{@code AuthRequest.user}
 * (types/index.ts) do backend Node. É o principal guardado no SecurityContext depois
 * que o {@link JwtAuthenticationFilter} valida o token. {@code tokenVersion} é comparado
 * com {@code users.token_version} para permitir revogar sessões (reset de senha etc.).
 */
public record AuthenticatedUser(
        UUID userId,
        UserRole role,
        UUID tenantId,
        UUID professionalId,
        int tokenVersion
) {
}
