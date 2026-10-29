package com.agendepro.user;

import com.agendepro.common.AppException;
import com.agendepro.security.AuthenticatedUser;
import com.agendepro.security.JwtService;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantRepository;
import com.agendepro.tenant.TenantStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static com.agendepro.user.AuthDtos.*;

/** Porta de auth.controller.ts. */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptLimiter loginAttemptLimiter;

    /** Hash bcrypt fictício: e-mail inexistente também paga o custo do bcrypt (sem diferença de tempo). */
    private String dummyHash;

    /**
     * Login único para super_admin, tenant_admin e professional. Qualquer falha
     * (e-mail inexistente, senha errada, tenant suspenso) devolve a mesma mensagem.
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        if (loginAttemptLimiter.isBlocked(request.email())) {
            throw new AppException("Muitas tentativas. Tente novamente em 15 minutos.", 429, "TOO_MANY_ATTEMPTS");
        }

        User user = userRepository.findByEmail(request.email()).orElse(null);
        String hash = user != null ? user.getPasswordHash() : dummyHash();
        boolean passwordOk = passwordEncoder.matches(request.password(), hash);

        Tenant tenant = user != null && user.getTenantId() != null
                ? tenantRepository.findById(user.getTenantId()).orElse(null) : null;

        // Funcionário e dono só entram com o tenant ativo (trial conta como ativo)
        boolean tenantBlocked = tenant != null && tenant.getStatus() == TenantStatus.SUSPENDED;

        if (user == null || !passwordOk || tenantBlocked) {
            loginAttemptLimiter.recordFailure(request.email());
            throw AppException.unauthorized("E-mail ou senha inválidos", "INVALID_CREDENTIALS");
        }
        loginAttemptLimiter.reset(request.email());

        AuthenticatedUser principal = new AuthenticatedUser(user.getId(), user.getRole(), user.getTenantId(),
                user.getProfessionalId(), user.getTokenVersion());
        String token = jwtService.generateToken(principal);

        TenantSummary tenantSummary = tenant == null ? null
                : new TenantSummary(tenant.getId(), tenant.getSlug(), tenant.getName(), tenant.getStatus(), tenant.getPlan());

        UserSummary userSummary = new UserSummary(
                user.getId(), user.getName(), user.getEmail(), user.getRole(),
                user.getTenantId(), user.getProfessionalId(), tenantSummary);

        return new LoginResponse(token, userSummary);
    }

    @Transactional(readOnly = true)
    public MeResponse me(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Usuário não encontrado"));

        MeTenantSummary tenantSummary = null;
        if (user.getTenantId() != null) {
            Tenant tenant = tenantRepository.findById(user.getTenantId()).orElse(null);
            if (tenant != null) {
                tenantSummary = new MeTenantSummary(
                        tenant.getId(), tenant.getSlug(), tenant.getName(), tenant.getStatus(), tenant.getPlan(),
                        tenant.getPrimaryColor(), tenant.getAdminColor(), tenant.getLogoUrl());
            }
        }

        return new MeResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(),
                user.getTenantId(), user.getProfessionalId(), tenantSummary);
    }

    @Transactional
    public UpdateMeResponse updateMe(UUID userId, UpdateMeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Usuário não encontrado"));

        // A troca de e-mail exige senha atual + confirmação pelo novo endereço (POST /api/auth/email-change)
        if (request.email() != null && !request.email().equalsIgnoreCase(user.getEmail())) {
            throw AppException.badRequest(
                    "Para alterar o e-mail, use a opção \"Alterar e-mail\" (requer senha atual e confirmação).",
                    "USE_EMAIL_CHANGE_FLOW");
        }
        if (request.name() != null) {
            user.setName(request.name());
        }

        User saved = userRepository.save(user);
        return new UpdateMeResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(),
                saved.getTenantId(), saved.getProfessionalId());
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Usuário não encontrado"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new AppException("Senha atual incorreta", 400, "WRONG_PASSWORD");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private String dummyHash() {
        if (dummyHash == null) {
            dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
        }
        return dummyHash;
    }
}
