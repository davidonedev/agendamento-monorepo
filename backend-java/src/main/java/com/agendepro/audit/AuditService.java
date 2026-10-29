package com.agendepro.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

/**
 * Grava eventos de auditoria. Quem chama é responsável por NUNCA passar senhas ou
 * tokens em {@code details} — só identificadores e metadados não sensíveis.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    public static final String PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED";
    public static final String PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED";
    public static final String EMAIL_CHANGE_REQUESTED = "EMAIL_CHANGE_REQUESTED";
    public static final String EMAIL_CHANGE_CONFIRMED = "EMAIL_CHANGE_CONFIRMED";
    public static final String ACCESS_HELP_REQUESTED = "ACCESS_HELP_REQUESTED";
    public static final String ACCESS_HELP_RESOLVED = "ACCESS_HELP_RESOLVED";
    public static final String CREDENTIALS_CHANGED_BY_TENANT = "CREDENTIALS_CHANGED_BY_TENANT";
    public static final String CREDENTIALS_CHANGED_BY_SUPER = "CREDENTIALS_CHANGED_BY_SUPER";
    public static final String SUPER_ADMIN_ACCESSED_TENANT = "SUPER_ADMIN_ACCESSED_TENANT";

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public void record(String action, UUID actorUserId, UUID targetUserId, UUID tenantId, String ip, Map<String, ?> details) {
        auditLogRepository.save(AuditLog.builder()
                .action(action)
                .actorUserId(actorUserId)
                .targetUserId(targetUserId)
                .tenantId(tenantId)
                .ip(ip)
                .details(toJson(details))
                .build());
    }

    private String toJson(Map<String, ?> details) {
        if (details == null || details.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(details);
        } catch (JsonProcessingException ex) {
            log.warn("[audit] Falha ao serializar detalhes: {}", ex.getMessage());
            return null;
        }
    }
}
