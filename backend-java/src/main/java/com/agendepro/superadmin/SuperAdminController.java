package com.agendepro.superadmin;

import com.agendepro.common.ApiResponse;
import com.agendepro.tenant.TenantDtos;
import com.agendepro.tenant.TenantPlan;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.agendepro.superadmin.SuperAdminDtos.*;

/** Porta de super.routes.ts / super.controller.ts — /api/super/**, role super_admin. */
@Tag(name = "Super Admin")
@RestController
@RequestMapping("/api/super")
@RequiredArgsConstructor
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<PlatformMetricsResponse>> metrics() {
        return ResponseEntity.ok(ApiResponse.ok(superAdminService.getPlatformMetrics()));
    }

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<PlanConfigResponse>>> plans() {
        return ResponseEntity.ok(ApiResponse.ok(superAdminService.listPlanConfigs()));
    }

    @PatchMapping("/plans/{plan}")
    public ResponseEntity<ApiResponse<PlanConfigResponse>> updatePlan(@PathVariable TenantPlan plan, @Valid @RequestBody UpdatePlanConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(superAdminService.updatePlanConfig(plan, request)));
    }

    @GetMapping("/tenants")
    public ResponseEntity<ApiResponse<List<TenantDtos.TenantWithCountsResponse>>> listTenants() {
        return ResponseEntity.ok(ApiResponse.ok(superAdminService.listTenants()));
    }

    @PostMapping("/tenants")
    public ResponseEntity<ApiResponse<TenantDtos.TenantResponse>> createTenant(@Valid @RequestBody CreateTenantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(superAdminService.createTenant(request)));
    }

    @GetMapping("/tenants/{id}")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> getTenant(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(superAdminService.getTenant(id)));
    }

    @PatchMapping("/tenants/{id}")
    public ResponseEntity<ApiResponse<TenantDtos.TenantResponse>> updateTenant(@PathVariable UUID id, @Valid @RequestBody UpdateTenantRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(superAdminService.updateTenant(id, request)));
    }

    @DeleteMapping("/tenants/{id}")
    public ResponseEntity<Void> deleteTenant(@PathVariable UUID id) {
        superAdminService.deleteTenant(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserListItem>>> listUsers() {
        return ResponseEntity.ok(ApiResponse.ok(superAdminService.listUsers()));
    }

    @PatchMapping("/users/{id}/email")
    public ResponseEntity<ApiResponse<UserListItem>> updateUserEmail(@PathVariable UUID id, @Valid @RequestBody UpdateUserEmailRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(superAdminService.updateUserEmail(id, request)));
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<ApiResponse<com.agendepro.user.AuthDtos.MessageResponse>> forceChangePassword(
            @PathVariable UUID id, @Valid @RequestBody ForcePasswordRequest request) {
        superAdminService.forceChangePassword(id, request);
        return ResponseEntity.ok(ApiResponse.ok(new com.agendepro.user.AuthDtos.MessageResponse("Senha alterada com sucesso")));
    }
}
