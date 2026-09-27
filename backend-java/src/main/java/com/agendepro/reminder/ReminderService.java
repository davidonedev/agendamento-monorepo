package com.agendepro.reminder;

import com.agendepro.appointment.Appointment;
import com.agendepro.appointment.AppointmentRepository;
import com.agendepro.catalog.ServiceOffering;
import com.agendepro.catalog.ServiceOfferingRepository;
import com.agendepro.client.Client;
import com.agendepro.client.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Porta de reminder.controller.ts (listAbsentClients): clientes cujo último agendamento
 * não cancelado foi há mais de `daysSince` dias, ou que nunca agendaram.
 */
@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;

    @Transactional(readOnly = true)
    public List<AbsentClientResponse> listAbsentClients(UUID tenantId, int daysSince) {
        String cutoff = LocalDate.now().minusDays(daysSince).toString();

        List<Client> clients = clientRepository.findByTenantIdAndPhoneIsNotNullOrderByNameAsc(tenantId);
        if (clients.isEmpty()) return List.of();

        List<UUID> clientIds = clients.stream().map(Client::getId).toList();
        List<Appointment> activeAppointments = appointmentRepository.findActiveByClientIds(clientIds);

        // Último agendamento (não cancelado) por cliente — mesma semântica do `take: 1`
        // do Prisma após orderBy date desc.
        Map<UUID, Appointment> lastByClient = activeAppointments.stream()
                .collect(Collectors.toMap(Appointment::getClientId, a -> a,
                        (a, b) -> a.getDate().compareTo(b.getDate()) >= 0 ? a : b));

        Map<UUID, String> serviceNames = serviceOfferingRepository
                .findAllById(lastByClient.values().stream().map(Appointment::getServiceId).distinct().toList())
                .stream().collect(Collectors.toMap(ServiceOffering::getId, ServiceOffering::getName));

        return clients.stream()
                .filter(c -> {
                    Appointment last = lastByClient.get(c.getId());
                    return last == null || last.getDate().compareTo(cutoff) <= 0;
                })
                .map(c -> {
                    Appointment last = lastByClient.get(c.getId());
                    Long daysMissing = last == null ? null
                            : ChronoUnit.DAYS.between(LocalDate.parse(last.getDate()), LocalDate.now());
                    return new AbsentClientResponse(
                            c.getId(), c.getName(), c.getPhone(), c.getEmail(), c.getCreatedAt(),
                            last == null ? null : last.getDate(),
                            last == null ? null : serviceNames.get(last.getServiceId()),
                            daysMissing);
                })
                .sorted(Comparator.comparingLong((AbsentClientResponse r) -> r.daysMissing() == null ? 9999L : r.daysMissing()).reversed())
                .toList();
    }
}
