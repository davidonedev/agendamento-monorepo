package com.agendepro.professional;

import com.agendepro.appointment.Appointment;
import com.agendepro.appointment.AppointmentRepository;
import com.agendepro.audit.AuditService;
import com.agendepro.security.SecurityUtils;
import com.agendepro.catalog.ServiceOffering;
import com.agendepro.catalog.ServiceOfferingDtos;
import com.agendepro.catalog.ServiceOfferingRepository;
import com.agendepro.client.Client;
import com.agendepro.client.ClientRepository;
import com.agendepro.common.AppException;
import com.agendepro.tenant.PlanLimits;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantRepository;
import com.agendepro.user.User;
import com.agendepro.user.UserRepository;
import com.agendepro.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

import static com.agendepro.professional.ProfessionalDtos.*;

/** Porta de professional.controller.ts. */
@Service
@RequiredArgsConstructor
public class ProfessionalService {

    private final ProfessionalRepository professionalRepository;
    private final ProfessionalServiceLinkRepository linkRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ProfessionalResponse> list(UUID tenantId) {
        return professionalRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .map(p -> toResponse(p, appointmentRepository.countByProfessionalId(p.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProfessionalDetailResponse getDetail(UUID tenantId, UUID id) {
        Professional professional = professionalRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Profissional não encontrado"));

        List<Appointment> recent = appointmentRepository.findByTenantIdAndProfessionalIdOrderByDateDesc(
                tenantId, id, PageRequest.of(0, 20));

        Map<UUID, Client> clientsById = clientRepository.findAllById(recent.stream().map(Appointment::getClientId).toList())
                .stream().collect(Collectors.toMap(Client::getId, c -> c));
        Map<UUID, ServiceOffering> servicesById = serviceOfferingRepository.findAllById(recent.stream().map(Appointment::getServiceId).toList())
                .stream().collect(Collectors.toMap(ServiceOffering::getId, s -> s));

        List<RecentAppointment> recentDtos = recent.stream().map(a -> {
            Client c = clientsById.get(a.getClientId());
            ServiceOffering s = servicesById.get(a.getServiceId());
            ClientBasic clientBasic = c == null ? null : new ClientBasic(c.getId(), c.getName(), c.getEmail(), c.getPhone());
            return new RecentAppointment(a.getId(), a.getDate(), a.getStartTime(), a.getEndTime(),
                    a.getStatus().getValue(), a.getPrice(), clientBasic, s == null ? null : ServiceOfferingDtos.ServiceResponse.from(s));
        }).toList();

        return new ProfessionalDetailResponse(
                professional.getId(), professional.getTenantId(), professional.getName(), professional.getSpecialty(),
                professional.getAvatar(), professional.getPhotoUrl(), professional.getBio(),
                professional.getWorkingHoursStart(), professional.getWorkingHoursEnd(),
                Arrays.asList(professional.getWorkingDays()), buildServiceLinks(professional.getId()), recentDtos);
    }

    @Transactional
    public ProfessionalResponse create(UUID tenantId, ProfessionalCreateRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> AppException.notFound("Tenant não encontrado"));

        int limit = PlanLimits.of(tenant.getPlan()).professionals();
        long current = professionalRepository.countByTenantId(tenantId);
        if (current >= limit) {
            throw new AppException("Limite de profissionais atingido para o plano " + tenant.getPlan().getValue(),
                    403, "PLAN_LIMIT_REACHED");
        }

        Professional professional = professionalRepository.save(Professional.builder()
                .tenantId(tenantId)
                .name(request.name())
                .specialty(request.specialty())
                .bio(request.bio())
                .avatar(request.avatar())
                .photoUrl(request.photoUrl())
                .workingHoursStart(request.workingHoursStart())
                .workingHoursEnd(request.workingHoursEnd())
                .workingDays(request.workingDays().toArray(new Integer[0]))
                .build());

        if (!request.serviceIds().isEmpty()) {
            linkRepository.saveAll(request.serviceIds().stream()
                    .map(serviceId -> ProfessionalServiceLink.of(professional.getId(), serviceId))
                    .toList());
        }

        if (request.email() != null && request.password() != null) {
            upsertPlatformUser(request.email(), request.password(), professional.getId(), tenantId, professional.getName());
        }

        return toResponse(professional, 0L);
    }

    @Transactional
    public ProfessionalResponse update(UUID tenantId, UUID id, ProfessionalUpdateRequest request) {
        Professional professional = professionalRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Profissional não encontrado"));

        if (request.name() != null) professional.setName(request.name());
        if (request.specialty() != null) professional.setSpecialty(request.specialty());
        if (request.bio() != null) professional.setBio(request.bio());
        if (request.avatar() != null) professional.setAvatar(request.avatar());
        if (request.photoUrl() != null) professional.setPhotoUrl(request.photoUrl());
        if (request.workingHoursStart() != null) professional.setWorkingHoursStart(request.workingHoursStart());
        if (request.workingHoursEnd() != null) professional.setWorkingHoursEnd(request.workingHoursEnd());
        if (request.workingDays() != null) professional.setWorkingDays(request.workingDays().toArray(new Integer[0]));
        professionalRepository.save(professional);

        if (request.serviceIds() != null) {
            linkRepository.deleteByProfessionalId(id);
            if (!request.serviceIds().isEmpty()) {
                linkRepository.saveAll(request.serviceIds().stream()
                        .map(serviceId -> ProfessionalServiceLink.of(id, serviceId))
                        .toList());
            }
        }

        if (request.email() != null && request.password() != null) {
            upsertPlatformUser(request.email(), request.password(), id, tenantId,
                    request.name() != null ? request.name() : professional.getName());
        }

        return toResponse(professional, appointmentRepository.countByProfessionalId(id));
    }

    @Transactional
    public void delete(UUID tenantId, UUID id) {
        Professional professional = professionalRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Profissional não encontrado"));
        professionalRepository.delete(professional);
    }

    /** GET /api/professional/me — porta de professional.routes.ts (sem appointments). */
    @Transactional(readOnly = true)
    public ProfessionalResponse getSelf(UUID tenantId, UUID professionalId) {
        Professional professional = professionalRepository.findByIdAndTenantId(professionalId, tenantId)
                .orElseThrow(() -> AppException.notFound("Profissional não encontrado"));
        return toResponse(professional, null);
    }

    /** GET /api/professional/professionals — lista do tenant (sem _count). */
    @Transactional(readOnly = true)
    public List<ProfessionalResponse> listBasic(UUID tenantId) {
        return professionalRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .map(p -> toResponse(p, null))
                .toList();
    }

    /** Auto-atualização do próprio profissional (PATCH /api/professional/me). */
    @Transactional
    public ProfessionalResponse updateSelf(UUID tenantId, UUID professionalId, ProfessionalSelfUpdateRequest request) {
        if (request.workingHoursStart() != null && request.workingHoursEnd() != null
                && request.workingHoursStart().compareTo(request.workingHoursEnd()) >= 0) {
            throw new AppException("Horário de início deve ser anterior ao horário de fim", 400);
        }

        Professional professional = professionalRepository.findByIdAndTenantId(professionalId, tenantId)
                .orElseThrow(() -> AppException.notFound("Profissional não encontrado"));

        if (request.workingDays() != null) professional.setWorkingDays(request.workingDays().toArray(new Integer[0]));
        if (request.workingHoursStart() != null) professional.setWorkingHoursStart(request.workingHoursStart());
        if (request.workingHoursEnd() != null) professional.setWorkingHoursEnd(request.workingHoursEnd());
        if (request.bio() != null) professional.setBio(request.bio());
        if (request.specialty() != null) professional.setSpecialty(request.specialty());
        if (request.avatar() != null) professional.setAvatar(request.avatar());
        if (request.photoUrl() != null) professional.setPhotoUrl(request.photoUrl());
        professionalRepository.save(professional);

        return toResponse(professional, null);
    }

    /**
     * Cria ou atualiza o acesso do profissional. Só mexe no usuário já vinculado a esse
     * profissional (ou num usuário profissional órfão do MESMO tenant com esse e-mail);
     * um e-mail de qualquer outra conta é rejeitado — nunca sobrescreve senha alheia.
     */
    private void upsertPlatformUser(String email, String password, UUID professionalId, UUID tenantId, String name) {
        String passwordHash = passwordEncoder.encode(password);
        User user = userRepository.findFirstByProfessionalIdAndTenantId(professionalId, tenantId).orElse(null);
        User byEmail = userRepository.findByEmail(email).orElse(null);

        if (byEmail != null && (user == null || !byEmail.getId().equals(user.getId()))) {
            boolean orphanOfSameTenant = user == null
                    && byEmail.getRole() == UserRole.PROFESSIONAL
                    && tenantId.equals(byEmail.getTenantId())
                    && byEmail.getProfessionalId() == null;
            if (!orphanOfSameTenant) {
                throw new AppException("E-mail já está em uso", 400, "EMAIL_IN_USE");
            }
            user = byEmail;
        }

        if (user != null) {
            user.setEmail(email);
            user.setPasswordHash(passwordHash);
            user.setProfessionalId(professionalId);
            user.bumpTokenVersion(); // credenciais trocadas pelo tenant derrubam as sessões do funcionário
            auditService.record(AuditService.CREDENTIALS_CHANGED_BY_TENANT, currentUserIdOrNull(), user.getId(), tenantId,
                    null, Map.of("professionalId", professionalId.toString()));
        } else {
            user = User.builder()
                    .name(name)
                    .email(email)
                    .passwordHash(passwordHash)
                    .role(UserRole.PROFESSIONAL)
                    .tenantId(tenantId)
                    .professionalId(professionalId)
                    .build();
        }
        userRepository.save(user);
    }

    private static UUID currentUserIdOrNull() {
        try {
            return SecurityUtils.currentUser().userId();
        } catch (AppException ex) {
            return null;
        }
    }

    public List<ServiceLinkSummary> buildServiceLinks(UUID professionalId) {
        List<ProfessionalServiceLink> links = linkRepository.findByIdProfessionalId(professionalId);
        if (links.isEmpty()) return List.of();

        Map<UUID, ServiceOffering> services = serviceOfferingRepository
                .findAllById(links.stream().map(l -> l.getId().getServiceId()).toList())
                .stream().collect(Collectors.toMap(ServiceOffering::getId, s -> s));

        return links.stream()
                .map(l -> new ServiceLinkSummary(professionalId, l.getId().getServiceId(),
                        Optional.ofNullable(services.get(l.getId().getServiceId())).map(ServiceOfferingDtos.ServiceResponse::from).orElse(null)))
                .toList();
    }

    private ProfessionalResponse toResponse(Professional p, Long appointmentCount) {
        return new ProfessionalResponse(
                p.getId(), p.getTenantId(), p.getName(), p.getSpecialty(), p.getAvatar(), p.getPhotoUrl(), p.getBio(),
                p.getWorkingHoursStart(), p.getWorkingHoursEnd(), Arrays.asList(p.getWorkingDays()),
                buildServiceLinks(p.getId()), appointmentCount);
    }
}
