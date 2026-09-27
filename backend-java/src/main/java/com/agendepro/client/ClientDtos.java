package com.agendepro.client;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** DTOs de clientes (área admin) — porta de client.controller.ts. Nunca expõe passwordHash. */
public final class ClientDtos {

    private ClientDtos() {
    }

    public record ClientResponse(UUID id, UUID tenantId, String name, String email, String phone,
                                  Boolean emailVerified, Instant createdAt, Instant updatedAt, Long appointmentCount) {
        public static ClientResponse from(Client c) {
            return from(c, null);
        }

        public static ClientResponse from(Client c, Long appointmentCount) {
            return new ClientResponse(c.getId(), c.getTenantId(), c.getName(), c.getEmail(), c.getPhone(),
                    c.getEmailVerified(), c.getCreatedAt(), c.getUpdatedAt(), appointmentCount);
        }
    }

    public record ServiceRef(UUID id, String name, Integer duration, Double price) {
    }

    public record ProfessionalRef(UUID id, String name, String specialty) {
    }

    public record AppointmentHistoryItem(UUID id, String date, String startTime, String endTime,
                                          String status, Double price, String notes,
                                          ServiceRef service, ProfessionalRef professional) {
    }

    public record ClientDetailResponse(UUID id, UUID tenantId, String name, String email, String phone,
                                        Boolean emailVerified, Instant createdAt, Instant updatedAt,
                                        List<AppointmentHistoryItem> appointments) {
    }

    public record ClientCreateRequest(
            @NotBlank @Size(min = 2, max = 100) String name,
            @NotBlank @Email String email,
            String phone
    ) {
    }

    public record ClientUpdateRequest(
            @Size(min = 2, max = 100) String name,
            @Email String email,
            String phone
    ) {
    }
}
