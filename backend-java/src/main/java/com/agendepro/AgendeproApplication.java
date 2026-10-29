package com.agendepro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * UserDetailsServiceAutoConfiguration é excluída porque a autenticação é 100% via
 * JWT (JwtAuthenticationFilter) — não usamos o AuthenticationManager/UserDetailsService
 * padrão do Spring Security, então essa autoconfig só gera um usuário/senha aleatórios
 * inúteis a cada boot.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@EnableAsync
public class AgendeproApplication {

    public static void main(String[] args) {
        SpringApplication.run(AgendeproApplication.class, args);
    }
}
