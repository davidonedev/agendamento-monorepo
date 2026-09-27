package com.agendepro.tenant;

import com.agendepro.appointment.AppointmentDtos;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** DTOs de tenant — porta de tenant.controller.ts. */
public final class TenantDtos {

    private TenantDtos() {
    }

    public record TenantResponse(
            UUID id, String slug, String name, String ownerName, String email, String phone, String address,
            TenantStatus status, TenantPlan plan, Double monthlyPrice, String primaryColor, String adminColor,
            String logoUrl, String bannerUrl, Boolean isOpen, Integer minAdvanceMinutes,
            String whatsappApiUrl, String whatsappApiKey, String whatsappInstance, String whatsappTemplate,
            Instant createdAt, Instant updatedAt
    ) {
        public static TenantResponse from(Tenant t) {
            return new TenantResponse(t.getId(), t.getSlug(), t.getName(), t.getOwnerName(), t.getEmail(),
                    t.getPhone(), t.getAddress(), t.getStatus(), t.getPlan(), t.getMonthlyPrice(),
                    t.getPrimaryColor(), t.getAdminColor(), t.getLogoUrl(), t.getBannerUrl(), t.getIsOpen(),
                    t.getMinAdvanceMinutes(), t.getWhatsappApiUrl(), t.getWhatsappApiKey(), t.getWhatsappInstance(),
                    t.getWhatsappTemplate(), t.getCreatedAt(), t.getUpdatedAt());
        }
    }

    public record TenantCounts(long professionals, long services, long clients, long appointments) {
    }

    /**
     * Porta exata de `res.json({success:true, data: tenant})` em getMyTenant()
     * (tenant.controller.ts), onde `tenant` vem de `prisma.tenant.findUnique({include:{_count:...}})`
     * — ou seja, os campos do tenant FLAT no nível raiz do objeto, com `_count` como
     * mais uma propriedade (não aninhado sob "tenant"/"counts"). O frontend
     * (getMyTenantApi) espera exatamente esse formato; aninhar quebra a tela de admin.
     */
    public record TenantWithCountsResponse(
            UUID id, String slug, String name, String ownerName, String email, String phone, String address,
            TenantStatus status, TenantPlan plan, Double monthlyPrice, String primaryColor, String adminColor,
            String logoUrl, String bannerUrl, Boolean isOpen, Integer minAdvanceMinutes,
            String whatsappApiUrl, String whatsappApiKey, String whatsappInstance, String whatsappTemplate,
            Instant createdAt, Instant updatedAt,
            @JsonProperty("_count") TenantCounts count
    ) {
        public static TenantWithCountsResponse from(Tenant t, TenantCounts counts) {
            return new TenantWithCountsResponse(t.getId(), t.getSlug(), t.getName(), t.getOwnerName(), t.getEmail(),
                    t.getPhone(), t.getAddress(), t.getStatus(), t.getPlan(), t.getMonthlyPrice(),
                    t.getPrimaryColor(), t.getAdminColor(), t.getLogoUrl(), t.getBannerUrl(), t.getIsOpen(),
                    t.getMinAdvanceMinutes(), t.getWhatsappApiUrl(), t.getWhatsappApiKey(), t.getWhatsappInstance(),
                    t.getWhatsappTemplate(), t.getCreatedAt(), t.getUpdatedAt(), counts);
        }
    }

    public record UpdateSettingsRequest(
            @Size(min = 2) String name,
            @Size(min = 2) String ownerName,
            String phone,
            String address,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String primaryColor,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String adminColor,
            String logoUrl,
            String bannerUrl,
            Boolean isOpen,
            @Min(0) @Max(1440) Integer minAdvanceMinutes,
            String whatsappApiUrl,
            String whatsappApiKey,
            String whatsappInstance,
            @Size(max = 2000) String whatsappTemplate
    ) {
    }

    public record DashboardStats(long pending, long confirmed, long completed, long totalClients, double totalRevenue) {
    }

    public record DashboardToday(List<AppointmentDtos.AppointmentResponse> appointments, double revenue) {
    }

    public record DashboardResponse(DashboardToday today, DashboardStats stats) {
    }

    public record GroupStat(String name, double revenue, long count) {
    }

    public record RevenueResponse(double total, long count, Map<String, Double> byDate,
                                   List<GroupStat> byService, List<GroupStat> byProfessional) {
    }
}
