package com.agendepro.professional;

import com.agendepro.client.Client;
import com.agendepro.client.ClientDtos;
import com.agendepro.client.ClientRepository;
import com.agendepro.common.ApiResponse;
import com.agendepro.common.AppException;
import com.agendepro.security.SecurityUtils;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantDtos;
import com.agendepro.tenant.TenantRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.agendepro.professional.ProfessionalDtos.*;

/** Porta dos handlers inline de professional.routes.ts (/me, /tenant, /clients, /professionals). */
@Tag(name = "Professional (self-service)")
@RestController
@RequestMapping("/api/professional")
@RequiredArgsConstructor
public class ProfessionalSelfController {

    private final ProfessionalService professionalService;
    private final TenantRepository tenantRepository;
    private final ClientRepository clientRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ProfessionalResponse>> me() {
        var user = SecurityUtils.currentUser();
        UUID professionalId = SecurityUtils.requireProfessionalId();
        return ResponseEntity.ok(ApiResponse.ok(professionalService.getSelf(user.tenantId(), professionalId)));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<ProfessionalResponse>> updateMe(@Valid @RequestBody ProfessionalSelfUpdateRequest request) {
        var user = SecurityUtils.currentUser();
        UUID professionalId = SecurityUtils.requireProfessionalId();
        return ResponseEntity.ok(ApiResponse.ok(professionalService.updateSelf(user.tenantId(), professionalId, request)));
    }

    @GetMapping("/tenant")
    public ResponseEntity<ApiResponse<TenantDtos.TenantResponse>> tenant() {
        UUID tenantId = SecurityUtils.requireTenantId();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> AppException.notFound("Tenant não encontrado"));
        return ResponseEntity.ok(ApiResponse.ok(TenantDtos.TenantResponse.from(tenant)));
    }

    @GetMapping("/clients")
    public ResponseEntity<ApiResponse<List<ClientDtos.ClientResponse>>> clients() {
        UUID tenantId = SecurityUtils.requireTenantId();
        var data = clientRepository.search(tenantId, null).stream().map(ClientDtos.ClientResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/professionals")
    public ResponseEntity<ApiResponse<List<ProfessionalResponse>>> professionals() {
        UUID tenantId = SecurityUtils.requireTenantId();
        return ResponseEntity.ok(ApiResponse.ok(professionalService.listBasic(tenantId)));
    }
}
