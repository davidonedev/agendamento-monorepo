package com.agendepro.tenant;

import com.agendepro.appointment.AppointmentStatus;

import java.util.List;
import java.util.UUID;

/** Resumo do Painel admin (GET /api/admin/dashboard/summary). Datas "yyyy-MM-dd" no fuso America/Sao_Paulo. */
public final class DashboardSummaryDtos {

    private DashboardSummaryDtos() {
    }

    public record ClientsSummary(long total, long last7Days, long previous7Days) {
    }

    /** Cancelamentos + faltas dos últimos 7 dias (hoje e os 6 dias anteriores). */
    public record CancellationsSummary(long total, long cancelled, long noShow) {
    }

    public record DayCount(String date, long count) {
    }

    public record UpcomingAppointment(UUID id, String date, String startTime, String clientName,
                                      String serviceName, String professionalName, AppointmentStatus status) {
    }

    /** state: in_progress | last_day | expired | paid | none. */
    public record TrialInfo(String state, int totalDays, int usedDays, int remainingDays, String endsAt) {
    }

    public record DashboardSummaryResponse(String today, ClientsSummary clients, CancellationsSummary cancellations,
                                           List<DayCount> week, List<UpcomingAppointment> upcoming, TrialInfo trial) {
    }
}
