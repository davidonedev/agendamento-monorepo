package com.agendepro.professional;

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

import static com.agendepro.professional.ProfessionalDtos.*;

/** Porta das rotas /api/admin/professionals/** (admin.routes.ts). */
@Tag(name = "Professionals (admin)")
@RestController
@RequestMapping("/api/admin/professionals")
@RequiredArgsConstructor
public class AdminProfessionalController {

    private final ProfessionalService professionalService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProfessionalResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(professionalService.list(SecurityUtils.requireTenantId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProfessionalDetailResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(professionalService.getDetail(SecurityUtils.requireTenantId(), id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProfessionalResponse>> create(@Valid @RequestBody ProfessionalCreateRequest request) {
        var created = professionalService.create(SecurityUtils.requireTenantId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<ProfessionalResponse>> update(@PathVariable UUID id, @Valid @RequestBody ProfessionalUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(professionalService.update(SecurityUtils.requireTenantId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        professionalService.delete(SecurityUtils.requireTenantId(), id);
        return ResponseEntity.noContent().build();
    }
}
