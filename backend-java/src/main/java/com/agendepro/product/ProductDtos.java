package com.agendepro.product;

import jakarta.validation.constraints.*;

import java.util.UUID;

public final class ProductDtos {

    private ProductDtos() {
    }

    public record ProductCreateRequest(
            @NotBlank @Size(min = 2, max = 100) String name,
            @Size(max = 500) String description,
            @NotNull @Positive Double price,
            @Min(0) Integer stock,
            @Min(0) Integer lowStockThreshold,
            @Size(max = 50) String category,
            String imageUrl,
            Boolean isActive
    ) {
        public ProductCreateRequest {
            stock = stock == null ? 0 : stock;
            lowStockThreshold = lowStockThreshold == null ? 5 : lowStockThreshold;
            isActive = isActive == null || isActive;
        }
    }

    public record ProductUpdateRequest(
            @Size(min = 2, max = 100) String name,
            @Size(max = 500) String description,
            @Positive Double price,
            @Min(0) Integer stock,
            @Min(0) Integer lowStockThreshold,
            @Size(max = 50) String category,
            String imageUrl,
            Boolean isActive
    ) {
    }

    public record AdjustStockRequest(@NotNull Integer delta) {
    }

    public record ProductResponse(
            UUID id, UUID tenantId, String name, String description, Double price, Integer stock,
            Integer lowStockThreshold, String category, String imageUrl, Boolean isActive
    ) {
        public static ProductResponse from(Product p) {
            return new ProductResponse(p.getId(), p.getTenantId(), p.getName(), p.getDescription(), p.getPrice(),
                    p.getStock(), p.getLowStockThreshold(), p.getCategory(), p.getImageUrl(), p.getIsActive());
        }
    }
}
