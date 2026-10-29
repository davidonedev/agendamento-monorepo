import {
  CalendarCheck, BellRing, Users, BarChart3, Contact, Layers,
  CalendarPlus, LayoutDashboard, Repeat, Scissors, Palette, Flower2,
  type LucideIcon,
} from 'lucide-react';

/*
 * Itens marcados com `confirm` (e com o comentário [CONFIRMAR FUNCIONALIDADE])
 * citam recursos que ainda NÃO existem no backend. Revise antes de publicar:
 * implemente o recurso ou ajuste o texto.
 */

// ─── Navegação ────────────────────────────────────────────────────────────────
export const NAV_LINKS = [
  { href: '#para-quem',     label: 'Para quem é' },
  { href: '#recursos',      label: 'Recursos' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#depoimentos',   label: 'Depoimentos' },
  { href: '#planos',        label: 'Planos' },
  { href: '#duvidas',       label: 'Dúvidas' },
];

// ─── Segmentos ────────────────────────────────────────────────────────────────
export type SegmentId = 'barbearia' | 'salao' | 'estetica';

/** Agendamento do mockup: `start` e `span` em horas a partir das 09:00 (aceita frações). */
export interface MockSlot {
  col: number;
  start: number;
  span: number;
  client: string;
  service: string;
}

export interface Segment {
  id: SegmentId;
  label: string;
  icon: LucideIcon;
  /** Classes do tom do segmento (texto, fundo suave, borda). */
  tone: { text: string; soft: string; border: string; dot: string };
  heroLine: string;
  mockup: {
    business: string;
    pros: string[];
    slots: MockSlot[];
    newBooking: { client: string; service: string; when: string };
  };
}

export const SEGMENTS: Segment[] = [
  {
    id: 'barbearia',
    label: 'Barbearia',
    icon: Scissors,
    tone: { text: 'text-landing-petrol', soft: 'bg-landing-petrol/10', border: 'border-landing-petrol/30', dot: 'bg-landing-petrol' },
    heroLine: 'Corte e barba a cada 15 dias: o cliente remarca pelo link, escolhe o profissional e cada um vê a própria cadeira.',
    mockup: {
      business: 'Barbearia do Centro',
      pros: ['Carlos', 'Diego', 'Rafa'],
      slots: [
        { col: 0, start: 0,    span: 0.75, client: 'João P.',    service: 'Corte' },
        { col: 0, start: 1,    span: 1,    client: 'Pedro L.',   service: 'Corte + barba' },
        { col: 0, start: 3,    span: 0.75, client: 'André F.',   service: 'Corte infantil' },
        { col: 1, start: 0.5,  span: 0.5,  client: 'Mateus R.',  service: 'Barba completa' },
        { col: 1, start: 2,    span: 1.5,  client: 'Caio F.',    service: 'Platinado' },
        { col: 2, start: 0,    span: 1,    client: 'Vitor A.',   service: 'Corte + barba' },
        { col: 2, start: 2.5,  span: 0.5,  client: 'Luan M.',    service: 'Sobrancelha' },
      ],
      newBooking: { client: 'Lucas M.', service: 'Corte + barba', when: 'Amanhã às 15:30 com Diego' },
    },
  },
  {
    id: 'salao',
    label: 'Salão',
    icon: Palette,
    tone: { text: 'text-landing-plum', soft: 'bg-landing-lavender/25', border: 'border-landing-lavender/60', dot: 'bg-landing-plum' },
    heroLine: 'Coloração de 3 horas e escova de 40 minutos na mesma agenda: cada serviço ocupa o tempo certo, sem encaixe no improviso.',
    mockup: {
      business: 'Studio Aurora',
      pros: ['Juliana', 'Bia', 'Renata'],
      slots: [
        { col: 0, start: 0,    span: 3,    client: 'Marina C.',  service: 'Coloração + corte' },
        { col: 1, start: 0,    span: 0.75, client: 'Paula S.',   service: 'Escova' },
        { col: 1, start: 1,    span: 0.75, client: 'Lia M.',     service: 'Escova' },
        { col: 1, start: 2,    span: 2,    client: 'Gabriel T.', service: 'Progressiva' },
        { col: 2, start: 0.5,  span: 1,    client: 'Helena R.',  service: 'Manicure + pedicure' },
        { col: 2, start: 2.5,  span: 1.5,  client: 'Sofia B.',   service: 'Mechas' },
      ],
      newBooking: { client: 'Ana C.', service: 'Coloração', when: 'Sexta às 09:00 com Juliana' },
    },
  },
  {
    id: 'estetica',
    label: 'Estética',
    icon: Flower2,
    tone: { text: 'text-landing-sage-ink', soft: 'bg-landing-sage-light', border: 'border-landing-sage/40', dot: 'bg-landing-sage' },
    heroLine: 'Limpeza de pele, depilação, sobrancelha e pacotes de sessões organizados por profissional, com o histórico de cada cliente à mão.',
    mockup: {
      business: 'Clínica Lumi',
      pros: ['Carla', 'Priscila', 'Tati'],
      slots: [
        { col: 0, start: 0,    span: 1.5,  client: 'Beatriz N.', service: 'Limpeza de pele' },
        { col: 0, start: 2,    span: 0.5,  client: 'Rui P.',     service: 'Design de sobrancelha' },
        { col: 1, start: 0,    span: 1,    client: 'Camila D.',  service: 'Drenagem (sessão 4/10)' },
        { col: 1, start: 1.5,  span: 1,    client: 'Jorge V.',   service: 'Massagem relaxante' },
        { col: 2, start: 0.5,  span: 0.75, client: 'Larissa F.', service: 'Depilação pernas' },
        { col: 2, start: 2,    span: 1,    client: 'Nina A.',    service: 'Peeling' },
      ],
      newBooking: { client: 'Fernanda L.', service: 'Limpeza de pele', when: 'Amanhã às 14:00 com Carla' },
    },
  },
];

// ─── Faixa de serviços ────────────────────────────────────────────────────────
export const SERVICE_TAGS = [
  'Corte + barba', 'Coloração', 'Limpeza de pele', 'Escova', 'Design de sobrancelha',
  'Corte degradê', 'Manicure', 'Depilação', 'Progressiva', 'Massagem', 'Mechas', 'Drenagem',
];

// ─── Benefícios universais ────────────────────────────────────────────────────
export interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
  confirm?: string;
}

