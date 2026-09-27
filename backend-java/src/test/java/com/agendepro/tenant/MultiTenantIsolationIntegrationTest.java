package com.agendepro.tenant;

import com.agendepro.AbstractIntegrationTest;
import com.agendepro.professional.Professional;
import com.agendepro.testsupport.AuthTestHelper;
import com.agendepro.testsupport.TestFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Garante que um tenant_admin nunca acessa dados de outro tenant — mesmo sabendo o
 * ID de um recurso alheio, a busca é sempre escopada por tenantId (SecurityUtils.
 * requireTenantId() + findByIdAndTenantId nos repositórios), então deve responder
 * 404 e nunca 200/403 com dados vazados.
 */
class MultiTenantIsolationIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestFixtures fixtures;
    @Autowired
    private AuthTestHelper authTestHelper;

    @Test
    void adminCannotReadAnotherTenantsProfessional() throws Exception {
        var tenantA = fixtures.tenant(TenantPlan.BASIC);
        fixtures.admin(tenantA, "admin-a@example.com", "senha123");
        String tokenA = authTestHelper.login(mockMvc, "admin-a@example.com", "senha123");

        var tenantB = fixtures.tenant(TenantPlan.BASIC);
        Professional professionalOfB = fixtures.professional(tenantB);

        mockMvc.perform(get("/api/admin/professionals/" + professionalOfB.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    @Test
    void adminCannotDeleteAnotherTenantsProfessional() throws Exception {
        var tenantA = fixtures.tenant(TenantPlan.BASIC);
        fixtures.admin(tenantA, "admin-a2@example.com", "senha123");
        String tokenA = authTestHelper.login(mockMvc, "admin-a2@example.com", "senha123");

        var tenantB = fixtures.tenant(TenantPlan.BASIC);
        Professional professionalOfB = fixtures.professional(tenantB);

        mockMvc.perform(delete("/api/admin/professionals/" + professionalOfB.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }
}
