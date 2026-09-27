package com.agendepro.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {
    List<ProductCategory> findByTenantIdOrderByNameAsc(UUID tenantId);
    Optional<ProductCategory> findByTenantIdAndName(UUID tenantId, String name);
    Optional<ProductCategory> findByIdAndTenantId(UUID id, UUID tenantId);
}
