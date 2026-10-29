package com.agendepro.account;

import com.agendepro.audit.AuditService;
import com.agendepro.common.AppException;
import com.agendepro.notification.EmailService;
import com.agendepro.user.User;
import com.agendepro.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Troca de e-mail do usuário logado: exige a senha atual e só efetiva depois que o
 * link enviado ao NOVO endereço é confirmado. O endereço antigo é avisado da troca.
 */
@Service
@RequiredArgsConstructor
public class EmailChangeService {

    private final UserRepository userRepository;
    private final UserTokenRepository userTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${app.app-url}")
    private String appUrl;

    @Value("${app.email-change.ttl-minutes:60}")
    private long ttlMinutes;

    @Transactional
    public void request(UUID userId, String newEmailRaw, String currentPassword, String ip) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Usuário não encontrado"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new AppException("Senha atual incorreta", 400, "WRONG_PASSWORD");
        }

        String newEmail = newEmailRaw.trim();
        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            throw AppException.badRequest("O novo e-mail é igual ao atual", "SAME_EMAIL");
        }
        ensureEmailAvailable(newEmail, userId);

        Instant now = Instant.now();
        userTokenRepository.invalidatePending(userId, UserToken.EMAIL_CHANGE, now);

        String rawToken = TokenHasher.newToken();
        userTokenRepository.save(UserToken.builder()
                .userId(userId)
                .type(UserToken.EMAIL_CHANGE)
                .tokenHash(TokenHasher.hash(rawToken))
                .newEmail(newEmail)
                .expiresAt(now.plus(Duration.ofMinutes(ttlMinutes)))
                .build());

        String confirmUrl = appUrl + "/confirm-email-change?token=" + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        emailService.sendEmailChangeConfirmation(newEmail, user.getName(), confirmUrl, ttlMinutes);

        auditService.record(AuditService.EMAIL_CHANGE_REQUESTED, userId, userId, user.getTenantId(), ip,
                Map.of("newEmail", newEmail));
    }

    @Transactional
    public void confirm(String rawToken, String ip) {
        Instant now = Instant.now();
        UserToken token = userTokenRepository.findByTokenHash(TokenHasher.hash(rawToken))
                .filter(t -> t.isUsable(UserToken.EMAIL_CHANGE, now))
                .orElseThrow(EmailChangeService::invalidToken);

        // E-mail pode ter sido ocupado por outra conta entre a solicitação e a confirmação
        ensureEmailAvailable(token.getNewEmail(), token.getUserId());

        if (userTokenRepository.markUsed(token.getId(), now) != 1) {
            throw invalidToken();
        }

        User user = userRepository.findById(token.getUserId()).orElseThrow(EmailChangeService::invalidToken);
        String oldEmail = user.getEmail();
        user.setEmail(token.getNewEmail());
        userRepository.save(user);

        emailService.sendEmailChangedNotice(oldEmail, user.getName(), user.getEmail());

        auditService.record(AuditService.EMAIL_CHANGE_CONFIRMED, user.getId(), user.getId(), user.getTenantId(), ip,
                Map.of("oldEmail", oldEmail, "newEmail", user.getEmail()));
    }

    private void ensureEmailAvailable(String email, UUID userId) {
        userRepository.findByEmail(email).ifPresent(existing -> {
            if (!existing.getId().equals(userId)) {
                throw new AppException("E-mail já está em uso", 400, "EMAIL_IN_USE");
            }
        });
    }

    private static AppException invalidToken() {
        return AppException.badRequest("Link de confirmação inválido ou expirado.", "INVALID_EMAIL_CHANGE_TOKEN");
    }
}
