package com.agendepro.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, UUID> {
    List<ServiceCategory> findByTenantIdOrderByNameAsc(UUID tenantId);
    Optional<ServiceCategory> findByTenantIdAndName(UUID tenantId, String name);
    Optional<ServiceCategory> findByIdAndTenantId(UUID id, UUID tenantId);
}
