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

/**
 * Token de uso único para redefinição de senha ou confirmação de troca de e-mail.
 * Só o hash SHA-256 é persistido ({@link TokenHasher}); o valor bruto vai apenas no link do e-mail.
 */
@Entity
@Table(name = "user_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserToken {

    public static final String PASSWORD_RESET = "password_reset";
    public static final String EMAIL_CHANGE = "email_change";

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "new_email", length = 180)
    private String newEmail;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public boolean isUsable(String expectedType, Instant now) {
        return expectedType.equals(type) && usedAt == null && expiresAt.isAfter(now);
    }
}
