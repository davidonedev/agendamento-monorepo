package com.agendepro.publicapi;

import com.agendepro.appointment.*;
import com.agendepro.catalog.ServiceOffering;
import com.agendepro.catalog.ServiceOfferingDtos;
import com.agendepro.catalog.ServiceOfferingRepository;
import com.agendepro.client.Client;
import com.agendepro.client.ClientEmailToken;
import com.agendepro.client.ClientEmailTokenRepository;
import com.agendepro.client.ClientRepository;
import com.agendepro.common.AppException;
import com.agendepro.notification.EmailService;
import com.agendepro.notification.WhatsappService;
import com.agendepro.professional.Professional;
import com.agendepro.professional.ProfessionalDtos;
import com.agendepro.professional.ProfessionalRepository;
import com.agendepro.professional.ProfessionalService;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantRepository;
import com.agendepro.tenant.TenantStatus;
import com.agendepro.user.User;
import com.agendepro.user.UserRepository;
import com.agendepro.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import static com.agendepro.publicapi.PublicDtos.*;

/** Porta de public.controller.ts — portal público (/api/public/**, sem autenticação). */
@Service
@RequiredArgsConstructor
public class PublicService {

    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TenantRepository tenantRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ProfessionalRepository professionalRepository;
    private final AppointmentRepository appointmentRepository;
    private final ScheduleService scheduleService;
    private final ClientRepository clientRepository;
    private final ClientEmailTokenRepository clientEmailTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final WhatsappService whatsappService;
    private final AppointmentService appointmentService;
    private final ProfessionalService professionalService;
    private final com.agendepro.blockedslot.BlockedSlotRepository blockedSlotRepository;

    @org.springframework.beans.factory.annotation.Value("${app.app-url}")
    private String appUrl;

