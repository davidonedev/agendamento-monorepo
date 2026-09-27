package com.agendepro.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, UUID> {

    List<ServiceOffering> findByTenantIdOrderByNameAsc(UUID tenantId);

    Optional<ServiceOffering> findByIdAndTenantId(UUID id, UUID tenantId);

    List<ServiceOffering> findByIdInAndTenantId(List<UUID> ids, UUID tenantId);

    long countByTenantId(UUID tenantId);
}
