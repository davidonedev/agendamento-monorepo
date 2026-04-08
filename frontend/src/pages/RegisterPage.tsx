import { useState } from 'react';
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

  /**
   * Chamado pelo ClientRegisterForm após cadastro (email/senha OU Google).
   * - Cadastro via e-mail/senha: result contém os dados → faz login e avança.
   * - Cadastro via Google: GoogleSignInButton já chamou login(); result.id está vazio
   *   então lemos o nome do contexto.
   */
  const handleClientSuccess = (result: ClientSessionData) => {
    if (result.id) {
      // Registro via e-mail/senha — faz login agora
      login(result);
      setUserName(result.name);
    } else {
      // Google já fez login; lemos o nome do contexto
      setUserName(client?.name ?? '');
    }
    setStep('success');
  };

  const handleProfessionalSuccess = (name: string) => {
    setUserName(name);
    setStep('success');
  };

  return (
    <div className="py-4">
      {step === 'role' && (
        <RoleSelector onSelect={handleRoleSelect} />
      )}

      {step === 'client-form' && (
        <ClientRegisterForm onBack={handleBack} onSuccess={handleClientSuccess} />
      )}

      {step === 'professional-form' && (
        <ProfessionalRegisterForm onBack={handleBack} onSuccess={handleProfessionalSuccess} />
      )}

      {step === 'success' && role && (
        <RegisterSuccess role={role} name={userName} />
      )}
    </div>
  );
}
