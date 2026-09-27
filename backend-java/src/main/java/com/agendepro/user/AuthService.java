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

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> AppException.unauthorized("E-mail ou senha inválidos", "INVALID_CREDENTIALS"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw AppException.unauthorized("E-mail ou senha inválidos", "INVALID_CREDENTIALS");
        }

        Tenant tenant = user.getTenantId() != null ? tenantRepository.findById(user.getTenantId()).orElse(null) : null;

        if (tenant != null && tenant.getStatus() == TenantStatus.SUSPENDED) {
            throw new AppException("Conta suspensa. Entre em contato com o suporte.", 403, "TENANT_SUSPENDED");
        }

        AuthenticatedUser principal = new AuthenticatedUser(user.getId(), user.getRole(), user.getTenantId(), user.getProfessionalId());
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

        if (request.email() != null) {
            userRepository.findByEmail(request.email()).ifPresent(existing -> {
                if (!existing.getId().equals(userId)) {
                    throw new AppException("E-mail já está em uso", 400, "EMAIL_IN_USE");
                }
            });
            user.setEmail(request.email());
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
}
