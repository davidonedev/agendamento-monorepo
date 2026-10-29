package com.agendepro.account;

import com.agendepro.common.ApiResponse;
import com.agendepro.common.ClientIp;
import com.agendepro.security.SecurityUtils;
import com.agendepro.user.AuthDtos.MessageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.agendepro.account.AccountDtos.*;

/**
 * Recuperação de conta. Rotas públicas em /api/auth/** (liberadas no SecurityConfig);
 * listagem/resolução de pedidos de ajuda em /api/admin/** e /api/super/** (role pelo prefixo).
 */
@Tag(name = "Account recovery")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AccountController {

    private final PasswordResetService passwordResetService;
    private final EmailChangeService emailChangeService;
    private final AccessHelpService accessHelpService;

    // ─── Senha ───────────────────────────────────────────────────────────────────

    @PostMapping("/auth/forgot-password")
    public ResponseEntity<ApiResponse<MessageResponse>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest http) {
        passwordResetService.request(request.email(), ClientIp.of(http));
        return ResponseEntity.ok(ApiResponse.ok(new MessageResponse(FORGOT_PASSWORD_MESSAGE)));
    }

    @PostMapping("/auth/reset-password")
    public ResponseEntity<ApiResponse<MessageResponse>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request, HttpServletRequest http) {
        passwordResetService.reset(request.token(), request.newPassword(), ClientIp.of(http));
        return ResponseEntity.ok(ApiResponse.ok(new MessageResponse("Senha redefinida com sucesso. Faça login com a nova senha.")));
    }

    // ─── E-mail ──────────────────────────────────────────────────────────────────

    @PostMapping("/auth/email-change")
    public ResponseEntity<ApiResponse<MessageResponse>> requestEmailChange(
            @Valid @RequestBody EmailChangeRequest request, HttpServletRequest http) {
        UUID userId = SecurityUtils.currentUser().userId();
        emailChangeService.request(userId, request.newEmail(), request.currentPassword(), ClientIp.of(http));
        return ResponseEntity.ok(ApiResponse.ok(new MessageResponse(
                "Enviamos um link de confirmação para o novo e-mail. A troca só vale depois da confirmação.")));
    }

    @PostMapping("/auth/email-change/confirm")
    public ResponseEntity<ApiResponse<MessageResponse>> confirmEmailChange(
            @Valid @RequestBody TokenRequest request, HttpServletRequest http) {
        emailChangeService.confirm(request.token(), ClientIp.of(http));
        return ResponseEntity.ok(ApiResponse.ok(new MessageResponse("E-mail alterado com sucesso. Use o novo e-mail para entrar.")));
    }

    // ─── Pedidos de ajuda ("Não consigo acessar meu e-mail") ────────────────────

    @PostMapping("/auth/access-help")
    public ResponseEntity<ApiResponse<MessageResponse>> createAccessHelp(
            @Valid @RequestBody AccessHelpCreateRequest request, HttpServletRequest http) {
        accessHelpService.create(request, ClientIp.of(http));
        return ResponseEntity.ok(ApiResponse.ok(new MessageResponse(ACCESS_HELP_MESSAGE)));
    }

    @GetMapping("/admin/access-help")
    public ResponseEntity<ApiResponse<List<AccessHelpResponse>>> listTenantAccessHelp() {
        return ResponseEntity.ok(ApiResponse.ok(accessHelpService.listForTenant(SecurityUtils.requireTenantId())));
    }

    @PatchMapping("/admin/access-help/{id}/resolve")
    public ResponseEntity<ApiResponse<AccessHelpResponse>> resolveTenantAccessHelp(@PathVariable UUID id, HttpServletRequest http) {
        return ResponseEntity.ok(ApiResponse.ok(accessHelpService.resolveForTenant(
                SecurityUtils.requireTenantId(), id, SecurityUtils.currentUser().userId(), ClientIp.of(http))));
    }

    @GetMapping("/super/access-help")
    public ResponseEntity<ApiResponse<List<AccessHelpResponse>>> listSuperAccessHelp() {
        return ResponseEntity.ok(ApiResponse.ok(accessHelpService.listForSuper()));
    }

    @PatchMapping("/super/access-help/{id}/resolve")
    public ResponseEntity<ApiResponse<AccessHelpResponse>> resolveSuperAccessHelp(@PathVariable UUID id, HttpServletRequest http) {
        return ResponseEntity.ok(ApiResponse.ok(accessHelpService.resolveForSuper(
                id, SecurityUtils.currentUser().userId(), ClientIp.of(http))));
    }
}
