package com.agendepro.publicapi;

import com.agendepro.AbstractIntegrationTest;
import com.agendepro.appointment.Appointment;
import com.agendepro.appointment.AppointmentRepository;
import com.agendepro.appointment.AppointmentStatus;
import com.agendepro.catalog.ServiceOffering;
import com.agendepro.client.Client;
import com.agendepro.professional.Professional;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.testsupport.TestFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Porta da regra de cancelamento de cancelPublicAppointment (public.controller.ts):
 * o cliente só pode cancelar até 1 hora antes do início, calculado em
 * America/Sao_Paulo.
 */
class CancellationWindowIntegrationTest extends AbstractIntegrationTest {

    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestFixtures fixtures;
    @Autowired
    private AppointmentRepository appointmentRepository;

    @Test
    void cancellingMoreThanOneHourAheadSucceeds() throws Exception {
        var ctx = setUp();
        LocalDateTime target = LocalDateTime.now(SAO_PAULO).plusHours(3);
        Appointment appointment = createAppointment(ctx, target);

        String body = "{\"clientId\":\"" + ctx.client.getId() + "\"}";
        mockMvc.perform(patch("/api/public/" + ctx.tenant.getSlug() + "/appointments/" + appointment.getId() + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void cancellingLessThanOneHourAheadIsRejected() throws Exception {
        var ctx = setUp();
        LocalDateTime target = LocalDateTime.now(SAO_PAULO).plusMinutes(20);
        Appointment appointment = createAppointment(ctx, target);

        String body = "{\"clientId\":\"" + ctx.client.getId() + "\"}";
        mockMvc.perform(patch("/api/public/" + ctx.tenant.getSlug() + "/appointments/" + appointment.getId() + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CANCELLATION_WINDOW_EXPIRED"));
    }

    private record Ctx(Tenant tenant, Professional professional, ServiceOffering service, Client client) {
    }

    private Ctx setUp() {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        Professional professional = fixtures.professional(tenant);
        ServiceOffering service = fixtures.service(tenant, 40.0, 30);
        Client client = fixtures.client(tenant);
        return new Ctx(tenant, professional, service, client);
    }

    private Appointment createAppointment(Ctx ctx, LocalDateTime target) {
        String date = target.toLocalDate().toString();
        String startTime = target.format(TIME_FMT);
        String endTime = target.plusMinutes(30).format(TIME_FMT);

        return appointmentRepository.save(Appointment.builder()
                .tenantId(ctx.tenant.getId()).clientId(ctx.client.getId()).professionalId(ctx.professional.getId())
                .serviceId(ctx.service.getId()).date(date).startTime(startTime).endTime(endTime)
                .price(ctx.service.getPrice()).status(AppointmentStatus.PENDING).build());
    }
}
