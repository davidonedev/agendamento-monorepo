package com.agendepro.superadmin;

import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.tenant.TenantStatus;
import com.agendepro.user.UserRole;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class SuperAdminDtos {

    private SuperAdminDtos() {
    }

    public record ProfessionalAppointmentCount(long appointments) {
    }

    public record ProfessionalRef(UUID id, String name, String specialty, String avatar,
                                   @JsonProperty("_count") ProfessionalAppointmentCount count) {
    }

    public record ServiceRef(UUID id, String name, Double price, Integer duration, String category) {
    }

    public record PeriodStat(long count, double revenue) {
    }

    public record AppointmentStats(PeriodStat today, PeriodStat month, PeriodStat year) {
    }

    public record DetailCounts(long appointments, long clients) {
    }

    /**
     * Porta exata de getTenant() (super.controller.ts): `res.json({data: {...tenant,
     * appointmentStats}})`, onde `tenant` já veio do Prisma com `professionals`,
     * `services` e `_count` (só appointments+clients) aninhados — tudo no nível raiz
     * do objeto, nunca sob uma chave "tenant" separada (isso quebra o frontend).
     */
    public record TenantDetailResponse(
            UUID id, String slug, String name, String ownerName, String email, String phone, String address,
            TenantStatus status, TenantPlan plan, Double monthlyPrice, String primaryColor, String adminColor,
            String logoUrl, String bannerUrl, Boolean isOpen, Integer minAdvanceMinutes,
            String whatsappApiUrl, String whatsappApiKey, String whatsappInstance, String whatsappTemplate,
            Instant createdAt, Instant updatedAt,
            List<ProfessionalRef> professionals, List<ServiceRef> services,
            @JsonProperty("_count") DetailCounts count,
            AppointmentStats appointmentStats
    ) {
        public static TenantDetailResponse from(Tenant t, List<ProfessionalRef> professionals, List<ServiceRef> services,
                                                 DetailCounts counts, AppointmentStats stats) {
            return new TenantDetailResponse(t.getId(), t.getSlug(), t.getName(), t.getOwnerName(), t.getEmail(),
                    t.getPhone(), t.getAddress(), t.getStatus(), t.getPlan(), t.getMonthlyPrice(),
                    t.getPrimaryColor(), t.getAdminColor(), t.getLogoUrl(), t.getBannerUrl(), t.getIsOpen(),
                    t.getMinAdvanceMinutes(), t.getWhatsappApiUrl(), t.getWhatsappApiKey(), t.getWhatsappInstance(),
                    t.getWhatsappTemplate(), t.getCreatedAt(), t.getUpdatedAt(), professionals, services, counts, stats);
        }
    }

    public record CreateTenantRequest(
            @NotBlank @Size(min = 2, max = 50) @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug deve conter apenas letras minúsculas, números e hífens") String slug,
            @NotBlank @Size(min = 2, max = 100) String name,
            @NotBlank @Size(min = 2, max = 100) String ownerName,
            @NotBlank @Email String email,
            String phone,
            String address,
            TenantPlan plan,
            @PositiveOrZero Double monthlyPrice,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String primaryColor,
            @NotBlank @Size(min = 6, message = "Senha do admin deve ter no mínimo 6 caracteres") String adminPassword
    ) {
        public CreateTenantRequest {
            plan = plan == null ? TenantPlan.BASIC : plan;
            monthlyPrice = monthlyPrice == null ? 0 : monthlyPrice;
            primaryColor = primaryColor == null ? "#3B82F6" : primaryColor;
        }
    }

    public record UpdateTenantRequest(
            @Size(min = 2) String name,
            @Size(min = 2) String ownerName,
            String phone,
            String address,
            TenantStatus status,
            TenantPlan plan,
            @PositiveOrZero Double monthlyPrice,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String primaryColor
    ) {
    }

    public record TenantRef(String name, String slug) {
    }

    public record UserListItem(UUID id, String name, String email, UserRole role, UUID tenantId, TenantRef tenant) {
    }

    public record UpdateUserEmailRequest(@NotBlank @Email String email) {
    }

    public record ForcePasswordRequest(@NotBlank @Size(min = 6) String newPassword) {
    }

    public record UpdatePlanConfigRequest(
            @Size(min = 1, max = 50) String displayName,
            @PositiveOrZero Double defaultPrice,
            @Min(-1) Integer maxProfessionals,
            @Min(-1) Integer maxServices,
            List<String> features
    ) {
    }

    public record PlanConfigResponse(UUID id, TenantPlan plan, String displayName, Double defaultPrice,
                                      Integer maxProfessionals, Integer maxServices, List<String> features) {
        public static PlanConfigResponse from(PlanConfig c) {
            return new PlanConfigResponse(c.getId(), c.getPlan(), c.getDisplayName(), c.getDefaultPrice(),
                    c.getMaxProfessionals(), c.getMaxServices(), c.featureList());
        }
    }

    public record Totals(long tenants, long professionals, long clients, long appointments, long completedAppointments) {
    }

    public record TenantsByStatus(long active, long trial, long suspended) {
    }

    public record RevenueSummary(double total, double mrr) {
    }

    public record PlatformMetricsResponse(Totals totals, TenantsByStatus tenantsByStatus,
                                           Map<String, Long> tenantsByPlan, RevenueSummary revenue) {
    }
}
