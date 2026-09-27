package com.agendepro.publicapi;

import com.agendepro.appointment.AppointmentDtos;
import com.agendepro.professional.ProfessionalDtos;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.tenant.TenantStatus;
import jakarta.validation.constraints.*;

import java.util.List;
import java.util.UUID;

/** DTOs do portal público — porta de public.controller.ts. */
public final class PublicDtos {

    private PublicDtos() {
    }

    // ─── login-data ───────────────────────────────────────────────────────────────

    public record LoginDataUser(UUID id, String name, String email, String role) {
    }

    public record LoginDataProfessionalUser(String email) {
    }

    public record LoginDataProfessional(UUID id, String name, String specialty, List<LoginDataProfessionalUser> users) {
    }

    public record LoginDataTenant(UUID id, String name, String slug, TenantPlan plan, TenantStatus status,
                                   List<LoginDataUser> users, List<LoginDataProfessional> professionals) {
    }

    // ─── tenant público ───────────────────────────────────────────────────────────

    public record TenantPublicResponse(UUID id, String slug, String name, String primaryColor, String logoUrl,
                                        String bannerUrl, Boolean isOpen, TenantStatus status, String address,
                                        String phone, Integer minAdvanceMinutes) {
    }

    // ─── profissionais públicos ───────────────────────────────────────────────────

    public record ProfessionalPublicResponse(UUID id, String name, String specialty, String avatar, String photoUrl,
                                              String bio, List<Integer> workingDays, String workingHoursStart,
                                              String workingHoursEnd, List<ProfessionalDtos.ServiceLinkSummary> services) {
    }

    // ─── booking ────────────────────────────────────────────────────────────────

    public record BookingRequest(
            @NotBlank String professionalId,
            String serviceId,
            List<String> serviceIds,
            @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String date,
            @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}(:\\d{2})?$") String startTime,
            @NotBlank @Size(min = 2, max = 100) String clientName,
            @NotBlank @Email String clientEmail,
            String clientPhone,
            @Size(max = 500) String notes
    ) {
        public List<UUID> resolveServiceIds() {
            if (serviceIds != null && !serviceIds.isEmpty()) return serviceIds.stream().map(UUID::fromString).toList();
            if (serviceId != null) return List.of(UUID.fromString(serviceId));
            throw new com.agendepro.common.AppException("serviceId ou serviceIds é obrigatório", 400);
        }

        public String startTimeHHmm() {
            return startTime.length() >= 5 ? startTime.substring(0, 5) : startTime;
        }
    }

    // ─── cliente ────────────────────────────────────────────────────────────────

    public record ClientLoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record ClientAuthResponse(UUID id, String name, String email, String phone) {
    }

    public record ClientRegisterRequest(
            @NotBlank @Size(min = 2, max = 100) String name,
            @NotBlank @Email String email,
            String phone,
            @NotBlank @Size(min = 6) String password
    ) {
    }

    public record GoogleAuthRequest(@NotBlank String accessToken) {
    }

    public record RegisterAndBookRequest(
            @NotBlank @Size(min = 2, max = 100) String name,
            @NotBlank @Email String email,
            @NotBlank String phone,
            @NotBlank @Size(min = 6) String password,
            @NotBlank String professionalId,
            @NotEmpty List<@NotBlank String> serviceIds,
            @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String date,
            @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}(:\\d{2})?$") String startTime,
            @Size(max = 500) String notes
    ) {
        public String startTimeHHmm() {
            return startTime.length() >= 5 ? startTime.substring(0, 5) : startTime;
        }
    }

    public record RegisterAndBookResponse(List<AppointmentDtos.AppointmentResponse> appointments, String message, String phone) {
    }

    public record ProfessionalRegisterRequest(
            @NotBlank @Size(min = 2, max = 100) String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            @NotBlank @Size(min = 2, max = 100) String specialty,
            @Size(max = 500) String bio,
            String workingHoursStart,
            String workingHoursEnd,
            List<Integer> workingDays
    ) {
        public ProfessionalRegisterRequest {
            workingHoursStart = (workingHoursStart == null || workingHoursStart.isBlank()) ? "08:00" : workingHoursStart;
            workingHoursEnd = (workingHoursEnd == null || workingHoursEnd.isBlank()) ? "18:00" : workingHoursEnd;
            workingDays = workingDays == null ? List.of(1, 2, 3, 4, 5) : workingDays;
        }
    }

    public record ProfessionalRegisterResponse(String name, String email) {
    }

    public record CancelBookingRequest(@NotNull UUID clientId) {
    }

    public record ResendVerificationRequest(@NotBlank @Email String email) {
    }

    public record BusinessRegisterRequest(
            @NotBlank @Size(min = 2, max = 100) String ownerName,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            String phone,
            @NotBlank @Size(min = 2, max = 120) String businessName,
            String address,
            @Size(min = 2, max = 60) @Pattern(regexp = "^[a-z0-9-]+$", message = "Use apenas letras minúsculas, números e hífens") String slug
    ) {
    }

    public record BusinessRegisterResponse(String message, String slug) {
    }

    public record MessageResponse(String message) {
    }
}
