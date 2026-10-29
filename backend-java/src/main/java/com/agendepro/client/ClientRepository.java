package com.agendepro.client;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {

    Optional<Client> findByTenantIdAndEmail(UUID tenantId, String email);

    Optional<Client> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByTenantId(UUID tenantId);

    /** Porta do filtro OR (name/email/phone) de listClients (client.controller.ts). */
    @Query("""
            SELECT c FROM Client c
            WHERE c.tenantId = :tenantId
              AND (:search IS NULL
                   OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR c.phone LIKE CONCAT('%', :search, '%'))
            ORDER BY c.name ASC
            """)
    List<Client> search(@Param("tenantId") UUID tenantId, @Param("search") String search);

    /** Porta de reminder.controller.ts — clientes com telefone cadastrado. */
    List<Client> findByTenantIdAndPhoneIsNotNullOrderByNameAsc(UUID tenantId);

    /** Porta da checagem de telefone duplicado (registerPublicClient/registerAndBook). */
    boolean existsByTenantIdAndPhoneContaining(UUID tenantId, String phoneSuffix);
}
