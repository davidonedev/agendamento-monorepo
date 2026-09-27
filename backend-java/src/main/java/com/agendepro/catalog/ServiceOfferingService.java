package com.agendepro.catalog;

import com.agendepro.common.AppException;
import com.agendepro.tenant.PlanLimits;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static com.agendepro.catalog.ServiceOfferingDtos.*;

/** Porta de service.controller.ts. */
@Service
@RequiredArgsConstructor
public class ServiceOfferingService {

    private final ServiceOfferingRepository serviceOfferingRepository;
    private final TenantRepository tenantRepository;

    @Transactional(readOnly = true)
    public List<ServiceResponse> list(UUID tenantId) {
        return serviceOfferingRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .map(ServiceResponse::from)
                .toList();
    }

    @Transactional
    public ServiceResponse create(UUID tenantId, ServiceCreateRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> AppException.notFound("Tenant não encontrado"));

        int limit = PlanLimits.of(tenant.getPlan()).services();
        long current = serviceOfferingRepository.countByTenantId(tenantId);
        if (current >= limit) {
            throw new AppException("Limite de serviços atingido para o plano " + tenant.getPlan().getValue(),
                    403, "PLAN_LIMIT_REACHED");
        }

        ServiceOffering entity = ServiceOffering.builder()
                .tenantId(tenantId)
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .duration(request.duration())
                .category(request.category())
                .isActive(request.isActive() == null || request.isActive())
                .build();

        return ServiceResponse.from(serviceOfferingRepository.save(entity));
    }

    @Transactional
    public ServiceResponse update(UUID tenantId, UUID id, ServiceUpdateRequest request) {
        ServiceOffering existing = serviceOfferingRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Serviço não encontrado"));

        if (request.name() != null) existing.setName(request.name());
        if (request.description() != null) existing.setDescription(request.description());
        if (request.price() != null) existing.setPrice(request.price());
        if (request.duration() != null) existing.setDuration(request.duration());
        if (request.category() != null) existing.setCategory(request.category());
        if (request.isActive() != null) existing.setIsActive(request.isActive());

        return ServiceResponse.from(serviceOfferingRepository.save(existing));
    }

    @Transactional
    public void delete(UUID tenantId, UUID id) {
        ServiceOffering existing = serviceOfferingRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Serviço não encontrado"));
        serviceOfferingRepository.delete(existing);
    }
}
