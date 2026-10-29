package com.agendepro.client;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClientEmailTokenRepository extends JpaRepository<ClientEmailToken, UUID> {
    Optional<ClientEmailToken> findByToken(String token);
}
