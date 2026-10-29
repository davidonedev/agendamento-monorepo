import { useState } from 'react';
import ProfessionalRegisterForm from '@/components/register/ProfessionalRegisterForm';
import RegisterSuccess from '@/components/register/RegisterSuccess';
import { useNavigate } from 'react-router-dom';
import { usePublicTenant } from '@/context/PublicTenantContext';

type Step = 'form' | 'success';

export default function ProfessionalRegisterPage() {
  const { data: { tenant } } = usePublicTenant();
  const navigate             = useNavigate();

  const [step, setStep]         = useState<Step>('form');
  const [userName, setUserName] = useState('');

  const handleBack = () => navigate(`/${tenant.slug}`);

  const handleSuccess = (name: string) => {
    setUserName(name);
    setStep('success');
  };

  return (
    <div className="py-4">
      {step === 'form' && (
        <ProfessionalRegisterForm onBack={handleBack} onSuccess={handleSuccess} />
      )}
      {step === 'success' && (
        <RegisterSuccess role="professional" name={userName} />
      )}
    </div>
  );
}
