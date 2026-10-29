package com.agendepro.blockedslot;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class BlockedSlotDtos {

    private BlockedSlotDtos() {
    }

    public record BlockedSlotRequest(
            @NotNull UUID professionalId,
            @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Formato: YYYY-MM-DD") String date,
            @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}(:\\d{2})?$", message = "Formato: HH:mm") String startTime,
            @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}(:\\d{2})?$", message = "Formato: HH:mm") String endTime,
            @Size(max = 200) String reason
    ) {
        public String startTimeHHmm() {
            return startTime.length() >= 5 ? startTime.substring(0, 5) : startTime;
        }

        public String endTimeHHmm() {
            return endTime.length() >= 5 ? endTime.substring(0, 5) : endTime;
        }
    }

    public record ProfessionalRef(UUID id, String name, String specialty, String avatar, String photoUrl) {
    }

    public record BlockedSlotResponse(UUID id, UUID tenantId, UUID professionalId, String date,
                                       String startTime, String endTime, String reason,
                                       ProfessionalRef professional) {
    }
}
