import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifyClientEmailApi } from '@/services/public.service';
import { usePublicClient } from '@/context/PublicClientContext';
import { usePublicTenant } from '@/context/PublicTenantContext';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const { tenantSlug }      = useParams<{ tenantSlug: string }>();
  const [searchParams]      = useSearchParams();
  const navigate            = useNavigate();
  const { login }           = usePublicClient();
  const { data: { tenant } } = usePublicTenant();

  const [status,  setStatus]  = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token || !tenantSlug) {
      setStatus('error');
      setMessage('Link de verificação inválido.');
      return;
    }

    verifyClientEmailApi(tenantSlug, token)
      .then(clientData => {
        login(clientData);
        setStatus('success');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Link inválido ou expirado.');
      });
  }, [tenantSlug, searchParams, login]);

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-16">
      {status === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Verificando seu e-mail...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Conta verificada!</h2>
            <p className="text-muted-foreground text-sm">
              Sua conta em <strong>{tenant.name}</strong> está ativa.
              Seu agendamento foi confirmado com sucesso!
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              className="gap-2"
              style={{ backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }}
              onClick={() => navigate(`/${tenantSlug}/my-appointments`)}
            >
              <LogIn className="h-4 w-4" />
              Ver meus agendamentos
            </Button>
            <Button variant="outline" onClick={() => navigate(`/${tenantSlug}`)}>
              Voltar ao portal
            </Button>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Verificação falhou</h2>
            <p className="text-muted-foreground text-sm">{message}</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/${tenantSlug}`)}>
            Voltar ao portal
          </Button>
        </>
      )}
    </div>
  );
}