export const BENEFITS: Benefit[] = [
  {
    icon: CalendarPlus,
    title: 'Mais agendamentos',
    description: 'O cliente marca a qualquer hora pelo seu link, inclusive enquanto você está atendendo.',
  },
  {
    icon: BellRing,
    title: 'Menos faltas',
    description: 'Confirmação no WhatsApp ao agendar e lembrete antes do horário mantêm a agenda ocupada.',
    // [CONFIRMAR FUNCIONALIDADE]
    confirm: 'Lembrete automático antes do horário não existe; hoje há confirmação no agendamento e mensagem manual para clientes sumidos.',
  },
  {
    icon: LayoutDashboard,
    title: 'Gestão simples',
    description: 'Agenda, equipe, clientes e faturamento no mesmo painel. Sem planilha e sem caderno.',
  },
  {
    icon: Repeat,
    title: 'Clientes que voltam',
    description: 'Veja quem não aparece há semanas e chame de volta com uma mensagem pronta.',
  },
];

// ─── Recursos ─────────────────────────────────────────────────────────────────
export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  confirm?: string;
}

export const FEATURES: Feature[] = [
  {
    icon: CalendarCheck,
    title: 'Agendamento online 24h',
    description: 'Seu negócio ganha um link próprio. O cliente escolhe serviço, profissional e um horário livre, sem ligação e sem troca de mensagens.',
  },
  {
    icon: BellRing,
    title: 'Confirmação e lembretes',
    description: 'O cliente recebe a confirmação no WhatsApp ao agendar e um lembrete antes do horário. Menos faltas e menos horário vago.',
    // [CONFIRMAR FUNCIONALIDADE]
    confirm: 'Lembrete automático antes do horário.',
  },
  {
    icon: Users,
    title: 'Agenda por profissional',
    description: 'Cada profissional com a própria agenda, os serviços que atende e login próprio. Você acompanha a equipe inteira.',
  },
  {
    icon: BarChart3,
    title: 'Faturamento e comissões',
    description: 'Quanto entrou no dia, na semana e no mês, por serviço e por profissional, com a comissão de cada um calculada.',
    // [CONFIRMAR FUNCIONALIDADE]
    confirm: 'Comissões: hoje existe só o faturamento por profissional.',
  },
  {
    icon: Layers,
    title: 'Serviços, combos e pacotes',
    description: 'Corte de 30 minutos ou coloração de 3 horas: cada serviço com duração e preço próprios. Monte combos e pacotes de sessões.',
    // [CONFIRMAR FUNCIONALIDADE]
    confirm: 'Pacotes de sessões: hoje existem serviços com duração própria e categoria "Combo", sem controle de sessões.',
  },
  {
    icon: Contact,
    title: 'Clientes, histórico e retorno',
    description: 'Cadastro e histórico de visitas de cada cliente, mais a lista de quem sumiu há 30, 60 ou 90 dias, com mensagem pronta para o WhatsApp.',
  },
];

