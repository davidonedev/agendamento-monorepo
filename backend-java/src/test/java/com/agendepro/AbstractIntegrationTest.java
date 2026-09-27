package com.agendepro;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base para os testes de integração: sobe um Postgres real via Testcontainers (sem
 * mocks — as regras de conflito de horário, limites de plano etc. dependem de
 * constraints e queries reais do banco) e a aplicação inteira num MockMvc.
 *
 * O container é iniciado manualmente uma única vez (padrão "singleton container" do
 * Testcontainers) em vez de usar {@code @Container} — com {@code @Container} num campo
 * estático, cada classe de teste que estende esta base dispara seu próprio
 * beforeAll/afterAll e PARA o container ao final da primeira classe, quebrando as
 * classes seguintes. Sem essa anotação, o container nunca é parado explicitamente;
 * o Ryuk (resource reaper) do Testcontainers o remove quando a JVM de testes termina.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("agendepro_test")
            .withUsername("test")
            .withPassword("test");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
}
