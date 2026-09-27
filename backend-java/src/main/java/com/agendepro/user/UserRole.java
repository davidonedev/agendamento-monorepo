package com.agendepro.user;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.agendepro.common.AppException;

/**
 * Espelha o enum {@code UserRole} do schema.prisma. O valor de fio (JSON e coluna no
 * banco) é o mesmo snake_case que o frontend já consome ("super_admin", "tenant_admin",
 * "professional") — ver {@link UserRoleConverter}.
 */
public enum UserRole {
    SUPER_ADMIN("super_admin"),
    TENANT_ADMIN("tenant_admin"),
    PROFESSIONAL("professional");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    /** Nome da authority Spring Security equivalente, ex: ROLE_TENANT_ADMIN. */
    public String authority() {
        return "ROLE_" + name();
    }

    @JsonCreator
    public static UserRole fromValue(String value) {
        for (UserRole r : values()) {
            if (r.value.equals(value)) return r;
        }
        throw new AppException("Role inválida: " + value, 400);
    }
}
