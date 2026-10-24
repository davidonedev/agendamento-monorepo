package com.agendepro.account;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/** Pedido "Não consigo acessar meu e-mail" — tratado pelo tenant (funcionário) ou Superadmin (dono). */
@Entity
@Table(name = "access_help_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessHelpRequest {

    public static final String REQUESTER_PROFESSIONAL = "professional";
    public static final String REQUESTER_TENANT_ADMIN = "tenant_admin";
    public static final String TARGET_TENANT = "tenant";
    public static final String TARGET_SUPER_ADMIN = "super_admin";
    public static final String STATUS_PENDING = "pending";
    public static final String STATUS_RESOLVED = "resolved";

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "requester_type", nullable = false, length = 20)
    private String requesterType;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 150)
    private String contact;

    @Column(nullable = false, length = 150)
    private String barbershop;

    @Column(length = 1000)
    private String message;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(nullable = false, length = 20)
    private String target;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = STATUS_PENDING;

    @Column(name = "resolved_by")
    private UUID resolvedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
