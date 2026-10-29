package com.agendepro.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class ProductCategoryDtos {

    private ProductCategoryDtos() {
    }

    public record CategoryRequest(@NotBlank @Size(min = 1, max = 60) String name) {
    }

    public record CategoryResponse(UUID id, UUID tenantId, String name, Instant createdAt) {
        public static CategoryResponse from(ProductCategory c) {
            return new CategoryResponse(c.getId(), c.getTenantId(), c.getName(), c.getCreatedAt());
        }
    }
}
