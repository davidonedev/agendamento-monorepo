package com.agendepro.appointment;

import com.agendepro.AbstractIntegrationTest;
import com.agendepro.catalog.ServiceOffering;
import com.agendepro.professional.Professional;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.testsupport.AuthTestHelper;
import com.agendepro.testsupport.TestFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cobre a regra mais crítica do sistema: dois agendamentos não podem se sobrepor para
 * o mesmo profissional, nem um agendamento pode cair sobre um horário bloqueado —
 * porta de checkConflict() (schedule.service.ts).
 */
class AppointmentConflictIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestFixtures fixtures;
    @Autowired
    private AuthTestHelper authTestHelper;

    @Test
    void secondOverlappingAppointmentIsRejected() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.PRO);
        fixtures.admin(tenant, "admin-conflict@example.com", "senha123");
        Professional professional = fixtures.professional(tenant);
        ServiceOffering service = fixtures.service(tenant, 50.0, 30);
        String token = authTestHelper.login(mockMvc, "admin-conflict@example.com", "senha123");
        String date = LocalDate.now().plusDays(1).toString();

        String bookingJson = """
                {"professionalId":"%s","serviceId":"%s","date":"%s","startTime":"10:00",
                 "clientName":"Cliente Um","clientEmail":"cliente1@example.com"}
                """.formatted(professional.getId(), service.getId(), date);

        mockMvc.perform(post("/api/admin/appointments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(bookingJson))
                .andExpect(status().isCreated());

        String overlappingJson = """
                {"professionalId":"%s","serviceId":"%s","date":"%s","startTime":"10:15",
                 "clientName":"Cliente Dois","clientEmail":"cliente2@example.com"}
                """.formatted(professional.getId(), service.getId(), date);

        mockMvc.perform(post("/api/admin/appointments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(overlappingJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SCHEDULE_CONFLICT"));
    }

    @Test
    void appointmentOverBlockedSlotIsRejected() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.PRO);
        fixtures.admin(tenant, "admin-block@example.com", "senha123");
        Professional professional = fixtures.professional(tenant);
        ServiceOffering service = fixtures.service(tenant, 40.0, 30);
        String date = LocalDate.now().plusDays(1).toString();
        fixtures.blockedSlot(tenant, professional, date, "09:00", "12:00");
        String token = authTestHelper.login(mockMvc, "admin-block@example.com", "senha123");

        String bookingJson = """
                {"professionalId":"%s","serviceId":"%s","date":"%s","startTime":"09:30",
                 "clientName":"Cliente Bloqueado","clientEmail":"bloqueado@example.com"}
                """.formatted(professional.getId(), service.getId(), date);

        mockMvc.perform(post("/api/admin/appointments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(bookingJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SCHEDULE_CONFLICT"));
    }

    @Test
    void nonOverlappingAppointmentSucceeds() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.PRO);
        fixtures.admin(tenant, "admin-ok@example.com", "senha123");
        Professional professional = fixtures.professional(tenant);
        ServiceOffering service = fixtures.service(tenant, 30.0, 30);
        String token = authTestHelper.login(mockMvc, "admin-ok@example.com", "senha123");
        String date = LocalDate.now().plusDays(1).toString();

        String first = """
                {"professionalId":"%s","serviceId":"%s","date":"%s","startTime":"10:00",
                 "clientName":"Cliente Um","clientEmail":"c1@example.com"}
                """.formatted(professional.getId(), service.getId(), date);
        mockMvc.perform(post("/api/admin/appointments").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(first))
                .andExpect(status().isCreated());

        // Começa exatamente quando o primeiro termina (10:30) — não deve haver conflito.
        String second = """
                {"professionalId":"%s","serviceId":"%s","date":"%s","startTime":"10:30",
                 "clientName":"Cliente Dois","clientEmail":"c2@example.com"}
                """.formatted(professional.getId(), service.getId(), date);
        mockMvc.perform(post("/api/admin/appointments").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(second))
                .andExpect(status().isCreated());
    }
}
