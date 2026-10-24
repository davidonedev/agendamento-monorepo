package com.agendepro.user;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limite de falhas de login por e-mail (complementa o limite por IP do RateLimitFilter,
 * que não segura um ataque distribuído contra uma única conta). Conta qualquer e-mail
 * digitado, exista ou não, para não revelar quais contas existem.
 */
@Component
public class LoginAttemptLimiter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final int maxFailures;
    private final Duration window;

    public LoginAttemptLimiter(
            @Value("${app.rate-limit.login-failures-per-email:5}") int maxFailures,
            @Value("${app.rate-limit.login-failures-window-minutes:15}") int windowMinutes
    ) {
        this.maxFailures = maxFailures;
        this.window = Duration.ofMinutes(windowMinutes);
    }

    public boolean isBlocked(String email) {
        Bucket bucket = buckets.get(key(email));
        return bucket != null && bucket.getAvailableTokens() <= 0;
    }

    public void recordFailure(String email) {
        buckets.computeIfAbsent(key(email), k -> Bucket.builder()
                .addLimit(Bandwidth.classic(maxFailures, Refill.intervally(maxFailures, window)))
                .build()).tryConsume(1);
    }

    public void reset(String email) {
        buckets.remove(key(email));
    }

    private static String key(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
