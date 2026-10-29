import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { usePlatform } from '@/context/PlatformContext';
import { ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { TenantPlan, TenantStatus } from '@/types';
import type { TenantWithCounts } from '@/services/super.service';
import { PLAN_CONFIG, PLAN_KEYS, STATUS_CONFIG, STATUS_KEYS, getPlanConfig, slugify } from './tenantMeta';

interface FormState {
  name: string; slug: string; ownerName: string; email: string;
  phone: string; address: string;
  plan: TenantPlan; monthlyPrice: string; primaryColor: string;
  adminPassword: string; status: TenantStatus;
}

type Errors = Partial<Record<keyof FormState, string>>;

const HEX = /^#[0-9a-fA-F]{6}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG = /^[a-z0-9-]{2,50}$/;

function parsePrice(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}

function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error
        ? <p id={`${htmlFor}-error`} role="alert" className="text-xs text-destructive">{error}</p>
        : hint && <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Corpo do formulário — montado só enquanto o diálogo está aberto ──────────
function TenantFormBody({ tenant, onClose }: { tenant: TenantWithCounts | null; onClose: () => void }) {
  const isEdit = !!tenant;
  const uid = useId();
  const { createTenant, updateTenant, planConfigs } = usePlatform();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(() => tenant
    ? {
        name: tenant.name, slug: tenant.slug, ownerName: tenant.ownerName, email: tenant.email,
        phone: tenant.phone ?? '', address: tenant.address ?? '',
        plan: tenant.plan, monthlyPrice: String(tenant.monthlyPrice),
        primaryColor: tenant.primaryColor, adminPassword: '', status: tenant.status,
      }
    : {
        name: '', slug: '', ownerName: '', email: '', phone: '', address: '',
        plan: 'basic', monthlyPrice: String(getPlanConfig('basic', planConfigs)?.defaultPrice ?? 0),
        primaryColor: '#3B82F6', adminPassword: '', status: 'trial',
      });
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [priceTouched, setPriceTouched] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const id = (field: keyof FormState) => `${uid}-${field}`;
  const aria = (field: keyof FormState) => ({
    id: id(field),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `${id(field)}-error` : undefined,
  });

  const planDefault = getPlanConfig(form.plan, planConfigs)?.defaultPrice;

  const handleName = (name: string) => {
    set('name', name);
    if (!isEdit && !slugTouched) set('slug', slugify(name));
  };

  const handlePlan = (plan: TenantPlan) => {
    set('plan', plan);
    const price = getPlanConfig(plan, planConfigs)?.defaultPrice;
    if (!priceTouched && price !== undefined) set('monthlyPrice', String(price));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = 'Informe o nome (mínimo 2 caracteres).';
    if (form.ownerName.trim().length < 2) e.ownerName = 'Informe o responsável (mínimo 2 caracteres).';
    if (!isEdit) {
      if (!SLUG.test(form.slug)) e.slug = 'Use de 2 a 50 caracteres: letras minúsculas, números e hífen.';
      if (!EMAIL.test(form.email.trim())) e.email = 'Informe um e-mail válido.';
      if (form.adminPassword.length < 6) e.adminPassword = 'A senha precisa ter pelo menos 6 caracteres.';
    }
    const price = parsePrice(form.monthlyPrice);
    if (Number.isNaN(price) || price < 0) e.monthlyPrice = 'Informe um valor válido (0 ou mais).';
    if (!HEX.test(form.primaryColor)) e.primaryColor = 'Use o formato #RRGGBB.';
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setApiError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const shared = {
      name: form.name.trim(),
      ownerName: form.ownerName.trim(),
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      plan: form.plan,
      monthlyPrice: parsePrice(form.monthlyPrice),
      primaryColor: form.primaryColor,
    };

    setSaving(true);
    try {
      if (tenant) {
        await updateTenant(tenant.id, { ...shared, status: form.status });
        toast({ title: 'Alterações salvas', description: shared.name });
      } else {
        await createTenant({
          ...shared,
          slug: form.slug,
          email: form.email.trim(),
          adminPassword: form.adminPassword,
        });
        toast({ title: 'Tenant criado', description: `${shared.name} começa com status Trial.` });
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_SLUG') {
        setErrors({ slug: 'Este slug já está em uso. Escolha outro.' });
      } else if (err instanceof ApiError && err.code === 'DUPLICATE_EMAIL') {
        setErrors({ email: 'Este e-mail já está cadastrado.' });
      } else {
        setApiError(err instanceof Error ? err.message : 'Não foi possível salvar. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? `Editar ${tenant.name}` : 'Novo tenant'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Atualize os dados do estabelecimento. Slug e e-mail do admin não podem ser alterados aqui.'
            : 'Cria o estabelecimento e o usuário administrador. O tenant começa em modo Trial.'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome do estabelecimento *" htmlFor={id('name')} error={errors.name}>
          <Input {...aria('name')} placeholder="Barber Kings" value={form.name}
            onChange={e => handleName(e.target.value)} autoFocus />
        </Field>
        <Field
          label="Slug (URL do portal) *" htmlFor={id('slug')} error={errors.slug}
          hint={isEdit ? 'Não pode ser alterado.' : `Portal: /${form.slug || 'slug'}`}
        >
          <Input {...aria('slug')} placeholder="barber-kings" value={form.slug} disabled={isEdit}
            className="font-mono text-sm"
            onChange={e => { setSlugTouched(true); set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }} />
        </Field>

        <Field label="Responsável *" htmlFor={id('ownerName')} error={errors.ownerName}>
          <Input {...aria('ownerName')} placeholder="João Silva" value={form.ownerName}
            onChange={e => set('ownerName', e.target.value)} />
        </Field>
        <Field
          label={isEdit ? 'E-mail do admin' : 'E-mail do admin *'} htmlFor={id('email')} error={errors.email}
        >
          <Input {...aria('email')} type="email" placeholder="admin@exemplo.com" value={form.email}
            disabled={isEdit} onChange={e => set('email', e.target.value)} />
        </Field>

        <Field label="Telefone" htmlFor={id('phone')}>
          <Input id={id('phone')} placeholder="(11) 99999-0000" value={form.phone}
            onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="Endereço" htmlFor={id('address')}>
          <Input id={id('address')} placeholder="Rua das Flores, 123" value={form.address}
            onChange={e => set('address', e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Plano" htmlFor={id('plan')}>
          <Select value={form.plan} onValueChange={v => handlePlan(v as TenantPlan)}>
            <SelectTrigger id={id('plan')}><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLAN_KEYS.map(p => <SelectItem key={p} value={p}>{PLAN_CONFIG[p].label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="Mensalidade (R$)" htmlFor={id('monthlyPrice')} error={errors.monthlyPrice}
          hint={planDefault !== undefined && parsePrice(form.monthlyPrice) !== planDefault
            ? (
              <>
                Padrão do plano: {formatCurrency(planDefault)}{' '}
                <button type="button" className="text-primary underline-offset-2 hover:underline"
                  onClick={() => { setPriceTouched(false); set('monthlyPrice', String(planDefault)); }}>
                  usar
                </button>
              </>
            )
            : undefined}
        >
          <Input {...aria('monthlyPrice')} type="number" min="0" step="0.01" value={form.monthlyPrice}
            onChange={e => { setPriceTouched(true); set('monthlyPrice', e.target.value); }} />
        </Field>
        {isEdit ? (
          <Field label="Status" htmlFor={id('status')}>
            <Select value={form.status} onValueChange={v => set('status', v as TenantStatus)}>
              <SelectTrigger id={id('status')}><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_KEYS.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>

      <Field label="Cor principal do portal" htmlFor={id('primaryColor')} error={errors.primaryColor}>
        <div className="flex gap-2">
          <input
            type="color" aria-label="Escolher cor"
            value={HEX.test(form.primaryColor) ? form.primaryColor : '#3B82F6'}
            onChange={e => set('primaryColor', e.target.value)}
            className="h-10 w-12 shrink-0 cursor-pointer rounded-md border p-0.5"
          />
          <Input {...aria('primaryColor')} value={form.primaryColor}
            onChange={e => set('primaryColor', e.target.value)} className="font-mono text-sm" />
        </div>
      </Field>

      {!isEdit && (
        <Field
          label="Senha do admin *" htmlFor={id('adminPassword')} error={errors.adminPassword}
          hint="O admin entra no painel com o e-mail acima e esta senha."
        >
          <Input {...aria('adminPassword')} type="password" autoComplete="new-password"
            placeholder="Mínimo 6 caracteres" value={form.adminPassword}
            onChange={e => set('adminPassword', e.target.value)} />
        </Field>
      )}

      {apiError && <p role="alert" className="text-sm text-destructive">{apiError}</p>}

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar tenant'}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface TenantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sem tenant = criar; com tenant = editar. */
  tenant?: TenantWithCounts | null;
}

export function TenantFormDialog({ open, onOpenChange, tenant = null }: TenantFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <TenantFormBody tenant={tenant} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
