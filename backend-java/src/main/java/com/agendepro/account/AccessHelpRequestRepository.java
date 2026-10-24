package com.agendepro.account;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccessHelpRequestRepository extends JpaRepository<AccessHelpRequest, UUID> {
    List<AccessHelpRequest> findByTargetAndTenantIdOrderByCreatedAtDesc(String target, UUID tenantId);
    List<AccessHelpRequest> findByTargetOrderByCreatedAtDesc(String target);
    Optional<AccessHelpRequest> findByIdAndTargetAndTenantId(UUID id, String target, UUID tenantId);
    Optional<AccessHelpRequest> findByIdAndTarget(UUID id, String target);
}
