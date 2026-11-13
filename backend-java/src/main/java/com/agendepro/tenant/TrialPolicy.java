package com.agendepro.tenant;

import com.agendepro.tenant.DashboardSummaryDtos.TrialInfo;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Cálculo dos dias de teste grátis — ÚNICO ponto onde o período do trial é definido.
 * TODO: o tenant ainda não guarda a data de fim do teste. Enquanto isso, o teste dura TRIAL_DAYS a partir
 * da data de criação (createdAt). Quando existir trial_ends_at (migration proposta, aguardando confirmação),
 * troque só este método para ler o campo.
 */
public final class TrialPolicy {

    public static final int TRIAL_DAYS = 30;

    private TrialPolicy() {
    }

    /**
     * @param createdDay dia de criação do tenant (America/Sao_Paulo)
     * @param today      dia atual (America/Sao_Paulo)
     */
    public static TrialInfo compute(TenantStatus status, LocalDate createdDay, LocalDate today) {
        if (status == TenantStatus.ACTIVE) return new TrialInfo("paid", 0, 0, 0, null);
        if (status != TenantStatus.TRIAL) return new TrialInfo("none", 0, 0, 0, null);

        LocalDate endsOn = createdDay.plusDays(TRIAL_DAYS);
        long elapsed = ChronoUnit.DAYS.between(createdDay, today);
        int used = (int) Math.max(0, Math.min(elapsed, TRIAL_DAYS));
        int remaining = TRIAL_DAYS - used;

        String state = remaining == 0 ? "expired" : remaining == 1 ? "last_day" : "in_progress";
        return new TrialInfo(state, TRIAL_DAYS, used, remaining, endsOn.toString());
    }
}
