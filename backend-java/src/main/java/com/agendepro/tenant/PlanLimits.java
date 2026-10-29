package com.agendepro.tenant;

import java.util.Map;

/** Porta de PLAN_LIMITS (types/index.ts). Infinity → Integer.MAX_VALUE. */
public final class PlanLimits {

    private PlanLimits() {
    }

    public record Limits(int professionals, int services) {
    }

    private static final Map<TenantPlan, Limits> LIMITS = Map.of(
            TenantPlan.BASIC, new Limits(2, 3),
            TenantPlan.PRO, new Limits(Integer.MAX_VALUE, Integer.MAX_VALUE),
            TenantPlan.ENTERPRISE, new Limits(Integer.MAX_VALUE, Integer.MAX_VALUE)
    );

    public static Limits of(TenantPlan plan) {
        return LIMITS.get(plan);
    }
}
