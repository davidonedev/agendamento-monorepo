package com.agendepro.account;

import com.agendepro.AbstractIntegrationTest;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.testsupport.AuthTestHelper;
import com.agendepro.testsupport.TestFixtures;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static com.agendepro.account.PasswordResetIntegrationTest.unique;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AccessHelpIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestFixtures fixtures;
    @Autowired
    private AuthTestHelper authHelper;
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void professionalRequestIsVisibleOnlyToItsOwnTenant() throws Exception {
        Tenant tenantA = fixtures.tenant(TenantPlan.BASIC);
        Tenant tenantB = fixtures.tenant(TenantPlan.BASIC);
        String adminA = unique("adminA");
        String adminB = unique("adminB");
        fixtures.admin(tenantA, adminA, "senha123");
        fixtures.admin(tenantB, adminB, "senha123");
        String superEmail = unique("super");
        fixtures.superAdmin(superEmail, "senha123");
        String marker = "Funcionario " + UUID.randomUUID().toString().substring(0, 6);

        create("professional", marker, tenantA.getSlug()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message").value(AccountDtos.ACCESS_HELP_MESSAGE));

        String jwtA = authHelper.login(mockMvc, adminA, "senha123");
        String jwtB = authHelper.login(mockMvc, adminB, "senha123");
        String jwtSuper = authHelper.login(mockMvc, superEmail, "senha123");

        JsonNode listA = list("/api/admin/access-help", jwtA);
        JsonNode match = find(listA, marker);
        assertThat(match).isNotNull();
        assertThat(match.get("status").asText()).isEqualTo("pending");
        assertThat(match.get("tenantId").asText()).isEqualTo(tenantA.getId().toString());

        assertThat(find(list("/api/admin/access-help", jwtB), marker)).isNull();
        assertThat(find(list("/api/super/access-help", jwtSuper), marker)).isNull();

        String id = match.get("id").asText();
        // Tenant B não consegue resolver pedido do tenant A
        mockMvc.perform(patch("/api/admin/access-help/" + id + "/resolve").header("Authorization", "Bearer " + jwtB))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/api/admin/access-help/" + id + "/resolve").header("Authorization", "Bearer " + jwtA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("resolved"));
    }

    @Test
    void tenantOwnerRequestGoesToSuperAdmin() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String adminEmail = unique("owner");
        fixtures.admin(tenant, adminEmail, "senha123");
        String superEmail = unique("super2");
        fixtures.superAdmin(superEmail, "senha123");
        String marker = "Dono " + UUID.randomUUID().toString().substring(0, 6);

        create("tenant_admin", marker, tenant.getName()).andExpect(status().isOk());

        assertThat(find(list("/api/super/access-help", authHelper.login(mockMvc, superEmail, "senha123")), marker)).isNotNull();
        assertThat(find(list("/api/admin/access-help", authHelper.login(mockMvc, adminEmail, "senha123")), marker)).isNull();
    }

    @Test
    void responseIsGenericEvenForUnknownBarbershop() throws Exception {
        String known = create("professional", "Alguem", fixtures.tenant(TenantPlan.BASIC).getSlug())
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        String unknown = create("professional", "Alguem", "barbearia-que-nao-existe-" + UUID.randomUUID())
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        assertThat(unknown).isEqualTo(known);
    }

    @Test
    void tenantAdminCannotListSuperQueue() throws Exception {
        Tenant tenant = fixtures.tenant(TenantPlan.BASIC);
        String adminEmail = unique("nosuper");
        fixtures.admin(tenant, adminEmail, "senha123");
        mockMvc.perform(get("/api/super/access-help")
                        .header("Authorization", "Bearer " + authHelper.login(mockMvc, adminEmail, "senha123")))
                .andExpect(status().isForbidden());
    }

    private ResultActions create(String type, String name, String barbershop) throws Exception {
        String body = objectMapper.writeValueAsString(java.util.Map.of(
                "requesterType", type, "name", name, "contact", "(11) 99999-0000", "barbershop", barbershop));
        return mockMvc.perform(post("/api/auth/access-help").contentType("application/json").content(body));
    }

    private JsonNode list(String path, String jwt) throws Exception {
        String response = mockMvc.perform(get(path).header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        return objectMapper.readTree(response).get("data");
    }

    private static JsonNode find(JsonNode list, String name) {
        for (JsonNode n : list) {
            if (name.equals(n.get("name").asText())) return n;
        }
        return null;
    }
}
