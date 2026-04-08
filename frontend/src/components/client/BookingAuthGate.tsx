import { useNavigate } from 'react-router-dom';
import { Lock, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicTenant } from '@/context/PublicTenantContext';

/**
 * Exibido no lugar do BookingFlow quando o cliente não está autenticado.
 * Redireciona para o cadastro — o upsert por e-mail serve tanto para
 * novos clientes quanto para clientes retornando após perda de sessão.
 */
export default function BookingAuthGate() {
  const { data: { tenant }, getSlug } = usePublicTenant();
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-12">
      {/* Ícone */}
      <div
        className="h-20 w-20 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: `${tenant.primaryColor}18` }}
      >
        <Lock className="h-9 w-9" style={{ color: tenant.primaryColor }} />
      </div>

      {/* Mensagem */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Cadastro necessário</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Para agendar em <strong>{tenant.name}</strong> você precisa ter uma conta.
          O cadastro é rápido e gratuito.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <Button
          className="w-full gap-2"
          size="lg"
          style={{ backgroundColor: tenant.primaryColor, borderColor: tenant.primaryColor }}
          onClick={() => navigate(`/${getSlug()}/register`)}
        >
          <UserPlus className="h-4 w-4" />
          Criar minha conta
        </Button>

        <button
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center gap-1"
          onClick={() => navigate(`/${getSlug()}/register`)}
        >
          Já tenho cadastro — entrar com meu e-mail
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
