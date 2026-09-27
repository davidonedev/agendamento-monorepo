package com.agendepro.appointment;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.agendepro.common.AppException;

public enum AppointmentStatus {
    PENDING("pending"),
    CONFIRMED("confirmed"),
    COMPLETED("completed"),
    CANCELLED("cancelled"),
    NO_SHOW("no_show");

    private final String value;

    AppointmentStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static AppointmentStatus fromValue(String value) {
        for (AppointmentStatus s : values()) {
            if (s.value.equals(value)) return s;
        }
        throw new AppException("Status de agendamento inválido: " + value, 400);
    }
}
