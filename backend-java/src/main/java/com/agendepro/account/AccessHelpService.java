package com.agendepro.account;

import com.agendepro.audit.AuditService;
import com.agendepro.common.AppException;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.agendepro.account.AccessHelpRequest.*;
import static com.agendepro.account.AccountDtos.*;

/**
 * Pedidos "Não consigo acessar meu e-mail". Pedido de funcionário vai para o tenant
 * dele (identificado pela barbearia informada); pedido de dono — ou de funcionário
 * cuja barbearia não foi encontrada — vai para o Superadmin.
 */
@Service
@RequiredArgsConstructor
public class AccessHelpService {

    private final AccessHelpRequestRepository repository;
    private final TenantRepository tenantRepository;
    private final AuditService auditService;

    @Transactional
    public void create(AccessHelpCreateRequest request, String ip) {
        Optional<Tenant> tenant = resolveTenant(request.barbershop());
        boolean toTenant = REQUESTER_PROFESSIONAL.equals(request.requesterType()) && tenant.isPresent();

        AccessHelpRequest saved = repository.save(AccessHelpRequest.builder()
                .requesterType(request.requesterType())
                .name(request.name().trim())
                .contact(request.contact().trim())
                .barbershop(request.barbershop().trim())
                .message(request.message() == null || request.message().isBlank() ? null : request.message().trim())
                .tenantId(tenant.map(Tenant::getId).orElse(null))
                .target(toTenant ? TARGET_TENANT : TARGET_SUPER_ADMIN)
                .build());

        auditService.record(AuditService.ACCESS_HELP_REQUESTED, null, null, saved.getTenantId(), ip,
                Map.of("requestId", saved.getId().toString(), "requesterType", saved.getRequesterType(), "target", saved.getTarget()));
    }

    @Transactional(readOnly = true)
    public List<AccessHelpResponse> listForTenant(UUID tenantId) {
        return toResponses(repository.findByTargetAndTenantIdOrderByCreatedAtDesc(TARGET_TENANT, tenantId));
    }

    @Transactional(readOnly = true)
    public List<AccessHelpResponse> listForSuper() {
        return toResponses(repository.findByTargetOrderByCreatedAtDesc(TARGET_SUPER_ADMIN));
    }

    @Transactional
    public AccessHelpResponse resolveForTenant(UUID tenantId, UUID id, UUID actorId, String ip) {
        AccessHelpRequest request = repository.findByIdAndTargetAndTenantId(id, TARGET_TENANT, tenantId)
                .orElseThrow(() -> AppException.notFound("Solicitação não encontrada"));
        return resolve(request, actorId, ip);
    }

    @Transactional
    public AccessHelpResponse resolveForSuper(UUID id, UUID actorId, String ip) {
        AccessHelpRequest request = repository.findByIdAndTarget(id, TARGET_SUPER_ADMIN)
                .orElseThrow(() -> AppException.notFound("Solicitação não encontrada"));
        return resolve(request, actorId, ip);
    }

    private AccessHelpResponse resolve(AccessHelpRequest request, UUID actorId, String ip) {
        if (!STATUS_RESOLVED.equals(request.getStatus())) {
            request.setStatus(STATUS_RESOLVED);
            request.setResolvedBy(actorId);
            request.setResolvedAt(Instant.now());
            repository.save(request);
            auditService.record(AuditService.ACCESS_HELP_RESOLVED, actorId, null, request.getTenantId(), ip,
                    Map.of("requestId", request.getId().toString()));
        }
        return toResponses(List.of(request)).get(0);
    }

    /** Barbearia informada pode ser o slug do portal ou o nome (sem diferenciar maiúsculas). */
    private Optional<Tenant> resolveTenant(String barbershop) {
        String value = barbershop.trim();
        return tenantRepository.findBySlug(value.toLowerCase())
                .or(() -> tenantRepository.findFirstByNameIgnoreCase(value));
    }

    private List<AccessHelpResponse> toResponses(List<AccessHelpRequest> requests) {
        Map<UUID, String> tenantNames = tenantRepository.findAllById(
                        requests.stream().map(AccessHelpRequest::getTenantId).filter(Objects::nonNull).distinct().toList())
                .stream().collect(Collectors.toMap(Tenant::getId, Tenant::getName));
        Function<AccessHelpRequest, AccessHelpResponse> map = r -> new AccessHelpResponse(
                r.getId(), r.getRequesterType(), r.getName(), r.getContact(), r.getBarbershop(), r.getMessage(),
                r.getTenantId(), r.getTenantId() == null ? null : tenantNames.get(r.getTenantId()),
                r.getTarget(), r.getStatus(), r.getResolvedAt(), r.getCreatedAt());
        return requests.stream().map(map).toList();
    }
}
