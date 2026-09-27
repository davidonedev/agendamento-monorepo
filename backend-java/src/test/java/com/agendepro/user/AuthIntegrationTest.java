package com.agendepro.user;

import com.agendepro.AbstractIntegrationTest;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.tenant.TenantRepository;
import com.agendepro.testsupport.TestFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestFixtures fixtures;
    @Autowired
    private TenantRepository tenantRepository;

    @Test
    void loginWithValidCredentialsReturnsToken() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        fixtures.admin(tenant, "valid@example.com", "senha123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"valid@example.com\",\"password\":\"senha123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.role").value("tenant_admin"))
                .andExpect(jsonPath("$.data.user.tenant.slug").value(tenant.getSlug()));
    }

    @Test
    void loginWithWrongPasswordReturns401() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        fixtures.admin(tenant, "wrongpass@example.com", "senhaCorreta");

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"wrongpass@example.com\",\"password\":\"senhaErrada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void loginWithSuspendedTenantReturns403() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        tenant.setStatus(com.agendepro.tenant.TenantStatus.SUSPENDED);
        tenantRepository.save(tenant);
        fixtures.admin(tenant, "suspended@example.com", "senha123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"suspended@example.com\",\"password\":\"senha123\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("TENANT_SUSPENDED"));
    }
}
