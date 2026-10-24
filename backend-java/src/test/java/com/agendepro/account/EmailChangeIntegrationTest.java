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
import com.agendepro.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static com.agendepro.account.PasswordResetIntegrationTest.tokenFromUrl;
import static com.agendepro.account.PasswordResetIntegrationTest.unique;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class EmailChangeIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestFixtures fixtures;
    @Autowired
    private AuthTestHelper authHelper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void emailOnlyChangesAfterConfirmationAndOldEmailIsNotified() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String oldEmail = unique("old");
        String newEmail = unique("new");
        User user = fixtures.admin(tenant, oldEmail, "senha123");
        String jwt = authHelper.login(mockMvc, oldEmail, "senha123");

        requestChange(jwt, newEmail, "senha123").andExpect(status().isOk());

        // Ainda não trocou
        assertThat(userRepository.findById(user.getId()).orElseThrow().getEmail()).isEqualTo(oldEmail);

        ArgumentCaptor<String> url = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendEmailChangeConfirmation(eq(newEmail), anyString(), url.capture(), anyLong());
        String token = tokenFromUrl(url.getValue());

        confirm(token).andExpect(status().isOk());
        assertThat(userRepository.findById(user.getId()).orElseThrow().getEmail()).isEqualTo(newEmail);
        verify(emailService).sendEmailChangedNotice(eq(oldEmail), anyString(), eq(newEmail));

        // Uso único
        confirm(token).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_EMAIL_CHANGE_TOKEN"));

        // Login passa a ser pelo novo e-mail
        assertThat(authHelper.login(mockMvc, newEmail, "senha123")).isNotBlank();

        assertThat(auditLogRepository.findByTargetUserIdOrderByCreatedAtAsc(user.getId()))
                .extracting(AuditLog::getAction).contains(AuditService.EMAIL_CHANGE_CONFIRMED);
    }

    @Test
    void requiresCurrentPassword() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String email = unique("pwd");
        fixtures.admin(tenant, email, "senha123");
        String jwt = authHelper.login(mockMvc, email, "senha123");

        requestChange(jwt, unique("target"), "senhaErrada")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("WRONG_PASSWORD"));
        verify(emailService, never()).sendEmailChangeConfirmation(anyString(), anyString(), anyString(), anyLong());
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String email = unique("dup");
        String taken = unique("taken");
        fixtures.admin(tenant, email, "senha123");
        fixtures.admin(tenant, taken, "senha123");
        String jwt = authHelper.login(mockMvc, email, "senha123");

        requestChange(jwt, taken, "senha123")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EMAIL_IN_USE"));
    }

    @Test
    void emailTakenBeforeConfirmationIsRejectedOnConfirm() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String email = unique("race");
        String target = unique("racetarget");
        User user = fixtures.admin(tenant, email, "senha123");
        String jwt = authHelper.login(mockMvc, email, "senha123");

        requestChange(jwt, target, "senha123").andExpect(status().isOk());
        ArgumentCaptor<String> url = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendEmailChangeConfirmation(eq(target), anyString(), url.capture(), anyLong());

        fixtures.admin(tenant, target, "outra123"); // outra conta ocupa o e-mail antes da confirmação

        confirm(tokenFromUrl(url.getValue()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EMAIL_IN_USE"));
        assertThat(userRepository.findById(user.getId()).orElseThrow().getEmail()).isEqualTo(email);
    }

    @Test
    void requiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/auth/email-change").contentType("application/json")
                        .content("{\"newEmail\":\"x@example.com\",\"currentPassword\":\"senha123\"}"))
                .andExpect(status().isUnauthorized());
    }

    private ResultActions requestChange(String jwt, String newEmail, String currentPassword) throws Exception {
        return mockMvc.perform(post("/api/auth/email-change").header("Authorization", "Bearer " + jwt)
                .contentType("application/json")
                .content("{\"newEmail\":\"" + newEmail + "\",\"currentPassword\":\"" + currentPassword + "\"}"));
    }

    private ResultActions confirm(String token) throws Exception {
        return mockMvc.perform(post("/api/auth/email-change/confirm").contentType("application/json")
                .content("{\"token\":\"" + token + "\"}"));
    }
}
