package com.agendepro.client;

import com.agendepro.appointment.Appointment;
import com.agendepro.appointment.AppointmentRepository;
import com.agendepro.catalog.ServiceOffering;
import com.agendepro.catalog.ServiceOfferingRepository;
import com.agendepro.common.AppException;
import com.agendepro.professional.Professional;
import com.agendepro.professional.ProfessionalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.agendepro.client.ClientDtos.*;

/** Porta de client.controller.ts. */
@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ProfessionalRepository professionalRepository;

    @Transactional(readOnly = true)
    public List<ClientResponse> list(UUID tenantId, String search) {
        String normalizedSearch = (search == null || search.isBlank()) ? null : search;
        return clientRepository.search(tenantId, normalizedSearch).stream()
                .map(c -> ClientResponse.from(c, appointmentRepository.countByClientId(c.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientDetailResponse getDetail(UUID tenantId, UUID id) {
        Client client = clientRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Cliente não encontrado"));

        List<Appointment> appointments = appointmentRepository.findByTenantIdAndClientIdOrderByDateAscStartTimeAsc(tenantId, id)
                .stream().sorted(Comparator.comparing(Appointment::getDate).reversed()).toList();

        Map<UUID, ServiceOffering> services = serviceOfferingRepository
                .findAllById(appointments.stream().map(Appointment::getServiceId).toList())
                .stream().collect(Collectors.toMap(ServiceOffering::getId, s -> s));
        Map<UUID, Professional> professionals = professionalRepository
                .findAllById(appointments.stream().map(Appointment::getProfessionalId).toList())
                .stream().collect(Collectors.toMap(Professional::getId, p -> p));

        List<AppointmentHistoryItem> history = appointments.stream().map(a -> {
            ServiceOffering s = services.get(a.getServiceId());
            Professional p = professionals.get(a.getProfessionalId());
            return new AppointmentHistoryItem(
                    a.getId(), a.getDate(), a.getStartTime(), a.getEndTime(), a.getStatus().getValue(), a.getPrice(), a.getNotes(),
                    s == null ? null : new ServiceRef(s.getId(), s.getName(), s.getDuration(), s.getPrice()),
                    p == null ? null : new ProfessionalRef(p.getId(), p.getName(), p.getSpecialty()));
        }).toList();

        return new ClientDetailResponse(client.getId(), client.getTenantId(), client.getName(), client.getEmail(),
                client.getPhone(), client.getEmailVerified(), client.getCreatedAt(), client.getUpdatedAt(), history);
    }

    @Transactional
    public ClientResponse create(UUID tenantId, ClientCreateRequest request) {
        Client client = clientRepository.save(Client.builder()
                .tenantId(tenantId).name(request.name()).email(request.email()).phone(request.phone()).build());
        return ClientResponse.from(client);
    }

    @Transactional
    public ClientResponse update(UUID tenantId, UUID id, ClientUpdateRequest request) {
        Client client = clientRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Cliente não encontrado"));

        if (request.name() != null) client.setName(request.name());
        if (request.email() != null) client.setEmail(request.email());
        if (request.phone() != null) client.setPhone(request.phone());

        return ClientResponse.from(clientRepository.save(client));
    }

    @Transactional
    public void delete(UUID tenantId, UUID id) {
        Client client = clientRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Cliente não encontrado"));
        clientRepository.delete(client);
    }

    /**
     * Cria ou atualiza um cliente por (tenantId, email) — porta de prisma.client.upsert,
     * usado ao criar agendamentos (admin/professional/público). Check-then-act protegido
     * pela constraint única (tenant_id, email): sob concorrência extrema, o perdedor da
     * corrida recebe 409 DUPLICATE_ENTRY em vez de silenciosamente mesclar os dados.
     */
    @Transactional
    public Client upsertByEmail(UUID tenantId, String name, String email, String phone) {
        return clientRepository.findByTenantIdAndEmail(tenantId, email)
                .map(existing -> {
                    existing.setName(name);
                    if (phone != null) existing.setPhone(phone);
                    return clientRepository.save(existing);
                })
                .orElseGet(() -> clientRepository.save(Client.builder()
                        .tenantId(tenantId).name(name).email(email).phone(phone).build()));
    }
}
