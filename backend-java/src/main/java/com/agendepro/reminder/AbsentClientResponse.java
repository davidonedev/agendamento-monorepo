package com.agendepro.reminder;

import java.time.Instant;
import java.util.UUID;

/** Porta do retorno de listAbsentClients (reminder.controller.ts). */
public record AbsentClientResponse(
        UUID id, String name, String phone, String email, Instant createdAt,
        String lastAppointmentDate, String lastServiceName, Long daysMissing
) {
}
