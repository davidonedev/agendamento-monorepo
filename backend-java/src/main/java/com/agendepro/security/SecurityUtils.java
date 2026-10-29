package com.agendepro.security;

import com.agendepro.common.AppException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Acesso ao usuário autenticado corrente — porta do padrão
 * {@code (req as AuthRequest).user} usado em todos os controllers do backend Node.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static AuthenticatedUser currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser user)) {
            throw AppException.unauthorized("Não autenticado", "UNAUTHORIZED");
        }
        return user;
    }

    /** Porta de resolveTenantId() (appointment.controller.ts) — nunca aceita tenantId externo. */
    public static UUID requireTenantId() {
        UUID tenantId = currentUser().tenantId();
        if (tenantId == null) {
            throw new AppException("Tenant não identificado no token", 400, "MISSING_TENANT");
        }
        return tenantId;
    }

    public static UUID requireProfessionalId() {
        UUID professionalId = currentUser().professionalId();
        if (professionalId == null) {
            throw new AppException("Profissional não identificado no token", 400, "MISSING_PROFESSIONAL");
        }
        return professionalId;
    }
}
