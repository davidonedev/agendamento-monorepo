package com.agendepro.appointment;

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

import static com.agendepro.appointment.AppointmentDtos.*;

/**
 * Exposto em /api/admin/appointments e /api/professional/appointments — mesma lógica
 * reaproveitada nos dois routers do backend Node (list/create/updateStatus). O delete
 * só existe do lado admin — ver {@link AdminAppointmentController}.
 */
@Tag(name = "Appointments")
@RestController
@RequestMapping({"/api/admin/appointments", "/api/professional/appointments"})
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> list(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) UUID professionalId,
            @RequestParam(required = false) AppointmentStatus status
    ) {
        var data = appointmentService.list(SecurityUtils.requireTenantId(), SecurityUtils.currentUser(),
                date, startDate, endDate, professionalId, status);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AppointmentResponse>> create(@Valid @RequestBody AppointmentCreateRequest request) {
        var created = appointmentService.create(SecurityUtils.requireTenantId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateStatus(@PathVariable UUID id, @Valid @RequestBody UpdateStatusRequest request) {
        var updated = appointmentService.updateStatus(SecurityUtils.requireTenantId(), SecurityUtils.currentUser(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}
