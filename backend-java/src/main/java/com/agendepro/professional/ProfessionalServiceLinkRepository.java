package com.agendepro.professional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface ProfessionalServiceLinkRepository extends JpaRepository<ProfessionalServiceLink, ProfessionalServiceLinkId> {

    List<ProfessionalServiceLink> findByIdProfessionalId(UUID professionalId);

    List<ProfessionalServiceLink> findByIdServiceId(UUID serviceId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ProfessionalServiceLink l WHERE l.id.professionalId = :professionalId")
    void deleteByProfessionalId(@Param("professionalId") UUID professionalId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ProfessionalServiceLink l WHERE l.id.serviceId = :serviceId")
    void deleteByServiceId(@Param("serviceId") UUID serviceId);
}
