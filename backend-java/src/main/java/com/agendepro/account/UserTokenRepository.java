package com.agendepro.account;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface UserTokenRepository extends JpaRepository<UserToken, UUID> {

    Optional<UserToken> findByTokenHash(String tokenHash);

    long countByUserIdAndTypeAndCreatedAtAfter(UUID userId, String type, Instant after);

    /** Marca um token como usado só se ainda não foi — retorna 1 para quem "ganhou" o uso. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update UserToken t set t.usedAt = :now where t.id = :id and t.usedAt is null")
    int markUsed(@Param("id") UUID id, @Param("now") Instant now);

    /** Invalida (marca como usados) todos os tokens pendentes do usuário daquele tipo. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update UserToken t set t.usedAt = :now where t.userId = :userId and t.type = :type and t.usedAt is null")
    int invalidatePending(@Param("userId") UUID userId, @Param("type") String type, @Param("now") Instant now);
}
