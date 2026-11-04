package com.agendepro.appointment;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Serializa tentativas concorrentes de agendamento para o mesmo profissional/dia
 * via pg_advisory_xact_lock, evitando double-booking com isolation READ COMMITTED.
 * O lock é liberado automaticamente ao fim da transação.
 */
@Service
public class PgAdvisoryLockService {

    @PersistenceContext
    private EntityManager em;

    public void lockProfessionalSchedule(UUID professionalId, String date) {
        long key = computeKey(professionalId, date);
        em.createNativeQuery("SELECT pg_advisory_xact_lock(:key)")
                .setParameter("key", key)
                .getSingleResult();
    }

    private long computeKey(UUID professionalId, String date) {
        // Mistura os bits menos significativos do UUID com o hash da data
        // para distribuição uniforme e chaves estáveis por professional+date.
        long a = professionalId.getLeastSignificantBits();
        long b = (long) date.hashCode();
        return a ^ (b * 0x9e3779b97f4a7c15L);
    }
}