// ─── Para quem é ──────────────────────────────────────────────────────────────
export interface Audience {
  segment: SegmentId;
  title: string;
  pain: string;
  solution: string;
  example: string;
  imageHint: string;
  confirm?: string;
}

export const AUDIENCES: Audience[] = [
  {
    segment: 'barbearia',
    title: 'Barbearias',
    pain: 'O cliente fiel corta a cada 15 dias, mas marca por mensagem, esquece e acaba sumindo.',
    solution: 'Link de agendamento na bio, agenda separada por profissional e a lista de quem passou do prazo de voltar.',
    example: 'No sábado, o cliente escolhe o Diego pelo link, marca corte + barba às 15h30 e recebe a confirmação no WhatsApp.',
    imageHint: 'profissional atendendo cliente na cadeira da barbearia',
  },
  {
    segment: 'salao',
    title: 'Salões de cabelo',
    pain: 'Coloração, mechas e progressiva se misturam com escovas rápidas, e o encaixe vira bagunça.',
    solution: 'Cada serviço com a duração real. A agenda só oferece horários em que o procedimento inteiro cabe.',
    example: 'Na terça, a Juliana faz uma coloração das 9h ao meio-dia enquanto a Bia atende três escovas no mesmo período, sem conflito.',
    imageHint: 'cabeleireira finalizando coloração em cliente no salão',
  },
  {
    segment: 'estetica',
    title: 'Clínicas e studios de estética',
    pain: 'Pacotes de sessões, retornos e procedimentos diferentes por profissional controlados no caderno.',
    solution: 'Pacotes de sessões, histórico de cada cliente e agenda por profissional no mesmo lugar.',
    example: 'A cliente faz a 4ª de 10 sessões de drenagem com a Priscila e já sai com a 5ª marcada.',
    imageHint: 'esteticista em procedimento de limpeza de pele',
    // [CONFIRMAR FUNCIONALIDADE]
    confirm: 'Pacotes de sessões.',
  },
];

// ─── Como funciona ────────────────────────────────────────────────────────────
export const STEPS = [
  {
    title: 'Crie sua conta',
    description: 'Informe os dados do seu negócio e escolha o endereço do seu link. Leva poucos minutos.',
  },
  {
    title: 'Cadastre serviços e equipe',
    description: 'Defina serviços, preços e duração de cada um, os profissionais e os horários de atendimento.',
  },
  {
    title: 'Compartilhe seu link',
    description: 'Coloque o link no Instagram e no WhatsApp. Os agendamentos caem direto na sua agenda.',
  },
];

// ─── Depoimentos ──────────────────────────────────────────────────────────────
// PLACEHOLDER: todos fictícios. Substitua por depoimentos reais (com autorização) antes de publicar.
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  segment: SegmentId;
  placeholder?: boolean;
}

