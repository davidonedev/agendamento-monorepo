package com.agendepro.account;

import com.agendepro.user.PasswordPolicy;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/** DTOs de recuperação de conta: reset de senha, troca de e-mail e pedidos de ajuda. */
public final class AccountDtos {

    private AccountDtos() {
    }

    /** Respostas genéricas — nunca revelam se a conta existe. */
    public static final String FORGOT_PASSWORD_MESSAGE =
            "Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.";
    public static final String ACCESS_HELP_MESSAGE =
            "Solicitação registrada. Se os dados conferirem, o responsável entrará em contato pelo contato informado.";

    public record ForgotPasswordRequest(
            @NotBlank(message = "E-mail inválido") @Email(message = "E-mail inválido") String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Token obrigatório") String token,
            @NotBlank @Size(min = PasswordPolicy.MIN_LENGTH, message = PasswordPolicy.MIN_LENGTH_MESSAGE) String newPassword
    ) {
    }

    public record EmailChangeRequest(
            @NotBlank(message = "E-mail inválido") @Email(message = "E-mail inválido") @Size(max = 180) String newEmail,
            @NotBlank(message = "Senha atual obrigatória") String currentPassword
    ) {
    }

    public record TokenRequest(@NotBlank(message = "Token obrigatório") String token) {
    }

    public record AccessHelpCreateRequest(
            @NotBlank @Pattern(regexp = "professional|tenant_admin", message = "Tipo de conta inválido") String requesterType,
            @NotBlank(message = "Nome obrigatório") @Size(min = 2, max = 150) String name,
            @NotBlank(message = "Contato obrigatório") @Size(min = 3, max = 150) String contact,
            @NotBlank(message = "Barbearia obrigatória") @Size(min = 2, max = 150) String barbershop,
            @Size(max = 1000) String message
    ) {
    }

    public record AccessHelpResponse(
            UUID id, String requesterType, String name, String contact, String barbershop, String message,
            UUID tenantId, String tenantName, String target, String status, Instant resolvedAt, Instant createdAt
    ) {
    }
}
