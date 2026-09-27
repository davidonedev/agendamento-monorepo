package com.agendepro.testsupport;

import com.agendepro.blockedslot.BlockedSlot;
import com.agendepro.blockedslot.BlockedSlotRepository;
import com.agendepro.catalog.ServiceOffering;
import com.agendepro.catalog.ServiceOfferingRepository;
import com.agendepro.client.Client;
import com.agendepro.client.ClientRepository;
import com.agendepro.professional.Professional;
import com.agendepro.professional.ProfessionalRepository;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.tenant.TenantRepository;
import com.agendepro.tenant.TenantStatus;
import com.agendepro.user.User;
import com.agendepro.user.UserRepository;
import com.agendepro.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Fábricas rápidas de dados de teste direto via repositório — sem passar por HTTP. */
@Component
@RequiredArgsConstructor
public class TestFixtures {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final ProfessionalRepository professionalRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ClientRepository clientRepository;
    private final BlockedSlotRepository blockedSlotRepository;
    private final PasswordEncoder passwordEncoder;

    public Tenant tenant(TenantPlan plan) {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        return tenantRepository.save(Tenant.builder()
                .slug("tenant-" + unique).name("Tenant " + unique).ownerName("Owner " + unique)
                .email("owner-" + unique + "@example.com").status(TenantStatus.ACTIVE).plan(plan).build());
    }

    public User admin(Tenant tenant, String email, String rawPassword) {
        return userRepository.save(User.builder()
                .name("Admin").email(email).passwordHash(passwordEncoder.encode(rawPassword))
                .role(UserRole.TENANT_ADMIN).tenantId(tenant.getId()).build());
    }

    public User professionalUser(Tenant tenant, Professional professional, String email, String rawPassword) {
        return userRepository.save(User.builder()
                .name(professional.getName()).email(email).passwordHash(passwordEncoder.encode(rawPassword))
                .role(UserRole.PROFESSIONAL).tenantId(tenant.getId()).professionalId(professional.getId()).build());
    }

    public Professional professional(Tenant tenant) {
        return professionalRepository.save(Professional.builder()
                .tenantId(tenant.getId()).name("Prof " + UUID.randomUUID().toString().substring(0, 6))
                .workingHoursStart("08:00").workingHoursEnd("18:00")
                .workingDays(new Integer[]{0, 1, 2, 3, 4, 5, 6}).build());
    }

    public ServiceOffering service(Tenant tenant, double price, int durationMinutes) {
        return serviceOfferingRepository.save(ServiceOffering.builder()
                .tenantId(tenant.getId()).name("Service " + UUID.randomUUID().toString().substring(0, 6))
                .price(price).duration(durationMinutes).build());
    }

    public Client client(Tenant tenant) {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        return clientRepository.save(Client.builder()
                .tenantId(tenant.getId()).name("Client " + unique).email("client-" + unique + "@example.com").build());
    }

    public BlockedSlot blockedSlot(Tenant tenant, Professional professional, String date, String start, String end) {
        return blockedSlotRepository.save(BlockedSlot.builder()
                .tenantId(tenant.getId()).professionalId(professional.getId()).date(date).startTime(start).endTime(end).build());
    }
}
