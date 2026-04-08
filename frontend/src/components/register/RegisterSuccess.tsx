import { useNavigate } from 'react-router-dom';
import { CheckCircle, CalendarCheck, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicTenant } from '@/context/PublicTenantContext';
import type { RegisterRole } from './RoleSelector';

interface RegisterSuccessProps {
  role: RegisterRole;
  name: string;
}

export default function RegisterSuccess({ role, name }: RegisterSuccessProps) {
  const { data: { tenant }, getSlug } = usePublicTenant();
  const navigate = useNavigate();

  const isClient = role === 'client';

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-8">
      {/* Icon */}
      <div
        className="h-20 w-20 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: `${tenant.primaryColor}20` }}
      >
        <CheckCircle className="h-10 w-10" style={{ color: tenant.primaryColor }} />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Cadastro realizado!</h1>
        <p className="text-muted-foreground">
          Bem-vindo(a), <strong>{name}</strong>!
          {isClient
            ? ' Seu cadastro em ' + tenant.name + ' foi concluído com sucesso.'
            : ' Seu perfil de profissional em ' + tenant.name + ' foi criado. Faça login para acessar sua agenda.'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {isClient ? (
          <>
            <Button
              className="w-full"
              style={{ backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }}
              onClick={() => navigate(`/${getSlug()}/booking`)}
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              Agendar agora
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate(`/${getSlug()}`)}>
              Ver serviços
            </Button>
          </>
        ) : (
          <>
            <Button
              className="w-full"
              style={{ backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }}
              onClick={() => navigate('/login')}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Fazer login
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate(`/${getSlug()}`)}>
              Voltar ao início
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
