package com.agendepro.tenant;

import com.agendepro.appointment.Appointment;
import com.agendepro.appointment.AppointmentRepository;
import com.agendepro.appointment.AppointmentService;
import com.agendepro.appointment.AppointmentSpecifications;
import com.agendepro.appointment.AppointmentStatus;
import com.agendepro.catalog.ServiceOfferingRepository;
import com.agendepro.client.ClientRepository;
import com.agendepro.common.AppException;
import com.agendepro.professional.ProfessionalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.agendepro.tenant.TenantDtos.*;

/** Porta de tenant.controller.ts. */
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final ProfessionalRepository professionalRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;

    @Transactional(readOnly = true)
    public TenantWithCountsResponse getMyTenant(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> AppException.notFound("Tenant não encontrado"));

        TenantCounts counts = new TenantCounts(
                professionalRepository.countByTenantId(tenantId),
                serviceOfferingRepository.countByTenantId(tenantId),
                clientRepository.countByTenantId(tenantId),
                appointmentRepository.countByTenantId(tenantId));

        return TenantWithCountsResponse.from(tenant, counts);
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard(UUID tenantId) {
        String today = LocalDate.now().toString();

        List<Appointment> todayAppointments = appointmentRepository.findByTenantIdAndDateOrderByStartTimeAsc(tenantId, today);
        long pending = appointmentRepository.countByTenantIdAndStatus(tenantId, AppointmentStatus.PENDING);
        long confirmed = appointmentRepository.countByTenantIdAndStatus(tenantId, AppointmentStatus.CONFIRMED);
        long completed = appointmentRepository.countByTenantIdAndStatus(tenantId, AppointmentStatus.COMPLETED);
        long totalClients = clientRepository.countByTenantId(tenantId);
        double totalRevenue = appointmentRepository.sumPriceByTenantIdAndStatus(tenantId, AppointmentStatus.COMPLETED);

        double todayRevenue = todayAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .mapToDouble(Appointment::getPrice)
                .sum();

        DashboardToday todayDto = new DashboardToday(appointmentService.toResponses(todayAppointments), todayRevenue);
        DashboardStats stats = new DashboardStats(pending, confirmed, completed, totalClients, totalRevenue);
        return new DashboardResponse(todayDto, stats);
    }

    @Transactional
    public TenantResponse updateSettings(UUID tenantId, UpdateSettingsRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> AppException.notFound("Tenant não encontrado"));

        if (request.name() != null) tenant.setName(request.name());
        if (request.ownerName() != null) tenant.setOwnerName(request.ownerName());
        if (request.phone() != null) tenant.setPhone(request.phone());
        if (request.address() != null) tenant.setAddress(request.address());
        if (request.primaryColor() != null) tenant.setPrimaryColor(request.primaryColor());
        if (request.adminColor() != null) tenant.setAdminColor(request.adminColor());
        if (request.logoUrl() != null) tenant.setLogoUrl(request.logoUrl());
        if (request.bannerUrl() != null) tenant.setBannerUrl(request.bannerUrl());
        if (request.isOpen() != null) tenant.setIsOpen(request.isOpen());
        if (request.minAdvanceMinutes() != null) tenant.setMinAdvanceMinutes(request.minAdvanceMinutes());
        if (request.whatsappApiUrl() != null) tenant.setWhatsappApiUrl(request.whatsappApiUrl());
        if (request.whatsappApiKey() != null) tenant.setWhatsappApiKey(request.whatsappApiKey());
        if (request.whatsappInstance() != null) tenant.setWhatsappInstance(request.whatsappInstance());
        if (request.whatsappTemplate() != null) tenant.setWhatsappTemplate(request.whatsappTemplate());

        return TenantResponse.from(tenantRepository.save(tenant));
    }

    @Transactional(readOnly = true)
    public RevenueResponse revenue(UUID tenantId, String startDate, String endDate, UUID professionalId) {
        var spec = AppointmentSpecifications.and(
                AppointmentSpecifications.tenantIdEq(tenantId),
                AppointmentSpecifications.statusEq(AppointmentStatus.COMPLETED),
                AppointmentSpecifications.dateGte(startDate),
                AppointmentSpecifications.dateLte(endDate),
                AppointmentSpecifications.professionalIdEq(professionalId));

        List<Appointment> appointments = appointmentRepository.findAll(spec,
                org.springframework.data.domain.Sort.by("date").ascending());

        var services = serviceOfferingRepository.findAllById(appointments.stream().map(Appointment::getServiceId).distinct().toList())
                .stream().collect(Collectors.toMap(s -> s.getId(), s -> s.getName()));
        var professionals = professionalRepository.findAllById(appointments.stream().map(Appointment::getProfessionalId).distinct().toList())
                .stream().collect(Collectors.toMap(p -> p.getId(), p -> p.getName()));

        Map<String, Double> byDate = new LinkedHashMap<>();
        Map<UUID, GroupStat> byServiceAcc = new LinkedHashMap<>();
        Map<UUID, GroupStat> byProfessionalAcc = new LinkedHashMap<>();
        double total = 0;

        for (Appointment a : appointments) {
            byDate.merge(a.getDate(), a.getPrice(), Double::sum);
            total += a.getPrice();

            byServiceAcc.merge(a.getServiceId(),
                    new GroupStat(services.getOrDefault(a.getServiceId(), ""), a.getPrice(), 1),
                    (o, n) -> new GroupStat(o.name(), o.revenue() + n.revenue(), o.count() + 1));

            byProfessionalAcc.merge(a.getProfessionalId(),
                    new GroupStat(professionals.getOrDefault(a.getProfessionalId(), ""), a.getPrice(), 1),
                    (o, n) -> new GroupStat(o.name(), o.revenue() + n.revenue(), o.count() + 1));
        }

        return new RevenueResponse(total, appointments.size(), byDate,
                List.copyOf(byServiceAcc.values()), List.copyOf(byProfessionalAcc.values()));
    }
}
