package com.agendepro.professional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProfessionalRepository extends JpaRepository<Professional, UUID> {

    List<Professional> findByTenantIdOrderByNameAsc(UUID tenantId);

    Optional<Professional> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByTenantId(UUID tenantId);

    /** Porta de `services: { some: { serviceId } }` (getPublicProfessionals). */
    @Query("""
            SELECT DISTINCT p FROM Professional p
            JOIN ProfessionalServiceLink l ON l.id.professionalId = p.id
            WHERE p.tenantId = :tenantId AND l.id.serviceId = :serviceId
            ORDER BY p.name ASC
            """)
    List<Professional> findByTenantIdAndServiceId(@Param("tenantId") UUID tenantId, @Param("serviceId") UUID serviceId);
}
