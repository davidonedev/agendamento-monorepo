package com.agendepro.superadmin;

import com.agendepro.appointment.Appointment;
import com.agendepro.appointment.AppointmentRepository;
import com.agendepro.appointment.AppointmentStatus;
import com.agendepro.catalog.ServiceOffering;
import com.agendepro.catalog.ServiceOfferingRepository;
import com.agendepro.client.ClientRepository;
import com.agendepro.common.AppException;
import com.agendepro.professional.Professional;
import com.agendepro.professional.ProfessionalRepository;
import com.agendepro.tenant.*;
import com.agendepro.user.User;
import com.agendepro.user.UserRepository;
import com.agendepro.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import static com.agendepro.superadmin.SuperAdminDtos.*;

/** Porta de super.controller.ts. */
@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppointmentRepository appointmentRepository;
    private final ProfessionalRepository professionalRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ClientRepository clientRepository;
    private final PlanConfigRepository planConfigRepository;

    // ─── Tenants ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TenantDtos.TenantWithCountsResponse> listTenants() {
        return tenantRepository.findAll(org.springframework.data.domain.Sort.by("createdAt").descending()).stream()
                .map(t -> TenantDtos.TenantWithCountsResponse.from(t, new TenantDtos.TenantCounts(
                        professionalRepository.countByTenantId(t.getId()),
                        serviceOfferingRepository.countByTenantId(t.getId()),
                        clientRepository.countByTenantId(t.getId()),
                        appointmentRepository.countByTenantId(t.getId()))))
                .toList();
    }

    @Transactional(readOnly = true)
    public TenantDetailResponse getTenant(UUID id) {
        Tenant tenant = tenantRepository.findById(id).orElseThrow(() -> AppException.notFound("Tenant não encontrado"));

        List<Professional> professionals = professionalRepository.findByTenantIdOrderByNameAsc(id);
        List<ProfessionalRef> professionalRefs = professionals.stream()
                .map(p -> new ProfessionalRef(p.getId(), p.getName(), p.getSpecialty(), p.getAvatar(),
                        new ProfessionalAppointmentCount(appointmentRepository.countByProfessionalId(p.getId()))))
                .toList();

        List<ServiceRef> serviceRefs = serviceOfferingRepository.findByTenantIdOrderByNameAsc(id).stream()
                .map(s -> new ServiceRef(s.getId(), s.getName(), s.getPrice(), s.getDuration(), s.getCategory()))
                .toList();

        LocalDate now = LocalDate.now();
        String todayStart = now.toString();
        String monthStart = now.withDayOfMonth(1).toString();
        String yearStart = now.withDayOfYear(1).toString();

        AppointmentStats stats = new AppointmentStats(
                periodStat(id, todayStart),
                periodStat(id, monthStart),
                periodStat(id, yearStart));

        DetailCounts counts = new DetailCounts(appointmentRepository.countByTenantId(id), clientRepository.countByTenantId(id));

        return TenantDetailResponse.from(tenant, professionalRefs, serviceRefs, counts, stats);
    }

    private PeriodStat periodStat(UUID tenantId, String fromDate) {
        var spec = com.agendepro.appointment.AppointmentSpecifications.and(
                com.agendepro.appointment.AppointmentSpecifications.tenantIdEq(tenantId),
                com.agendepro.appointment.AppointmentSpecifications.dateGte(fromDate));
        List<Appointment> appointments = appointmentRepository.findAll(spec);
        double revenue = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).mapToDouble(Appointment::getPrice).sum();
        return new PeriodStat(appointments.size(), revenue);
    }

    @Transactional
    public TenantDtos.TenantResponse createTenant(CreateTenantRequest request) {
        if (tenantRepository.existsBySlug(request.slug())) {
            throw new AppException("Slug já em uso", 409, "DUPLICATE_SLUG");
        }
        tenantRepository.findByEmail(request.email()).ifPresent(t -> {
            throw new AppException("E-mail já em uso", 409, "DUPLICATE_EMAIL");
        });

        Tenant tenant = tenantRepository.save(Tenant.builder()
                .slug(request.slug())
                .name(request.name())
                .ownerName(request.ownerName())
                .email(request.email())
                .phone(request.phone())
                .address(request.address())
                .plan(request.plan())
                .monthlyPrice(request.monthlyPrice())
                .primaryColor(request.primaryColor())
                .status(TenantStatus.TRIAL)
                .build());

        userRepository.save(User.builder()
                .name(request.ownerName())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.adminPassword()))
                .role(UserRole.TENANT_ADMIN)
                .tenantId(tenant.getId())
                .build());

        return TenantDtos.TenantResponse.from(tenant);
    }

    @Transactional
    public TenantDtos.TenantResponse updateTenant(UUID id, UpdateTenantRequest request) {
        Tenant tenant = tenantRepository.findById(id).orElseThrow(() -> AppException.notFound("Tenant não encontrado"));

        if (request.name() != null) tenant.setName(request.name());
        if (request.ownerName() != null) tenant.setOwnerName(request.ownerName());
        if (request.phone() != null) tenant.setPhone(request.phone());
        if (request.address() != null) tenant.setAddress(request.address());
        if (request.status() != null) tenant.setStatus(request.status());
        if (request.plan() != null) tenant.setPlan(request.plan());
        if (request.monthlyPrice() != null) tenant.setMonthlyPrice(request.monthlyPrice());
        if (request.primaryColor() != null) tenant.setPrimaryColor(request.primaryColor());

        return TenantDtos.TenantResponse.from(tenantRepository.save(tenant));
    }

    @Transactional
    public void deleteTenant(UUID id) {
        if (!tenantRepository.existsById(id)) throw AppException.notFound("Tenant não encontrado");
        tenantRepository.deleteById(id);
    }

    // ─── Usuários ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserListItem> listUsers() {
        List<User> users = userRepository.findByRoleIn(List.of(UserRole.TENANT_ADMIN, UserRole.PROFESSIONAL));
        Map<UUID, Tenant> tenants = tenantRepository.findAllById(
                        users.stream().map(User::getTenantId).filter(Objects::nonNull).distinct().toList())
                .stream().collect(Collectors.toMap(Tenant::getId, t -> t));

        return users.stream()
                .sorted(Comparator.comparing((User u) -> u.getRole().getValue()).thenComparing(User::getName))
                .map(u -> {
                    Tenant t = u.getTenantId() == null ? null : tenants.get(u.getTenantId());
                    return new UserListItem(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getTenantId(),
                            t == null ? null : new TenantRef(t.getName(), t.getSlug()));
                })
                .toList();
    }

    @Transactional
    public UserListItem updateUserEmail(UUID id, UpdateUserEmailRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) throw new AppException("E-mail já está em uso", 400, "EMAIL_IN_USE");
        });

        User user = userRepository.findById(id).orElseThrow(() -> AppException.notFound("Usuário não encontrado"));
        user.setEmail(request.email());
        userRepository.save(user);

        Tenant t = user.getTenantId() == null ? null : tenantRepository.findById(user.getTenantId()).orElse(null);
        return new UserListItem(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getTenantId(),
                t == null ? null : new TenantRef(t.getName(), t.getSlug()));
    }

    @Transactional
    public void forceChangePassword(UUID id, ForcePasswordRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> AppException.notFound("Usuário não encontrado"));
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    // ─── Planos ─────────────────────────────────────────────────────────────────

    private static final List<PlanConfig> PLAN_DEFAULTS = List.of(
            PlanConfig.builder().plan(TenantPlan.BASIC).displayName("Basic").defaultPrice(97.0)
                    .maxProfessionals(2).maxServices(3)
                    .features(new String[]{"Até 2 profissionais", "Agendamento online", "Gestão de clientes",
                            "Portal público personalizado", "Suporte via e-mail"}).build(),
            PlanConfig.builder().plan(TenantPlan.PRO).displayName("Pro").defaultPrice(197.0)
                    .maxProfessionals(5).maxServices(-1)
                    .features(new String[]{"Até 5 profissionais", "Agendamento online", "Gestão de clientes",
                            "Relatórios avançados", "Portal público personalizado", "Gestão de produtos", "Suporte prioritário"}).build(),
            PlanConfig.builder().plan(TenantPlan.ENTERPRISE).displayName("Premium").defaultPrice(397.0)
                    .maxProfessionals(-1).maxServices(-1)
                    .features(new String[]{"Profissionais ilimitados", "Agendamento online", "Gestão de clientes",
                            "Relatórios avançados", "Portal público personalizado", "Gestão de produtos",
                            "Suporte dedicado 24/7", "Onboarding personalizado"}).build()
    );

    @Transactional
    public List<PlanConfigResponse> listPlanConfigs() {
        for (PlanConfig defaults : PLAN_DEFAULTS) {
            planConfigRepository.findByPlan(defaults.getPlan()).orElseGet(() -> planConfigRepository.save(defaults));
        }
        return planConfigRepository.findAll(org.springframework.data.domain.Sort.by("plan")).stream()
                .map(PlanConfigResponse::from).toList();
    }

    @Transactional
    public PlanConfigResponse updatePlanConfig(TenantPlan plan, UpdatePlanConfigRequest request) {
        PlanConfig config = planConfigRepository.findByPlan(plan)
                .orElseThrow(() -> AppException.notFound("Plano não encontrado"));

        if (request.displayName() != null) config.setDisplayName(request.displayName());
        if (request.defaultPrice() != null) config.setDefaultPrice(request.defaultPrice());
        if (request.maxProfessionals() != null) config.setMaxProfessionals(request.maxProfessionals());
        if (request.maxServices() != null) config.setMaxServices(request.maxServices());
        if (request.features() != null) config.setFeatures(request.features().toArray(new String[0]));

        return PlanConfigResponse.from(planConfigRepository.save(config));
    }

    // ─── Métricas da plataforma ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PlatformMetricsResponse getPlatformMetrics() {
        long totalTenants = tenantRepository.count();
        long activeTenants = tenantRepository.countByStatus(TenantStatus.ACTIVE);
        long trialTenants = tenantRepository.countByStatus(TenantStatus.TRIAL);
        long suspendedTenants = tenantRepository.countByStatus(TenantStatus.SUSPENDED);
        long totalProfessionals = professionalRepository.count();
        long totalClients = clientRepository.count();
        long totalAppointments = appointmentRepository.count();
        long completedAppointments = appointmentRepository.countByStatus(AppointmentStatus.COMPLETED);
        double totalRevenue = appointmentRepository.sumPriceByStatus(AppointmentStatus.COMPLETED);

        Map<String, Long> byPlan = tenantRepository.findAll().stream()
                .collect(Collectors.groupingBy(t -> t.getPlan().getValue(), Collectors.counting()));

        double mrr = tenantRepository.findAll().stream()
                .filter(t -> t.getStatus() == TenantStatus.ACTIVE || t.getStatus() == TenantStatus.TRIAL)
                .mapToDouble(Tenant::getMonthlyPrice)
                .sum();

        return new PlatformMetricsResponse(
                new Totals(totalTenants, totalProfessionals, totalClients, totalAppointments, completedAppointments),
                new TenantsByStatus(activeTenants, trialTenants, suspendedTenants),
                byPlan,
                new RevenueSummary(totalRevenue, mrr));
    }
}
