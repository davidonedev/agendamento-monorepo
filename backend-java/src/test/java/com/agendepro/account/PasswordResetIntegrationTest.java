package com.agendepro.account;

import com.agendepro.AbstractIntegrationTest;
import com.agendepro.audit.AuditLog;
import com.agendepro.audit.AuditLogRepository;
import com.agendepro.audit.AuditService;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.testsupport.AuthTestHelper;
import com.agendepro.testsupport.TestFixtures;
import com.agendepro.user.User;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PasswordResetIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestFixtures fixtures;
    @Autowired
    private AuthTestHelper authHelper;
    @Autowired
    private UserTokenRepository userTokenRepository;
    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void requestResponseIsIdenticalForExistingAndUnknownEmail() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String email = unique("exists");
        fixtures.admin(tenant, email, "senha123");

        String existing = forgot(email).andExpect(status().isOk()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        String unknown = forgot(unique("ghost")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);

        assertThat(unknown).isEqualTo(existing);
        assertThat(existing).contains(AccountDtos.FORGOT_PASSWORD_MESSAGE);
        verify(emailService, times(1)).sendPasswordReset(eq(email), anyString(), anyString(), anyLong());
    }

    @Test
    void validTokenWorksExactlyOnceAndOldSessionsAreRevoked() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String email = unique("reset");
        User user = fixtures.admin(tenant, email, "senhaAntiga");
        String oldJwt = authHelper.login(mockMvc, email, "senhaAntiga");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + oldJwt)).andExpect(status().isOk());

        forgot(email).andExpect(status().isOk());
        String token = capturedResetToken(email);

        reset(token, "senhaNova1")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Uso único
        reset(token, "outraSenha2")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_RESET_TOKEN"));

        // Sessão antiga invalidada
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + oldJwt))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_TOKEN"));

        // Nova senha vale, antiga não
        mockMvc.perform(post("/api/auth/login").contentType("application/json")
                        .content("{\"email\":\"" + email + "\",\"password\":\"senhaAntiga\"}"))
                .andExpect(status().isUnauthorized());
        String newJwt = authHelper.login(mockMvc, email, "senhaNova1");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + newJwt)).andExpect(status().isOk());

        // Auditoria registrada sem token nem senha
        List<AuditLog> logs = auditLogRepository.findByTargetUserIdOrderByCreatedAtAsc(user.getId());
        assertThat(logs).extracting(AuditLog::getAction)
                .contains(AuditService.PASSWORD_RESET_REQUESTED, AuditService.PASSWORD_RESET_COMPLETED);
        assertThat(logs).allSatisfy(l -> {
            String details = String.valueOf(l.getDetails());
            assertThat(details).doesNotContain(token).doesNotContain("senhaNova1");
        });
    }

    @Test
    void expiredTokenIsRejected() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        User user = fixtures.admin(tenant, unique("expired"), "senha123");

        String rawToken = TokenHasher.newToken();
        userTokenRepository.save(UserToken.builder()
                .userId(user.getId()).type(UserToken.PASSWORD_RESET).tokenHash(TokenHasher.hash(rawToken))
                .expiresAt(Instant.now().minusSeconds(60)).build());

        reset(rawToken, "senhaNova1")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_RESET_TOKEN"));
    }

    @Test
    void tokenIsStoredOnlyAsHash() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String email = unique("hash");
        fixtures.admin(tenant, email, "senha123");

        forgot(email).andExpect(status().isOk());
        String token = capturedResetToken(email);

        assertThat(userTokenRepository.findByTokenHash(token)).isEmpty();
        assertThat(userTokenRepository.findByTokenHash(TokenHasher.hash(token))).isPresent();
    }

    @Test
    void newRequestInvalidatesPreviousPendingTokens() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String email = unique("twice");
        fixtures.admin(tenant, email, "senha123");

        forgot(email);
        forgot(email);
        ArgumentCaptor<String> urls = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(2)).sendPasswordReset(eq(email), anyString(), urls.capture(), anyLong());
        String first = tokenFromUrl(urls.getAllValues().get(0));
        String second = tokenFromUrl(urls.getAllValues().get(1));

        reset(first, "senhaNova1").andExpect(status().isBadRequest());
        reset(second, "senhaNova1").andExpect(status().isOk());
    }

    @Test
    void resetPasswordAppliesPasswordPolicy() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String email = unique("policy");
        fixtures.admin(tenant, email, "senha123");
        forgot(email);
        String token = capturedResetToken(email);

        reset(token, "123").andExpect(status().isUnprocessableEntity());
        // Token continua válido após a validação falhar
        reset(token, "senhaValida").andExpect(status().isOk());
    }

    @Test
    void suspendedTenantUserReceivesNoResetEmail() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        tenant.setStatus(com.agendepro.tenant.TenantStatus.SUSPENDED);
        String email = unique("susp");
        fixtures.admin(tenant, email, "senha123");
        fixtures.saveTenant(tenant);

        forgot(email).andExpect(status().isOk()).andExpect(jsonPath("$.data.message").value(AccountDtos.FORGOT_PASSWORD_MESSAGE));
        verify(emailService, never()).sendPasswordReset(anyString(), anyString(), anyString(), anyLong());
    }

    // ─── helpers ─────────────────────────────────────────────────────────────────

    private ResultActions forgot(String email) throws Exception {
        return mockMvc.perform(post("/api/auth/forgot-password").contentType("application/json")
                .content("{\"email\":\"" + email + "\"}"));
    }

    private ResultActions reset(String token, String newPassword) throws Exception {
        return mockMvc.perform(post("/api/auth/reset-password").contentType("application/json")
                .content("{\"token\":\"" + token + "\",\"newPassword\":\"" + newPassword + "\"}"));
    }

    private String capturedResetToken(String email) {
        ArgumentCaptor<String> url = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordReset(eq(email), anyString(), url.capture(), anyLong());
        return tokenFromUrl(url.getValue());
    }

    static String tokenFromUrl(String url) {
        return URLDecoder.decode(url.substring(url.indexOf("token=") + 6), StandardCharsets.UTF_8);
    }

    static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }
}
