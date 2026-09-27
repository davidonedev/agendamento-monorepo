package com.agendepro.tenant;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.agendepro.common.AppException;

public enum TenantPlan {
    BASIC("basic"),
    PRO("pro"),
    ENTERPRISE("enterprise");

    private final String value;

    TenantPlan(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static TenantPlan fromValue(String value) {
        for (TenantPlan p : values()) {
            if (p.value.equals(value)) return p;
        }
        throw new AppException("Plano inválido: " + value, 400);
    }
}
