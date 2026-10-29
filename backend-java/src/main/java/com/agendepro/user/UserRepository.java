package com.agendepro.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleIn(List<UserRole> roles);
    Optional<User> findFirstByProfessionalIdAndTenantId(UUID professionalId, UUID tenantId);
    Optional<User> findFirstByTenantIdAndRole(UUID tenantId, UserRole role);

    /** Leitura leve usada pelo JwtAuthenticationFilter a cada requisição autenticada. */
    @Query("select u.tokenVersion from User u where u.id = :id")
    Optional<Integer> findTokenVersionById(@Param("id") UUID id);
}
