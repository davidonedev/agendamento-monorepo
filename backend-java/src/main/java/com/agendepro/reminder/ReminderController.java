package com.agendepro.reminder;

import com.agendepro.common.ApiResponse;
import com.agendepro.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Porta de reminder.controller.ts — GET /api/admin/reminders/absent-clients. */
@Tag(name = "Reminders")
@RestController
@RequestMapping("/api/admin/reminders")
@RequiredArgsConstructor
@Validated
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping("/absent-clients")
    public ResponseEntity<ApiResponse<List<AbsentClientResponse>>> absentClients(
            @RequestParam(defaultValue = "30") @Min(1) @Max(365) int daysSince
    ) {
        var data = reminderService.listAbsentClients(SecurityUtils.requireTenantId(), daysSince);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
