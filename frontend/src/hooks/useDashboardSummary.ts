import { useCallback, useEffect, useState } from 'react';
import { getDashboardSummaryApi, type DashboardSummary } from '../services/dashboard.service';

/** Carrega o resumo do Painel; uma falha aqui só afeta os cards que dependem dele. */
export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await getDashboardSummaryApi());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { data, loading, error, reload: load };
}
