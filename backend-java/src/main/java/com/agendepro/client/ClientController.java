package com.agendepro.client;

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

import static com.agendepro.client.ClientDtos.*;

/** Porta de client.controller.ts — /api/admin/clients/**. */
@Tag(name = "Clients (admin)")
@RestController
@RequestMapping("/api/admin/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClientResponse>>> list(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok(clientService.list(SecurityUtils.requireTenantId(), search)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientDetailResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(clientService.getDetail(SecurityUtils.requireTenantId(), id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClientResponse>> create(@Valid @RequestBody ClientCreateRequest request) {
        var created = clientService.create(SecurityUtils.requireTenantId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> update(@PathVariable UUID id, @Valid @RequestBody ClientUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(clientService.update(SecurityUtils.requireTenantId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        clientService.delete(SecurityUtils.requireTenantId(), id);
        return ResponseEntity.noContent().build();
    }
}
