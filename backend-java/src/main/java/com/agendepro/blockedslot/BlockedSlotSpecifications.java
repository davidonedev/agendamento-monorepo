package com.agendepro.blockedslot;

import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class BlockedSlotSpecifications {

    private BlockedSlotSpecifications() {
    }

    public static Specification<BlockedSlot> tenantIdEq(UUID tenantId) {
        return (root, query, cb) -> cb.equal(root.get("tenantId"), tenantId);
    }

    public static Specification<BlockedSlot> professionalIdEq(UUID professionalId) {
        return professionalId == null ? null : (root, query, cb) -> cb.equal(root.get("professionalId"), professionalId);
    }

    public static Specification<BlockedSlot> dateEq(String date) {
        return date == null ? null : (root, query, cb) -> cb.equal(root.get("date"), date);
    }

    public static Specification<BlockedSlot> dateGte(String startDate) {
        return startDate == null ? null : (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("date"), startDate);
    }

    public static Specification<BlockedSlot> dateLte(String endDate) {
        return endDate == null ? null : (root, query, cb) -> cb.lessThanOrEqualTo(root.get("date"), endDate);
    }

    @SafeVarargs
    public static Specification<BlockedSlot> and(Specification<BlockedSlot>... specs) {
        Specification<BlockedSlot> result = Specification.where(null);
        for (Specification<BlockedSlot> spec : specs) {
            if (spec != null) result = result.and(spec);
        }
        return result;
    }
}
