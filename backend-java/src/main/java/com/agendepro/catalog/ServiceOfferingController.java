package com.agendepro.catalog;

import com.agendepro.common.ApiResponse;
import com.agendepro.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.agendepro.catalog.ServiceOfferingDtos.*;

/**
 * Exposto tanto em /api/admin/services quanto /api/professional/services — mesma
 * lógica reaproveitada nos dois routers no backend Node (admin.routes.ts e
 * professional.routes.ts apontam para os mesmos handlers de service.controller.ts).
 */
@Tag(name = "Services")
@RestController
@RequestMapping({"/api/admin/services", "/api/professional/services"})
@RequiredArgsConstructor
public class ServiceOfferingController {

    private final ServiceOfferingService serviceOfferingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceResponse>>> list() {
        UUID tenantId = SecurityUtils.requireTenantId();
        return ResponseEntity.ok(ApiResponse.ok(serviceOfferingService.list(tenantId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceResponse>> create(@Valid @RequestBody ServiceCreateRequest request) {
        UUID tenantId = SecurityUtils.requireTenantId();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(serviceOfferingService.create(tenantId, request)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceResponse>> update(@PathVariable UUID id, @Valid @RequestBody ServiceUpdateRequest request) {
        UUID tenantId = SecurityUtils.requireTenantId();
        return ResponseEntity.ok(ApiResponse.ok(serviceOfferingService.update(tenantId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        UUID tenantId = SecurityUtils.requireTenantId();
        serviceOfferingService.delete(tenantId, id);
        return ResponseEntity.noContent().build();
    }
}
