package com.agendepro.tenant;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.agendepro.common.AppException;

public enum TenantStatus {
    ACTIVE("active"),
    TRIAL("trial"),
    SUSPENDED("suspended");

    private final String value;

    TenantStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static TenantStatus fromValue(String value) {
        for (TenantStatus s : values()) {
            if (s.value.equals(value)) return s;
        }
        throw new AppException("Status de tenant inválido: " + value, 400);
    }
}
