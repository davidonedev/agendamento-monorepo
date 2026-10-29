package com.agendepro.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class ServiceCategoryDtos {

    private ServiceCategoryDtos() {
    }

    public record CategoryRequest(@NotBlank @Size(min = 1, max = 60) String name) {
    }

    public record CategoryResponse(UUID id, UUID tenantId, String name, Instant createdAt) {
        public static CategoryResponse from(ServiceCategory c) {
            return new CategoryResponse(c.getId(), c.getTenantId(), c.getName(), c.getCreatedAt());
        }
    }
}
