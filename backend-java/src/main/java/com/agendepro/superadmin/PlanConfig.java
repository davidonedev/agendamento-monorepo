package com.agendepro.superadmin;

import com.agendepro.tenant.TenantPlan;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Porta do model PlanConfig (schema.prisma). maxProfessionals/maxServices = -1 → ilimitado. */
@Entity
@Table(name = "plan_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanConfig {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private TenantPlan plan;

    @Column(name = "display_name", nullable = false, length = 50)
    private String displayName;

    @Column(name = "default_price", nullable = false)
    private Double defaultPrice;

    @Column(name = "max_professionals", nullable = false)
    @Builder.Default
    private Integer maxProfessionals = -1;

    @Column(name = "max_services", nullable = false)
    @Builder.Default
    private Integer maxServices = -1;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false, columnDefinition = "text[]")
    @Builder.Default
    private String[] features = new String[0];

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    @PrePersist
    void touch() {
        updatedAt = Instant.now();
    }

    public List<String> featureList() {
        return List.of(features);
    }
}
