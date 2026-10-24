package com.agendepro.account;

import com.agendepro.audit.AuditService;
import com.agendepro.common.AppException;
import com.agendepro.notification.EmailService;
import com.agendepro.tenant.TenantRepository;
import com.agendepro.tenant.TenantStatus;
import com.agendepro.user.User;
import com.agendepro.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/**
 * "Esqueci minha senha" para todas as roles (super_admin, tenant_admin, professional).
 * A solicitação sempre responde igual; o token é aleatório, guardado só como hash,
 * expira rápido e é de uso único. Redefinir a senha derruba todas as sessões do usuário.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final UserTokenRepository userTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${app.app-url}")
    private String appUrl;

    @Value("${app.password-reset.ttl-minutes:30}")
    private long ttlMinutes;

    @Value("${app.password-reset.max-per-hour:3}")
    private long maxPerHour;

    @Transactional
    public void request(String email, String ip) {
        User user = userRepository.findByEmail(email.trim()).orElse(null);
        if (user == null) {
            auditService.record(AuditService.PASSWORD_RESET_REQUESTED, null, null, null, ip, Map.of("known", false));
            return;
        }

        boolean tenantSuspended = user.getTenantId() != null && tenantRepository.findById(user.getTenantId())
                .map(t -> t.getStatus() == TenantStatus.SUSPENDED).orElse(false);
        Instant now = Instant.now();
        long recent = userTokenRepository.countByUserIdAndTypeAndCreatedAtAfter(
                user.getId(), UserToken.PASSWORD_RESET, now.minus(Duration.ofHours(1)));

        if (tenantSuspended || recent >= maxPerHour) {
            auditService.record(AuditService.PASSWORD_RESET_REQUESTED, null, user.getId(), user.getTenantId(), ip,
                    Map.of("known", true, "sent", false, "reason", tenantSuspended ? "tenant_suspended" : "throttled"));
            return;
        }

        userTokenRepository.invalidatePending(user.getId(), UserToken.PASSWORD_RESET, now);

        String rawToken = TokenHasher.newToken();
        userTokenRepository.save(UserToken.builder()
                .userId(user.getId())
                .type(UserToken.PASSWORD_RESET)
                .tokenHash(TokenHasher.hash(rawToken))
                .expiresAt(now.plus(Duration.ofMinutes(ttlMinutes)))
                .build());

        String resetUrl = appUrl + "/reset-password?token=" + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        emailService.sendPasswordReset(user.getEmail(), user.getName(), resetUrl, ttlMinutes);

        auditService.record(AuditService.PASSWORD_RESET_REQUESTED, null, user.getId(), user.getTenantId(), ip,
                Map.of("known", true, "sent", true));
    }

    @Transactional
    public void reset(String rawToken, String newPassword, String ip) {
        Instant now = Instant.now();
        UserToken token = userTokenRepository.findByTokenHash(TokenHasher.hash(rawToken))
                .filter(t -> t.isUsable(UserToken.PASSWORD_RESET, now))
                .orElseThrow(PasswordResetService::invalidToken);

        // Marcação atômica: em requisições concorrentes com o mesmo token, só uma vence
        if (userTokenRepository.markUsed(token.getId(), now) != 1) {
            throw invalidToken();
        }
        // Invalida qualquer outro link de redefinição pendente do mesmo usuário
        userTokenRepository.invalidatePending(token.getUserId(), UserToken.PASSWORD_RESET, now);

        User user = userRepository.findById(token.getUserId()).orElseThrow(PasswordResetService::invalidToken);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.bumpTokenVersion(); // derruba todas as sessões (JWTs) ativas
        userRepository.save(user);

        auditService.record(AuditService.PASSWORD_RESET_COMPLETED, user.getId(), user.getId(), user.getTenantId(), ip, null);
    }

    private static AppException invalidToken() {
        return AppException.badRequest("Link de redefinição inválido ou expirado. Solicite um novo.", "INVALID_RESET_TOKEN");
    }
}
