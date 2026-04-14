import { useState } from 'react';
import { Eye, EyeOff, Loader2, LogIn, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clientLoginApi } from '@/services/register.service';
import { resendVerificationEmailApi } from '@/services/public.service';
import { usePublicClient } from '@/context/PublicClientContext';
import { usePublicTenant } from '@/context/PublicTenantContext';
import GoogleSignInButton from './GoogleSignInButton';

interface ClientLoginDialogProps {
  open: boolean;
  onClose: () => void;
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex-1 border-t" />ou<span className="flex-1 border-t" />
    </div>
  );
}

export default function ClientLoginDialog({ open, onClose }: ClientLoginDialogProps) {
  const { login } = usePublicClient();
  const { data: { tenant }, getSlug } = usePublicTenant();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Estado específico de e-mail não verificado
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading,   setResendLoading]   = useState(false);
  const [resendMsg,       setResendMsg]       = useState('');

  const handleClose = () => {
    setEmail(''); setPassword(''); setError('');
    setUnverifiedEmail(''); setResendMsg('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError('');
    setUnverifiedEmail('');
    try {
      const result = await clientLoginApi(getSlug(), email.trim().toLowerCase(), password);
      login(result);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar.';
      // Detecta e-mail não verificado pelo código ou pelo texto da mensagem
      const isUnverified =
        (err as { code?: string })?.code === 'EMAIL_NOT_VERIFIED' ||
        msg.includes('verificar seu e-mail');
      if (isUnverified) {
        setUnverifiedEmail(email.trim().toLowerCase());
        setError('');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg('');
    try {
      await resendVerificationEmailApi(getSlug(), unverifiedEmail);
      setResendMsg('Novo link enviado! Verifique sua caixa de entrada.');
    } catch {
      setResendMsg('Não foi possível reenviar. Tente novamente em instantes.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Entrar em {tenant.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Painel de e-mail não verificado */}
          {unverifiedEmail ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${tenant.primaryColor}18` }}
                >
                  <Mail className="h-5 w-5" style={{ color: tenant.primaryColor }} />
                </div>
                <div>
                  <p className="font-semibold text-sm">Conta não verificada</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Você precisa verificar sua conta via WhatsApp antes de entrar.<br />
                    Acesse a mensagem enviada para o número cadastrado com{' '}
                    <strong>{unverifiedEmail}</strong>.
                  </p>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleResend}
                disabled={resendLoading}
                style={{ backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }}
              >
                {resendLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Mail className="h-4 w-4" />}
                Reenviar link de verificação
              </Button>

              {resendMsg && (
                <p className="text-center text-xs text-muted-foreground">{resendMsg}</p>
              )}

              <button
                type="button"
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setUnverifiedEmail(''); setEmail(''); setPassword(''); }}
              >
                ← Tentar com outro e-mail
              </button>
            </div>
          ) : (
            <>
              {/* Google */}
              <GoogleSignInButton
                label="Entrar com Google"
                onSuccess={handleClose}
                onError={setError}
                disabled={loading}
              />

              <Divider />

              {/* E-mail + senha */}
              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input
                    id="login-email" type="email" placeholder="seu@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    disabled={loading} autoFocus autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-pass">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-pass" type={showPass ? 'text' : 'password'}
                      placeholder="Sua senha" className="pr-10"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      disabled={loading} autoComplete="current-password"
                    />
                    <button
                      type="button" tabIndex={-1}
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
                  type="submit" className="w-full gap-2"
                  disabled={loading || !email.trim() || !password}
                  style={{ backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  Entrar
                </Button>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
