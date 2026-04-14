import { useState } from 'react';
import ClientRegisterForm from '@/components/register/ClientRegisterForm';
import RegisterSuccess from '@/components/register/RegisterSuccess';
import { usePublicClient } from '@/context/PublicClientContext';
import { useNavigate } from 'react-router-dom';
import { usePublicTenant } from '@/context/PublicTenantContext';
import type { ClientSessionData } from '@/services/register.service';

type Step = 'client-form' | 'success';

export default function RegisterPage() {
  const { login, client }        = usePublicClient();
  const { data: { tenant } }     = usePublicTenant();
  const navigate                 = useNavigate();

  const [step, setStep]         = useState<Step>('client-form');
  const [userName, setUserName] = useState('');

  const handleBack = () => navigate(`/${tenant.slug}`);

  /**
   * Chamado pelo ClientRegisterForm após cadastro (email/senha OU Google).
   * - Cadastro via e-mail/senha: result contém os dados → faz login e avança.
   * - Cadastro via Google: GoogleSignInButton já chamou login(); result.id está vazio
   *   então lemos o nome do contexto.
   */
  const handleClientSuccess = (result: ClientSessionData) => {
    if (result.id) {
      login(result);
      setUserName(result.name);
    } else {
      setUserName(client?.name ?? '');
    }
    setStep('success');
  };

  return (
    <div className="py-4">
      {step === 'client-form' && (
        <ClientRegisterForm onBack={handleBack} onSuccess={handleClientSuccess} />
      )}

      {step === 'success' && (
        <RegisterSuccess role="client" name={userName} />
      )}
    </div>
  );
}
