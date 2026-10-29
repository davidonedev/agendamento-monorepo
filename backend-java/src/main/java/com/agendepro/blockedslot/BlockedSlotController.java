package com.agendepro.blockedslot;

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

import static com.agendepro.blockedslot.BlockedSlotDtos.*;

/** Porta de blockedSlot.controller.ts — /api/admin/blocked-slots. */
@Tag(name = "Blocked Slots")
@RestController
@RequestMapping("/api/admin/blocked-slots")
@RequiredArgsConstructor
public class BlockedSlotController {

    private final BlockedSlotService blockedSlotService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BlockedSlotResponse>>> list(
            @RequestParam(required = false) UUID professionalId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        var data = blockedSlotService.list(SecurityUtils.requireTenantId(), professionalId, date, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BlockedSlotResponse>> create(@Valid @RequestBody BlockedSlotRequest request) {
        var created = blockedSlotService.create(SecurityUtils.requireTenantId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        blockedSlotService.delete(SecurityUtils.requireTenantId(), id);
        return ResponseEntity.noContent().build();
    }
}
