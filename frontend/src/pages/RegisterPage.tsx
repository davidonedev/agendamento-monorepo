import { useState } from 'react';
<<<<<<< HEAD
import RoleSelector, { type RegisterRole } from '@/components/register/RoleSelector';
import ClientRegisterForm from '@/components/register/ClientRegisterForm';
import ProfessionalRegisterForm from '@/components/register/ProfessionalRegisterForm';
import RegisterSuccess from '@/components/register/RegisterSuccess';
import { usePublicClient } from '@/context/PublicClientContext';
import type { ClientSessionData } from '@/services/register.service';

type Step = 'role' | 'client-form' | 'professional-form' | 'success';

export default function RegisterPage() {
  const { login, client } = usePublicClient();

  const [step, setStep]         = useState<Step>('role');
  const [role, setRole]         = useState<RegisterRole | null>(null);
  const [userName, setUserName] = useState('');

  const handleRoleSelect = (selected: RegisterRole) => {
    setRole(selected);
    setStep(selected === 'client' ? 'client-form' : 'professional-form');
  };

  const handleBack = () => {
    setStep('role');
    setRole(null);
  };
=======
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
>>>>>>> dev

  /**
   * Chamado pelo ClientRegisterForm após cadastro (email/senha OU Google).
   * - Cadastro via e-mail/senha: result contém os dados → faz login e avança.
   * - Cadastro via Google: GoogleSignInButton já chamou login(); result.id está vazio
   *   então lemos o nome do contexto.
   */
  const handleClientSuccess = (result: ClientSessionData) => {
    if (result.id) {
<<<<<<< HEAD
      // Registro via e-mail/senha — faz login agora
      login(result);
      setUserName(result.name);
    } else {
      // Google já fez login; lemos o nome do contexto
=======
      login(result);
      setUserName(result.name);
    } else {
>>>>>>> dev
      setUserName(client?.name ?? '');
    }
    setStep('success');
  };

<<<<<<< HEAD
  const handleProfessionalSuccess = (name: string) => {
    setUserName(name);
    setStep('success');
  };

  return (
    <div className="py-4">
      {step === 'role' && (
        <RoleSelector onSelect={handleRoleSelect} />
      )}

=======
  return (
    <div className="py-4">
>>>>>>> dev
      {step === 'client-form' && (
        <ClientRegisterForm onBack={handleBack} onSuccess={handleClientSuccess} />
      )}

<<<<<<< HEAD
      {step === 'professional-form' && (
        <ProfessionalRegisterForm onBack={handleBack} onSuccess={handleProfessionalSuccess} />
      )}

      {step === 'success' && role && (
        <RegisterSuccess role={role} name={userName} />
=======
      {step === 'success' && (
        <RegisterSuccess role="client" name={userName} />
>>>>>>> dev
      )}
    </div>
  );
}
