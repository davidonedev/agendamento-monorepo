import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Button>

      <h1 className="text-2xl font-bold">Termos de Uso</h1>
      <p className="text-sm text-muted-foreground">Última atualização: novembro de 2026</p>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">1. Aceitação dos termos</h2>
        <p>Ao criar uma conta ou usar o AgendePro, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">2. Descrição do serviço</h2>
        <p>O AgendePro é uma plataforma de agendamento online para profissionais de beleza, estética e saúde. Oferecemos ferramentas para gerenciar horários, clientes e serviços.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">3. Cadastro e conta</h2>
        <p>Você é responsável pela veracidade das informações fornecidas e pela segurança de sua senha. Informe imediatamente qualquer uso não autorizado da sua conta.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">4. Uso aceitável</h2>
        <p>É vedado usar a plataforma para fins ilegais, enviar spam, tentar acessar sistemas sem autorização ou prejudicar outros usuários.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">5. Pagamentos e cancelamentos</h2>
        <p>Os planos pagos são cobrados mensalmente ou anualmente conforme o plano escolhido. Cancelamentos não geram reembolso proporcional para o período vigente.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">6. Limitação de responsabilidade</h2>
        <p>O AgendePro não se responsabiliza por danos indiretos decorrentes do uso ou da impossibilidade de uso da plataforma.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">7. Alterações</h2>
        <p>Podemos atualizar estes termos a qualquer momento. Notificaremos usuários sobre mudanças relevantes por e-mail.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">8. Contato</h2>
        <p>Dúvidas sobre os termos? Fale conosco pelo e-mail <a href="mailto:suporte@agendepro.com" className="underline">suporte@agendepro.com</a>.</p>
      </section>
    </div>
  );
}
