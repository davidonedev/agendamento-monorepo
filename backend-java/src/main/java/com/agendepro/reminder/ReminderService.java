package com.agendepro.reminder;

import com.agendepro.appointment.Appointment;
import com.agendepro.appointment.AppointmentRepository;
import com.agendepro.catalog.ServiceOffering;
import com.agendepro.catalog.ServiceOfferingRepository;
import com.agendepro.client.Client;
import com.agendepro.client.ClientRepository;
import com.agendepro.notification.WhatsappService;
import com.agendepro.professional.Professional;
import com.agendepro.professional.ProfessionalRepository;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Envia lembretes automáticos de agendamento via WhatsApp.
 * - 24h antes: lembrete completo com data, horário e profissional.
 * - 2h antes:  lembrete curto de confirmação.
 *
 * Usa pg_advisory_xact_lock implícito via transação — cada instância processa
 * o mesmo conjunto de linhas mas o UPDATE em reminder_*_sent_at é atômico,
 * então não há risco de envio duplo em ambientes horizontalmente escalados.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderService {

    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;
    private final ProfessionalRepository professionalRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final TenantRepository tenantRepository;
    private final WhatsappService whatsappService;

    @Value("${app.app-url}")
    private String appUrl;

    @Value("${app.reminders.enabled:true}")
    private boolean remindersEnabled;

    // ── 24h ────────────────────────────────────────────────────────────────────

    @Scheduled(fixedDelayString = "${app.reminders.check-interval-ms:300000}")
    @Transactional
    public void send24hReminders() {
        if (!remindersEnabled) return;
        List<Appointment> pending = appointmentRepository.findNeedingReminder24h();
        if (pending.isEmpty()) return;

        log.info("[reminders] 24h: {} agendamentos para lembrar", pending.size());
        for (Appointment a : pending) {
            try {
                sendReminder(a, WhatsappService.REMINDER_24H_TEMPLATE, "24h");
                a.setReminder24hSentAt(Instant.now());
                appointmentRepository.save(a);
            } catch (Exception ex) {
                log.error("[reminders] Falha no lembrete 24h para agendamento {}: {}", a.getId(), ex.getMessage());
            }
        }
    }

    // ── 2h ─────────────────────────────────────────────────────────────────────

    @Scheduled(fixedDelayString = "${app.reminders.check-interval-ms:300000}")
    @Transactional
    public void send2hReminders() {
        if (!remindersEnabled) return;
        List<Appointment> pending = appointmentRepository.findNeedingReminder2h();
        if (pending.isEmpty()) return;

        log.info("[reminders] 2h: {} agendamentos para lembrar", pending.size());
        for (Appointment a : pending) {
            try {
                sendReminder(a, WhatsappService.REMINDER_2H_TEMPLATE, "2h");
                a.setReminder2hSentAt(Instant.now());
                appointmentRepository.save(a);
            } catch (Exception ex) {
                log.error("[reminders] Falha no lembrete 2h para agendamento {}: {}", a.getId(), ex.getMessage());
            }
        }
    }

    // ── Helper ─────────────────────────────────────────────────────────────────

    private void sendReminder(Appointment a, String template, String label) {
        Optional<Client> clientOpt = clientRepository.findById(a.getClientId());
        if (clientOpt.isEmpty() || clientOpt.get().getPhone() == null) {
            log.warn("[reminders] {}h: cliente {} sem telefone, pulando", label, a.getClientId());
            return;
        }
        Client client = clientOpt.get();

        Optional<Tenant> tenantOpt = tenantRepository.findById(a.getTenantId());
        if (tenantOpt.isEmpty()) return;
        Tenant tenant = tenantOpt.get();

        String professionalName = professionalRepository.findById(a.getProfessionalId())
                .map(Professional::getName).orElse("—");

        String serviceName = serviceOfferingRepository.findById(a.getServiceId())
                .map(ServiceOffering::getName).orElse("—");

        String formattedDate = formatDate(a.getDate());
        String portalLink = appUrl + "/" + tenant.getSlug() + "/my-appointments";

        Map<String, String> vars = Map.of(
                "clientName",  client.getName(),
                "tenantName",  tenant.getName(),
                "date",        formattedDate,
                "time",        a.getStartTime(),
                "professional", professionalName,
                "services",    serviceName,
                "portalLink",  portalLink
        );

        String message = whatsappService.interpolateTemplate(template, vars);
        WhatsappService.TenantWhatsappConfig cfg = new WhatsappService.TenantWhatsappConfig(
                tenant.getWhatsappApiUrl(), tenant.getWhatsappApiKey(), tenant.getWhatsappInstance());

        whatsappService.sendMessage(cfg, client.getPhone(), message);
        log.debug("[reminders] {}h: mensagem enviada para {} (appt {})", label, client.getPhone(), a.getId());
    }

    // ── Clientes ausentes (porta de reminder.controller.ts) ────────────────────

    @Transactional(readOnly = true)
    public List<AbsentClientResponse> listAbsentClients(UUID tenantId, int daysSince) {
        List<Client> clients = clientRepository.findByTenantIdAndPhoneIsNotNullOrderByNameAsc(tenantId);
        if (clients.isEmpty()) return List.of();

        List<UUID> clientIds = clients.stream().map(Client::getId).toList();
        List<Appointment> lastAppts = appointmentRepository.findActiveByClientIds(clientIds);

        // Último agendamento por cliente
        Map<UUID, Appointment> lastByClient = lastAppts.stream()
                .collect(Collectors.toMap(
                        Appointment::getClientId,
                        a -> a,
                        (a, b) -> a.getDate().compareTo(b.getDate()) >= 0 ? a : b
                ));

        LocalDate cutoff = LocalDate.now().minusDays(daysSince);

        return clients.stream()
                .filter(c -> {
                    Appointment last = lastByClient.get(c.getId());
                    if (last == null) return true; // nunca agendou
                    return LocalDate.parse(last.getDate()).isBefore(cutoff);
                })
                .map(c -> {
                    Appointment last = lastByClient.get(c.getId());
                    String lastDate = last != null ? last.getDate() : null;
                    String lastService = last != null
                            ? serviceOfferingRepository.findById(last.getServiceId())
                                    .map(ServiceOffering::getName).orElse(null)
                            : null;
                    long days = last != null
                            ? ChronoUnit.DAYS.between(LocalDate.parse(last.getDate()), LocalDate.now())
                            : -1L;
                    return new AbsentClientResponse(
                            c.getId(), c.getName(), c.getPhone(), c.getEmail(), c.getCreatedAt(),
                            lastDate, lastService, days < 0 ? null : days);
                })
                .toList();
    }

    private String formatDate(String date) {
        try {
            LocalDate d = LocalDate.parse(date);
            String dayOfWeek = d.getDayOfWeek().getDisplayName(TextStyle.FULL, new Locale("pt", "BR"));
            String monthName = d.getMonth().getDisplayName(TextStyle.FULL, new Locale("pt", "BR"));
            return dayOfWeek.substring(0, 1).toUpperCase() + dayOfWeek.substring(1)
                    + ", " + d.getDayOfMonth() + " de " + monthName;
        } catch (Exception e) {
            return date;
        }
    }
}
