package com.agendepro.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByTargetUserIdOrderByCreatedAtAsc(UUID targetUserId);
    List<AuditLog> findByActionOrderByCreatedAtAsc(String action);
}
