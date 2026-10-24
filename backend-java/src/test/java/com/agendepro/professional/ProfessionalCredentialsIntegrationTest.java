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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** O tenant altera credenciais só dos próprios funcionários — nunca de outras contas. */
class ProfessionalCredentialsIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestFixtures fixtures;
    @Autowired
    private AuthTestHelper authHelper;

    @Test
    void tenantCannotTakeOverSuperAdminAccountByEmail() throws Exception {
        String superEmail = unique("super");
        fixtures.superAdmin(superEmail, "superSenha");
        Tenant tenant = fixtures.tenant(TenantPlan.PRO);
        String adminEmail = unique("admin");
        fixtures.admin(tenant, adminEmail, "senha123");
        String jwt = authHelper.login(mockMvc, adminEmail, "senha123");

        mockMvc.perform(post("/api/admin/professionals").header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Invasor\",\"email\":\"" + superEmail + "\",\"password\":\"hackeado\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EMAIL_IN_USE"));

        // Senha do Superadmin continua a mesma
        assertThat(authHelper.login(mockMvc, superEmail, "superSenha")).isNotBlank();
    }

    @Test
    void tenantUpdatesOwnProfessionalCredentialsAndRevokesOldSessions() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.PRO);
        String adminEmail = unique("admin2");
        fixtures.admin(tenant, adminEmail, "senha123");
        Professional professional = fixtures.professional(tenant);
        String profEmail = unique("prof");
        fixtures.professionalUser(tenant, professional, profEmail, "senhaVelha");
        String profJwt = authHelper.login(mockMvc, profEmail, "senhaVelha");
        String adminJwt = authHelper.login(mockMvc, adminEmail, "senha123");

        String newEmail = unique("prof-novo");
        mockMvc.perform(patch("/api/admin/professionals/" + professional.getId()).header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + newEmail + "\",\"password\":\"senhaNova\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + profJwt))
                .andExpect(status().isUnauthorized());
        String newJwt = authHelper.login(mockMvc, newEmail, "senhaNova");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + newJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.professionalId").value(professional.getId().toString()));
    }

    private static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }
}
