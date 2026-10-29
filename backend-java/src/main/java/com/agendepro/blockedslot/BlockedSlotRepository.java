package com.agendepro.blockedslot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BlockedSlotRepository extends JpaRepository<BlockedSlot, UUID>, JpaSpecificationExecutor<BlockedSlot> {

    Optional<BlockedSlot> findByIdAndTenantId(UUID id, UUID tenantId);

    List<BlockedSlot> findByTenantIdAndProfessionalIdAndDateOrderByStartTimeAsc(
            UUID tenantId, UUID professionalId, String date);

    @Query("""
            SELECT COUNT(b) > 0 FROM BlockedSlot b
            WHERE b.tenantId = :tenantId AND b.professionalId = :professionalId AND b.date = :date
              AND b.startTime < :endTime AND b.endTime > :startTime
            """)
    boolean hasConflict(
            @Param("tenantId") UUID tenantId,
            @Param("professionalId") UUID professionalId,
            @Param("date") String date,
            @Param("startTime") String startTime,
            @Param("endTime") String endTime);
}
