package com.agendepro.tenant;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/** Porta do model Tenant (schema.prisma). */
@Entity
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, length = 60)
    private String slug;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "owner_name", nullable = false, length = 150)
    private String ownerName;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    private String phone;

    private String address;

    @Column(nullable = false)
    @Builder.Default
    private TenantStatus status = TenantStatus.TRIAL;

    @Column(nullable = false)
    @Builder.Default
    private TenantPlan plan = TenantPlan.BASIC;

    @Column(name = "monthly_price", nullable = false)
    @Builder.Default
    private Double monthlyPrice = 0.0;

    @Column(name = "primary_color", nullable = false, length = 9)
    @Builder.Default
    private String primaryColor = "#3B82F6";

    @Column(name = "admin_color", length = 9)
    private String adminColor;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(name = "is_open", nullable = false)
    @Builder.Default
    private Boolean isOpen = true;

    @Column(name = "min_advance_minutes", nullable = false)
    @Builder.Default
    private Integer minAdvanceMinutes = 0;

    @Column(name = "whatsapp_api_url", length = 300)
    private String whatsappApiUrl;

    @Column(name = "whatsapp_api_key", length = 300)
    private String whatsappApiKey;

    @Column(name = "whatsapp_instance", length = 150)
    private String whatsappInstance;

    @Column(name = "whatsapp_template", length = 2000)
    private String whatsappTemplate;

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
