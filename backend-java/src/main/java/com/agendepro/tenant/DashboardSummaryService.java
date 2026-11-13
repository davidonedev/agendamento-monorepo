package com.agendepro.tenant;

import com.agendepro.appointment.Appointment;
import com.agendepro.appointment.AppointmentDtos.AppointmentResponse;
import com.agendepro.appointment.AppointmentRepository;
import com.agendepro.appointment.AppointmentService;
import com.agendepro.appointment.AppointmentStatus;
import com.agendepro.client.ClientRepository;
import com.agendepro.common.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.agendepro.tenant.DashboardSummaryDtos.*;

/**
 * Números do Painel admin. Todas as janelas de data usam America/Sao_Paulo (agendamentos guardam
 * data e hora como texto no horário de Brasília) e toda consulta é filtrada por tenant_id.
 */
@Service
@RequiredArgsConstructor
public class DashboardSummaryService {

    public static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final int UPCOMING_LIMIT = 5;
    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    private final TenantRepository tenantRepository;
    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary(UUID tenantId) {
        return summary(tenantId, Clock.system(ZONE));
    }

    /** Relógio injetável para os testes. */
    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary(UUID tenantId, Clock clock) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> AppException.notFound("Tenant não encontrado"));

        LocalDate today = LocalDate.now(clock.withZone(ZONE));
        String nowTime = clock.instant().atZone(ZONE).format(HHMM);

        // janelas de 7 dias: hoje + 6 anteriores, e os 7 dias antes disso
        Instant windowEnd = startOf(today.plusDays(1));
        Instant last7Start = startOf(today.minusDays(6));
        Instant prev7Start = startOf(today.minusDays(13));

        ClientsSummary clients = new ClientsSummary(
                clientRepository.countByTenantId(tenantId),
                clientRepository.countByTenantIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(tenantId, last7Start, windowEnd),
                clientRepository.countByTenantIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(tenantId, prev7Start, last7Start));

        long cancelled = appointmentRepository.countByTenantIdAndStatusAndUpdatedAtGreaterThanEqualAndUpdatedAtLessThan(
                tenantId, AppointmentStatus.CANCELLED, last7Start, windowEnd);
        long noShow = appointmentRepository.countByTenantIdAndStatusAndUpdatedAtGreaterThanEqualAndUpdatedAtLessThan(
                tenantId, AppointmentStatus.NO_SHOW, last7Start, windowEnd);

        // próximos 7 dias (hoje incluído): agendamentos não cancelados por dia
        Map<String, Long> perDay = appointmentRepository
                .findByTenantIdAndDateBetweenAndStatusNot(tenantId, today.toString(), today.plusDays(6).toString(), AppointmentStatus.CANCELLED)
                .stream().collect(Collectors.groupingBy(Appointment::getDate, Collectors.counting()));
        List<DayCount> week = IntStream.range(0, 7)
                .mapToObj(i -> today.plusDays(i).toString())
                .map(d -> new DayCount(d, perDay.getOrDefault(d, 0L)))
                .toList();

        List<Appointment> upcomingRaw = appointmentRepository.findUpcoming(
                tenantId, List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED),
                today.toString(), nowTime, PageRequest.of(0, UPCOMING_LIMIT));
        Map<UUID, AppointmentResponse> responses = appointmentService.toResponses(upcomingRaw).stream()
                .collect(Collectors.toMap(AppointmentResponse::id, Function.identity()));
        List<UpcomingAppointment> upcoming = upcomingRaw.stream().map(a -> {
            AppointmentResponse r = responses.get(a.getId());
            return new UpcomingAppointment(a.getId(), a.getDate(), a.getStartTime(),
                    r.client() != null ? r.client().name() : "—",
                    r.service() != null ? r.service().name() : "—",
                    r.professional() != null ? r.professional().name() : "—",
                    a.getStatus());
        }).toList();

        TrialInfo trial = TrialPolicy.compute(tenant.getStatus(), tenant.getCreatedAt().atZone(ZONE).toLocalDate(), today);

        return new DashboardSummaryResponse(today.toString(), clients,
                new CancellationsSummary(cancelled + noShow, cancelled, noShow), week, upcoming, trial);
    }

    private static Instant startOf(LocalDate day) {
        return day.atStartOfDay(ZONE).toInstant();
    }
}
