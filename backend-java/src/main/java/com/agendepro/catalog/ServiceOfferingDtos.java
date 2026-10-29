package com.agendepro.catalog;

import jakarta.validation.constraints.*;

import java.util.UUID;

/** DTOs do catálogo de serviços — porta de service.controller.ts. */
public final class ServiceOfferingDtos {

    private ServiceOfferingDtos() {
    }

    public record ServiceCreateRequest(
            @NotBlank @Size(min = 2, max = 100) String name,
            @Size(max = 500) String description,
            @NotNull @Positive(message = "Preço deve ser positivo") Double price,
            @NotNull @Positive(message = "Duração deve ser positiva (minutos)") Integer duration,
            @Size(max = 50) String category,
            Boolean isActive
    ) {
    }

    /** Todos os campos opcionais — porta de serviceSchema.partial() (PATCH). */
    public record ServiceUpdateRequest(
            @Size(min = 2, max = 100) String name,
            @Size(max = 500) String description,
            @Positive(message = "Preço deve ser positivo") Double price,
            @Positive(message = "Duração deve ser positiva (minutos)") Integer duration,
            @Size(max = 50) String category,
            Boolean isActive
    ) {
    }

    public record ServiceResponse(
            UUID id, UUID tenantId, String name, String description, Double price,
            Integer duration, String category, Boolean isActive
    ) {
        public static ServiceResponse from(ServiceOffering s) {
            return new ServiceResponse(s.getId(), s.getTenantId(), s.getName(), s.getDescription(),
                    s.getPrice(), s.getDuration(), s.getCategory(), s.getIsActive());
        }
    }
}
