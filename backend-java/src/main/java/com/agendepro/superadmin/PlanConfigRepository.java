package com.agendepro.superadmin;

import com.agendepro.tenant.TenantPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PlanConfigRepository extends JpaRepository<PlanConfig, UUID> {
    Optional<PlanConfig> findByPlan(TenantPlan plan);
}
