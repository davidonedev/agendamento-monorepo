import { useState } from 'react';
import { MailCheck, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { requestEmailChangeApi } from '@/services/account.service';
import { ApiError } from '@/lib/api';

/**
 * "Alterar e-mail" para qualquer role: exige a senha atual e só troca depois que o
 * usuário confirma pelo link enviado ao novo endereço.
 */
export function ChangeEmailCard({ accentColor }: { accentColor?: string }) {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [sentTo,   setSentTo]   = useState('');

  const valid = newEmail.trim() !== '' && password !== '' && newEmail.trim().toLowerCase() !== user?.email.toLowerCase();

  const handleSubmit = async () => {
    if (!valid) return;
    setError(''); setSaving(true);
    try {
      await requestEmailChangeApi(newEmail.trim(), password);
      setSentTo(newEmail.trim());
      setNewEmail(''); setPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? (err.details?.[0]?.message ?? err.message) : 'Erro ao solicitar a troca de e-mail.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alterar e-mail</CardTitle>
        <CardDescription>
          E-mail atual: <span className="font-medium text-foreground">{user?.email}</span>. A troca só vale depois que
          você confirmar pelo link enviado ao novo e-mail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sentTo && (
          <div role="status" className="flex items-start gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Enviamos um link de confirmação para <strong>{sentTo}</strong>. Até lá, continue usando o e-mail atual.</span>
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="change-email-new">Novo e-mail</Label>
          <Input id="change-email-new" type="email" placeholder="novo@email.com" autoComplete="email"
            value={newEmail} onChange={e => setNewEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="change-email-pwd">Senha atual</Label>
          <Input id="change-email-pwd" type="password" autoComplete="current-password"
            value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <X className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <Button onClick={handleSubmit} disabled={!valid || saving} size="sm"
          style={accentColor ? { backgroundColor: accentColor } : undefined}>
          {saving ? 'Enviando...' : 'Enviar link de confirmação'}
        </Button>
      </CardContent>
    </Card>
  );
}
