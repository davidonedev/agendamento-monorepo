import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, ChevronLeft, ChevronRight, CheckCircle, Loader2, X, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePublicTenant } from '@/context/PublicTenantContext';
import { formatCurrency } from '@/lib/utils';
import { getAvailableSlotsApi } from '@/services/public.service';
import type { Appointment, Service, Professional } from '@/types';

type Step = 'service' | 'professional' | 'datetime' | 'info' | 'confirm' | 'done';

/** Data e hora atual no fuso de Brasília. */
function nowBrasilia(): { date: string; time: string } {
  const now = new Date();
  return {
    date: now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }), // "YYYY-MM-DD"
    time: now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }), // "HH:mm"
  };
}

// ─── Detecta serviços "similares" por sobreposição de palavras significativas ──
function findSimilarPair(selected: Service[]): [Service, Service] | null {
  if (selected.length < 2) return null;

  const words = (name: string) =>
    name
      .toLowerCase()
      .replace(/[+&,]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const a = new Set(words(selected[i].name));
      const b = new Set(words(selected[j].name));
      if ([...a].some(w => b.has(w))) return [selected[i], selected[j]];
    }
  }
  return null;
}

export default function BookingFlow() {
  const { data, products: upsellProducts, addAppointment, getSlug } = usePublicTenant();
  const { services, professionals, tenant } = data;

  const navigate = useNavigate();
  const location = useLocation();
  const preService = (location.state as { serviceId?: string } | null)?.serviceId;

  const [step, setStep] = useState<Step>(preService ? 'professional' : 'service');

  // Multi-seleção de serviços
  const [selSvcs, setSelSvcs] = useState<Service[]>(
    preService ? (services.find(s => s.id === preService) ? [services.find(s => s.id === preService)!] : []) : [],
  );

  const [selProf, setSelProf] = useState<Professional | null>(null);
  const [selDate, setSelDate] = useState<Date | null>(null);
  const [selSlot, setSelSlot] = useState<string | null>(null);
  const [info, setInfo] = useState({ name: '', email: '', phone: '' });
  const [dateOffset, setDateOffset] = useState(0);
  const [doneAppts, setDoneAppts] = useState<Appointment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  const today = startOfDay(new Date());
  const brasiliaNow = nowBrasilia();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i + dateOffset));
  const categories = [...new Set(services.map(s => s.category))];

  // Cálculos derivados dos serviços selecionados
  const totalDuration = selSvcs.reduce((s, v) => s + v.duration, 0);
  const totalPrice = selSvcs.reduce((s, v) => s + v.price, 0);
  const similarPair = findSimilarPair(selSvcs);

  // Profissionais que oferecem TODOS os serviços selecionados
  const availProfs = selSvcs.length > 0
    ? professionals.filter(p => selSvcs.every(sv => p.services.includes(sv.id)))
    : [];

  const profWorksOnDay = selProf?.workingDays.includes(selDate?.getDay() ?? -1) ?? false;

  // ─── Toggles de serviço ───────────────────────────────────────────────────
  const toggleService = (svc: Service) => {
    setSelSvcs(prev => {
      if (prev.some(s => s.id === svc.id)) {
        return prev.filter(s => s.id !== svc.id);
      }
      return [...prev, svc];
    });
    // Reset etapas posteriores ao alterar seleção
    setSelProf(null);
    setSelDate(null);
    setSelSlot(null);
    setAvailableSlots([]);
  };

  const isSelected = (svc: Service) => selSvcs.some(s => s.id === svc.id);

  // ─── Busca slots ao selecionar data ──────────────────────────────────────
  const handleSelectDate = async (date: Date) => {
    setSelDate(date);
    setSelSlot(null);
    setAvailableSlots([]);
    setSlotsError('');
    if (!selProf || selSvcs.length === 0) return;
    setLoadingSlots(true);
    try {
      const slots = await getAvailableSlotsApi(getSlug(), {
        professionalId: selProf.id,
        serviceIds: selSvcs.map(s => s.id),
        date: format(date, 'yyyy-MM-dd'),
      });
      setAvailableSlots(slots);
    } catch (err) {
      setSlotsError(err instanceof Error ? err.message : 'Erro ao carregar horários disponíveis.');
    } finally {
      setLoadingSlots(false);
    }
  };

  // ─── Confirmar agendamento ────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (selSvcs.length === 0 || !selProf || !selDate || !selSlot) return;
    setSubmitting(true);
    setBookingError('');
    try {
      const appts = await addAppointment({
        professionalId: selProf.id,
        serviceIds: selSvcs.map(s => s.id),
        date: format(selDate, 'yyyy-MM-dd'),
        startTime: selSlot.slice(0, 5),
        clientName: info.name,
        clientEmail: info.email,
        clientPhone: info.phone || undefined,
      });
      setDoneAppts(appts);
      setStep('done');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Erro ao confirmar agendamento.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep('service');
    setSelSvcs([]);
    setSelProf(null);
    setSelDate(null);
    setSelSlot(null);
    setInfo({ name: '', email: '', phone: '' });
    setDateOffset(0);
    setDoneAppts([]);
    navigate(`/${tenant.slug}`);
  };

  const btnStyle = { backgroundColor: tenant.primaryColor };
  const stepOrder: Step[] = ['service', 'professional', 'datetime', 'info', 'confirm', 'done'];
  const stepIdx = stepOrder.indexOf(step);
  const stepLabels: Record<Step, string> = {
    service: 'Serviços',
    professional: 'Profissional',
    datetime: 'Data & Hora',
    info: 'Seus Dados',
    confirm: 'Confirmação',
    done: 'Concluído',
  };

  if (!tenant.isOpen) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto text-3xl">🔒</div>
        <h2 className="text-xl font-bold">Estabelecimento fechado</h2>
        <p className="text-muted-foreground text-sm">
          {tenant.name} não está aceitando agendamentos no momento. Volte mais tarde.
        </p>
        <Button variant="outline" onClick={() => navigate(`/${tenant.slug}`)}>Voltar ao portal</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ── Progress bar ── */}
      {step !== 'done' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            {stepOrder.slice(0, -1).map((s, i) => (
              <span
                key={s}
                className={i <= stepIdx ? 'font-medium' : ''}
                style={i <= stepIdx ? { color: tenant.primaryColor } : {}}
              >
                {stepLabels[s]}
              </span>
            ))}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(stepIdx / (stepOrder.length - 2)) * 100}%`, backgroundColor: tenant.primaryColor }}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 1 — Seleção de serviços (multi-select)
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'service' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Escolha os Serviços</h3>
            <p className="text-sm text-muted-foreground mt-1">Selecione um ou mais serviços. Toque novamente para desmarcar.</p>
          </div>

          {/* Aviso de serviços similares */}
          {similarPair && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 text-sm text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <strong>"{similarPair[0].name}"</strong> e <strong>"{similarPair[1].name}"</strong> parecem
                ter serviços sobrepostos. Verifique se não está duplicando o mesmo serviço.
              </span>
            </div>
          )}

          {/* Resumo da seleção */}
          {selSvcs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selSvcs.map(svc => (
                <Badge
                  key={svc.id}
                  variant="secondary"
                  className="gap-1 cursor-pointer pr-1"
                  onClick={() => toggleService(svc)}
                >
                  {svc.name}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground self-center ml-1">
                {totalDuration} min · {formatCurrency(totalPrice)}
              </span>
            </div>
          )}

          {/* Lista de serviços por categoria */}
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-sm font-medium text-muted-foreground mb-2">{cat}</p>
              <div className="space-y-2">
                {services.filter(s => s.category === cat).map(svc => {
                  const sel = isSelected(svc);
                  return (
                    <Card
                      key={svc.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${sel ? 'ring-2' : ''}`}
                      style={
                        sel
                          ? { boxShadow: `0 0 0 2px ${tenant.primaryColor}` }
                          : undefined
                      }
                      onClick={() => toggleService(svc)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <p className="font-medium">{svc.name}</p>
                          <p className="text-sm text-muted-foreground">{svc.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{svc.duration} min</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-lg" style={{ color: tenant.primaryColor }}>
                            {formatCurrency(svc.price)}
                          </p>
                          {sel
                            ? <CheckCircle className="h-5 w-5 ml-auto mt-1" style={{ color: tenant.primaryColor }} />
                            : <div className="h-5 w-5 ml-auto mt-1 rounded-full border-2 border-muted-foreground/40" />
                          }
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          <Button
            className="w-full"
            style={btnStyle}
            disabled={selSvcs.length === 0}
            onClick={() => setStep('professional')}
          >
            Continuar {selSvcs.length > 0 && `(${selSvcs.length} serviço${selSvcs.length > 1 ? 's' : ''})`}
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 2 — Profissional
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'professional' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setStep('service')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-xl font-semibold">Escolha o Profissional</h3>
          </div>

          {availProfs.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nenhum profissional oferece todos os serviços selecionados. Tente outra combinação.
            </p>
          )}

          {availProfs.map(p => (
            <Card
              key={p.id}
              className={`cursor-pointer transition-all hover:shadow-md ${selProf?.id === p.id ? 'ring-2' : ''}`}
              onClick={() => setSelProf(p)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-white font-bold text-lg" style={{ backgroundColor: tenant.primaryColor }}>
                    {p.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.specialty}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.bio}</p>
                </div>
                {selProf?.id === p.id && (
                  <CheckCircle className="h-5 w-5 shrink-0" style={{ color: tenant.primaryColor }} />
                )}
              </CardContent>
            </Card>
          ))}

          <Button
            className="w-full"
            style={btnStyle}
            disabled={!selProf}
            onClick={() => setStep('datetime')}
          >
            Continuar
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 3 — Data e Horário
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'datetime' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setStep('professional')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-xl font-semibold">Data & Horário</h3>
          </div>

          {/* Resumo dos serviços selecionados */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <p className="font-medium">Serviços selecionados:</p>
            {selSvcs.map(svc => (
              <div key={svc.id} className="flex justify-between text-muted-foreground">
                <span>{svc.name}</span>
                <span>{svc.duration} min · {formatCurrency(svc.price)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-1 border-t mt-1">
              <span>Total</span>
              <span>{totalDuration} min · {formatCurrency(totalPrice)}</span>
            </div>
          </div>

          {/* Seleção de data */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Selecione a data</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setDateOffset(d => Math.max(0, d - 7))} disabled={dateOffset === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDateOffset(d => d + 7)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {dates.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const works = selProf?.workingDays.includes(date.getDay()) ?? false;
                const isPast = dateStr < brasiliaNow.date;
                const isSel = selDate && dateStr === format(selDate, 'yyyy-MM-dd');
                const disabled = !works || isPast;
                return (
                  <button
                    key={date.toISOString()}
                    disabled={disabled}
                    onClick={() => handleSelectDate(date)}
                    className={`flex flex-col items-center py-2 rounded-lg text-xs transition-all
                      ${isPast ? 'opacity-30 cursor-not-allowed text-muted-foreground' : ''}
                      ${!works && !isPast ? 'opacity-30 cursor-not-allowed' : ''}
                      ${!disabled ? 'cursor-pointer hover:bg-muted' : ''}`}
                    style={isSel ? { backgroundColor: tenant.primaryColor, color: '#fff', fontWeight: 700 } : {}}
                  >
                    <span className="text-[10px] uppercase">{format(date, 'EEE', { locale: ptBR })}</span>
                    <span className="font-semibold text-sm mt-0.5">{format(date, 'd')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots disponíveis */}
          {selDate && (
            <div>
              <p className="text-sm font-medium mb-2">
                Horários disponíveis — {format(selDate, "d 'de' MMMM", { locale: ptBR })}
              </p>
              {loadingSlots ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : slotsError ? (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {slotsError}
                </div>
              ) : !profWorksOnDay ? (
                <p className="text-center text-muted-foreground py-4">
                  Profissional não trabalha neste dia
                </p>
              ) : (
                (() => {
                  const isToday = selDate ? format(selDate, 'yyyy-MM-dd') === brasiliaNow.date : false;
                  const earliestTime = (() => {
                    if (!isToday) return null;
                    const advance = tenant.minAdvanceMinutes ?? 0;
                    const [h, m] = brasiliaNow.time.split(':').map(Number);
                    const total = h * 60 + m + advance;
                    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
                  })();
                  const visibleSlots = earliestTime
                    ? availableSlots.filter(slot => slot > earliestTime)
                    : availableSlots;
                  return visibleSlots.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum horário disponível neste dia — todos os horários estão ocupados
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {visibleSlots.map(slot => {
                        const isSel = selSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelSlot(slot)}
                            className="py-2 rounded-md text-sm font-medium transition-all border hover:border-primary/60"
                            style={isSel
                              ? { backgroundColor: tenant.primaryColor, color: '#fff', borderColor: tenant.primaryColor }
                              : {}}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          <Button className="w-full" style={btnStyle} disabled={!selDate || !selSlot} onClick={() => setStep('info')}>
            Continuar
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 4 — Dados do cliente
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'info' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setStep('datetime')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-xl font-semibold">Seus Dados</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome completo *</Label>
              <Input placeholder="João Silva" value={info.name} onChange={e => setInfo(i => ({ ...i, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>E-mail *</Label>
              <Input type="email" placeholder="joao@email.com" value={info.email} onChange={e => setInfo(i => ({ ...i, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Telefone *</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={info.phone}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                  let masked = '';
                  if (digits.length === 0) masked = '';
                  else if (digits.length <= 2) masked = `(${digits}`;
                  else if (digits.length <= 7) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                  else masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                  setInfo(i => ({ ...i, phone: masked }));
                }}
              />
            </div>
          </div>
          <Button className="w-full" style={btnStyle} disabled={!info.name || !info.email || !info.phone} onClick={() => setStep('confirm')}>
            Revisar
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 5 — Confirmação
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'confirm' && selSvcs.length > 0 && selProf && selDate && selSlot && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setStep('info')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-xl font-semibold">Confirmar Agendamento</h3>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Profissional */}
              <div className="flex items-center gap-3 pb-4 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-white font-bold" style={{ backgroundColor: tenant.primaryColor }}>
                    {selProf.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selProf.name}</p>
                  <p className="text-sm text-muted-foreground">{selProf.specialty}</p>
                </div>
              </div>

              {/* Serviços */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Serviços</p>
                {selSvcs.map((svc, i) => (
                  <div key={svc.id} className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                      {svc.name}
                    </span>
                    <span className="text-muted-foreground">{formatCurrency(svc.price)}</span>
                  </div>
                ))}
              </div>

              {/* Detalhes */}
              <div className="space-y-2 text-sm border-t pt-3">
                {[
                  ['Data', format(selDate, "EEEE, d 'de' MMMM", { locale: ptBR })],
                  ['Início', selSlot],
                  ['Duração', `${totalDuration} min`],
                  ['Cliente', info.name],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg" style={{ color: tenant.primaryColor }}>
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {bookingError && (
            <p className="text-sm text-destructive text-center">{bookingError}</p>
          )}

          <Button className="w-full" size="lg" style={btnStyle} onClick={handleConfirm} disabled={submitting}>
            {submitting
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Confirmando...</>
              : 'Confirmar Agendamento'}
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 6 — Concluído
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'done' && doneAppts.length > 0 && (
        <div className="text-center space-y-6 py-8">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold">Agendamento Confirmado!</h3>
            <p className="text-muted-foreground mt-2">Você receberá uma confirmação em breve.</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm text-left">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Profissional</span>
                <span className="font-medium">{selProf?.name}</span>
              </div>
              {doneAppts.map((appt, i) => (
                <div key={appt.id} className="flex justify-between border-b last:border-0 pb-2 pt-1">
                  <span className="text-muted-foreground">{selSvcs[i]?.name ?? `Serviço ${i + 1}`}</span>
                  <span className="font-medium">{appt.startTime} – {appt.endTime} · {formatCurrency(appt.price)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-semibold">
                <span>Total</span>
                <span style={{ color: tenant.primaryColor }}>{formatCurrency(totalPrice)}</span>
              </div>
            </CardContent>
          </Card>
          {/* Upsell de produtos */}
          {upsellProducts.length > 0 && (
            <div className="text-left space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" style={{ color: tenant.primaryColor }} />
                <p className="font-semibold text-sm">Leve também da {tenant.name}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upsellProducts.slice(0, 4).map(product => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: tenant.primaryColor }}
                    >
                      {product.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                      )}
                      <p className="text-sm font-bold mt-0.5" style={{ color: tenant.primaryColor }}>
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Pergunte ao seu barbeiro sobre nossos produtos disponíveis.
              </p>
            </div>
          )}

          <Button onClick={reset} variant="outline" className="w-full">Fazer Novo Agendamento</Button>
        </div>
      )}
    </div>
  );
}
