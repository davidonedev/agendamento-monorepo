package com.agendepro.professional;

import com.agendepro.AbstractIntegrationTest;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.testsupport.AuthTestHelper;
import com.agendepro.testsupport.TestFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Porta de PLAN_LIMITS (types/index.ts): plano basic permite no máximo 2 profissionais. */
class PlanLimitIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestFixtures fixtures;
    @Autowired
    private AuthTestHelper authTestHelper;

    @Test
    void thirdProfessionalOnBasicPlanIsRejected() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        fixtures.admin(tenant, "admin-limit@example.com", "senha123");
        String token = authTestHelper.login(mockMvc, "admin-limit@example.com", "senha123");

        for (int i = 1; i <= 2; i++) {
            String body = "{\"name\":\"Profissional " + i + "\"}";
            mockMvc.perform(post("/api/admin/professionals")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isCreated());
        }

        mockMvc.perform(post("/api/admin/professionals")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Profissional 3\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("PLAN_LIMIT_REACHED"));
    }

    @Test
    void proPlanHasNoProfessionalLimit() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.PRO);
        fixtures.admin(tenant, "admin-pro@example.com", "senha123");
        String token = authTestHelper.login(mockMvc, "admin-pro@example.com", "senha123");

        for (int i = 1; i <= 3; i++) {
            String body = "{\"name\":\"Profissional " + i + "\"}";
            mockMvc.perform(post("/api/admin/professionals")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isCreated());
        }
    }
}
