import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Clock, Edit2, Loader2, Plus, Scissors, Trash2, Upload, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTenant, PLAN_LIMITS } from '@/context/TenantContext';
import { ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Professional, Service } from '@/types';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const STATUS_VARIANT = { confirmed: 'info', completed: 'success', cancelled: 'destructive', pending: 'warning' } as const;
const STATUS_LABEL = { pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };

interface ProfFormData {
  name: string;
  specialty: string;
  avatar: string;
  photoUrl: string;
  bio: string;
  services: string[];
  workingHours: { start: string; end: string };
  workingDays: number[];
  email: string;
  password: string;
}

const EMPTY_FORM: ProfFormData = {
  name: '', specialty: '', avatar: '', photoUrl: '', bio: '',
  services: [], workingHours: { start: '09:00', end: '18:00' }, workingDays: [1, 2, 3, 4, 5, 6],
  email: '', password: '',
};

function formFromProf(p: Professional): ProfFormData {
  return {
    name: p.name, specialty: p.specialty, avatar: p.avatar,
    photoUrl: p.photoUrl ?? '', bio: p.bio, services: [...p.services],
    workingHours: { ...p.workingHours }, workingDays: [...p.workingDays],
    email: p.email ?? '', password: p.password ?? '',
  };
}

// ─── PhotoUpload — defined outside to keep stable identity ───────────────────
function PhotoUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-4">
      <div
        className="h-20 w-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/60 transition-colors shrink-0"
        onClick={() => ref.current?.click()}
      >
        {value
          ? <img src={value} alt="foto" className="h-full w-full object-cover" />
          : <Upload className="h-6 w-6 text-muted-foreground opacity-50" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Foto do profissional</p>
        <p className="text-xs text-muted-foreground">Clique no círculo para enviar. PNG/JPG, máx. 2 MB.</p>
        {value && (
          <button type="button" className="text-xs text-destructive hover:underline flex items-center gap-1" onClick={() => onChange('')}>
            <X className="h-3 w-3" /> Remover foto
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}

// ─── ProfFormFields — defined outside to prevent remount on every keystroke ──
interface ProfFormFieldsProps {
  form: ProfFormData;
  setForm: React.Dispatch<React.SetStateAction<ProfFormData>>;
  services: Service[];
}

function ProfFormFields({ form, setForm, services }: ProfFormFieldsProps) {
  const toggleDay = (day: number) =>
    setForm(f => ({ ...f, workingDays: f.workingDays.includes(day) ? f.workingDays.filter(d => d !== day) : [...f.workingDays, day].sort() }));

  const toggleService = (svcId: string) =>
    setForm(f => ({ ...f, services: f.services.includes(svcId) ? f.services.filter(s => s !== svcId) : [...f.services, svcId] }));

  return (
    <div className="space-y-4">
      <PhotoUpload value={form.photoUrl} onChange={v => setForm(f => ({ ...f, photoUrl: v }))} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <Label>Nome completo *</Label>
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Carlos Silva"
          />
        </div>
        <div className="space-y-1">
          <Label>Especialidade</Label>
          <Input
            value={form.specialty}
            onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
            placeholder="Ex: Barbeiro"
          />
        </div>
        <div className="space-y-1">
          <Label>Iniciais (avatar)</Label>
          <Input
            value={form.avatar}
            onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
            maxLength={3}
            placeholder="CS"
          />
          <p className="text-xs text-muted-foreground">Gerado automaticamente se vazio</p>
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Bio</Label>
          <Input
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Breve descrição..."
          />
        </div>
      </div>

      {/* Platform access */}
      <div className="rounded-lg border p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold">Acesso à Plataforma</p>
          <p className="text-xs text-muted-foreground mt-0.5">Deixe em branco para não conceder acesso.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>E-mail de acesso</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="profissional@email.com"
            />
          </div>
          <div className="space-y-1">
            <Label>Senha</Label>
            <Input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 4 caracteres"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Início do expediente</Label>
          <Input
            type="time"
            value={form.workingHours.start}
            onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, start: e.target.value } }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Fim do expediente</Label>
          <Input
            type="time"
            value={form.workingHours.end}
            onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, end: e.target.value } }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Dias de trabalho</Label>
        <div className="flex gap-1.5 flex-wrap">
          {DAY_NAMES.map((name, idx) => (
            <button key={idx} type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.workingDays.includes(idx) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
              onClick={() => toggleDay(idx)}>
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Serviços oferecidos</Label>
        <div className="flex gap-1.5 flex-wrap">
          {services.map(s => (
            <button key={s.id} type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.services.includes(s.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
              onClick={() => toggleService(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProfessionalsView() {
  const { professionals, services, appointments, clients, tenant, canAddProfessional, addProfessional, updateProfessional, deleteProfessional } = useTenant();

  const [selected, setSelected]     = useState<string | null>(null);
  const [editId, setEditId]         = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [form, setForm]             = useState<ProfFormData>(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);

  const prof       = professionals.find(p => p.id === selected);
  const deleteProf = professionals.find(p => p.id === deleteId);
  const limits     = PLAN_LIMITS[tenant.plan] ?? PLAN_LIMITS['basic'];

  const getStats = (profId: string) => {
    const appts     = appointments.filter(a => a.professionalId === profId);
    const completed = appts.filter(a => a.status === 'completed');
    const upcoming  = appts.filter(a => a.date >= format(new Date(), 'yyyy-MM-dd') && a.status !== 'cancelled');
    return { total: appts.length, completed: completed.length, revenue: completed.reduce((s, a) => s + a.price, 0), upcoming: upcoming.length };
  };

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(''); setShowCreate(true); };
  const openEdit   = (p: Professional) => { setEditId(p.id); setForm(formFromProf(p)); setFormError(''); setSelected(null); };

  const hasActiveAppts = (profId: string) =>
    appointments.some(a => a.professionalId === profId && ['pending', 'confirmed'].includes(a.status));

  const buildPayload = () => ({
    name:              form.name.trim(),
    specialty:         form.specialty.trim(),
    avatar:            form.avatar.trim() || form.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
    photoUrl:          form.photoUrl || undefined,
    bio:               form.bio.trim(),
    serviceIds:        form.services,
    workingHoursStart: form.workingHours.start,
    workingHoursEnd:   form.workingHours.end,
    workingDays:       form.workingDays,
    email:             form.email.trim()    || undefined,
    password:          form.password.trim() || undefined,
  });

  const formatApiError = (err: unknown): string => {
    if (err instanceof ApiError && err.details && err.details.length > 0) {
      return err.details.map(d => `${d.field ? `[${d.field}] ` : ''}${d.message}`).join(' • ');
    }
    return err instanceof Error ? err.message : 'Erro desconhecido.';
  };

  const handleSaveCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      await addProfessional(buildPayload());
      setShowCreate(false);
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editId || !form.name.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      await updateProfessional(editId, buildPayload());
      setEditId(null);
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProfessional(deleteId);
      setDeleteId(null);
    } catch (err) {
      console.error('Erro ao excluir profissional:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profissionais</h2>
          <p className="text-muted-foreground text-sm">
            {professionals.length}
            {limits.professionals !== Infinity ? `/${limits.professionals}` : ''} profissionais
            {limits.professionals !== Infinity ? ` (plano ${tenant.plan})` : ''}
          </p>
        </div>
        <Button onClick={openCreate} disabled={!canAddProfessional} className="gap-2"
          title={!canAddProfessional ? `Limite do plano ${tenant.plan} atingido` : undefined}>
          <Plus className="h-4 w-4" /> Novo Profissional
        </Button>
      </div>

      {!canAddProfessional && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Limite de {limits.professionals} profissionais do plano <strong className="capitalize">{tenant.plan}</strong> atingido. Faça upgrade para adicionar mais.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professionals.map(p => {
          const stats = getStats(p.id);
          const profServices = services.filter(s => p.services.includes(s.id));
          return (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 cursor-pointer" onClick={() => setSelected(p.id)}>
                    {p.photoUrl && <AvatarImage src={p.photoUrl} alt={p.name} className="object-cover" />}
                    <AvatarFallback className="text-white font-bold text-lg" style={{ backgroundColor: 'hsl(var(--primary))' }}>{p.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelected(p.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-lg leading-tight">{p.name}</p>
                      {p.email && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-green-600 border-green-300">Acesso ativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{p.specialty}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.bio}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)} title="Editar">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)} title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center border-t pt-3">
                  <div><p className="text-sm font-bold text-primary">{stats.upcoming}</p><p className="text-xs text-muted-foreground">Próximos</p></div>
                  <div><p className="text-sm font-bold text-green-600">{stats.completed}</p><p className="text-xs text-muted-foreground">Concluídos</p></div>
                  <div><p className="text-sm font-bold">{formatCurrency(stats.revenue)}</p><p className="text-xs text-muted-foreground">Receita</p></div>
                </div>
                <div className="mt-3 flex items-center gap-1 flex-wrap">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{p.workingHours.start}–{p.workingHours.end}</span>
                  <span className="text-muted-foreground mx-1">·</span>
                  {p.workingDays.map(d => <span key={d} className="text-xs bg-muted px-1 rounded">{DAY_NAMES[d]}</span>)}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {profServices.map(s => (
                    <Badge key={s.id} variant="secondary" className="text-xs"><Scissors className="h-2.5 w-2.5 mr-1" />{s.name}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {prof?.photoUrl && <AvatarImage src={prof.photoUrl} alt={prof.name} className="object-cover" />}
                <AvatarFallback className="text-white font-bold" style={{ backgroundColor: 'hsl(var(--primary))' }}>{prof?.avatar}</AvatarFallback>
              </Avatar>
              {prof?.name}
            </DialogTitle>
          </DialogHeader>
          {prof && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">{prof.bio}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Especialidade', prof.specialty],
                  ['Horário', `${prof.workingHours.start} às ${prof.workingHours.end}`],
                  ['Receita Total', formatCurrency(getStats(prof.id).revenue)],
                  ['Atendimentos', `${getStats(prof.id).completed} concluídos`],
                ].map(([l, v]) => (
                  <div key={l}><p className="text-muted-foreground">{l}</p><p className="font-medium">{v}</p></div>
                ))}
              </div>
              <div>
                <p className="font-semibold mb-2">Serviços</p>
                {services.filter(s => prof.services.includes(s.id)).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded border text-sm mb-1">
                    <span>{s.name}</span><span className="font-medium">{formatCurrency(s.price)}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="font-semibold mb-2">Últimos Atendimentos</p>
                {appointments.filter(a => a.professionalId === prof.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map(appt => {
                  const client = clients.find(c => c.id === appt.clientId);
                  const svc    = services.find(s => s.id === appt.serviceId);
                  return (
                    <div key={appt.id} className="flex items-center justify-between p-2 rounded border text-sm mb-1">
                      <div>
                        <p className="font-medium">{client?.name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(appt.date + 'T00:00:00'), "d 'de' MMM", { locale: ptBR })} · {appt.startTime} · {svc?.name}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={STATUS_VARIANT[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
                        <p className="text-xs font-medium mt-1">{formatCurrency(appt.price)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => openEdit(prof)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Editar
                </Button>
                <Button variant="destructive" onClick={() => { setSelected(null); setDeleteId(prof.id); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={o => { if (!o) { setShowCreate(false); setFormError(''); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Profissional</DialogTitle>
          </DialogHeader>
          <ProfFormFields form={form} setForm={setForm} services={services} />
          {formError && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {formError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setFormError(''); }}>Cancelar</Button>
            <Button onClick={handleSaveCreate} disabled={!form.name.trim() || saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : 'Criar profissional'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editId} onOpenChange={o => { if (!o) { setEditId(null); setFormError(''); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Profissional</DialogTitle>
          </DialogHeader>
          <ProfFormFields form={form} setForm={setForm} services={services} />
          {formError && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {formError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditId(null); setFormError(''); }}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={!form.name.trim() || saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Excluir profissional
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">Tem certeza que deseja excluir <strong>{deleteProf?.name}</strong>?</p>
            {deleteId && hasActiveAppts(deleteId) && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Este profissional tem agendamentos ativos. Eles <strong>não serão cancelados</strong> automaticamente.</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
