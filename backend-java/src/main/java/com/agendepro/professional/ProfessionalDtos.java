package com.agendepro.professional;

import com.agendepro.catalog.ServiceOfferingDtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/** DTOs de profissionais — porta de professional.controller.ts + trechos de professional.routes.ts. */
public final class ProfessionalDtos {

    private ProfessionalDtos() {
    }

    public record ServiceLinkSummary(UUID professionalId, UUID serviceId, ServiceOfferingDtos.ServiceResponse service) {
    }

    public record ProfessionalResponse(
            UUID id, UUID tenantId, String name, String specialty, String avatar, String photoUrl, String bio,
            String workingHoursStart, String workingHoursEnd, List<Integer> workingDays,
            List<ServiceLinkSummary> services, Long appointmentCount
    ) {
    }

    public record ProfessionalDetailResponse(
            UUID id, UUID tenantId, String name, String specialty, String avatar, String photoUrl, String bio,
            String workingHoursStart, String workingHoursEnd, List<Integer> workingDays,
            List<ServiceLinkSummary> services, List<RecentAppointment> appointments
    ) {
    }

    public record RecentAppointment(
            UUID id, String date, String startTime, String endTime, String status, Double price,
            ClientBasic client, ServiceOfferingDtos.ServiceResponse service
    ) {
    }

    /** Resumo mínimo do cliente, só para não acoplar este domínio ao pacote client. */
    public record ClientBasic(UUID id, String name, String email, String phone) {
    }

    /** Campos com default — porta de professionalSchema (com z.preprocess/.default) do Node. */
    public record ProfessionalCreateRequest(
            @Size(min = 2, max = 100) String name,
            @Size(max = 100) String specialty,
            @Size(max = 500) String bio,
            String avatar,
            String photoUrl,
            String workingHoursStart,
            String workingHoursEnd,
            List<Integer> workingDays,
            List<UUID> serviceIds,
            @Email String email,
            @Size(min = 4) String password
    ) {
        public ProfessionalCreateRequest {
            specialty = specialty == null ? "" : specialty;
            bio = bio == null ? "" : bio;
            avatar = avatar == null ? "" : avatar;
            workingHoursStart = normalizeTime(workingHoursStart, "08:00");
            workingHoursEnd = normalizeTime(workingHoursEnd, "18:00");
            workingDays = workingDays == null ? List.of(1, 2, 3, 4, 5) : workingDays;
            serviceIds = serviceIds == null ? List.of() : serviceIds;
        }
    }

    public record ProfessionalUpdateRequest(
            @Size(min = 2, max = 100) String name,
            @Size(max = 100) String specialty,
            @Size(max = 500) String bio,
            String avatar,
            String photoUrl,
            String workingHoursStart,
            String workingHoursEnd,
            List<Integer> workingDays,
            List<UUID> serviceIds,
            @Email String email,
            @Size(min = 4) String password
    ) {
        public ProfessionalUpdateRequest {
            workingHoursStart = workingHoursStart == null ? null : normalizeTime(workingHoursStart, null);
            workingHoursEnd = workingHoursEnd == null ? null : normalizeTime(workingHoursEnd, null);
        }
    }

    /** Porta de updateMeSchema (professional.routes.ts) — auto-atualização do profissional. */
    public record ProfessionalSelfUpdateRequest(
            List<@Min(0) @Max(6) Integer> workingDays,
            String workingHoursStart,
            String workingHoursEnd,
            @Size(max = 500) String bio,
            @Size(max = 100) String specialty,
            String avatar,
            String photoUrl
    ) {
    }

    /** Aceita HH:MM ou HH:MM:SS (alguns navegadores mobile retornam com segundos). */
    static String normalizeTime(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return value.length() >= 5 ? value.substring(0, 5) : value;
    }
}
