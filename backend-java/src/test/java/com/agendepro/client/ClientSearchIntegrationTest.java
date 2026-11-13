package com.agendepro.client;

import com.agendepro.AbstractIntegrationTest;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.testsupport.AuthTestHelper;
import com.agendepro.testsupport.TestFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regressão do 500 "function lower(bytea) does not exist" em GET /api/admin/clients sem termo de busca,
 * que só acontece no PostgreSQL real (por isso roda sobre o Testcontainers da base).
 */
class ClientSearchIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private AuthTestHelper authTestHelper;
    @Autowired private ClientRepository clientRepository;

    private Client client(Tenant tenant, String name, String email, String phone) {
        return clientRepository.save(Client.builder().tenantId(tenant.getId()).name(name).email(email).phone(phone).build());
    }

    private String adminToken(Tenant tenant) throws Exception {
        String email = "admin-" + UUID.randomUUID() + "@example.com";
        fixtures.admin(tenant, email, "senha123");
        return authTestHelper.login(mockMvc, email, "senha123");
    }

    @Test
    void listWithoutSearchReturns200() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        client(tenant, "Ana Souza", "ana@example.com", "11999990001");
        String token = adminToken(tenant);

        mockMvc.perform(get("/api/admin/clients").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)));
        mockMvc.perform(get("/api/admin/clients").param("search", "").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)));
        mockMvc.perform(get("/api/admin/clients").param("search", "   ").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    void searchByNameEmailAndPhoneIgnoringCase() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        client(tenant, "José Álvares", "jose.alvares@example.com", "11988887777");
        client(tenant, "Maria Lima", "maria@example.com", "21977776666");
        String token = adminToken(tenant);

        for (String term : new String[]{"JOSÉ", "josé", "álvares", "JOSE.ALVARES", "88887"}) {
            mockMvc.perform(get("/api/admin/clients").param("search", term).header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].name").value("José Álvares"));
        }
    }

    @Test
    void wildcardCharactersAreLiteral() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        client(tenant, "Ana 100%", "ana@example.com", null);
        client(tenant, "Bia_Silva", "bia@example.com", null);
        client(tenant, "Carlos", "carlos@example.com", null);
        String token = adminToken(tenant);

        mockMvc.perform(get("/api/admin/clients").param("search", "%").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name").value("Ana 100%"));
        mockMvc.perform(get("/api/admin/clients").param("search", "_").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name").value("Bia_Silva"));
    }

    @Test
    void searchIsIsolatedByTenant() throws Exception {
        Tenant a = fixtures.tenant(TenantPlan.BASIC);
        Tenant b = fixtures.tenant(TenantPlan.BASIC);
        client(a, "Cliente Compartilhado", "a@example.com", null);
        client(b, "Cliente Compartilhado", "b@example.com", null);
        String tokenA = adminToken(a);

        mockMvc.perform(get("/api/admin/clients").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].email").value("a@example.com"));
        mockMvc.perform(get("/api/admin/clients").param("search", "Compartilhado").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].email").value("a@example.com"));
    }

    @Test
    void searchIgnoresAccentsInNameAndEmail() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        Tenant other = fixtures.tenant(TenantPlan.BASIC);
        client(tenant, "José Álvares", "josé.silva@example.com", "11988887777");
        client(tenant, "Maria Lima", "maria@example.com", "21977776666");
        client(other, "José de Outro Tenant", "jose@outro.com", null);
        String token = adminToken(tenant);

        for (String term : new String[]{"jose", "JOSE", "josé", "JOSÉ", "alvares", "Álvares", "jose.silva"}) {
            mockMvc.perform(get("/api/admin/clients").param("search", term).header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].name").value("José Álvares"));
        }
        // telefone continua funcionando
        mockMvc.perform(get("/api/admin/clients").param("search", "7666").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name").value("Maria Lima"));
    }

    @Test
    void businessRegistrationCreatesTenantAndAdminWhoCanListClients() throws Exception {
        String email = "dono-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/public/register/business").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ownerName":"Dono Teste","email":"%s","password":"senha123","businessName":"Barbearia Teste"}
                                """.formatted(email)))
                .andExpect(status().isCreated());

        String token = authTestHelper.login(mockMvc, email, "senha123");
        mockMvc.perform(get("/api/admin/me").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/clients").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void adminRoutesRejectProfessionalAndAnonymousWithout5xx() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        var professional = fixtures.professional(tenant);
        String email = "prof-" + UUID.randomUUID() + "@example.com";
        fixtures.professionalUser(tenant, professional, email, "senha123");
        String token = authTestHelper.login(mockMvc, email, "senha123");

        mockMvc.perform(get("/api/admin/clients").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/clients")).andExpect(status().is4xxClientError());
    }

    @Test
    void internalErrorsDoNotLeakDetails() throws Exception {
        // Mensagem genérica no corpo de qualquer 500; aqui basta garantir que um erro de cliente não vaza SQL.
        mockMvc.perform(get("/api/admin/clients")).andExpect(status().is4xxClientError())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string(not(containsString("select "))));
    }
}