export const TESTIMONIALS: Testimonial[] = [
  { segment: 'barbearia', placeholder: true, quote: 'Parei de perder horário por mensagem esquecida. O cliente agenda sozinho e eu só atendo.', name: 'Rafael S.', role: 'Dono de barbearia' },
  { segment: 'salao',     placeholder: true, quote: 'Coloração e escova finalmente convivem na mesma agenda, sem eu refazer encaixe toda hora.', name: 'Juliana R.', role: 'Dona de salão' },
  { segment: 'estetica',  placeholder: true, quote: 'Abro o histórico da cliente antes da sessão e sei exatamente o que foi feito e quando.', name: 'Patrícia L.', role: 'Esteticista' },
  { segment: 'barbearia', placeholder: true, quote: 'Cada profissional vê a própria agenda e eu acompanho o faturamento de todos no fim do mês.', name: 'Thiago M.', role: 'Gestor de barbearia' },
  { segment: 'salao',     placeholder: true, quote: 'Coloquei o link no Instagram e as clientes começaram a marcar à noite, com o salão fechado.', name: 'Camila T.', role: 'Cabeleireira' },
  { segment: 'estetica',  placeholder: true, quote: 'Depilação, limpeza de pele e massagem, cada uma com seu tempo. Configurei tudo em uma tarde.', name: 'Fernanda A.', role: 'Dona de studio de estética' },
];

// ─── Planos (espelham os padrões de PlanConfig no backend) ────────────────────
export interface Plan {
  name: string;
  monthly: number;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    name: 'Basic',
    monthly: 97,
    description: 'Para quem atende sozinho ou com uma equipe pequena.',
    features: ['Até 2 profissionais', 'Agendamento online', 'Gestão de clientes', 'Portal público personalizado', 'Suporte via e-mail'],
  },
  {
    name: 'Pro',
    monthly: 197,
    description: 'Para negócios em crescimento que querem controle total.',
    features: ['Até 5 profissionais', 'Agendamento online', 'Gestão de clientes', 'Relatórios avançados', 'Portal público personalizado', 'Gestão de produtos', 'Suporte prioritário'],
    highlighted: true,
  },
  {
    name: 'Premium',
    monthly: 397,
    description: 'Para redes e espaços com equipe grande.',
    features: ['Profissionais ilimitados', 'Tudo do Pro', 'Suporte dedicado 24/7', 'Onboarding personalizado'],
  },
];

export const ANNUAL_DISCOUNT = 0.2;

// ─── FAQ ──────────────────────────────────────────────────────────────────────
export const FAQ = [
  {
    q: 'O que é o AgendePro?',
    a: 'Uma plataforma de agendamento e gestão para barbearias, salões de beleza e clínicas ou studios de estética: agenda online, profissionais, serviços, clientes, lembretes, produtos e faturamento em um só lugar.',
  },
  {
    q: 'Serve para o meu tipo de negócio?',
    a: 'Se você atende com hora marcada, serve. Barbearias, salões, studios de unha, sobrancelha e depilação, clínicas de estética e espaços de massagem cadastram os próprios serviços, durações e profissionais.',
  },
  {
    q: 'Consigo cadastrar procedimentos longos, como coloração ou progressiva?',
    a: 'Sim. Cada serviço tem duração e preço próprios. A agenda só oferece ao cliente horários em que o procedimento inteiro cabe, então uma coloração de 3 horas não se choca com a escova seguinte.',
  },
  {
    // [CONFIRMAR FUNCIONALIDADE] pacotes de sessões
    q: 'Dá para trabalhar com pacotes de sessões?',
    a: 'Sim. Você cadastra o pacote, acompanha quantas sessões a cliente já fez e agenda as próximas pelo mesmo painel.',
  },
  {
    q: 'Meus clientes precisam baixar algum aplicativo?',
    a: 'Não. Eles agendam pelo link do seu negócio (ex.: agendepro.com/seu-negocio), direto no navegador do celular ou do computador.',
  },
  {
    q: 'Cada profissional tem o próprio acesso?',
    a: 'Sim. Cada profissional entra com seu login e vê a própria agenda, os serviços que atende e o próprio faturamento. Quem administra vê tudo.',
  },
  {
    q: 'Posso vender produtos pelo sistema?',
    a: 'Pode. Cadastre shampoos, pomadas, esmaltes, dermocosméticos ou o que você revende, organizados por categoria, e acompanhe o estoque.',
  },
  {
    q: 'Posso testar antes de pagar?',
    a: 'Sim. Toda conta nova começa no plano Trial gratuito, sem cartão de crédito. Você escolhe um plano quando quiser, conforme o negócio cresce.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'O acesso é protegido por login e senha, e cada negócio só enxerga os próprios dados.',
  },
];
