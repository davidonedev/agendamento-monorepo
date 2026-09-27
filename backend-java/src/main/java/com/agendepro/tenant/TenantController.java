package com.agendepro.tenant;

import com.agendepro.common.ApiResponse;
import com.agendepro.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import static com.agendepro.tenant.TenantDtos.*;

/** Porta de tenant.controller.ts — /api/admin/{me,dashboard,settings,revenue}. */
@Tag(name = "Tenant (admin)")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Validated
public class TenantController {

    private final TenantService tenantService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<TenantWithCountsResponse>> getMyTenant() {
        return ResponseEntity.ok(ApiResponse.ok(tenantService.getMyTenant(SecurityUtils.requireTenantId())));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.ok(tenantService.dashboard(SecurityUtils.requireTenantId())));
    }

    @PatchMapping("/settings")
    public ResponseEntity<ApiResponse<TenantResponse>> updateSettings(@Valid @RequestBody UpdateSettingsRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(tenantService.updateSettings(SecurityUtils.requireTenantId(), request)));
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<RevenueResponse>> revenue(
            @RequestParam @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String startDate,
            @RequestParam @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String endDate,
            @RequestParam(required = false) UUID professionalId
    ) {
        var data = tenantService.revenue(SecurityUtils.requireTenantId(), startDate, endDate, professionalId);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
