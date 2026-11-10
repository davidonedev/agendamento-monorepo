import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Button>

      <h1 className="text-2xl font-bold">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground">Última atualização: novembro de 2026</p>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">1. Dados coletados</h2>
        <p>Coletamos nome, e-mail, telefone e informações de uso necessários para fornecer o serviço de agendamento. Dados de pagamento são processados por terceiros e não são armazenados por nós.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">2. Finalidade do tratamento</h2>
        <p>Os dados são usados exclusivamente para: (a) identificação e autenticação do usuário; (b) envio de confirmações e notificações de agendamento via WhatsApp e e-mail; (c) suporte ao cliente.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">3. Compartilhamento de dados</h2>
        <p>Não vendemos nem cedemos seus dados a terceiros para fins publicitários. Dados podem ser compartilhados com prestadores de serviço técnico (hospedagem, e-mail transacional) sob acordos de confidencialidade.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">4. Segurança</h2>
        <p>Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração ou exclusão indevida, incluindo criptografia em trânsito (HTTPS) e controle de acesso.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">5. Seus direitos (LGPD — Lei 13.709/2018)</h2>
        <p>Você tem direito a: confirmar a existência de tratamento; acessar seus dados; corrigir dados incompletos ou inexatos; solicitar anonimização ou exclusão; revogar consentimento. Para exercer esses direitos, envie e-mail para <a href="mailto:privacidade@agendepro.com" className="underline">privacidade@agendepro.com</a>.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">6. Retenção de dados</h2>
        <p>Os dados são mantidos enquanto a conta estiver ativa. Após o encerramento, serão eliminados em até 90 dias, salvo obrigação legal.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">7. Cookies</h2>
        <p>Utilizamos apenas cookies de sessão estritamente necessários para autenticação. Não utilizamos cookies de rastreamento ou publicidade.</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">8. Contato com o Encarregado (DPO)</h2>
        <p>Questões sobre privacidade: <a href="mailto:privacidade@agendepro.com" className="underline">privacidade@agendepro.com</a>.</p>
      </section>
    </div>
  );
}
