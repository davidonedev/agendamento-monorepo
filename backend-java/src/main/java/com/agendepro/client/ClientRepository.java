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

    /** Clientes cadastrados na janela [from, to). */
    long countByTenantIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(UUID tenantId, java.time.Instant from, java.time.Instant to);

    /** Listagem sem filtro de busca. */
    List<Client> findByTenantIdOrderByNameAsc(UUID tenantId);

    /**
     * Filtro OR (name/email/phone) de listClients (client.controller.ts), sem diferenciar acentos (extensão unaccent, V7). Só é chamado com termo não nulo:
     * o padrão ":p IS NULL OR ..." faz o PostgreSQL inferir bytea para o parâmetro nulo (lower(bytea) não existe).
     * {@code pattern} já vem com '%' e com os curingas do usuário escapados com '!' (ver {@link #search}).
     */
    @Query("""
            SELECT c FROM Client c
            WHERE c.tenantId = :tenantId
              AND (LOWER(FUNCTION('unaccent', c.name)) LIKE LOWER(FUNCTION('unaccent', :pattern)) ESCAPE '!'
                   OR LOWER(FUNCTION('unaccent', c.email)) LIKE LOWER(FUNCTION('unaccent', :pattern)) ESCAPE '!'
                   OR c.phone LIKE :pattern ESCAPE '!')
            ORDER BY c.name ASC
            """)
    List<Client> findByTenantIdAndPattern(@Param("tenantId") UUID tenantId, @Param("pattern") String pattern);

    /** Busca por nome, e-mail ou telefone; termo nulo/vazio lista todos os clientes do tenant. */
    default List<Client> search(UUID tenantId, String search) {
        String term = search == null ? "" : search.trim();
        if (term.isEmpty()) return findByTenantIdOrderByNameAsc(tenantId);
        String escaped = term.replace("!", "!!").replace("%", "!%").replace("_", "!_");
        return findByTenantIdAndPattern(tenantId, "%" + escaped + "%");
    }

    /** Porta de reminder.controller.ts — clientes com telefone cadastrado. */
    List<Client> findByTenantIdAndPhoneIsNotNullOrderByNameAsc(UUID tenantId);

    /** Porta da checagem de telefone duplicado (registerPublicClient/registerAndBook). */
    boolean existsByTenantIdAndPhoneContaining(UUID tenantId, String phoneSuffix);
}
