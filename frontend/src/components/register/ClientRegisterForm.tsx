import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePublicTenant } from '@/context/PublicTenantContext';
import { usePublicClient } from '@/context/PublicClientContext';
import { registerClientApi, type ClientSessionData } from '@/services/register.service';
import { maskPhone } from '@/lib/phone';
import GoogleSignInButton from './GoogleSignInButton';

interface ClientRegisterFormProps {
  onBack: () => void;
  onSuccess: (result: ClientSessionData) => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMPTY: FormState = { name: '', email: '', phone: '', password: '', confirmPassword: '' };

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.name.trim().length < 2)
    errors.name = 'Nome deve ter ao menos 2 caracteres.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'E-mail inválido.';
  if (form.password.length < 6)
    errors.password = 'Senha deve ter ao menos 6 caracteres.';
  if (form.password !== form.confirmPassword)
    errors.confirmPassword = 'As senhas não coincidem.';
  return errors;
}

// ─── Divisor visual ────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex-1 border-t" />
      ou
      <span className="flex-1 border-t" />
    </div>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ClientRegisterForm({ onBack, onSuccess }: ClientRegisterFormProps) {
  const { data: { tenant }, getSlug } = usePublicTenant();
  const { login } = usePublicClient();

  const [form, setForm]     = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (field in errors) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');
    try {
      const result = await registerClientApi(getSlug(), {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        phone:    form.phone.trim() || undefined,
        password: form.password,
      });
      onSuccess(result);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Erro ao cadastrar.');
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleSuccess = () => {
    // GoogleSignInButton já chamou login(); buscamos o cliente do contexto via onSuccess
    // Precisamos propagar para RegisterPage — usamos um resultado sintético via login
    // O RegisterPage vai ler do contexto após o login do Google
    onSuccess({ id: '', name: '', email: '' }); // sinaliza sucesso; RegisterPage lê do context
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cadastre-se em {tenant.name} para agendar serviços
        </p>
      </div>

      {/* Google */}
      <GoogleSignInButton
        label="Cadastrar com Google"
        onSuccess={() => onSuccess({ id: '', name: '', email: '' })}
        onError={setApiError}
        disabled={saving}
      />

      <Divider />

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo *</Label>
          <Input id="name" placeholder="Seu nome" value={form.name} onChange={set('name')} disabled={saving} autoComplete="name" />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail *</Label>
          <Input id="email" type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')} disabled={saving} autoComplete="email" />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={e => setForm(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
            disabled={saving}
            autoComplete="tel"
            maxLength={15}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Mín. 6 caracteres"
                value={form.password}
                onChange={set('password')}
                disabled={saving}
                autoComplete="new-password"
                className="pr-10"
              />
              <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar senha *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                disabled={saving}
                autoComplete="new-password"
                className="pr-10"
              />
              <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
          </div>
        </div>

        {apiError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={saving}
          style={{ backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Criar conta
        </Button>
      </form>
    </div>
  );
}
