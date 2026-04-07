import { useState, useEffect, useCallback } from 'react';
import {
  Bell, MessageCircle, Search, RefreshCw, Loader2,
  Clock, Calendar, ChevronDown, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { listAbsentClientsApi, type AbsentClient } from '@/services/reminders.service';

// ─── Opções de período de ausência ───────────────────────────────────────────
const PERIOD_OPTIONS = [
  { label: '7 dias',   value: 7   },
  { label: '15 dias',  value: 15  },
  { label: '30 dias',  value: 30  },
  { label: '45 dias',  value: 45  },
  { label: '60 dias',  value: 60  },
  { label: '90 dias',  value: 90  },
  { label: '6 meses',  value: 180 },
  { label: '1 ano',    value: 365 },
];

// ─── Mensagem padrão de WhatsApp ──────────────────────────────────────────────
function buildWhatsAppUrl(client: AbsentClient, message: string): string {
  // Remove tudo que não for número
  const phone = client.phone.replace(/\D/g, '');
  // Adiciona DDI 55 (Brasil) se não tiver
  const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encoded}`;
}

function defaultMessage(client: AbsentClient, daysSince: number): string {
  return `Olá ${client.name}! 👋\n\nSentimos sua falta! Faz ${daysSince > 0 ? `${daysSince} dias` : 'um tempo'} que você não passa por aqui.\n\nQue tal agendar um horário? Estamos à disposição! 💈`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RemindersView() {
  const [daysSince, setDaysSince]     = useState(30);
  const [dropOpen, setDropOpen]       = useState(false);
  const [clients, setClients]         = useState<AbsentClient[]>([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [msgOverrides, setMsgOverrides] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAbsentClientsApi(daysSince);
      setClients(data);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [daysSince]);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const getMessage = (c: AbsentClient) =>
    msgOverrides[c.id] ?? defaultMessage(c, c.daysMissing ?? daysSince);

  const periodLabel = PERIOD_OPTIONS.find(o => o.value === daysSince)?.label ?? `${daysSince} dias`;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" /> Lembretes
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Clientes que não voltaram há mais de <strong>{periodLabel}</strong>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar cliente ou telefone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Seletor de período */}
        <div className="relative">
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={() => setDropOpen(v => !v)}
          >
            <Clock className="h-4 w-4" />
            Ausente há: <strong>{periodLabel}</strong>
            <ChevronDown className={`h-4 w-4 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
          </Button>
          {dropOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border bg-card shadow-lg py-1 overflow-hidden">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setDaysSince(opt.value); setDropOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-muted
                    ${opt.value === daysSince ? 'font-semibold text-primary bg-primary/5' : 'text-foreground'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estatística rápida */}
      {!loading && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} ausente{filtered.length !== 1 ? 's' : ''}
          </Badge>
          <span className="text-muted-foreground">com telefone cadastrado</span>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground gap-3">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando clientes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Bell className="h-10 w-10 opacity-20" />
          <p className="font-medium">
            {clients.length === 0
              ? `Nenhum cliente ausente há mais de ${periodLabel}.`
              : 'Nenhum resultado para essa busca.'}
          </p>
          {clients.length === 0 && (
            <p className="text-xs">Tente aumentar o período ou aguardar mais agendamentos.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(client => {
            const isExpanded = expandedId === client.id;
            const msg = getMessage(client);
            const waUrl = buildWhatsAppUrl(client, msg);
            const daysLabel = client.daysMissing !== null
              ? `${client.daysMissing} dias ausente`
              : 'Nunca agendou';

            return (
              <Card key={client.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Linha principal */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{client.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">{client.phone}</span>
                        {client.lastServiceName && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            Último: {client.lastServiceName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          client.daysMissing === null ? 'outline' :
                          client.daysMissing >= 90 ? 'destructive' :
                          client.daysMissing >= 30 ? 'secondary' :
                          'outline'
                        }
                        className="text-xs whitespace-nowrap"
                      >
                        <Calendar className="h-2.5 w-2.5 mr-1" />
                        {daysLabel}
                      </Badge>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                        onClick={() => setExpandedId(isExpanded ? null : client.id)}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>

                  {/* Painel expandido — editar mensagem + enviar */}
                  {isExpanded && (
                    <div className="border-t px-4 py-3 bg-muted/30 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Mensagem de lembrete
                      </p>
                      <textarea
                        rows={5}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                        value={msg}
                        onChange={e => setMsgOverrides(prev => ({ ...prev, [client.id]: e.target.value }))}
                      />
                      <div className="flex justify-between items-center gap-3">
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                          onClick={() => setMsgOverrides(prev => {
                            const next = { ...prev };
                            delete next[client.id];
                            return next;
                          })}
                        >
                          Restaurar padrão
                        </button>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Enviar via WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
