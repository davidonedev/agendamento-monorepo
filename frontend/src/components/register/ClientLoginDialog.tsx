import { useState } from 'react';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clientLoginApi } from '@/services/register.service';
import { usePublicClient } from '@/context/PublicClientContext';
import { usePublicTenant } from '@/context/PublicTenantContext';
import GoogleSignInButton from './GoogleSignInButton';

interface ClientLoginDialogProps {
  open: boolean;
  onClose: () => void;
  onRegister: () => void;
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex-1 border-t" />
      ou
      <span className="flex-1 border-t" />
    </div>
  );
}

export default function ClientLoginDialog({ open, onClose, onRegister }: ClientLoginDialogProps) {
  const { login } = usePublicClient();
  const { data: { tenant }, getSlug } = usePublicTenant();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError('');
    try {
      const result = await clientLoginApi(getSlug(), email.trim().toLowerCase(), password);
      login(result);
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Entrar em {tenant.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Google */}
          <GoogleSignInButton
            label="Entrar com Google"
            onSuccess={handleClose}
            onError={setError}
            disabled={loading}
          />

          <Divider />

          {/* Email + senha */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                disabled={loading}
                autoFocus
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-pass">Senha</Label>
              <div className="relative">
                <Input
                  id="login-pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPass(v => !v)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={loading || !email.trim() || !password}
              style={{ backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }}
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <LogIn className="h-4 w-4" />}
              Entrar
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Não tem conta?{' '}
            <button
              type="button"
              className="underline hover:text-foreground transition-colors"
              onClick={() => { handleClose(); onRegister(); }}
            >
              Criar conta
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