    private final RestClient restClient = RestClient.create();

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private Tenant resolveTenant(String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> AppException.notFound("Barbearia não encontrada"));
        if (tenant.getStatus() == TenantStatus.SUSPENDED) {
            throw new AppException("Esta barbearia está temporariamente indisponível", 503);
        }
        return tenant;
    }

    private WhatsappService.TenantWhatsappConfig whatsappConfig(Tenant tenant) {
        return new WhatsappService.TenantWhatsappConfig(tenant.getWhatsappApiUrl(), tenant.getWhatsappApiKey(), tenant.getWhatsappInstance());
    }

    // ─── login-data ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LoginDataTenant> getLoginData() {
        List<Tenant> tenants = tenantRepository.findAll().stream()
                .filter(t -> t.getStatus() != TenantStatus.SUSPENDED)
                .sorted(Comparator.comparing(Tenant::getName))
                .toList();

        return tenants.stream().map(t -> {
            List<User> users = userRepository.findAll().stream().filter(u -> t.getId().equals(u.getTenantId())).toList();
            List<LoginDataUser> userDtos = users.stream()
                    .map(u -> new LoginDataUser(u.getId(), u.getName(), u.getEmail(), u.getRole().getValue())).toList();

            List<Professional> professionals = professionalRepository.findByTenantIdOrderByNameAsc(t.getId());
            List<LoginDataProfessional> professionalDtos = professionals.stream().map(p -> {
                List<LoginDataProfessionalUser> profUsers = users.stream()
                        .filter(u -> p.getId().equals(u.getProfessionalId()))
                        .map(u -> new LoginDataProfessionalUser(u.getEmail())).toList();
                return new LoginDataProfessional(p.getId(), p.getName(), p.getSpecialty(), profUsers);
            }).toList();

            return new LoginDataTenant(t.getId(), t.getName(), t.getSlug(), t.getPlan(), t.getStatus(), userDtos, professionalDtos);
        }).toList();
    }

    // ─── tenant / catálogo público ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TenantPublicResponse getTenantBySlug(String slug) {
        Tenant t = resolveTenant(slug);
        return new TenantPublicResponse(t.getId(), t.getSlug(), t.getName(), t.getPrimaryColor(), t.getLogoUrl(),
                t.getBannerUrl(), t.getIsOpen(), t.getStatus(), t.getAddress(), t.getPhone(), t.getMinAdvanceMinutes());
    }

    @Transactional(readOnly = true)
    public List<ServiceOfferingDtos.ServiceResponse> getPublicServices(String slug) {
        Tenant t = resolveTenant(slug);
        return serviceOfferingRepository.findByTenantIdOrderByNameAsc(t.getId()).stream()
                .map(ServiceOfferingDtos.ServiceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ProfessionalPublicResponse> getPublicProfessionals(String slug, UUID serviceId) {
        Tenant t = resolveTenant(slug);
        List<Professional> professionals = serviceId != null
                ? professionalRepository.findByTenantIdAndServiceId(t.getId(), serviceId)
                : professionalRepository.findByTenantIdOrderByNameAsc(t.getId());

        return professionals.stream().map(p -> new ProfessionalPublicResponse(
                p.getId(), p.getName(), p.getSpecialty(), p.getAvatar(), p.getPhotoUrl(), p.getBio(),
                Arrays.asList(p.getWorkingDays()), p.getWorkingHoursStart(), p.getWorkingHoursEnd(),
                professionalService.buildServiceLinks(p.getId()))).toList();
    }

    // ─── disponibilidade ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<String> getAvailableSlots(String slug, UUID professionalId, String serviceId, String serviceIds, String date) {
        Tenant t = resolveTenant(slug);

        List<UUID> ids = new ArrayList<>();
        if (serviceIds != null && !serviceIds.isBlank()) {
            Arrays.stream(serviceIds.split(",")).map(String::trim).filter(s -> !s.isEmpty()).map(UUID::fromString).forEach(ids::add);
        } else if (serviceId != null && !serviceId.isBlank()) {
            ids.add(UUID.fromString(serviceId));
        }
        if (ids.isEmpty()) throw new AppException("serviceId ou serviceIds obrigatório", 400);

        if (!t.getIsOpen()) return List.of();

        Professional professional = professionalRepository.findByIdAndTenantId(professionalId, t.getId())
                .orElseThrow(() -> AppException.notFound("Profissional não encontrado"));
        List<ServiceOffering> services = serviceOfferingRepository.findByIdInAndTenantId(ids, t.getId());
        if (services.size() != ids.size()) throw AppException.notFound("Um ou mais serviços não encontrados");

        int totalDuration = services.stream().mapToInt(ServiceOffering::getDuration).sum();

        int dayOfWeek = LocalDate.parse(date).getDayOfWeek().getValue() % 7; // ISO Monday=1..Sunday=7 → JS-like 0=Sun..6=Sat
        if (Arrays.stream(professional.getWorkingDays()).noneMatch(d -> d == dayOfWeek)) {
            return List.of();
        }

        List<Appointment> appointments = appointmentRepository.findActiveByProfessionalAndDate(t.getId(), professionalId, date);
        List<com.agendepro.blockedslot.BlockedSlot> blockedSlots =
                blockedSlotRepository.findByTenantIdAndProfessionalIdAndDateOrderByStartTimeAsc(t.getId(), professionalId, date);

        List<String> allSlots = scheduleService.generateTimeSlots(professional.getWorkingHoursStart(), professional.getWorkingHoursEnd(), totalDuration, 15);

        var occupied = new ArrayList<String[]>();
        appointments.forEach(a -> occupied.add(new String[]{a.getStartTime(), a.getEndTime()}));
        blockedSlots.forEach(b -> occupied.add(new String[]{b.getStartTime(), b.getEndTime()}));

        return allSlots.stream().filter(slot -> {
            int slotEnd = ScheduleService.toMinutes(slot) + totalDuration;
            String slotEndStr = ScheduleService.fromMinutes(slotEnd);
            return occupied.stream().noneMatch(occ -> slot.compareTo(occ[1]) < 0 && slotEndStr.compareTo(occ[0]) > 0);
        }).toList();
    }

    // ─── booking (portal público) ───────────────────────────────────────────────

    @Transactional
    public List<AppointmentDtos.AppointmentResponse> createPublicBooking(String slug, BookingRequest request) {
        Tenant t = resolveTenant(slug);
        if (!t.getIsOpen()) throw new AppException("Esta barbearia está fechada para novos agendamentos", 403);

        UUID professionalId = UUID.fromString(request.professionalId());
        List<UUID> serviceIds = request.resolveServiceIds();

        Professional professional = professionalRepository.findByIdAndTenantId(professionalId, t.getId())
                .orElseThrow(() -> AppException.notFound("Profissional não encontrado"));
        List<ServiceOffering> services = serviceOfferingRepository.findByIdInAndTenantId(serviceIds, t.getId());
        if (services.size() != serviceIds.size()) throw AppException.notFound("Um ou mais serviços não encontrados neste tenant");

        List<ServiceOffering> ordered = orderServices(serviceIds, services);
        int totalDuration = ordered.stream().mapToInt(ServiceOffering::getDuration).sum();
        String startTime = request.startTimeHHmm();
        String blockEnd = ScheduleService.addMinutes(startTime, totalDuration);

        Client client = upsertClient(t.getId(), request.clientName(), request.clientEmail(), request.clientPhone());

        if (scheduleService.checkConflict(t.getId(), professionalId, request.date(), startTime, blockEnd, null)) {
            throw new AppException("Horário não disponível. Por favor escolha outro horário.", 409, "SCHEDULE_CONFLICT");
        }

        List<Appointment> created = createChainedAppointments(t.getId(), client.getId(), professionalId, ordered, request.date(), startTime, request.notes());
        return appointmentService.toResponses(created);
    }

    private List<ServiceOffering> orderServices(List<UUID> ids, List<ServiceOffering> services) {
        Map<UUID, ServiceOffering> byId = services.stream().collect(Collectors.toMap(ServiceOffering::getId, s -> s));
        return ids.stream().map(byId::get).toList();
    }

    private List<Appointment> createChainedAppointments(UUID tenantId, UUID clientId, UUID professionalId,
                                                          List<ServiceOffering> ordered, String date, String startTime, String notes) {
        List<Appointment> created = new ArrayList<>();
        String current = startTime;
        for (ServiceOffering svc : ordered) {
            String end = ScheduleService.addMinutes(current, svc.getDuration());
            Appointment appt = appointmentRepository.save(Appointment.builder()
                    .tenantId(tenantId).clientId(clientId).professionalId(professionalId).serviceId(svc.getId())
                    .date(date).startTime(current).endTime(end).price(svc.getPrice()).notes(notes)
                    .status(AppointmentStatus.PENDING).build());
            created.add(appt);
            current = end;
        }
        return created;
    }

    private Client upsertClient(UUID tenantId, String name, String email, String phone) {
        return clientRepository.findByTenantIdAndEmail(tenantId, email)
                .map(existing -> {
                    existing.setName(name);
                    if (phone != null) existing.setPhone(phone);
                    return clientRepository.save(existing);
                })
                .orElseGet(() -> clientRepository.save(Client.builder().tenantId(tenantId).name(name).email(email).phone(phone).build()));
    }

    // ─── auth de cliente ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ClientAuthResponse loginPublicClient(String slug, ClientLoginRequest request) {
        Tenant t = resolveTenant(slug);
        Client client = clientRepository.findByTenantIdAndEmail(t.getId(), request.email())
                .orElseThrow(() -> AppException.unauthorized("E-mail ou senha inválidos.", "INVALID_CREDENTIALS"));

        if (client.getPasswordHash() == null) {
            throw AppException.unauthorized("Esta conta usa login com Google. Clique em \"Continuar com Google\".", "USE_GOOGLE");
        }
        if (!passwordEncoder.matches(request.password(), client.getPasswordHash())) {
            throw AppException.unauthorized("E-mail ou senha inválidos.", "INVALID_CREDENTIALS");
        }
        if (!Boolean.TRUE.equals(client.getEmailVerified())) {
            throw new AppException("Você precisa verificar seu e-mail antes de entrar. Verifique sua caixa de entrada.", 403, "EMAIL_NOT_VERIFIED");
        }

        return new ClientAuthResponse(client.getId(), client.getName(), client.getEmail(), client.getPhone());
    }

    @Transactional
    public MessageResponse registerPublicClient(String slug, ClientRegisterRequest request) {
        Tenant t = resolveTenant(slug);

        clientRepository.findByTenantIdAndEmail(t.getId(), request.email()).ifPresent(c -> {
            throw new AppException("Este e-mail já está cadastrado neste estabelecimento. Faça login.", 409, "EMAIL_IN_USE");
        });
        checkDuplicatePhone(t.getId(), request.phone());

        Client client = clientRepository.save(Client.builder()
                .tenantId(t.getId()).name(request.name()).email(request.email()).phone(request.phone())
                .passwordHash(passwordEncoder.encode(request.password())).emailVerified(false).build());

        String token = createVerificationToken(client.getId());
        sendVerification(t, client, slug, token, null);

        return new MessageResponse("Cadastro iniciado. Verifique seu WhatsApp para ativar sua conta.");
    }

    @Transactional(readOnly = true)
    public ClientAuthResponse googleAuthPublicClient(String slug, GoogleAuthRequest request) {
        Tenant t = resolveTenant(slug);

        Map<String, Object> profile;
        try {
            profile = restClient.get()
                    .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                    .header("Authorization", "Bearer " + request.accessToken())
                    .retrieve()
                    .body(Map.class);
        } catch (Exception ex) {
            throw AppException.unauthorized("Token do Google inválido ou expirado.", "GOOGLE_AUTH_FAILED");
        }

        String email = profile == null ? null : (String) profile.get("email");
        if (email == null) throw new AppException("Não foi possível obter o e-mail da conta Google.", 400);
        String name = profile.get("name") != null ? (String) profile.get("name") : email;

        Client client = clientRepository.findByTenantIdAndEmail(t.getId(), email)
                .map(existing -> {
                    existing.setName(name);
                    return clientRepository.save(existing);
                })
                .orElseGet(() -> clientRepository.save(Client.builder().tenantId(t.getId()).name(name).email(email).build()));

        return new ClientAuthResponse(client.getId(), client.getName(), client.getEmail(), client.getPhone());
    }

    @Transactional(readOnly = true)
    public List<AppointmentDtos.AppointmentResponse> getClientAppointments(String slug, UUID clientId) {
        Tenant t = resolveTenant(slug);
        clientRepository.findByIdAndTenantId(clientId, t.getId()).orElseThrow(() -> AppException.notFound("Cliente não encontrado"));
        List<Appointment> appointments = appointmentRepository.findByTenantIdAndClientIdOrderByDateAscStartTimeAsc(t.getId(), clientId);
        return appointmentService.toResponses(appointments);
    }

    @Transactional
    public MessageResponse cancelPublicAppointment(String slug, UUID id, CancelBookingRequest request) {
        Tenant t = resolveTenant(slug);
        Appointment appointment = appointmentRepository.findByIdAndTenantIdAndClientId(id, t.getId(), request.clientId())
                .orElseThrow(() -> AppException.notFound("Agendamento não encontrado"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new AppException("Agendamento já foi cancelado.", 400, "ALREADY_CANCELLED");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new AppException("Agendamentos concluídos não podem ser cancelados.", 400, "ALREADY_COMPLETED");
        }

        // date/startTime são tratados como horário de Brasília (America/Sao_Paulo), igual ao Node.
        LocalDateTime apptDateTime = LocalDateTime.parse(appointment.getDate() + "T" + appointment.getStartTime() + ":00");
        long diffMinutes = ChronoUnit.MINUTES.between(LocalDateTime.now(SAO_PAULO), apptDateTime);

        if (diffMinutes < 60) {
            throw new AppException("O prazo de cancelamento encerrou. Com menos de 1 hora de antecedência só é possível reagendar.",
                    400, "CANCELLATION_WINDOW_EXPIRED");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
        return new MessageResponse("Agendamento cancelado com sucesso.");
    }

    // ─── cadastro de profissional público ────────────────────────────────────────

    @Transactional
    public ProfessionalRegisterResponse registerPublicProfessional(String slug, ProfessionalRegisterRequest request) {
        Tenant t = resolveTenant(slug);

        if (userRepository.existsByEmail(request.email())) {
            throw new AppException("Este e-mail já está em uso", 409, "EMAIL_IN_USE");
        }

        Professional professional = professionalRepository.save(Professional.builder()
                .tenantId(t.getId()).name(request.name()).specialty(request.specialty()).bio(request.bio())
                .workingHoursStart(request.workingHoursStart()).workingHoursEnd(request.workingHoursEnd())
                .workingDays(request.workingDays().toArray(new Integer[0])).build());

        User user = userRepository.save(User.builder()
                .name(request.name()).email(request.email()).passwordHash(passwordEncoder.encode(request.password()))
                .role(UserRole.PROFESSIONAL).tenantId(t.getId()).professionalId(professional.getId()).build());

        return new ProfessionalRegisterResponse(professional.getName(), user.getEmail());
    }

    // ─── verificação de e-mail ─────────────────────────────────────────────────

    @Transactional
    public ClientAuthResponse verifyClientEmail(String slug, String token) {
        Tenant t = resolveTenant(slug);
        ClientEmailToken record = clientEmailTokenRepository.findByToken(token)
                .orElseThrow(() -> new AppException("Link de verificação inválido ou expirado.", 400, "INVALID_TOKEN"));

        if (record.getUsedAt() != null) throw new AppException("Este link já foi utilizado.", 400, "TOKEN_USED");
        if (record.getExpiresAt().isBefore(Instant.now())) throw new AppException("Link de verificação expirado. Solicite um novo.", 400, "TOKEN_EXPIRED");

        Client client = clientRepository.findById(record.getClientId())
                .orElseThrow(() -> new AppException("Link de verificação inválido.", 400, "INVALID_TOKEN"));
        if (!client.getTenantId().equals(t.getId())) throw new AppException("Link de verificação inválido.", 400, "INVALID_TOKEN");

        client.setEmailVerified(true);
        clientRepository.save(client);
        record.setUsedAt(Instant.now());
        clientEmailTokenRepository.save(record);

        return new ClientAuthResponse(client.getId(), client.getName(), client.getEmail(), client.getPhone());
    }

    @Transactional
    public MessageResponse resendVerificationEmail(String slug, ResendVerificationRequest request) {
        Tenant t = resolveTenant(slug);
        Client client = clientRepository.findByTenantIdAndEmail(t.getId(), request.email()).orElse(null);

        if (client == null || Boolean.TRUE.equals(client.getEmailVerified())) {
            return new MessageResponse("Se o contato estiver cadastrado, você receberá um novo link.");
        }

        String token = createVerificationToken(client.getId());
        sendVerification(t, client, slug, token, null);

        return new MessageResponse("Novo link de verificação enviado.");
    }

    // ─── cadastro + agendamento combinados ────────────────────────────────────────

    @Transactional
    public RegisterAndBookResponse registerAndBook(String slug, RegisterAndBookRequest request) {
        Tenant t = resolveTenant(slug);
        if (!t.getIsOpen()) throw new AppException("Este estabelecimento está fechado para novos agendamentos.", 403);

        clientRepository.findByTenantIdAndEmail(t.getId(), request.email()).ifPresent(c -> {
            throw new AppException("Este e-mail já tem cadastro neste estabelecimento. Faça login para agendar.", 409, "EMAIL_IN_USE");
        });
        checkDuplicatePhone(t.getId(), request.phone());

        UUID professionalId = UUID.fromString(request.professionalId());
        List<UUID> serviceIds = request.serviceIds().stream().map(UUID::fromString).toList();

        Professional professional = professionalRepository.findByIdAndTenantId(professionalId, t.getId())
                .orElseThrow(() -> AppException.notFound("Profissional não encontrado."));
        List<ServiceOffering> services = serviceOfferingRepository.findByIdInAndTenantId(serviceIds, t.getId());
        if (services.size() != serviceIds.size()) throw AppException.notFound("Um ou mais serviços não encontrados.");

        List<ServiceOffering> ordered = orderServices(serviceIds, services);
        int totalDuration = ordered.stream().mapToInt(ServiceOffering::getDuration).sum();
        double totalPrice = ordered.stream().mapToDouble(ServiceOffering::getPrice).sum();
        String startTime = request.startTimeHHmm();
        String blockEnd = ScheduleService.addMinutes(startTime, totalDuration);

        if (scheduleService.checkConflict(t.getId(), professionalId, request.date(), startTime, blockEnd, null)) {
            throw new AppException("Horário não disponível. Por favor escolha outro horário.", 409, "SCHEDULE_CONFLICT");
        }

        Client client = clientRepository.save(Client.builder()
                .tenantId(t.getId()).name(request.name()).email(request.email()).phone(request.phone())
                .passwordHash(passwordEncoder.encode(request.password())).emailVerified(false).build());

        String token = createVerificationToken(client.getId());
        List<Appointment> created = createChainedAppointments(t.getId(), client.getId(), professionalId, ordered, request.date(), startTime, request.notes());

        String dateFormatted = LocalDate.parse(request.date())
                .format(DateTimeFormatter.ofPattern("EEEE, dd/MM/yyyy", new Locale("pt", "BR")));
        String serviceNames = ordered.stream().map(ServiceOffering::getName).collect(Collectors.joining(", "));
        String totalFormatted = String.format(Locale.of("pt", "BR"), "R$ %,.2f", totalPrice);

        sendVerification(t, client, slug, token, new BookingSummary(dateFormatted, startTime, professional.getName(), serviceNames, totalFormatted));

        return new RegisterAndBookResponse(appointmentService.toResponses(created),
                "Agendamento criado! Verifique seu WhatsApp para ativar sua conta.", whatsappService.normalizePhone(client.getPhone()));
    }

    private record BookingSummary(String date, String time, String professional, String services, String total) {
    }

    private void checkDuplicatePhone(UUID tenantId, String phone) {
        if (phone == null || phone.isBlank()) return;
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() < 8) return;
        String suffix = digits.substring(digits.length() - 8);
        if (clientRepository.existsByTenantIdAndPhoneContaining(tenantId, suffix)) {
            throw new AppException("Este telefone já tem cadastro neste estabelecimento. Faça login para agendar.", 409, "PHONE_IN_USE");
        }
    }

    private String createVerificationToken(UUID clientId) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        String token = sb.toString();

        clientEmailTokenRepository.save(ClientEmailToken.builder()
                .clientId(clientId).token(token).expiresAt(Instant.now().plus(24, ChronoUnit.HOURS)).build());
        return token;
    }

    private void sendVerification(Tenant tenant, Client client, String slug, String token, BookingSummary summary) {
        String verifyUrl = appUrl + "/" + slug + "/verify-email?token=" + token;

        if (client.getPhone() != null && !client.getPhone().isBlank()) {
            String template = tenant.getWhatsappTemplate() != null ? tenant.getWhatsappTemplate() : WhatsappService.DEFAULT_TEMPLATE;
            Map<String, String> vars = new HashMap<>();
            vars.put("clientName", client.getName());
            vars.put("tenantName", tenant.getName());
            vars.put("verificationLink", verifyUrl);
            vars.put("date", summary != null ? summary.date() : "");
            vars.put("time", summary != null ? summary.time() : "");
            vars.put("professional", summary != null ? summary.professional() : "");
            vars.put("services", summary != null ? summary.services() : "");
            vars.put("total", summary != null ? summary.total() : "");

            String text = whatsappService.interpolateTemplate(template, vars);
            whatsappService.sendMessage(whatsappConfig(tenant), client.getPhone(), text);
        } else {
            emailService.sendVerificationEmail(client.getEmail(), client.getName(), tenant.getName(), verifyUrl);
        }
    }

    // ─── registro de negócio (cria tenant + tenant_admin) ─────────────────────────

    @Transactional
    public BusinessRegisterResponse registerBusiness(BusinessRegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AppException("Este e-mail já está em uso. Faça login ou use outro e-mail.", 409, "EMAIL_IN_USE");
        }

        String base = request.slug() != null && !request.slug().isBlank() ? request.slug() : slugify(request.businessName());
        if (base.isBlank()) throw new AppException("Não foi possível gerar um link para o estabelecimento.", 400);
        String slug = findUniqueSlug(base);

        Tenant tenant = tenantRepository.save(Tenant.builder()
                .slug(slug).name(request.businessName()).ownerName(request.ownerName()).email(request.email())
                .phone(request.phone()).address(request.address() != null ? request.address() : "")
                .status(TenantStatus.TRIAL).plan(com.agendepro.tenant.TenantPlan.BASIC).monthlyPrice(0.0).build());

        userRepository.save(User.builder()
                .name(request.ownerName()).email(request.email()).passwordHash(passwordEncoder.encode(request.password()))
                .role(UserRole.TENANT_ADMIN).tenantId(tenant.getId()).build());

        return new BusinessRegisterResponse("Conta criada com sucesso! Faça login para começar.", slug);
    }

    private String slugify(String text) {
        String normalized = Normalizer.normalize(text.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
        return normalized.length() > 60 ? normalized.substring(0, 60) : normalized;
    }

    private String findUniqueSlug(String base) {
        String slug = base;
        int i = 2;
        while (tenantRepository.existsBySlug(slug)) {
            slug = base + "-" + i++;
        }
        return slug;
    }
}
