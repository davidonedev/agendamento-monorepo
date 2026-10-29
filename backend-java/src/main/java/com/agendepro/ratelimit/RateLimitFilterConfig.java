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
            @Value("${app.rate-limit.api-refill-minutes}") int apiRefillMinutes,
            @Value("${app.rate-limit.login-capacity:10}") int loginCapacity,
            @Value("${app.rate-limit.forgot-password-capacity:5}") int forgotCapacity,
            @Value("${app.rate-limit.reset-password-capacity:10}") int resetCapacity,
            @Value("${app.rate-limit.email-change-capacity:5}") int emailChangeCapacity,
            @Value("${app.rate-limit.access-help-capacity:5}") int accessHelpCapacity
    ) {
        RateLimitFilter filter = new RateLimitFilter(authCapacity, authRefillMinutes, apiCapacity, apiRefillMinutes)
                .withRouteLimit("/api/auth/login", loginCapacity, 15)
                .withRouteLimit("/api/auth/forgot-password", forgotCapacity, 15)
                .withRouteLimit("/api/auth/reset-password", resetCapacity, 15)
                .withRouteLimit("/api/auth/email-change", emailChangeCapacity, 15)
                .withRouteLimit("/api/auth/email-change/confirm", resetCapacity, 15)
                .withRouteLimit("/api/auth/access-help", accessHelpCapacity, 60);

        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registration.addUrlPatterns("/api/*");
        return registration;
    }
}
