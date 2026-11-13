import { useEffect, useRef, useState } from 'react';
import { CalendarClock, Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { relativeDayLabel } from '@/lib/painel';
import type { DashboardSummary } from '@/services/dashboard.service';
import { CardError, LinesSkeleton } from './SummaryState';

interface Props {
  upcoming?: DashboardSummary['upcoming'];
  today?: string;
  /** Link público de agendamento do estabelecimento (origem do site + slug do tenant). */
  bookingUrl: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

const STATUS_LABEL = { pending: 'Pendente', confirmed: 'Confirmado' } as const;

/** Cópia com fallback: clipboard moderno e, se bloqueado, execCommand. Retorna false se nada funcionar. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyLinkButton({ url }: { url: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const handleCopy = async () => {
    setState((await copyText(url)) ? 'copied' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 3000);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button type="button" onClick={handleCopy} className="gap-2">
        {state === 'copied' ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
        {state === 'copied' ? 'Link copiado!' : 'Copiar link de agendamento'}
      </Button>
      <p role="status" className="min-h-[1.25rem] text-xs text-muted-foreground">
        {state === 'failed' && <>Não foi possível copiar automaticamente. Copie manualmente: <span className="font-mono text-foreground">{url}</span></>}
      </p>
    </div>
  );
}

/** Próximos 5 agendamentos a partir de agora. Vazio: convida a compartilhar o link de agendamento. */
export function UpcomingAppointments({ upcoming, today, bookingUrl, loading, error, onRetry }: Props) {
  // TODO: navegar para a Agenda quando houver rota/filtro para isso.
  const handleSeeAgenda = () => { /* sem rota por enquanto */ };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5 text-primary" aria-hidden /> Próximos agendamentos
          {upcoming && upcoming.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={handleSeeAgenda}>Ver agenda</Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <LinesSkeleton /> : error || !upcoming ? <CardError onRetry={onRetry} /> : upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              Sua agenda está vazia. Compartilhe seu link de agendamento para receber o primeiro cliente.
            </p>
            <CopyLinkButton url={bookingUrl} />
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map(a => (
              <li key={a.id} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="min-w-[56px] text-center">
                  <p className="text-sm font-bold text-primary">{a.startTime}</p>
                  <p className="text-xs text-muted-foreground">{today ? relativeDayLabel(a.date, today) : a.date}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.clientName}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.serviceName} · {a.professionalName}</p>
                </div>
                <Badge variant={a.status === 'confirmed' ? 'info' : 'warning'}>{STATUS_LABEL[a.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
