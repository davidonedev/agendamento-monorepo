package com.agendepro.user;

import com.agendepro.AbstractIntegrationTest;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.tenant.TenantRepository;
import com.agendepro.testsupport.TestFixtures;
import com.agendepro.professional.Professional;
import com.agendepro.tenant.TenantStatus;
import com.agendepro.testsupport.AuthTestHelper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
    @Autowired
    private AuthTestHelper authHelper;

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
    void loginWithSuspendedTenantReturnsGenericInvalidCredentials() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        tenant.setStatus(com.agendepro.tenant.TenantStatus.SUSPENDED);
        tenantRepository.save(tenant);
        fixtures.admin(tenant, "suspended@example.com", "senha123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"suspended@example.com\",\"password\":\"senha123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.error").value("E-mail ou senha inválidos"));
    }

    // ─── Login unificado pelo portal principal (/login da landing) ──────────────

    @Test
    void superAdminLogsInThroughMainPortal() throws Exception {
        String email = unique("super");
        fixtures.superAdmin(email, "senha123");

        login(email, "senha123")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.role").value("super_admin"))
                .andExpect(jsonPath("$.data.user.tenant").doesNotExist());
    }

    @Test
    void professionalLogsInThroughMainPortal() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        Professional professional = fixtures.professional(tenant);
        String email = unique("prof");
        fixtures.professionalUser(tenant, professional, email, "senha123");

        login(email, "senha123")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role").value("professional"))
                .andExpect(jsonPath("$.data.user.professionalId").value(professional.getId().toString()))
                .andExpect(jsonPath("$.data.user.tenant.slug").value(tenant.getSlug()));
    }

    @Test
    void unknownEmailAndWrongPasswordReturnTheSameGenericError() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String email = unique("known");
        fixtures.admin(tenant, email, "senhaCorreta");

        String wrongPassword = login(email, "senhaErrada")
                .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        String unknownEmail = login(unique("nobody"), "qualquer")
                .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);

        assertThat(unknownEmail).isEqualTo(wrongPassword);
        assertThat(wrongPassword).contains("E-mail ou senha inválidos");
    }

    @Test
    void professionalOfSuspendedTenantCannotLogIn() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        tenant.setStatus(TenantStatus.SUSPENDED);
        tenantRepository.save(tenant);
        String email = unique("suspprof");
        fixtures.professionalUser(tenant, fixtures.professional(tenant), email, "senha123");

        login(email, "senha123")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void loginIsThrottledPerEmailAfterRepeatedFailures() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String email = unique("brute");
        fixtures.admin(tenant, email, "senhaCorreta");

        for (int i = 0; i < 5; i++) {
            login(email, "errada" + i).andExpect(status().isUnauthorized());
        }
        // Mesmo com a senha certa, a conta fica temporariamente bloqueada
        login(email, "senhaCorreta")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("TOO_MANY_ATTEMPTS"));
    }

    @Test
    void patchMeCannotChangeEmailDirectly() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String email = unique("patchme");
        fixtures.admin(tenant, email, "senha123");
        String token = authHelper.login(mockMvc, email, "senha123");

        mockMvc.perform(patch("/api/auth/me").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content("{\"email\":\"" + unique("other") + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("USE_EMAIL_CHANGE_FLOW"));

        mockMvc.perform(patch("/api/auth/me").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content("{\"name\":\"Novo Nome\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Novo Nome"))
                .andExpect(jsonPath("$.data.email").value(email));
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"));
    }

    private static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }
}
