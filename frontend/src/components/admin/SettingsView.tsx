import { useRef, useState } from 'react';
import { CheckCircle, Clock, Copy, Edit2, ExternalLink, Eye, EyeOff, Upload, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/context/AuthContext';
import { updateMeApi, changePasswordApi } from '@/services/auth.service';
import type { Professional } from '@/types';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PLAN_FEATURES = {
  basic:      ['Até 1 profissionais', '3 serviços', 'Agenda semanal', 'Portal do cliente', 'Relatórios básicos'],
  pro:        ['Até 3 profissionais', 'Serviços ilimitados', 'Agenda + bloqueios', 'Portal personalizado', 'Relatórios de faturamento'],
  enterprise: ['Tudo do Pro', 'Múltiplas unidades', 'API de integração', 'Suporte prioritário'],
};

// ─── Image upload ─────────────────────────────────────────────────────────────
function ImageUpload({
  label, description, value, onChange, aspectClass = 'aspect-video',
}: {
  label: string; description: string; value?: string;
  onChange: (dataUrl: string | undefined) => void; aspectClass?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div
        className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer hover:border-primary/60 transition-colors ${aspectClass}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <button type="button"
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              onClick={e => { e.stopPropagation(); onChange(undefined); }}
            ><X className="h-3.5 w-3.5" /></button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-4">
            <Upload className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">Clique ou arraste uma imagem</p>
            <p className="text-xs">PNG, JPG, WebP — máx. 5 MB</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}

// ─── Color picker ─────────────────────────────────────────────────────────────
const PRESET_COLORS = ['#1e1b4b','#7c3aed','#db2777','#dc2626','#d97706','#16a34a','#0ea5e9','#0f172a','#78350f','#14532d'];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="h-11 w-11 rounded-lg border cursor-pointer p-0.5 bg-transparent shrink-0" />
        <div>
          <p className="font-mono font-medium text-sm">{value}</p>
          <p className="text-xs text-muted-foreground">Clique na paleta ou escolha um preset</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {PRESET_COLORS.map(c => (
          <button key={c} type="button" title={c}
            className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${value === c ? 'border-foreground scale-110 ring-2 ring-offset-1 ring-foreground/30' : 'border-transparent'}`}
            style={{ backgroundColor: c }} onClick={() => onChange(c)} />
        ))}
      </div>
    </div>
  );
}

// ─── Schedule dialog ──────────────────────────────────────────────────────────
interface ScheduleForm { workingDays: number[]; workingHoursStart: string; workingHoursEnd: string; }

function ScheduleDialog({ prof, onSave, onClose }: {
  prof: Professional;
  onSave: (profId: string, patch: ScheduleForm) => Promise<void>;
  onClose: () => void;
}) {
  const [days,  setDays]  = useState<number[]>([...prof.workingDays]);
  const [start, setStart] = useState(prof.workingHours.start);
  const [end,   setEnd]   = useState(prof.workingHours.end);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const toggleDay = (d: number) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b));

  const handleSave = async () => {
    if (start >= end)      { setErr('Início deve ser anterior ao fim.'); return; }
    if (days.length === 0) { setErr('Selecione ao menos um dia.'); return; }
    setSaving(true); setErr('');
    try { await onSave(prof.id, { workingDays: days, workingHoursStart: start, workingHoursEnd: end }); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Disponibilidade — {prof.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Dias de atendimento</Label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_LABELS.map((label, day) => {
                const active = days.includes(day);
                return (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${active ? 'text-white border-transparent' : 'text-muted-foreground border-muted hover:border-muted-foreground/40'}`}
                    style={active ? { backgroundColor: '#1A1A2E', borderColor: '#1A1A2E' } : {}}>
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {days.length > 0 ? days.map(d => DAY_LABELS[d]).join(', ') : 'Nenhum dia selecionado'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Início</Label><Input type="time" value={start} onChange={e => setStart(e.target.value)} /></div>
            <div className="space-y-1"><Label>Fim</Label><Input type="time" value={end} onChange={e => setEnd(e.target.value)} /></div>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export type SettingsSection = 'account' | 'portal' | 'schedule';

interface Props { section?: SettingsSection; }

// ─── Main component ───────────────────────────────────────────────────────────
export default function SettingsView({ section = 'account' }: Props) {
  const { tenant, professionals, updateSettings, updateProfessional } = useTenant();
  const { user, updateUser, changePassword } = useAuth();

  // Credentials form
  const [credForm, setCredForm]       = useState({ name: user?.name ?? '', email: user?.email ?? '' });
  const [credSaved, setCredSaved]     = useState(false);
  const [credError, setCredError]     = useState('');
  const [pwdForm, setPwdForm]         = useState({ current: '', next: '', confirm: '' });
  const [pwdSaved, setPwdSaved]       = useState(false);
  const [pwdError, setPwdError]       = useState('');
  const [showPwd, setShowPwd]         = useState({ current: false, next: false, confirm: false });

  const saveCredentials = async () => {
    setCredError('');
    try {
      await updateUser({ name: credForm.name, email: credForm.email });
      setCredSaved(true);
      setTimeout(() => setCredSaved(false), 2500);
    } catch (err) {
      setCredError(err instanceof Error ? err.message : 'Erro ao salvar.');
    }
  };

  const savePassword = async () => {
    setPwdError('');
    if (pwdForm.next.length < 6)          { setPwdError('A nova senha deve ter ao menos 6 caracteres.'); return; }
    if (pwdForm.next !== pwdForm.confirm)  { setPwdError('As senhas não coincidem.'); return; }
    try {
      await changePassword(pwdForm.current, pwdForm.next);
      setPwdSaved(true);
      setPwdForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwdSaved(false), 2500);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    }
  };

  // Account form
  const [adminForm, setAdminForm] = useState({
    name:       tenant.name,
    phone:      tenant.phone,
    address:    tenant.address,
    adminColor: tenant.adminColor ?? tenant.primaryColor,
    logoUrl:    tenant.logoUrl,
  });
  const [adminSaved, setAdminSaved] = useState(false);

  // Portal form
  const [portalForm, setPortalForm] = useState({
    primaryColor: tenant.primaryColor,
    bannerUrl:    tenant.bannerUrl,
    logoUrl:      tenant.logoUrl,
    isOpen:       tenant.isOpen,
  });
  const [portalSaved, setPortalSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const portalUrl = `${window.location.origin}/${tenant.slug}`;

  const saveAdmin = async () => {
    try { await updateSettings(adminForm); setAdminSaved(true); setTimeout(() => setAdminSaved(false), 2500); }
    catch (err) { console.error(err); }
  };

  const savePortal = async () => {
    try { await updateSettings(portalForm); setPortalSaved(true); setTimeout(() => setPortalSaved(false), 2500); }
    catch (err) { console.error(err); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const [scheduleProf, setScheduleProf] = useState<Professional | null>(null);
  const handleSaveSchedule = async (profId: string, patch: ScheduleForm) => {
    await updateProfessional(profId, patch);
  };

  const [advanceMinutes, setAdvanceMinutes] = useState(tenant.minAdvanceMinutes ?? 0);
  const [advanceSaved, setAdvanceSaved] = useState(false);
  const saveAdvance = async () => {
    try {
      await updateSettings({ minAdvanceMinutes: advanceMinutes });
      setAdvanceSaved(true);
      setTimeout(() => setAdvanceSaved(false), 2500);
    } catch (err) { console.error(err); }
  };

  // ── Section: Configurações da Conta ──────────────────────────────────────
  if (section === 'account') return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações da Conta</h2>
        <p className="text-muted-foreground text-sm">Informações do estabelecimento e aparência do painel admin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo da Barbearia</CardTitle>
          <CardDescription>Aparece no topo da barra lateral do painel admin</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload label="Logo" description="Recomendado: quadrado, mínimo 200×200 px"
            value={adminForm.logoUrl} onChange={url => setAdminForm(f => ({ ...f, logoUrl: url }))}
            aspectClass="aspect-square max-w-[200px]" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Informações do Estabelecimento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Nome do estabelecimento</Label>
            <Input value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Telefone</Label>
            <Input value={adminForm.phone} onChange={e => setAdminForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Endereço</Label>
            <Input value={adminForm.address} onChange={e => setAdminForm(f => ({ ...f, address: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cor do Painel Admin</CardTitle>
          <CardDescription>Cor do item selecionado no menu e do avatar no painel administrativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorPicker value={adminForm.adminColor} onChange={c => setAdminForm(f => ({ ...f, adminColor: c }))} />
          <div className="rounded-xl overflow-hidden border bg-card">
            <div className="h-9 border-b bg-card flex items-center justify-end px-3 gap-2">
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: adminForm.adminColor }}>AD</div>
            </div>
            <div className="flex">
              <div className="w-28 border-r bg-card p-2 space-y-1">
                <div className="flex items-center gap-1.5 px-1.5 py-1 rounded text-white text-[9px] font-medium" style={{ backgroundColor: adminForm.adminColor }}>
                  <div className="h-2 w-2 rounded-sm bg-white/60" /><span>Dashboard</span>
                </div>
                {['Agenda','Clientes','Config.'].map(l => (
                  <div key={l} className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[9px] text-muted-foreground">
                    <div className="h-2 w-2 rounded-sm bg-muted-foreground/30" /><span>{l}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {[65, 50].map((w, i) => (
                    <div key={i} className="rounded border p-2 space-y-1">
                      <div className="h-1.5 rounded bg-muted-foreground/20" style={{ width: `${w}%` }} />
                      <div className="h-3 rounded font-bold text-[10px] flex items-center" style={{ color: adminForm.adminColor }}>R$ —</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-end gap-1 h-8 px-1">
                  {[40, 70, 55, 90, 60, 80].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: adminForm.adminColor, opacity: 0.7 + i * 0.05 }} />
                  ))}
                </div>
                <div className="flex justify-end">
                  <div className="px-3 py-1 rounded text-white text-[9px] font-semibold" style={{ backgroundColor: adminForm.adminColor }}>Salvar</div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Prévia do painel com a cor selecionada</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Plano Atual
            <Badge variant={tenant.plan === 'pro' ? 'default' : 'outline'} className="capitalize">{tenant.plan}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex justify-between items-center mb-3">
              <p className="font-semibold capitalize">{tenant.plan}</p>
              <p className="text-lg font-bold">R$ {tenant.monthlyPrice}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
            </div>
            <ul className="space-y-1.5">
              {(PLAN_FEATURES[tenant.plan] ?? []).map(feat => (
                <li key={feat} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />{feat}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">Para fazer upgrade, entre em contato com a equipe AgendePro.</p>
        </CardContent>
      </Card>

      {/* Credenciais de acesso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">E-mail e Nome</CardTitle>
          <CardDescription>Dados de acesso à plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={credForm.name} onChange={e => setCredForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>E-mail</Label>
            <Input type="email" value={credForm.email} onChange={e => setCredForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          {credError && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-md px-3 py-2">
              <X className="h-4 w-4 shrink-0" /> {credError}
            </div>
          )}
          <Button onClick={saveCredentials} size="sm" className="gap-2">
            {credSaved ? <><CheckCircle className="h-4 w-4" /> Salvo!</> : 'Salvar'}
          </Button>
        </CardContent>
      </Card>

      {/* Troca de senha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alterar Senha</CardTitle>
          <CardDescription>Mínimo de 6 caracteres</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'current' as const, label: 'Senha atual' },
            { key: 'next'    as const, label: 'Nova senha'  },
            { key: 'confirm' as const, label: 'Confirmar nova senha' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label>{label}</Label>
              <div className="relative">
                <Input
                  type={showPwd[key] ? 'text' : 'password'}
                  value={pwdForm[key]}
                  onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPwd(s => ({ ...s, [key]: !s[key] }))}
                >
                  {showPwd[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
          {pwdError && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-md px-3 py-2">
              <X className="h-4 w-4 shrink-0" /> {pwdError}
            </div>
          )}
          <Button onClick={savePassword} size="sm" className="gap-2" disabled={!pwdForm.current || !pwdForm.next || !pwdForm.confirm}>
            {pwdSaved ? <><CheckCircle className="h-4 w-4" /> Senha alterada!</> : 'Alterar senha'}
          </Button>
        </CardContent>
      </Card>

      <Button onClick={saveAdmin} className="gap-2" style={{ backgroundColor: adminForm.adminColor }}>
        {adminSaved ? <><CheckCircle className="h-4 w-4" /> Salvo!</> : 'Salvar alterações'}
      </Button>
    </div>
  );

  // ── Section: Portal do Cliente ────────────────────────────────────────────
  if (section === 'portal') return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Portal do Cliente</h2>
        <p className="text-muted-foreground text-sm">Aparência e configurações do portal público de agendamento</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status do Estabelecimento</CardTitle>
          <CardDescription>Controla se o portal exibe agendamento disponível ou fechado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">
                {portalForm.isOpen ? '🟢 Aberto — aceitando agendamentos' : '🔴 Fechado — sem agendamentos'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {portalForm.isOpen
                  ? 'Clientes podem visualizar horários e agendar normalmente.'
                  : 'O portal mostra um aviso de fechado e desativa novos agendamentos.'}
              </p>
            </div>
            <Switch checked={portalForm.isOpen} onCheckedChange={val => setPortalForm(f => ({ ...f, isOpen: val }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cor do Portal do Cliente</CardTitle>
          <CardDescription>Usada nos botões, destaques de preço e identidade visual do portal público</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorPicker value={portalForm.primaryColor} onChange={c => setPortalForm(f => ({ ...f, primaryColor: c }))} />
          <div className="rounded-xl border overflow-hidden">
            <div className="h-2" style={{ backgroundColor: portalForm.primaryColor }} />
            <div className="p-4 flex items-center justify-between bg-card">
              <div className="space-y-1">
                <div className="h-3 w-28 rounded bg-muted" />
                <div className="h-2 w-20 rounded bg-muted/60" />
              </div>
              <div className="h-8 w-20 rounded-lg text-white text-xs font-semibold flex items-center justify-center" style={{ backgroundColor: portalForm.primaryColor }}>
                Agendar
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Prévia do portal com a cor selecionada</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo da Barbearia</CardTitle>
          <CardDescription>Exibida no canto esquerdo do hero do portal do cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload label="Logo" description="Recomendado: quadrado, mínimo 200×200 px"
            value={portalForm.logoUrl} onChange={url => setPortalForm(f => ({ ...f, logoUrl: url }))}
            aspectClass="aspect-square max-w-[200px]" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banner de Fundo</CardTitle>
          <CardDescription>Imagem de fundo exibida no hero do portal do cliente. Recomendado: foto panorâmica da barbearia.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload label="Banner" description="Recomendado: 1200×400 px (proporção 3:1)"
            value={portalForm.bannerUrl} onChange={url => setPortalForm(f => ({ ...f, bannerUrl: url }))}
            aspectClass="aspect-[3/1]" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link do Portal</CardTitle>
          <CardDescription>Compartilhe com seus clientes para agendamento online</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={portalUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopy} title="Copiar link">
              {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.open(portalUrl, '_blank')} title="Abrir portal">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Slug: <span className="font-mono font-semibold">/{tenant.slug}</span>
          </p>
        </CardContent>
      </Card>

      <Button onClick={savePortal} className="gap-2">
        {portalSaved ? <><CheckCircle className="h-4 w-4" /> Salvo!</> : 'Salvar alterações'}
      </Button>
    </div>
  );

  // ── Section: Horários ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Disponibilidade de Horários</h2>
        <p className="text-muted-foreground text-sm">Configure os dias e horários de atendimento de cada profissional</p>
      </div>

      {/* Antecedência mínima */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Antecedência Mínima para Agendamento
          </CardTitle>
          <CardDescription>
            Tempo mínimo antes do horário que o cliente pode agendar. Exemplo: 60 minutos = cliente só agenda a partir de 1 hora à frente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={1440}
              step={15}
              value={advanceMinutes}
              onChange={e => setAdvanceMinutes(Number(e.target.value))}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">minutos</span>
            {advanceMinutes > 0 && (
              <span className="text-xs text-muted-foreground">
                ({advanceMinutes >= 60
                  ? `${Math.floor(advanceMinutes / 60)}h${advanceMinutes % 60 > 0 ? ` ${advanceMinutes % 60}min` : ''}`
                  : `${advanceMinutes} min`} de antecedência)
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[0, 30, 60, 120, 180, 240].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setAdvanceMinutes(m)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  advanceMinutes === m
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-muted-foreground border-muted-foreground/20 hover:bg-muted'
                }`}
              >
                {m === 0 ? 'Sem mínimo' : m < 60 ? `${m} min` : `${m / 60}h`}
              </button>
            ))}
          </div>
          <Button onClick={saveAdvance} size="sm" className="gap-2">
            {advanceSaved ? <><CheckCircle className="h-4 w-4" /> Salvo!</> : 'Salvar'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Disponibilidade dos Profissionais
          </CardTitle>
          <CardDescription>
            Clique em Editar para ajustar a agenda de cada profissional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {professionals.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum profissional cadastrado.</p>
          )}
          {professionals.map(prof => (
            <div key={prof.id} className="flex items-center justify-between p-3 rounded-lg border bg-card gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{prof.name}</p>
                <p className="text-xs text-muted-foreground truncate">{prof.specialty}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {DAY_LABELS.map((label, day) => (
                    <span key={day}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        prof.workingDays.includes(day)
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground line-through opacity-50'
                      }`}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0 text-xs text-muted-foreground">
                <p>{prof.workingHours.start} – {prof.workingHours.end}</p>
                <Button size="sm" variant="default" className="mt-1 gap-1 h-7 text-xs" onClick={() => setScheduleProf(prof)}>
                  <Edit2 className="h-3 w-3" /> Editar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {scheduleProf && (
        <ScheduleDialog prof={scheduleProf} onSave={handleSaveSchedule} onClose={() => setScheduleProf(null)} />
      )}
    </div>
  );
}
