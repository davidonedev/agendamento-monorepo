package com.agendepro.testsupport;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/** Faz login via HTTP (exercitando o AuthController de verdade) e devolve o JWT. */
@Component
public class AuthTestHelper {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String login(MockMvc mockMvc, String email, String password) throws Exception {
        String body = "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
        String response = mockMvc.perform(post("/api/auth/login").contentType("application/json").content(body))
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(response);
        return json.at("/data/token").asText();
    }
}
