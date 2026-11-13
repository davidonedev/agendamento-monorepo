package com.agendepro.tenant;

import com.agendepro.AbstractIntegrationTest;
import com.agendepro.appointment.Appointment;
import com.agendepro.appointment.AppointmentRepository;
import com.agendepro.appointment.AppointmentStatus;
import com.agendepro.client.Client;
import com.agendepro.client.ClientRepository;
import com.agendepro.professional.Professional;
import com.agendepro.tenant.DashboardSummaryDtos.DashboardSummaryResponse;
import com.agendepro.testsupport.AuthTestHelper;
import com.agendepro.testsupport.TestFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static com.agendepro.tenant.DashboardSummaryService.ZONE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Números do Painel: janelas de 7 dias no fuso America/Sao_Paulo, isolamento por tenant e estado do trial. */
class DashboardSummaryIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private AuthTestHelper authTestHelper;
    @Autowired private DashboardSummaryService summaryService;
    @Autowired private ClientRepository clientRepository;
    @Autowired private AppointmentRepository appointmentRepository;

    /** Instante a partir de uma data/hora de Brasília. */
    private static Instant sp(String isoLocal) {
        return LocalDateTime.parse(isoLocal).atZone(ZONE).toInstant();
    }

    private static Clock clockAt(String isoLocalSp) {
        return Clock.fixed(sp(isoLocalSp), ZONE);
    }

    private Client clientCreatedAt(Tenant tenant, String isoLocalSp) {
        String u = UUID.randomUUID().toString().substring(0, 8);
        return clientRepository.save(Client.builder().tenantId(tenant.getId()).name("C " + u)
                .email(u + "@example.com").createdAt(sp(isoLocalSp)).build());
    }

    private Appointment appt(Tenant tenant, Client client, Professional prof, String date, String start, AppointmentStatus status) {
        return appointmentRepository.save(Appointment.builder().tenantId(tenant.getId()).clientId(client.getId())
                .professionalId(prof.getId()).serviceId(fixtures.service(tenant, 50, 30).getId())
                .date(date).startTime(start).endTime(start).status(status).price(50.0).build());
    }

    @Test
    void clientsCountsLast7AndPrevious7DaysInSaoPauloTime() {
        Tenant t = fixtures.tenant(TenantPlan.BASIC);
        Tenant other = fixtures.tenant(TenantPlan.BASIC);
        // hoje = 2026-11-12; últimos 7 dias = 06/11 00:00 até hoje; 7 anteriores = 30/10 00:00 até 06/11 00:00
        clientCreatedAt(t, "2026-11-12T10:00:00");
        clientCreatedAt(t, "2026-11-06T00:30:00");   // primeiro dia da janela
        clientCreatedAt(t, "2026-11-05T23:30:00");   // janela anterior
        clientCreatedAt(t, "2026-10-30T00:10:00");   // início da janela anterior
        clientCreatedAt(t, "2026-10-29T23:59:00");   // fora das duas
        clientCreatedAt(other, "2026-11-12T10:00:00"); // outro tenant: nunca conta

        var clients = summaryService.summary(t.getId(), clockAt("2026-11-12T15:00:00")).clients();

        assertThat(clients.total()).isEqualTo(5);
        assertThat(clients.last7Days()).isEqualTo(2);
        assertThat(clients.previous7Days()).isEqualTo(2);
    }

    @Test
    void cancellationsAndNoShowsCountedTogetherAndIsolatedByTenant() {
        Tenant t = fixtures.tenant(TenantPlan.BASIC);
        Tenant other = fixtures.tenant(TenantPlan.BASIC);
        Professional p = fixtures.professional(t);
        Client c = fixtures.client(t);
        appt(t, c, p, "2026-11-20", "09:00", AppointmentStatus.CANCELLED);
        appt(t, c, p, "2026-11-20", "10:00", AppointmentStatus.CANCELLED);
        appt(t, c, p, "2026-11-20", "11:00", AppointmentStatus.NO_SHOW);
        appt(t, c, p, "2026-11-20", "12:00", AppointmentStatus.COMPLETED);
        appt(other, fixtures.client(other), fixtures.professional(other), "2026-11-20", "09:00", AppointmentStatus.CANCELLED);

        var now = summaryService.summary(t.getId(), Clock.system(ZONE)).cancellations();
        assertThat(now.cancelled()).isEqualTo(2);
        assertThat(now.noShow()).isEqualTo(1);
        assertThat(now.total()).isEqualTo(3);

        // 30 dias depois, tudo já saiu da janela de 7 dias
        var later = summaryService.summary(t.getId(), Clock.fixed(Instant.now().plusSeconds(30L * 86400), ZONE)).cancellations();
        assertThat(later.total()).isZero();
    }

    @Test
    void weekCountsActiveAppointmentsPerDayUsingSaoPauloDate() {
        Tenant t = fixtures.tenant(TenantPlan.BASIC);
        Tenant other = fixtures.tenant(TenantPlan.BASIC);
        Professional p = fixtures.professional(t);
        Client c = fixtures.client(t);
        appt(t, c, p, "2026-11-12", "09:00", AppointmentStatus.CONFIRMED);
        appt(t, c, p, "2026-11-12", "10:00", AppointmentStatus.PENDING);
        appt(t, c, p, "2026-11-12", "11:00", AppointmentStatus.CANCELLED);   // cancelado não conta
        appt(t, c, p, "2026-11-15", "09:00", AppointmentStatus.CONFIRMED);
        appt(t, c, p, "2026-11-18", "09:00", AppointmentStatus.CONFIRMED);   // dia 7 (hoje + 6)
        appt(t, c, p, "2026-11-19", "09:00", AppointmentStatus.CONFIRMED);   // fora da faixa
        appt(t, c, p, "2026-11-11", "09:00", AppointmentStatus.CONFIRMED);   // ontem, fora
        appt(other, fixtures.client(other), fixtures.professional(other), "2026-11-12", "09:00", AppointmentStatus.CONFIRMED);

        // 22:30 em Brasília = 01:30 UTC do dia seguinte: "hoje" tem que ser 12/11, não 13/11
        DashboardSummaryResponse r = summaryService.summary(t.getId(), Clock.fixed(Instant.parse("2026-11-13T01:30:00Z"), ZONE));

        assertThat(r.today()).isEqualTo("2026-11-12");
        assertThat(r.week()).hasSize(7);
        assertThat(r.week().getFirst().date()).isEqualTo("2026-11-12");
        assertThat(r.week().getLast().date()).isEqualTo("2026-11-18");
        assertThat(r.week().stream().map(DashboardSummaryDtos.DayCount::count).toList())
                .containsExactly(2L, 0L, 0L, 1L, 0L, 0L, 1L);
    }

    @Test
    void upcomingAreChronologicalFromNowLimitedToFiveAndIgnoreInactive() {
        Tenant t = fixtures.tenant(TenantPlan.BASIC);
        Professional p = fixtures.professional(t);
        Client c = fixtures.client(t);
        appt(t, c, p, "2026-11-12", "09:00", AppointmentStatus.CONFIRMED);   // já passou
        appt(t, c, p, "2026-11-12", "16:00", AppointmentStatus.CANCELLED);   // inativo
        appt(t, c, p, "2026-11-12", "17:00", AppointmentStatus.COMPLETED);   // inativo
        appt(t, c, p, "2026-11-12", "14:00", AppointmentStatus.CONFIRMED);   // exatamente agora: entra
        appt(t, c, p, "2026-11-13", "08:00", AppointmentStatus.PENDING);
        appt(t, c, p, "2026-11-12", "15:30", AppointmentStatus.CONFIRMED);
        appt(t, c, p, "2026-11-14", "08:00", AppointmentStatus.CONFIRMED);
        appt(t, c, p, "2026-11-15", "08:00", AppointmentStatus.CONFIRMED);
        appt(t, c, p, "2026-11-16", "08:00", AppointmentStatus.CONFIRMED);   // 6º: fica de fora

        var upcoming = summaryService.summary(t.getId(), clockAt("2026-11-12T14:00:00")).upcoming();

        assertThat(upcoming).hasSize(5);
        assertThat(upcoming.stream().map(u -> u.date() + " " + u.startTime()).toList())
                .containsExactly("2026-11-12 14:00", "2026-11-12 15:30", "2026-11-13 08:00", "2026-11-14 08:00", "2026-11-15 08:00");
        assertThat(upcoming.getFirst().clientName()).isEqualTo(c.getName());
        assertThat(upcoming.getFirst().professionalName()).isEqualTo(p.getName());
    }

    @Test
    void trialDaysAtStartMiddleLastDayAndExpired() {
        LocalDate start = LocalDate.of(2026, 11, 1);
        var begin = TrialPolicy.compute(TenantStatus.TRIAL, start, start);
        assertThat(begin.state()).isEqualTo("in_progress");
        assertThat(begin.usedDays()).isZero();
        assertThat(begin.remainingDays()).isEqualTo(30);
        assertThat(begin.endsAt()).isEqualTo("2026-12-01");

        var middle = TrialPolicy.compute(TenantStatus.TRIAL, start, start.plusDays(5));
        assertThat(middle.state()).isEqualTo("in_progress");
        assertThat(middle.usedDays()).isEqualTo(5);
        assertThat(middle.remainingDays()).isEqualTo(25);

        var last = TrialPolicy.compute(TenantStatus.TRIAL, start, start.plusDays(29));
        assertThat(last.state()).isEqualTo("last_day");
        assertThat(last.remainingDays()).isEqualTo(1);

        var expired = TrialPolicy.compute(TenantStatus.TRIAL, start, start.plusDays(30));
        assertThat(expired.state()).isEqualTo("expired");
        assertThat(expired.remainingDays()).isZero();
        assertThat(TrialPolicy.compute(TenantStatus.TRIAL, start, start.plusDays(40)).usedDays()).isEqualTo(30);

        assertThat(TrialPolicy.compute(TenantStatus.ACTIVE, start, start).state()).isEqualTo("paid");
        assertThat(TrialPolicy.compute(TenantStatus.SUSPENDED, start, start).state()).isEqualTo("none");
    }

    @Test
    void endpointReturnsSummaryForAdminAndRejectsProfessional() throws Exception {
        Tenant t = fixtures.tenant(TenantPlan.BASIC);
        String adminEmail = "admin-" + UUID.randomUUID() + "@example.com";
        fixtures.admin(t, adminEmail, "senha123");
        String token = authTestHelper.login(mockMvc, adminEmail, "senha123");

        mockMvc.perform(get("/api/admin/dashboard/summary").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.week", hasSize(7)))
                .andExpect(jsonPath("$.data.upcoming", hasSize(0)))
                .andExpect(jsonPath("$.data.clients.total").value(0))
                .andExpect(jsonPath("$.data.trial.state").exists());

        Professional p = fixtures.professional(t);
        String profEmail = "prof-" + UUID.randomUUID() + "@example.com";
        fixtures.professionalUser(t, p, profEmail, "senha123");
        String profToken = authTestHelper.login(mockMvc, profEmail, "senha123");
        mockMvc.perform(get("/api/admin/dashboard/summary").header("Authorization", "Bearer " + profToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/dashboard/summary")).andExpect(status().is4xxClientError());
    }

}
