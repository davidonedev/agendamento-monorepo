package com.agendepro.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID>, JpaSpecificationExecutor<Appointment> {

    Optional<Appointment> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Appointment> findByIdAndTenantIdAndClientId(UUID id, UUID tenantId, UUID clientId);

    List<Appointment> findByTenantIdAndDateOrderByStartTimeAsc(UUID tenantId, String date);

    List<Appointment> findByTenantIdAndClientIdOrderByDateAscStartTimeAsc(UUID tenantId, UUID clientId);

    long countByTenantIdAndStatus(UUID tenantId, AppointmentStatus status);

    long countByTenantId(UUID tenantId);

    long countByProfessionalId(UUID professionalId);

    long countByClientId(UUID clientId);

    long countByServiceId(UUID serviceId);

    List<Appointment> findByTenantIdAndProfessionalIdOrderByDateDesc(UUID tenantId, UUID professionalId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT COALESCE(SUM(a.price), 0) FROM Appointment a WHERE a.tenantId = :tenantId AND a.status = :status")
    double sumPriceByTenantIdAndStatus(@Param("tenantId") UUID tenantId, @Param("status") AppointmentStatus status);

    @Query("SELECT COALESCE(SUM(a.price), 0) FROM Appointment a WHERE a.status = :status")
    double sumPriceByStatus(@Param("status") AppointmentStatus status);

    long countByStatus(AppointmentStatus status);

    /** Agendamentos (não cancelados) de um profissional num dia — usado na disponibilidade e no checkConflict. */
    @Query("""
            SELECT a FROM Appointment a
            WHERE a.tenantId = :tenantId AND a.professionalId = :professionalId AND a.date = :date
              AND a.status <> com.agendepro.appointment.AppointmentStatus.CANCELLED
            """)
    List<Appointment> findActiveByProfessionalAndDate(
            @Param("tenantId") UUID tenantId, @Param("professionalId") UUID professionalId, @Param("date") String date);

    /** Porta de checkConflict() (schedule.service.ts): sobreposição de horário. */
    @Query("""
            SELECT COUNT(a) > 0 FROM Appointment a
            WHERE a.tenantId = :tenantId AND a.professionalId = :professionalId AND a.date = :date
              AND a.status <> com.agendepro.appointment.AppointmentStatus.CANCELLED
              AND a.startTime < :endTime AND a.endTime > :startTime
              AND (:excludeId IS NULL OR a.id <> :excludeId)
            """)
    boolean hasConflict(
            @Param("tenantId") UUID tenantId,
            @Param("professionalId") UUID professionalId,
            @Param("date") String date,
            @Param("startTime") String startTime,
            @Param("endTime") String endTime,
            @Param("excludeId") UUID excludeId);

    /**
     * Agendamentos que precisam de lembrete de 24h:
     * horário de início (Brasília) entre 23h e 25h a partir de agora, sem lembrete enviado.
     */
    @Query(value = """
            SELECT * FROM appointments
            WHERE status NOT IN ('CANCELLED','COMPLETED')
              AND reminder_24h_sent_at IS NULL
              AND (date || 'T' || start_time || ':00')::timestamp AT TIME ZONE 'America/Sao_Paulo'
                  BETWEEN (now() + interval '23 hours') AND (now() + interval '25 hours')
            """, nativeQuery = true)
    List<Appointment> findNeedingReminder24h();

    /**
     * Agendamentos que precisam de lembrete de 2h:
     * horário de início (Brasília) entre 1h e 2.5h a partir de agora, sem lembrete enviado.
     */
    @Query(value = """
            SELECT * FROM appointments
            WHERE status NOT IN ('CANCELLED','COMPLETED')
              AND reminder_2h_sent_at IS NULL
              AND (date || 'T' || start_time || ':00')::timestamp AT TIME ZONE 'America/Sao_Paulo'
                  BETWEEN (now() + interval '1 hour') AND (now() + interval '150 minutes')
            """, nativeQuery = true)
    List<Appointment> findNeedingReminder2h();

    /** Porta de listAbsentClients (reminder.controller.ts) — último agendamento não cancelado por cliente. */
    @Query("""
            SELECT a FROM Appointment a
            WHERE a.clientId IN :clientIds AND a.status <> com.agendepro.appointment.AppointmentStatus.CANCELLED
            ORDER BY a.date DESC
            """)
    List<Appointment> findActiveByClientIds(@Param("clientIds") List<UUID> clientIds);
}
