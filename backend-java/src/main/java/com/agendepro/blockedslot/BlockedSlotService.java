package com.agendepro.blockedslot;

import com.agendepro.common.AppException;
import com.agendepro.professional.Professional;
import com.agendepro.professional.ProfessionalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.agendepro.blockedslot.BlockedSlotDtos.*;

/** Porta de blockedSlot.controller.ts. */
@Service
@RequiredArgsConstructor
public class BlockedSlotService {

    private final BlockedSlotRepository blockedSlotRepository;
    private final ProfessionalRepository professionalRepository;

    @Transactional(readOnly = true)
    public List<BlockedSlotResponse> list(UUID tenantId, UUID professionalId, String date, String startDate, String endDate) {
        Specification<BlockedSlot> spec = BlockedSlotSpecifications.and(
                BlockedSlotSpecifications.tenantIdEq(tenantId),
                BlockedSlotSpecifications.professionalIdEq(professionalId),
                date != null ? BlockedSlotSpecifications.dateEq(date) : BlockedSlotSpecifications.dateGte(startDate),
                date != null ? null : BlockedSlotSpecifications.dateLte(endDate));

        List<BlockedSlot> slots = blockedSlotRepository.findAll(spec,
                org.springframework.data.domain.Sort.by("date").ascending().and(org.springframework.data.domain.Sort.by("startTime").ascending()));

        Map<UUID, Professional> professionals = professionalRepository
                .findAllById(slots.stream().map(BlockedSlot::getProfessionalId).distinct().toList())
                .stream().collect(Collectors.toMap(Professional::getId, p -> p));

        return slots.stream().map(s -> toResponse(s, professionals.get(s.getProfessionalId()))).toList();
    }

    @Transactional
    public BlockedSlotResponse create(UUID tenantId, BlockedSlotRequest request) {
        Professional professional = professionalRepository.findByIdAndTenantId(request.professionalId(), tenantId)
                .orElseThrow(() -> AppException.notFound("Profissional não encontrado"));

        String startTime = request.startTimeHHmm();
        String endTime = request.endTimeHHmm();
        if (startTime.compareTo(endTime) >= 0) {
            throw new AppException("Horário de início deve ser anterior ao horário de fim", 400);
        }

        BlockedSlot saved = blockedSlotRepository.save(BlockedSlot.builder()
                .tenantId(tenantId)
                .professionalId(request.professionalId())
                .date(request.date())
                .startTime(startTime)
                .endTime(endTime)
                .reason(request.reason())
                .build());

        return toResponse(saved, professional);
    }

    @Transactional
    public void delete(UUID tenantId, UUID id) {
        BlockedSlot existing = blockedSlotRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Horário bloqueado não encontrado"));
        blockedSlotRepository.delete(existing);
    }

    private BlockedSlotResponse toResponse(BlockedSlot s, Professional p) {
        ProfessionalRef ref = p == null ? null : new ProfessionalRef(p.getId(), p.getName(), p.getSpecialty(), p.getAvatar(), p.getPhotoUrl());
        return new BlockedSlotResponse(s.getId(), s.getTenantId(), s.getProfessionalId(), s.getDate(),
                s.getStartTime(), s.getEndTime(), s.getReason(), ref);
    }
}
