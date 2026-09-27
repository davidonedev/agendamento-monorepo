package com.agendepro.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByTenantIdOrderByNameAsc(UUID tenantId);
    Optional<Product> findByIdAndTenantId(UUID id, UUID tenantId);
    List<Product> findByTenantIdAndIsActiveTrueAndStockGreaterThanOrderByNameAsc(UUID tenantId, int stock);
}
