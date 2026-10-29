package com.agendepro.appointment;

import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

/**
 * Porta do objeto {@code where} dinâmico montado em listAppointments/getRevenue
 * (appointment.controller.ts, tenant.controller.ts) — cada filtro é opcional e composto
 * via AND apenas quando presente.
 */
public final class AppointmentSpecifications {

    private AppointmentSpecifications() {
    }

    public static Specification<Appointment> tenantIdEq(UUID tenantId) {
        return (root, query, cb) -> cb.equal(root.get("tenantId"), tenantId);
    }

    public static Specification<Appointment> professionalIdEq(UUID professionalId) {
        return professionalId == null ? null : (root, query, cb) -> cb.equal(root.get("professionalId"), professionalId);
    }

    public static Specification<Appointment> statusEq(AppointmentStatus status) {
        return status == null ? null : (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Appointment> dateEq(String date) {
        return date == null ? null : (root, query, cb) -> cb.equal(root.get("date"), date);
    }

    public static Specification<Appointment> dateGte(String startDate) {
        return startDate == null ? null : (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("date"), startDate);
    }

    public static Specification<Appointment> dateLte(String endDate) {
        return endDate == null ? null : (root, query, cb) -> cb.lessThanOrEqualTo(root.get("date"), endDate);
    }

    @SafeVarargs
    public static Specification<Appointment> and(Specification<Appointment>... specs) {
        Specification<Appointment> result = Specification.where(null);
        for (Specification<Appointment> spec : specs) {
            if (spec != null) result = result.and(spec);
        }
        return result;
    }
}
