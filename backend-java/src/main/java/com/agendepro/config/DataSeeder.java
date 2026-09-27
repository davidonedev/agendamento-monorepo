package com.agendepro.config;

import com.agendepro.catalog.ServiceOffering;
import com.agendepro.catalog.ServiceOfferingRepository;
import com.agendepro.client.Client;
import com.agendepro.client.ClientRepository;
import com.agendepro.appointment.Appointment;
import com.agendepro.appointment.AppointmentRepository;
import com.agendepro.appointment.AppointmentStatus;
import com.agendepro.professional.Professional;
import com.agendepro.professional.ProfessionalRepository;
import com.agendepro.professional.ProfessionalServiceLink;
import com.agendepro.professional.ProfessionalServiceLinkRepository;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantPlan;
import com.agendepro.tenant.TenantRepository;
import com.agendepro.tenant.TenantStatus;
import com.agendepro.user.User;
import com.agendepro.user.UserRepository;
import com.agendepro.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Porta de seed/index.ts — popula tenants/profissionais/serviços/clientes de
 * demonstração. Idempotente por chave natural (slug/email/nome), já que os IDs aqui
 * são UUIDs gerados pela aplicação (diferente dos IDs fixos usados no seed do Node).
 * Ativado por `app.seed.enabled=true` (padrão em dev — ver application.yml/.env.example).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ProfessionalRepository professionalRepository;
    private final ProfessionalServiceLinkRepository linkRepository;
    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) return;
        if (tenantRepository.count() > 0) {
            log.info("[seed] Banco já populado — pulando seed.");
            return;
        }

        log.info("[seed] Iniciando seed...");

        userRepository.save(User.builder()
                .name("Super Admin").email("super@agendepro.com")
                .passwordHash(passwordEncoder.encode("super123")).role(UserRole.SUPER_ADMIN).build());

        seedBarberKings();
        seedNavalhaDeOuro();
        seedBarbeariaVintage();

        log.info("[seed] Concluído! Contas: super@agendepro.com/super123, " +
                "admin@barber-kings.com/admin123, admin@navalha.com/admin123, admin@vintage.com/admin123, " +
                "carlos@barber-kings.com|ana@barber-kings.com|marcos@barber-kings.com|felipe@navalha.com|thiago@navalha.com / prof123");
    }

    private void seedBarberKings() {
        Tenant tenant = tenantRepository.save(Tenant.builder()
                .slug("barber-kings").name("Barber Kings").ownerName("Ricardo Silva")
                .email("admin@barber-kings.com").phone("(11) 99999-1111")
                .address("Rua das Flores, 123 - São Paulo, SP")
                .status(TenantStatus.ACTIVE).plan(TenantPlan.PRO).monthlyPrice(197.0)
                .primaryColor("#1A1A2E").adminColor("#E94560").isOpen(true).build());

        userRepository.save(User.builder().name("Ricardo Silva").email("admin@barber-kings.com")
                .passwordHash(passwordEncoder.encode("admin123")).role(UserRole.TENANT_ADMIN).tenantId(tenant.getId()).build());

        ServiceOffering corte = saveService(tenant.getId(), "Corte de Cabelo", "Corte masculino moderno", 45, 30, "Cabelo");
        ServiceOffering barba = saveService(tenant.getId(), "Barba", "Aparar e modelar barba", 35, 30, "Barba");
        ServiceOffering combo = saveService(tenant.getId(), "Corte + Barba", "Pacote completo", 70, 60, "Combo");
        ServiceOffering coloracao = saveService(tenant.getId(), "Coloração", "Coloração masculina", 80, 90, "Coloração");
        ServiceOffering hidratacao = saveService(tenant.getId(), "Hidratação", "Tratamento capilar", 55, 45, "Tratamento");

        Professional carlos = saveProfessional(tenant.getId(), "Carlos Mendes", "Especialista em Cortes Clássicos",
                "Barbeiro com 10 anos de experiência, especializado em cortes clássicos e modernos.",
                "08:00", "18:00", new Integer[]{1, 2, 3, 4, 5, 6});
        Professional ana = saveProfessional(tenant.getId(), "Ana Paula", "Especialista em Coloração",
                "Cabeleireira e colorista com foco em técnicas modernas.",
                "09:00", "17:00", new Integer[]{1, 2, 3, 4, 5});
        Professional marcos = saveProfessional(tenant.getId(), "Marcos Oliveira", "Barbeiro e Especialista em Barba",
                "Expert em barba e cuidados faciais.", "10:00", "20:00", new Integer[]{1, 2, 3, 4, 5, 6});

        link(carlos, corte); link(carlos, barba); link(carlos, combo);
        link(ana, corte); link(ana, coloracao); link(ana, hidratacao);
        link(marcos, barba); link(marcos, combo);

        userRepository.save(User.builder().name("Carlos Mendes").email("carlos@barber-kings.com")
                .passwordHash(passwordEncoder.encode("prof123")).role(UserRole.PROFESSIONAL)
                .tenantId(tenant.getId()).professionalId(carlos.getId()).build());
        userRepository.save(User.builder().name("Ana Paula").email("ana@barber-kings.com")
                .passwordHash(passwordEncoder.encode("prof123")).role(UserRole.PROFESSIONAL)
                .tenantId(tenant.getId()).professionalId(ana.getId()).build());
        userRepository.save(User.builder().name("Marcos Oliveira").email("marcos@barber-kings.com")
                .passwordHash(passwordEncoder.encode("prof123")).role(UserRole.PROFESSIONAL)
                .tenantId(tenant.getId()).professionalId(marcos.getId()).build());

        Client joao = saveClient(tenant.getId(), "João Santos", "joao@email.com", "(11) 98765-4321");
        Client pedro = saveClient(tenant.getId(), "Pedro Costa", "pedro@email.com", "(11) 91234-5678");
        Client lucas = saveClient(tenant.getId(), "Lucas Ferreira", "lucas@email.com", "(11) 94567-8901");

        String today = LocalDate.now().toString();
        appointmentRepository.save(Appointment.builder().tenantId(tenant.getId()).clientId(joao.getId())
                .professionalId(carlos.getId()).serviceId(corte.getId()).date(today)
                .startTime("09:00").endTime("09:30").status(AppointmentStatus.CONFIRMED).price(45.0).build());
        appointmentRepository.save(Appointment.builder().tenantId(tenant.getId()).clientId(pedro.getId())
                .professionalId(marcos.getId()).serviceId(combo.getId()).date(today)
                .startTime("10:00").endTime("11:00").status(AppointmentStatus.PENDING).price(70.0).build());
        appointmentRepository.save(Appointment.builder().tenantId(tenant.getId()).clientId(lucas.getId())
                .professionalId(ana.getId()).serviceId(coloracao.getId()).date(today)
                .startTime("14:00").endTime("15:30").status(AppointmentStatus.PENDING).price(80.0).build());

        log.info("[seed] Tenant 1 (Barber Kings) criado");
    }

    private void seedNavalhaDeOuro() {
        Tenant tenant = tenantRepository.save(Tenant.builder()
                .slug("navalha-de-ouro").name("Navalha de Ouro").ownerName("Felipe Santos")
                .email("admin@navalha.com").phone("(21) 99999-2222")
                .address("Av. Brasil, 456 - Rio de Janeiro, RJ")
                .status(TenantStatus.ACTIVE).plan(TenantPlan.BASIC).monthlyPrice(97.0)
                .primaryColor("#FFD700").isOpen(true).build());

        userRepository.save(User.builder().name("Felipe Santos").email("admin@navalha.com")
                .passwordHash(passwordEncoder.encode("admin123")).role(UserRole.TENANT_ADMIN).tenantId(tenant.getId()).build());

        ServiceOffering degrade = saveService(tenant.getId(), "Corte Degradê", null, 50, 40, "Cabelo");
        ServiceOffering barbaCompleta = saveService(tenant.getId(), "Barba Completa", null, 40, 35, "Barba");
        ServiceOffering sobrancelha = saveService(tenant.getId(), "Sobrancelha", null, 20, 20, "Estética");

        Professional felipe = saveProfessional(tenant.getId(), "Felipe Barbosa", "Cortes Modernos", null,
                "09:00", "19:00", new Integer[]{1, 2, 3, 4, 5, 6});
        Professional thiago = saveProfessional(tenant.getId(), "Thiago Lima", "Barba e Estética", null,
                "10:00", "18:00", new Integer[]{1, 2, 3, 4, 5});

        link(felipe, degrade); link(felipe, barbaCompleta);
        link(thiago, barbaCompleta); link(thiago, sobrancelha);

        userRepository.save(User.builder().name("Felipe Barbosa").email("felipe@navalha.com")
                .passwordHash(passwordEncoder.encode("prof123")).role(UserRole.PROFESSIONAL)
                .tenantId(tenant.getId()).professionalId(felipe.getId()).build());
        userRepository.save(User.builder().name("Thiago Lima").email("thiago@navalha.com")
                .passwordHash(passwordEncoder.encode("prof123")).role(UserRole.PROFESSIONAL)
                .tenantId(tenant.getId()).professionalId(thiago.getId()).build());

        log.info("[seed] Tenant 2 (Navalha de Ouro) criado");
    }

    private void seedBarbeariaVintage() {
        Tenant tenant = tenantRepository.save(Tenant.builder()
                .slug("barbearia-vintage").name("Barbearia Vintage").ownerName("Roberto Alves")
                .email("admin@vintage.com").phone("(31) 99999-3333")
                .status(TenantStatus.SUSPENDED).plan(TenantPlan.BASIC).monthlyPrice(97.0)
                .primaryColor("#8B4513").isOpen(false).build());

        userRepository.save(User.builder().name("Roberto Alves").email("admin@vintage.com")
                .passwordHash(passwordEncoder.encode("admin123")).role(UserRole.TENANT_ADMIN).tenantId(tenant.getId()).build());

        log.info("[seed] Tenant 3 (Barbearia Vintage) criado");
    }

    private ServiceOffering saveService(java.util.UUID tenantId, String name, String description, double price, int duration, String category) {
        return serviceOfferingRepository.save(ServiceOffering.builder()
                .tenantId(tenantId).name(name).description(description).price(price).duration(duration).category(category).build());
    }

    private Professional saveProfessional(java.util.UUID tenantId, String name, String specialty, String bio,
                                           String start, String end, Integer[] workingDays) {
        return professionalRepository.save(Professional.builder()
                .tenantId(tenantId).name(name).specialty(specialty).bio(bio)
                .workingHoursStart(start).workingHoursEnd(end).workingDays(workingDays).build());
    }

    private Client saveClient(java.util.UUID tenantId, String name, String email, String phone) {
        return clientRepository.save(Client.builder().tenantId(tenantId).name(name).email(email).phone(phone).build());
    }

    private void link(Professional p, ServiceOffering s) {
        linkRepository.save(ProfessionalServiceLink.of(p.getId(), s.getId()));
    }
}
