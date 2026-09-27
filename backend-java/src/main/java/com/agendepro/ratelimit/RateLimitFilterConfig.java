package com.agendepro.ratelimit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class RateLimitFilterConfig {

    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(
            @Value("${app.rate-limit.auth-capacity}") int authCapacity,
            @Value("${app.rate-limit.auth-refill-minutes}") int authRefillMinutes,
            @Value("${app.rate-limit.api-capacity}") int apiCapacity,
            @Value("${app.rate-limit.api-refill-minutes}") int apiRefillMinutes
    ) {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(
                new RateLimitFilter(authCapacity, authRefillMinutes, apiCapacity, apiRefillMinutes));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registration.addUrlPatterns("/api/*");
        return registration;
    }
}
