package com.agendepro.professional;

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
import java.util.UUID;

/** Porta do model Professional (schema.prisma). */
@Entity
@Table(name = "professionals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Professional {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 150)
    @Builder.Default
    private String specialty = "";

    private String avatar;

    @Column(name = "photo_url", length = 2000)
    private String photoUrl;

    private String bio;

    @Column(name = "working_hours_start", nullable = false, length = 5)
    @Builder.Default
    private String workingHoursStart = "08:00";

    @Column(name = "working_hours_end", nullable = false, length = 5)
    @Builder.Default
    private String workingHoursEnd = "18:00";

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "working_days", nullable = false, columnDefinition = "integer[]")
    @Builder.Default
    private Integer[] workingDays = new Integer[]{1, 2, 3, 4, 5};

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
