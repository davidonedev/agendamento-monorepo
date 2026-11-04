import {
  CalendarCheck, BellRing, Users, BarChart3, Contact, Layers,
  CalendarPlus, LayoutDashboard, Repeat, Scissors, Palette, Flower2, User,
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
  { href: '#planos',        label: 'Planos' },
  { href: '#duvidas',       label: 'Dúvidas' },
];

// ─── Segmentos ────────────────────────────────────────────────────────────────
export type SegmentId = 'barbearia' | 'salao' | 'estetica' | 'autonomo';

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
  bookingMockup: {
    city: string;
    status: string;
    categories: string[];
    services: { name: string; duration: string; price: string }[];
    confirmedBooking: string;
  };
}

export const SEGMENTS: Segment[] = [
  {
    id: 'barbearia',
    label: 'Barbearia',
    icon: Scissors,
    tone: { text: 'text-landing-petrol', soft: 'bg-landing-petrol/10', border: 'border-landing-petrol/30', dot: 'bg-landing-petrol' },
    heroLine: 'Coloque o link na bio, cada cliente escolhe o barbeiro e marca o horário. Você abre o painel e já sabe quem chega.',
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
    bookingMockup: {
      city: 'Centro, São Paulo',
      status: 'Abre Seg. 9h',
      categories: ['Todos', 'Corte', 'Barba'],
      services: [
        { name: 'Corte Masculino',  duration: '30 min', price: 'R$ 45,00' },
        { name: 'Corte + Barba',    duration: '45 min', price: 'R$ 65,00' },
        { name: 'Barba Completa',   duration: '30 min', price: 'R$ 35,00' },
        { name: 'Corte Infantil',   duration: '25 min', price: 'R$ 35,00' },
      ],
      confirmedBooking: 'Amanhã, 15:30 · Corte + Barba',
    },
  },
  {
    id: 'salao',
    label: 'Salão de beleza',
    icon: Palette,
    tone: { text: 'text-landing-plum', soft: 'bg-landing-lavender/25', border: 'border-landing-lavender/60', dot: 'bg-landing-plum' },
    heroLine: 'Coloração de 3 horas e escova de 40 minutos convivem na mesma agenda: cada serviço ocupa o tempo certo, sem encaixe na pressa.',
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
    bookingMockup: {
      city: 'Vila Madalena, SP',
      status: 'Abre Seg. 9h',
      categories: ['Todos', 'Cabelo', 'Coloração'],
      services: [
        { name: 'Corte Feminino', duration: '45 min', price: 'R$ 70,00' },
        { name: 'Corte Masculino', duration: '30 min', price: 'R$ 50,00' },
        { name: 'Escova',         duration: '40 min', price: 'R$ 55,00' },
        { name: 'Coloração',      duration: '120 min', price: 'R$ 180,00' },
      ],
      confirmedBooking: 'Sexta, 09:00 · Coloração',
    },
  },
  {
    id: 'estetica',
    label: 'Estética',
    icon: Flower2,
    tone: { text: 'text-landing-sage-ink', soft: 'bg-landing-sage-light', border: 'border-landing-sage/40', dot: 'bg-landing-sage' },
    heroLine: 'Cada procedimento com duração própria, histórico completo da cliente e agenda na palma da mão.',
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
    bookingMockup: {
      city: 'Moema, São Paulo',
      status: 'Abre Seg. 9h',
      categories: ['Todos', 'Pele', 'Corpo'],
      services: [
        { name: 'Limpeza de pele',         duration: '60 min', price: 'R$ 120,00' },
        { name: 'Design de sobrancelha',   duration: '30 min', price: 'R$ 50,00' },
        { name: 'Drenagem linfática',      duration: '50 min', price: 'R$ 90,00' },
        { name: 'Peeling facial',          duration: '45 min', price: 'R$ 85,00' },
      ],
      confirmedBooking: 'Amanhã, 14:00 · Limpeza de pele',
    },
  },
  {
    id: 'autonomo',
    label: 'Autônomos',
    icon: User,
    tone: { text: 'text-amber-600', soft: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
    heroLine: 'Coloque o link no WhatsApp. A cliente marca, escolhe o serviço e recebe a confirmação — sem você parar o que está fazendo.',
    mockup: {
      business: 'Ana Lima',
      pros: ['Ana', 'Rita', 'Ju'],
      slots: [
        { col: 0, start: 0,    span: 0.75, client: 'Bruna S.',    service: 'Manicure' },
        { col: 0, start: 1,    span: 0.83, client: 'Karen T.',    service: 'Pedicure' },
        { col: 0, start: 2,    span: 1.5,  client: 'Patrícia M.', service: 'Gel nas unhas' },
        { col: 1, start: 0.5,  span: 0.5,  client: 'Renata O.',   service: 'Design sobrancelha' },
        { col: 1, start: 1.5,  span: 0.75, client: 'Sônia B.',    service: 'Manicure' },
        { col: 2, start: 0,    span: 1,    client: 'Claudia P.',  service: 'Pedicure' },
        { col: 2, start: 2,    span: 0.5,  client: 'Fabiana R.',  service: 'Manicure' },
      ],
      newBooking: { client: 'Daniela F.', service: 'Manicure', when: 'Amanhã às 10:00' },
    },
    bookingMockup: {
      city: 'Itaim Bibi, SP',
      status: 'Abre Ter. 9h',
      categories: ['Todos', 'Unhas', 'Estética'],
      services: [
        { name: 'Manicure',              duration: '45 min', price: 'R$ 40,00' },
        { name: 'Pedicure',              duration: '50 min', price: 'R$ 50,00' },
        { name: 'Gel nas unhas',         duration: '90 min', price: 'R$ 90,00' },
        { name: 'Design de sobrancelha', duration: '30 min', price: 'R$ 45,00' },
      ],
      confirmedBooking: 'Amanhã, 10:00 · Manicure',
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
    description: 'Seu link funciona enquanto você atende. O cliente escolhe serviço, profissional e horário sem precisar ligar.',
  },
  {
    icon: BellRing,
    title: 'Menos faltas',
    description: 'Confirmação automática pelo WhatsApp no ato do agendamento. Horário confirmado, menos falta de última hora.',
  },
  {
    icon: LayoutDashboard,
    title: 'Gestão simples',
    description: 'Agenda, equipe, clientes e caixa em um único painel. Sem caderno, sem planilha, sem anotação perdida no celular.',
  },
  {
    icon: Repeat,
    title: 'Clientes que voltam',
    description: 'Veja quem não voltou em 30, 60 ou 90 dias e chame de volta com uma mensagem pronta para o WhatsApp.',
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
    description: 'Seu negócio ganha um link com endereço próprio. O cliente abre, escolhe o serviço e marca — sem app, sem senha, sem mensagem.',
  },
  {
    icon: BellRing,
    title: 'Confirmação automática',
    description: 'Confirmação automática no WhatsApp assim que o cliente agenda. Sem ligação para confirmar, sem horário vago por esquecimento.',
  },
  {
    icon: Users,
    title: 'Agenda por profissional',
    description: 'Cada profissional com login próprio, serviços que atende e agenda separada. O dono acompanha a equipe inteira de um lugar só.',
  },
  {
    icon: BarChart3,
    title: 'Faturamento',
    description: 'Receita do dia, da semana e do mês, por serviço e por profissional. Tudo calculado e pronto para conferir.',
  },
  {
    icon: Layers,
    title: 'Serviços e combos',
    description: 'Cadastre cada serviço com duração e preço. Um corte de 30 minutos ou uma progressiva de 2 horas nunca disputam o mesmo horário.',
  },
  {
    icon: Contact,
    title: 'Clientes, histórico e retorno',
    description: 'Ficha completa de cada cliente com histórico de visitas. Saiba quem sumiu e envie uma mensagem de retorno com um clique.',
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
    pain: 'O cliente fiel corta a cada 15 dias, mas marca por mensagem, esquece o horário e desaparece sem avisar.',
    solution: 'Link de agendamento na bio, agenda separada por profissional e lista de quem passou do prazo de voltar.',
    example: 'No sábado, o cliente abre o link, escolhe o Diego, marca corte + barba às 15h30 e recebe a confirmação no WhatsApp — tudo em menos de um minuto.',
    imageHint: 'profissional atendendo cliente na cadeira da barbearia',
  },
  {
    segment: 'salao',
    title: 'Salões de cabelo',
    pain: 'Coloração, mechas e progressiva se misturam com escovas rápidas, e o encaixe manual vira erro de agenda.',
    solution: 'Cada serviço com a duração real. A agenda só oferece horários em que o procedimento inteiro cabe, sem conflito.',
    example: 'Na terça, a Juliana faz uma coloração das 9h ao meio-dia enquanto a Bia atende três escovas no mesmo período — zero conflito de horário.',
    imageHint: 'cabeleireira finalizando coloração em cliente no salão',
  },
  {
    segment: 'estetica',
    title: 'Clínicas e studios de estética',
    pain: 'Procedimentos diferentes por profissional, histórico da cliente e controle de retornos feitos em caderno e mensagem de WhatsApp.',
    solution: 'Histórico completo de cada cliente, agenda por profissional e controle de agendamentos no mesmo painel.',
    example: 'A cliente chega para drenagem com a Priscila, que abre o histórico, confere o que foi feito e já agenda o próximo retorno antes de ela sair.',
    imageHint: 'esteticista em procedimento de limpeza de pele',
  },
  {
    segment: 'autonomo',
    title: 'Profissionais autônomos',
    pain: 'Atender sozinha e ainda administrar WhatsApp, horários e pagamentos vira um segundo trabalho não remunerado.',
    solution: 'Link próprio de agendamento, agenda pessoal e histórico de clientes — tudo no celular, sem planilha paralela.',
    example: 'A Daniela abre o link, escolhe o serviço e agenda direto — Ana recebe a notificação no WhatsApp sem parar o atendimento.',
    imageHint: 'profissional autônoma atendendo cliente em estudio próprio',
  },
];

// ─── Como funciona ────────────────────────────────────────────────────────────
export const STEPS = [
  {
    title: 'Crie sua conta',
    description: 'Informe o nome do negócio e escolha o endereço do seu link de agendamento. Menos de cinco minutos.',
  },
  {
    title: 'Cadastre serviços e equipe',
    description: 'Adicione seus serviços com preço e duração, cadastre os profissionais e configure os horários de atendimento.',
  },
  {
    title: 'Compartilhe seu link',
    description: 'Coloque o link na bio do Instagram, no WhatsApp e no Google. Os agendamentos chegam direto na sua agenda.',
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
  { segment: 'autonomo',  placeholder: true, quote: 'Parei de negociar horário no WhatsApp. O link faz isso por mim enquanto estou atendendo.', name: 'Ana L.', role: 'Manicure autônoma' },
  { segment: 'autonomo',  placeholder: true, quote: 'Hoje minha agenda fica cheia sem eu ficar no celular. Minha cliente já marca a próxima antes de sair.', name: 'Carla M.', role: 'Sobrancelhista' },
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
    a: 'Uma plataforma de agendamento e gestão para barbearias, salões e estética: link próprio para o cliente marcar, agenda por profissional, histórico de clientes e controle financeiro em um só lugar.',
  },
  {
    q: 'Preciso conectar o WhatsApp para começar?',
    a: 'Não. O sistema funciona completamente sem o WhatsApp conectado. A integração fica disponível quando você quiser ativar.',
  },
  {
    q: 'Meu cliente precisa baixar algum aplicativo?',
    a: 'Não. O cliente abre o link do seu negócio direto no navegador do celular, escolhe o serviço e agenda. Nenhum app necessário.',
  },
  {
    q: 'Consigo cadastrar procedimentos longos, como coloração ou progressiva?',
    a: 'Sim. Cada serviço tem duração e preço próprios. A agenda só oferece ao cliente horários em que o procedimento inteiro cabe, então uma coloração de 3 horas não se choca com a escova seguinte.',
  },
  {
    q: 'Tem cobrança por agendamento?',
    a: 'Não. O AgendePro cobra uma assinatura mensal fixa. Você recebe quantos agendamentos quiser sem pagar por cada um.',
  },
  {
    q: 'Cada profissional tem acesso separado?',
    a: 'Sim. Cada profissional entra com login próprio, vê a própria agenda e os serviços que atende. Quem administra acompanha a equipe inteira.',
  },
  {
    q: 'Posso testar antes de pagar?',
    a: 'Sim. Toda conta nova começa no plano Trial gratuito, sem cartão de crédito. Você escolhe um plano quando quiser, conforme o negócio cresce.',
  },
  {
    q: 'Posso vender produtos pelo sistema?',
    a: 'Pode. Cadastre shampoos, pomadas, esmaltes, dermocosméticos ou o que você revende, organizados por categoria, e acompanhe o estoque.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Sim. Cada negócio só acessa seus próprios dados e o sistema é protegido por login e senha em todas as entradas.',
  },
];
