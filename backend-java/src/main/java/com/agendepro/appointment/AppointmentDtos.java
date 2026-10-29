package com.agendepro.appointment;

import com.agendepro.catalog.ServiceOfferingDtos;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** DTOs de agendamento — porta de appointment.controller.ts. */
public final class AppointmentDtos {

    private AppointmentDtos() {
    }

    /** Sem passwordHash — nunca exposto na API (o Node original inclui o registro Client
     *  inteiro via Prisma `include`, o que vazaria o hash; aqui isso é corrigido). */
    public record ClientSummary(UUID id, UUID tenantId, String name, String email, String phone,
                                 Boolean emailVerified, Instant createdAt, Instant updatedAt) {
    }

    public record ProfessionalSummary(UUID id, UUID tenantId, String name, String specialty, String avatar,
                                       String photoUrl, String bio, String workingHoursStart, String workingHoursEnd,
                                       List<Integer> workingDays, Instant createdAt, Instant updatedAt) {
    }

    public record AppointmentResponse(
            UUID id, UUID tenantId, UUID clientId, UUID professionalId, UUID serviceId,
            String date, String startTime, String endTime, AppointmentStatus status, Double price, String notes,
            Instant createdAt, Instant updatedAt,
            ClientSummary client, ProfessionalSummary professional, ServiceOfferingDtos.ServiceResponse service
    ) {
    }

    public record AppointmentCreateRequest(
            UUID clientId,
            @Size(min = 2) String clientName,
            @Email String clientEmail,
            String clientPhone,
            @NotNull UUID professionalId,
            @NotNull UUID serviceId,
            @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Formato: YYYY-MM-DD") String date,
            @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}(:\\d{2})?$", message = "Formato: HH:mm") String startTime,
            @Size(max = 500) String notes
    ) {
        public String startTimeHHmm() {
            return startTime.length() >= 5 ? startTime.substring(0, 5) : startTime;
        }
    }

    public record UpdateStatusRequest(@NotNull AppointmentStatus status) {
    }
}
