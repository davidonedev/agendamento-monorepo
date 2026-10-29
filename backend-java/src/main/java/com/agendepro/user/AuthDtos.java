package com.agendepro.user;

import com.agendepro.tenant.TenantPlan;
import com.agendepro.tenant.TenantStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/** DTOs de /api/auth/** — porta de auth.controller.ts. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "E-mail inválido") @Email(message = "E-mail inválido") String email,
            @NotBlank(message = "Senha obrigatória") String password
    ) {
    }

    public record TenantSummary(UUID id, String slug, String name, TenantStatus status, TenantPlan plan) {
    }

    public record UserSummary(
            UUID id, String name, String email, UserRole role,
            UUID tenantId, UUID professionalId, TenantSummary tenant
    ) {
    }

    public record LoginResponse(String token, UserSummary user) {
    }

    public record MeTenantSummary(
            UUID id, String slug, String name, TenantStatus status, TenantPlan plan,
            String primaryColor, String adminColor, String logoUrl
    ) {
    }

    public record MeResponse(
            UUID id, String name, String email, UserRole role,
            UUID tenantId, UUID professionalId, MeTenantSummary tenant
    ) {
    }

    public record UpdateMeRequest(
            @Size(min = 2, message = "Nome deve ter ao menos 2 caracteres") String name,
            @Email(message = "E-mail inválido") String email
    ) {
    }

    public record UpdateMeResponse(UUID id, String name, String email, UserRole role, UUID tenantId, UUID professionalId) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 6, message = "Nova senha deve ter no mínimo 6 caracteres") String newPassword
    ) {
    }

    public record MessageResponse(String message) {
    }
}
