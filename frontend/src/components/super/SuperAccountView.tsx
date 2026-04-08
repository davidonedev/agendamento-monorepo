import { useState, useEffect } from 'react';
import { CheckCircle, Eye, EyeOff, Loader2, Pencil, KeyRound, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { updateMeApi, changePasswordApi } from '@/services/auth.service';
import {
  listUsersApi, updateUserEmailApi, forceChangePasswordApi,
  type PlatformUser,
} from '@/services/super.service';
import { getSuperColor } from './SuperSettingsView';

// ─── Color picker (reaproveitado da SuperSettingsView) ────────────────────────
const PRESET_COLORS = [
  '#1e1b4b', '#7c3aed', '#db2777', '#dc2626',
  '#d97706', '#16a34a', '#0ea5e9', '#0f172a',
  '#78350f', '#14532d', '#0369a1', '#9f1239',
];

const STORAGE_KEY = 'super_primary_color';

function saveSuperColor(color: string) {
  localStorage.setItem(STORAGE_KEY, color);
}

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

// ─── Input de senha com toggle de visibilidade ────────────────────────────────
function PwdInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setShow(v => !v)}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

type Tab = 'settings' | 'account';

// ─── Tab: Configurações (cor) ─────────────────────────────────────────────────
function SettingsTab() {
  const [color, setColor] = useState(getSuperColor);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveSuperColor(color);
    window.dispatchEvent(new CustomEvent('super-color-change', { detail: color }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cor principal do painel</CardTitle>
        <CardDescription>Define a cor de destaque — botões, links ativos e indicadores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ColorPicker value={color} onChange={setColor} />

        {/* Preview */}
        <div className="rounded-lg border overflow-hidden text-xs">
          <div className="px-3 py-2 flex items-center gap-2 text-white font-semibold" style={{ backgroundColor: color }}>
            <div className="h-4 w-4 rounded bg-white/20 flex items-center justify-center text-[9px]">S</div>
            Super Admin
          </div>
          <div className="p-3 bg-muted/20 space-y-1.5">
            {['Dashboard', 'Tenants', 'Métricas', 'Minha conta'].map((item, i) => (
              <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-medium"
                style={i === 3 ? { backgroundColor: color, color: '#fff' } : { color: 'var(--muted-foreground)' }}>
                <div className="h-2.5 w-2.5 rounded-sm bg-current opacity-70" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} className="gap-2" style={{ backgroundColor: color }}>
          {saved ? <><CheckCircle className="h-4 w-4" />Salvo!</> : 'Salvar cor'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Tab: Minha conta (credenciais próprias + gerenciar usuários) ─────────────
function AccountTab() {
  const { user, updateUser, changePassword } = useAuth();

  // ── Credenciais próprias ──────────────────────────────────────────────────
  const [emailForm, setEmailForm] = useState({ email: user?.email ?? '', confirm: '' });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailOk, setEmailOk] = useState(false);

  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdOk, setPwdOk] = useState(false);

  const emailValid =
    emailForm.email.trim() !== '' &&
    emailForm.confirm.trim() !== '' &&
    emailForm.email === emailForm.confirm &&
    emailForm.email !== user?.email;

  const pwdValid =
    pwdForm.current.trim() !== '' &&
    pwdForm.next.trim().length >= 6 &&
    pwdForm.next === pwdForm.confirm;

  const handleSaveEmail = async () => {
    if (!emailValid) return;
    setEmailError('');
    setEmailSaving(true);
    try {
      await updateUser({ email: emailForm.email.trim() });
      setEmailOk(true);
      setEmailForm(f => ({ ...f, confirm: '' }));
      setTimeout(() => setEmailOk(false), 2500);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Erro ao atualizar e-mail.');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!pwdValid) return;
    if (pwdForm.next !== pwdForm.confirm) { setPwdError('As senhas não coincidem.'); return; }
    setPwdError('');
    setPwdSaving(true);
    try {
      await changePassword(pwdForm.current, pwdForm.next);
      setPwdOk(true);
      setPwdForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwdOk(false), 2500);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally {
      setPwdSaving(false);
    }
  };

  // ── Gerenciar outros usuários ─────────────────────────────────────────────
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');

  const [editEmailTarget, setEditEmailTarget] = useState<PlatformUser | null>(null);
  const [editEmailVal, setEditEmailVal] = useState('');
  const [editEmailConfirm, setEditEmailConfirm] = useState('');
  const [editEmailSaving, setEditEmailSaving] = useState(false);
  const [editEmailError, setEditEmailError] = useState('');

  const [editPwdTarget, setEditPwdTarget] = useState<PlatformUser | null>(null);
  const [editPwdVal, setEditPwdVal] = useState('');
  const [editPwdConfirm, setEditPwdConfirm] = useState('');
  const [editPwdSaving, setEditPwdSaving] = useState(false);
  const [editPwdError, setEditPwdError] = useState('');

  useEffect(() => {
    listUsersApi()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.tenant?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openEditEmail = (u: PlatformUser) => {
    setEditEmailTarget(u);
    setEditEmailVal(u.email);
    setEditEmailConfirm('');
    setEditEmailError('');
  };

  const openEditPwd = (u: PlatformUser) => {
    setEditPwdTarget(u);
    setEditPwdVal('');
    setEditPwdConfirm('');
    setEditPwdError('');
  };

  const handleUpdateEmail = async () => {
    if (!editEmailTarget) return;
    const emailOkFlag =
      editEmailVal.trim() !== '' &&
      editEmailConfirm.trim() !== '' &&
      editEmailVal === editEmailConfirm;
    if (!emailOkFlag) { setEditEmailError('Preencha os dois campos com o mesmo e-mail.'); return; }
    setEditEmailError('');
    setEditEmailSaving(true);
    try {
      const updated = await updateUserEmailApi(editEmailTarget.id, editEmailVal.trim());
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, email: updated.email } : u));
      setEditEmailTarget(null);
    } catch (err) {
      setEditEmailError(err instanceof Error ? err.message : 'Erro ao atualizar e-mail.');
    } finally {
      setEditEmailSaving(false);
    }
  };

  const handleForcePassword = async () => {
    if (!editPwdTarget) return;
    if (editPwdVal.trim().length < 6) { setEditPwdError('A senha deve ter no mínimo 6 caracteres.'); return; }
    if (editPwdVal !== editPwdConfirm) { setEditPwdError('As senhas não coincidem.'); return; }
    setEditPwdError('');
    setEditPwdSaving(true);
    try {
      await forceChangePasswordApi(editPwdTarget.id, editPwdVal);
      setEditPwdTarget(null);
    } catch (err) {
      setEditPwdError(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally {
      setEditPwdSaving(false);
    }
  };

  const userEmailValid =
    editEmailVal.trim() !== '' &&
    editEmailConfirm.trim() !== '' &&
    editEmailVal === editEmailConfirm;

  const userPwdValid =
    editPwdVal.trim().length >= 6 &&
    editPwdVal === editPwdConfirm;

  return (
    <div className="space-y-6">
      {/* ── Meu e-mail ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alterar meu e-mail</CardTitle>
          <CardDescription>E-mail atual: <span className="font-medium text-foreground">{user?.email}</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Novo e-mail *</Label>
            <Input
              type="email"
              placeholder="novo@email.com"
              value={emailForm.email}
              onChange={e => setEmailForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Confirmar novo e-mail *</Label>
            <Input
              type="email"
              placeholder="novo@email.com"
              value={emailForm.confirm}
              onChange={e => setEmailForm(f => ({ ...f, confirm: e.target.value }))}
            />
            {emailForm.confirm && emailForm.email !== emailForm.confirm && (
              <p className="text-xs text-destructive">Os e-mails não coincidem.</p>
            )}
          </div>
          {emailError && <p className="text-sm text-destructive">{emailError}</p>}
          <Button onClick={handleSaveEmail} disabled={!emailValid || emailSaving} className="gap-2">
            {emailSaving
              ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
              : emailOk
              ? <><CheckCircle className="h-4 w-4" />Salvo!</>
              : 'Salvar e-mail'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Minha senha ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alterar minha senha</CardTitle>
          <CardDescription>Informe sua senha atual e escolha uma nova com no mínimo 6 caracteres.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Senha atual *</Label>
            <PwdInput value={pwdForm.current} onChange={v => setPwdForm(f => ({ ...f, current: v }))} placeholder="Senha atual" />
          </div>
          <div className="space-y-1">
            <Label>Nova senha *</Label>
            <PwdInput value={pwdForm.next} onChange={v => setPwdForm(f => ({ ...f, next: v }))} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="space-y-1">
            <Label>Confirmar nova senha *</Label>
            <PwdInput value={pwdForm.confirm} onChange={v => setPwdForm(f => ({ ...f, confirm: v }))} placeholder="Repita a nova senha" />
            {pwdForm.confirm && pwdForm.next !== pwdForm.confirm && (
              <p className="text-xs text-destructive">As senhas não coincidem.</p>
            )}
          </div>
          {pwdError && <p className="text-sm text-destructive">{pwdError}</p>}
          <Button onClick={handleSavePassword} disabled={!pwdValid || pwdSaving} className="gap-2">
            {pwdSaving
              ? <><Loader2 className="h-4 w-4 animate-spin" />Alterando...</>
              : pwdOk
              ? <><CheckCircle className="h-4 w-4" />Alterada!</>
              : 'Alterar senha'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Gerenciar usuários ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gerenciar admins e profissionais</CardTitle>
          <CardDescription>Altere o e-mail ou redefina a senha de qualquer usuário da plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome, e-mail ou tenant…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado.</p>
          ) : (
            <div className="divide-y rounded-lg border overflow-hidden">
              {filtered.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{u.name}</p>
                      <Badge variant={u.role === 'tenant_admin' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1">
                        {u.role === 'tenant_admin' ? 'Admin' : 'Profissional'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    {u.tenant && (
                      <p className="text-xs text-muted-foreground">/{u.tenant.slug} — {u.tenant.name}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" title="Alterar e-mail" onClick={() => openEditEmail(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Redefinir senha" onClick={() => openEditPwd(u)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog: editar e-mail de usuário ────────────────────────────────── */}
      <Dialog open={!!editEmailTarget} onOpenChange={o => { if (!editEmailSaving && !o) setEditEmailTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar e-mail — {editEmailTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label>Novo e-mail *</Label>
              <Input type="email" placeholder="novo@email.com" value={editEmailVal}
                onChange={e => setEditEmailVal(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Confirmar e-mail *</Label>
              <Input type="email" placeholder="novo@email.com" value={editEmailConfirm}
                onChange={e => setEditEmailConfirm(e.target.value)} />
              {editEmailConfirm && editEmailVal !== editEmailConfirm && (
                <p className="text-xs text-destructive">Os e-mails não coincidem.</p>
              )}
            </div>
            {editEmailError && <p className="text-sm text-destructive">{editEmailError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmailTarget(null)} disabled={editEmailSaving}>Cancelar</Button>
            <Button onClick={handleUpdateEmail} disabled={!userEmailValid || editEmailSaving}>
              {editEmailSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: redefinir senha de usuário ──────────────────────────────── */}
      <Dialog open={!!editPwdTarget} onOpenChange={o => { if (!editPwdSaving && !o) setEditPwdTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Redefinir senha — {editPwdTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label>Nova senha *</Label>
              <PwdInput value={editPwdVal} onChange={setEditPwdVal} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-1">
              <Label>Confirmar nova senha *</Label>
              <PwdInput value={editPwdConfirm} onChange={setEditPwdConfirm} placeholder="Repita a senha" />
              {editPwdConfirm && editPwdVal !== editPwdConfirm && (
                <p className="text-xs text-destructive">As senhas não coincidem.</p>
              )}
            </div>
            {editPwdError && <p className="text-sm text-destructive">{editPwdError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPwdTarget(null)} disabled={editPwdSaving}>Cancelar</Button>
            <Button onClick={handleForcePassword} disabled={!userPwdValid || editPwdSaving}>
              {editPwdSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Alterando...</> : 'Redefinir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── View principal ───────────────────────────────────────────────────────────
export default function SuperAccountView() {
  const [tab, setTab] = useState<Tab>('settings');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'settings', label: 'Configurações' },
    { key: 'account',  label: 'Minha conta'   },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Minha conta</h2>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as configurações do painel e suas credenciais.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'settings' && <SettingsTab />}
      {tab === 'account'  && <AccountTab />}
    </div>
  );
}
