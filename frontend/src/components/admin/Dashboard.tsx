import { useMemo } from 'react';
import { format } from 'date-fns';
import { Users, UserPlus, Calendar, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant } from '@/context/TenantContext';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { useLoginSkeletonHold } from '@/motion/loginSplashStore';
import { LinesSkeleton } from './painel/SummaryState';
import { deltaText } from '@/lib/painel';
import { TrialCard } from './painel/TrialCard';
import { WeekStrip } from './painel/WeekStrip';
import { UpcomingAppointments } from './painel/UpcomingAppointments';
import { CancellationsCard } from './painel/CancellationsCard';
import { formatCurrency } from '@/lib/utils';

const STATUS_VARIANT = { confirmed: 'info', completed: 'success', cancelled: 'destructive', pending: 'warning', no_show: 'destructive' } as const;
const STATUS_LABEL   = { pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Não compareceu' };

export default function Dashboard() {
  const { tenant, appointments, clients, professionals, services } = useTenant();
  const summary = useDashboardSummary();
  // Depois da animação da logo no login, o Painel fica ~2 s em skeleton (ver loginSplashStore)
  const hold = useLoginSkeletonHold();
  const loading = summary.loading || hold;
  const bookingUrl = `${window.location.origin}/${tenant.slug}`;
  const today = format(new Date(), 'yyyy-MM-dd');

  const stats = useMemo(() => {
    const todayAppts  = appointments.filter(a => a.date === today && a.status !== 'cancelled');
    const totalRev    = appointments.filter(a => a.status === 'completed').reduce((s, a) => s + a.price, 0);
    const todayRev    = appointments.filter(a => a.date === today && a.status === 'completed').reduce((s, a) => s + a.price, 0);
    const pending     = todayAppts.filter(a => a.status === 'pending').length;
    const confirmed   = todayAppts.filter(a => a.status === 'confirmed').length;
    return { todayAppts, totalRev, todayRev, pending, confirmed };
  }, [appointments, today]);

  const todayAppts = appointments
    .filter(a => a.date === today && a.status !== 'cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Serviços mais agendados (top 5), para o card não crescer sem limite
  const popularServices = [...services]
    .map(svc => ({ svc, count: appointments.filter(a => a.serviceId === svc.id && a.status !== 'cancelled').length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(x => x.svc);

  const s = summary.data;
  const kpis = [
    { title: 'Agendamentos Hoje', icon: Calendar,   value: stats.todayAppts.length, sub: `${stats.confirmed} confirmados · ${stats.pending} pendentes` },
    { title: 'Faturamento Hoje',  icon: DollarSign, value: formatCurrency(stats.todayRev), sub: 'de serviços concluídos' },
    { title: 'Total de clientes', icon: Users,      value: s?.clients.total ?? 0, sub: s ? `+${s.clients.last7Days} nos últimos 7 dias` : '', loading: loading, error: summary.error },
    { title: 'Novos clientes',    icon: UserPlus,   value: s?.clients.last7Days ?? 0, sub: s ? deltaText(s.clients.last7Days, s.clients.previous7Days) : '', loading: loading, error: summary.error },
    { title: 'Receita Total',     icon: TrendingUp, value: formatCurrency(stats.totalRev), sub: `${appointments.filter(a => a.status === 'completed').length} atendimentos` },
  ].map(k => ({ error: false, ...k, loading: hold || !!k.loading }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Painel</h2>
        <p className="text-sm text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <TrialCard trial={summary.data?.trial} planName={tenant.plan} loading={loading} error={summary.error} onRetry={summary.reload} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                {kpi.loading ? (
                  <div role="status" aria-label="Carregando"><Skeleton className="h-8 w-20" /><Skeleton className="mt-2 h-3 w-28" /></div>
                ) : kpi.error ? (
                  <button type="button" onClick={summary.reload} className="text-sm text-muted-foreground underline underline-offset-2">Tentar novamente</button>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <WeekStrip week={summary.data?.week} today={summary.data?.today} loading={loading} error={summary.error} onRetry={summary.reload} />

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:auto-rows-fr gap-6 [&>*]:h-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" /> Agenda de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hold ? <LinesSkeleton /> : todayAppts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Você não tem agendamentos para hoje. Quando um cliente marcar um horário, ele aparece aqui.</p>
            ) : (
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {todayAppts.map(appt => {
                  const client = clients.find(c => c.id === appt.clientId);
                  const prof   = professionals.find(p => p.id === appt.professionalId);
                  const svc    = services.find(s => s.id === appt.serviceId);
                  return (
                    <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className="text-center min-w-[48px]">
                        <p className="text-sm font-bold text-primary">{appt.startTime}</p>
                        <p className="text-xs text-muted-foreground">{appt.endTime}</p>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {client?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{client?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{svc?.name} · {prof?.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={STATUS_VARIANT[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
                        <p className="text-xs font-medium mt-1">{formatCurrency(appt.price)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-primary" /> Serviços Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hold ? <LinesSkeleton /> : popularServices.length === 0 ? (<p className="py-8 text-center text-sm text-muted-foreground">Ainda não há dados de serviços. Cadastre um serviço para acompanhar os mais agendados.</p>) : (
            <div className="space-y-3">
              {popularServices.map(svc => {
                const count   = appointments.filter(a => a.serviceId === svc.id && a.status !== 'cancelled').length;
                const revenue = appointments.filter(a => a.serviceId === svc.id && a.status === 'completed').reduce((s, a) => s + a.price, 0);
                return (
                  <div key={svc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{svc.name}</p>
                      <p className="text-xs text-muted-foreground">{count} agendamentos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(revenue)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(svc.price)}/sessão</p>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>

        <UpcomingAppointments upcoming={summary.data?.upcoming} today={summary.data?.today} bookingUrl={bookingUrl} loading={loading} error={summary.error} onRetry={summary.reload} />

        <CancellationsCard data={summary.data?.cancellations} loading={loading} error={summary.error} onRetry={summary.reload} />
      </div>
    </div>
  );
}
