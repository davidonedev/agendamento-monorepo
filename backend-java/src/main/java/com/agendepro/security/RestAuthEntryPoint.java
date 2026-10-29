package com.agendepro.security;

import com.agendepro.common.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Disparado pelo Spring Security quando uma rota protegida é acessada sem uma
 * Authentication válida no contexto — porta do ramo 401 de authenticate() em
 * auth.middleware.ts, distinguindo token ausente (UNAUTHORIZED) de token
 * inválido/expirado (INVALID_TOKEN), igual ao backend Node.
 */
@Component
@RequiredArgsConstructor
public class RestAuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        boolean invalidToken = Boolean.TRUE.equals(request.getAttribute(JwtAuthenticationFilter.INVALID_TOKEN_ATTRIBUTE));

        ApiResponse<Void> body = invalidToken
                ? ApiResponse.error("Token inválido ou expirado", "INVALID_TOKEN")
                : ApiResponse.error("Token de autenticação não fornecido", "UNAUTHORIZED");

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
