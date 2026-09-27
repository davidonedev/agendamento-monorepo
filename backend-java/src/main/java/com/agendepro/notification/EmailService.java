package com.agendepro.notification;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

/**
 * Porta de email.service.ts (Nodemailer) — usa Thymeleaf para o template HTML de
 * verificação de e-mail. Sem SMTP_USER/SMTP_PASS configurados, só loga o link
 * (mesmo comportamento de desenvolvimento do Node).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username:}")
    private String smtpUser;

    @Value("${app.mail-from}")
    private String mailFrom;

    @Async
    public void sendVerificationEmail(String to, String clientName, String tenantName, String verifyUrl) {
        if (smtpUser == null || smtpUser.isBlank()) {
            log.info("\n─────────────────────────────────────────────\n" +
                            "[EMAIL] Verificação de e-mail (sem SMTP configurado)\n" +
                            "  Para:    {}\n  Link:    {}\n" +
                            "─────────────────────────────────────────────",
                    to, verifyUrl);
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("clientName", clientName);
            context.setVariable("tenantName", tenantName);
            context.setVariable("verifyUrl", verifyUrl);
            String html = templateEngine.process("email/verification", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject("Confirme seu e-mail — " + tenantName);
            helper.setText(html, true);

            mailSender.send(message);
        } catch (Exception ex) {
            log.error("[email] Falha ao enviar verificação: {}", ex.getMessage());
        }
    }
}
