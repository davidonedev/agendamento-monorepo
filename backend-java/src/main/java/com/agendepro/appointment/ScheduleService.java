package com.agendepro.appointment;

import com.agendepro.blockedslot.BlockedSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Porta direta de schedule.service.ts. */
@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final AppointmentRepository appointmentRepository;
    private final BlockedSlotRepository blockedSlotRepository;

    /** true se houver conflito de horário (agendamento ou bloqueio) para o profissional. */
    public boolean checkConflict(UUID tenantId, UUID professionalId, String date, String startTime, String endTime, UUID excludeAppointmentId) {
        boolean appointmentConflict = appointmentRepository.hasConflict(tenantId, professionalId, date, startTime, endTime, excludeAppointmentId);
        boolean blockedConflict = blockedSlotRepository.hasConflict(tenantId, professionalId, date, startTime, endTime);
        return appointmentConflict || blockedConflict;
    }

    /**
     * Gera os horários candidatos entre start e end, a cada `step` minutos, mantendo
     * apenas os que têm `blockDuration` minutos livres consecutivos a partir do slot.
     * Ex: start="08:00", end="18:00", blockDuration=30, step=15
     *   → ["08:00","08:15","08:30","08:45","09:00",...]
     */
    public List<String> generateTimeSlots(String start, String end, int blockDuration, int step) {
        List<String> slots = new ArrayList<>();

        int startMinutes = toMinutes(start);
        int endMinutes = toMinutes(end);

        int current = startMinutes;
        while (current + blockDuration <= endMinutes) {
            slots.add(fromMinutes(current));
            current += step;
        }
        return slots;
    }

    public static int toMinutes(String hhmm) {
        String[] parts = hhmm.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }

    public static String fromMinutes(int totalMinutes) {
        int h = totalMinutes / 60;
        int m = totalMinutes % 60;
        return String.format("%02d:%02d", h, m);
    }

    public static String addMinutes(String time, int minutes) {
        return fromMinutes(toMinutes(time) + minutes);
    }
}
