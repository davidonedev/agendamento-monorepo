import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Calendar, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTenant } from '@/context/TenantContext';
import { formatCurrency } from '@/lib/utils';

const STATUS_VARIANT = { confirmed: 'info', completed: 'success', cancelled: 'destructive', pending: 'warning' } as const;
const STATUS_LABEL   = { pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };

export default function Dashboard() {
  const { appointments, clients, professionals, services } = useTenant();
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">{format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Agendamentos Hoje', icon: Calendar,    value: stats.todayAppts.length, sub: `${stats.confirmed} confirmados · ${stats.pending} pendentes` },
          { title: 'Faturamento Hoje',  icon: DollarSign,  value: formatCurrency(stats.todayRev), sub: 'de serviços concluídos' },
          { title: 'Total Clientes',    icon: Users,       value: clients.length,           sub: `${professionals.length} profissionais ativos` },
          { title: 'Receita Total',     icon: TrendingUp,  value: formatCurrency(stats.totalRev), sub: `${appointments.filter(a => a.status === 'completed').length} atendimentos` },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" /> Agenda de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum agendamento hoje</p>
            ) : (
              <div className="space-y-3">
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
            <div className="space-y-3">
              {services.map(svc => {
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
