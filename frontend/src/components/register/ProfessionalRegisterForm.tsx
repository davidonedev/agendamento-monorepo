import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePublicTenant } from '@/context/PublicTenantContext';
import { registerProfessionalApi } from '@/services/register.service';

interface ProfessionalRegisterFormProps {
  onBack: () => void;
  onSuccess: (name: string) => void;
}

// ─── Days of week ─────────────────────────────────────────────────────────────

const DAYS = [
  { value: 0, short: 'D', label: 'Domingo'  },
  { value: 1, short: 'S', label: 'Segunda'  },
  { value: 2, short: 'T', label: 'Terça'    },
  { value: 3, short: 'Q', label: 'Quarta'   },
  { value: 4, short: 'Q', label: 'Quinta'   },
  { value: 5, short: 'S', label: 'Sexta'    },
  { value: 6, short: 'S', label: 'Sábado'   },
];

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  specialty: string;
  bio: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  specialty?: string;
  workingDays?: string;
}

const EMPTY: FormState = {
  name: '', email: '', password: '', confirmPassword: '',
  specialty: '', bio: '',
  workingHoursStart: '08:00', workingHoursEnd: '18:00',
  workingDays: [1, 2, 3, 4, 5],
};

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.name.trim().length < 2)                      errors.name    = 'Nome deve ter ao menos 2 caracteres.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))  errors.email   = 'E-mail inválido.';
  if (form.password.length < 6)                         errors.password = 'Senha deve ter ao menos 6 caracteres.';
  if (form.password !== form.confirmPassword)           errors.confirmPassword = 'As senhas não coincidem.';
  if (form.specialty.trim().length < 2)                 errors.specialty = 'Informe sua especialidade.';
  if (form.workingDays.length === 0)                    errors.workingDays = 'Selecione ao menos um dia.';
  return errors;
}

// ─── Day toggle ───────────────────────────────────────────────────────────────

interface DayToggleProps {
  days: number[];
  onChange: (days: number[]) => void;
  primaryColor: string;
  disabled?: boolean;
}

function DayToggle({ days, onChange, primaryColor, disabled }: DayToggleProps) {
  const toggle = (value: number) => {
    onChange(days.includes(value) ? days.filter(d => d !== value) : [...days, value]);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {DAYS.map(day => {
        const active = days.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            title={day.label}
            disabled={disabled}
            onClick={() => toggle(day.value)}
            className="h-9 w-9 rounded-full text-sm font-medium border-2 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              active
                ? { backgroundColor: primaryColor, borderColor: primaryColor, color: '#fff' }
                : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }
            }
          >
            {day.short}
          </button>
        );
      })}
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export default function ProfessionalRegisterForm({ onBack, onSuccess }: ProfessionalRegisterFormProps) {
  const { data: { tenant }, getSlug } = usePublicTenant();
  const [form, setForm]     = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (field in errors) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleDays = (days: number[]) => {
    setForm(prev => ({ ...prev, workingDays: days }));
    setErrors(prev => ({ ...prev, workingDays: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');
    try {
      await registerProfessionalApi(getSlug(), {
        name:               form.name.trim(),
        email:              form.email.trim().toLowerCase(),
        password:           form.password,
        specialty:          form.specialty.trim(),
        bio:                form.bio.trim() || undefined,
        workingHoursStart:  form.workingHoursStart,
        workingHoursEnd:    form.workingHoursEnd,
        workingDays:        form.workingDays,
      });
      onSuccess(form.name.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar. Tente novamente.';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold">Cadastro de Profissional</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Preencha seus dados para se cadastrar em {tenant.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* ── Dados pessoais ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Dados pessoais
          </legend>

          <div className="space-y-1.5">
            <Label htmlFor="p-name">Nome completo *</Label>
            <Input id="p-name" placeholder="Seu nome" value={form.name} onChange={set('name')} disabled={saving} autoComplete="name" />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-specialty">Especialidade *</Label>
            <Input id="p-specialty" placeholder="Ex: Barbeiro, Cabeleireiro, Esteticista…" value={form.specialty} onChange={set('specialty')} disabled={saving} />
            {errors.specialty && <p className="text-xs text-destructive">{errors.specialty}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-bio">Bio / Apresentação</Label>
            <Textarea
              id="p-bio"
              placeholder="Conte um pouco sobre você e sua experiência…"
              value={form.bio}
              onChange={set('bio')}
              disabled={saving}
              rows={3}
              className="resize-none"
            />
          </div>
        </fieldset>

        {/* ── Acesso ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Acesso à plataforma
          </legend>

          <div className="space-y-1.5">
            <Label htmlFor="p-email">E-mail *</Label>
            <Input id="p-email" type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')} disabled={saving} autoComplete="email" />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-pass">Senha *</Label>
              <div className="relative">
                <Input
                  id="p-pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mín. 6 caracteres"
                  value={form.password}
                  onChange={set('password')}
                  disabled={saving}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-confirm">Confirmar senha *</Label>
              <div className="relative">
                <Input
                  id="p-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  disabled={saving}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>
        </fieldset>

        {/* ── Disponibilidade ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Disponibilidade
          </legend>

          <div className="space-y-2">
            <Label>Dias de atendimento *</Label>
            <DayToggle
              days={form.workingDays}
              onChange={handleDays}
              primaryColor={tenant.primaryColor}
              disabled={saving}
            />
            {errors.workingDays && <p className="text-xs text-destructive">{errors.workingDays}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-start">Início do expediente</Label>
              <Input id="p-start" type="time" value={form.workingHoursStart} onChange={set('workingHoursStart')} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-end">Fim do expediente</Label>
              <Input id="p-end" type="time" value={form.workingHoursEnd} onChange={set('workingHoursEnd')} disabled={saving} />
            </div>
          </div>
        </fieldset>

        {apiError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {apiError}
          </p>
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
