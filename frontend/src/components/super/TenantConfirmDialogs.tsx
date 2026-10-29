import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { usePlatform } from '@/context/PlatformContext';
import type { TenantWithCounts } from '@/services/super.service';
import { STATUS_CONFIG, STATUS_EFFECT, type StatusAction } from './tenantMeta';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

// ─── Alterar status (suspender / ativar / reativar) ───────────────────────────
export interface StatusTarget {
  tenant: TenantWithCounts;
  action: StatusAction;
}

function StatusBody({ target, onClose }: { target: StatusTarget; onClose: () => void }) {
  const { tenant, action } = target;
  const { updateTenantStatus } = usePlatform();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setSaving(true);
    setError('');
    try {
      await updateTenantStatus(tenant.id, action.next);
      toast({ title: `${tenant.name} agora está ${STATUS_CONFIG[action.next].label.toLowerCase()}` });
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível alterar o status. Tente novamente.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{action.label} {tenant.name}?</DialogTitle>
        <DialogDescription>{STATUS_EFFECT[action.next]}</DialogDescription>
      </DialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant={action.destructive ? 'destructive' : 'default'} onClick={confirm} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <action.Icon />}
          {action.label}
        </Button>
      </DialogFooter>
    </>
  );
}

export function StatusConfirmDialog({ target, onClose }: { target: StatusTarget | null; onClose: () => void }) {
  return (
    <Dialog open={!!target} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent>
        {target && <StatusBody target={target} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

// ─── Excluir (exige digitar o slug) ───────────────────────────────────────────
function DeleteBody({ tenant, onClose, onDeleted }: {
  tenant: TenantWithCounts; onClose: () => void; onDeleted?: () => void;
}) {
  const { deleteTenant } = usePlatform();
  const { toast } = useToast();
  const [typed, setTyped] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const counts = tenant._count;
  const impact = [
    `${counts?.professionals ?? 0} profissionais`,
    `${counts?.services ?? 0} serviços`,
    `${counts?.clients ?? 0} clientes`,
    `${counts?.appointments ?? 0} agendamentos`,
  ];

  const confirm = async () => {
    setSaving(true);
    setError('');
    try {
      await deleteTenant(tenant.id);
      toast({ title: 'Tenant excluído', description: tenant.name });
      onClose();
      onDeleted?.();
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível excluir o tenant. Tente novamente.'));
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Excluir {tenant.name}?</DialogTitle>
        <DialogDescription>
          Esta ação é permanente e não pode ser desfeita. Serão apagados: {impact.join(', ')}.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="delete-confirm">
          Digite <span className="font-mono font-semibold">{tenant.slug}</span> para confirmar
        </Label>
        <Input
          id="delete-confirm" value={typed} autoFocus autoComplete="off"
          onChange={e => setTyped(e.target.value)} className="font-mono"
        />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="destructive" onClick={confirm} disabled={saving || typed.trim() !== tenant.slug}>
          {saving && <Loader2 className="animate-spin" />}
          Excluir permanentemente
        </Button>
      </DialogFooter>
    </>
  );
}

export function DeleteTenantDialog({ tenant, onClose, onDeleted }: {
  tenant: TenantWithCounts | null; onClose: () => void; onDeleted?: () => void;
}) {
  return (
    <Dialog open={!!tenant} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent>
        {tenant && <DeleteBody tenant={tenant} onClose={onClose} onDeleted={onDeleted} />}
      </DialogContent>
    </Dialog>
  );
}
