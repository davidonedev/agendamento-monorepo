import {
  CalendarCheck, BellRing, Users, BarChart3, Contact, Layers,
  Scissors, Palette, Flower2, User,
  type LucideIcon,
} from 'lucide-react';

/*
 * Itens marcados com `confirm` (e com o comentário [CONFIRMAR FUNCIONALIDADE])
 * citam recursos que ainda NÃO existem no backend. Revise antes de publicar:
 * implemente o recurso ou ajuste o texto.
 */

// ─── Navegação ────────────────────────────────────────────────────────────────
export interface NavItem {
  label: string;
  /** Link direto. Sem `href`, o item abre um dropdown com `children`. */
  href?: string;
  children?: { href: string; label: string; hint?: string }[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Para quem é',
    children: [
      { href: '#seg-barbearia', label: 'Barbearias',      hint: 'Agenda por barbeiro e link na bio' },
      { href: '#seg-salao',     label: 'Salões de cabelo', hint: 'Cada serviço com a duração real' },
      { href: '#seg-estetica',  label: 'Estética',        hint: 'Histórico e retorno de clientes' },
      { href: '#seg-lash',      label: 'Lash design',     hint: 'Cada técnica com a duração certa' },
      { href: '#seg-manicure',  label: 'Manicure',        hint: 'Manicure, pedicure e gel na agenda' },
    ],
  },
  {
    label: 'Recursos',
    children: [
      { href: '#agendamento',   label: 'Como o cliente agenda', hint: 'Veja o fluxo funcionando' },
      { href: '#recursos',      label: 'Tudo o que o sistema faz', hint: 'Agenda, equipe, caixa e clientes' },
      { href: '#como-funciona', label: 'Como começar',    hint: 'Três passos até o primeiro cliente' },
    ],
  },
  { label: 'Planos', href: '#planos' },
  { label: 'Dúvidas', href: '#duvidas' },
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
    tone: { text: 'text-lp-primary', soft: 'bg-lp-primary-soft', border: 'border-lp-primary/30', dot: 'bg-lp-primary' },
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
    tone: { text: 'text-lp-success-ink', soft: 'bg-lp-success-soft', border: 'border-lp-success/40', dot: 'bg-lp-success' },
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
    tone: { text: 'text-lp-black', soft: 'bg-lp-alt', border: 'border-lp-line', dot: 'bg-lp-black' },
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
    tone: { text: 'text-lp-primary', soft: 'bg-lp-primary-soft', border: 'border-lp-primary/30', dot: 'bg-lp-primary' },
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
    q: 'O que é o Nimbo?',
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
    a: 'Não. O Nimbo cobra uma assinatura mensal fixa. Você recebe quantos agendamentos quiser sem pagar por cada um.',
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

// ─── Blocos por segmento (3 bullets + link) ───────────────────────────────────
export const SEGMENT_BULLETS: Record<SegmentId, string[]> = {
  barbearia: ['Link de agendamento na bio do Instagram', 'Agenda separada por barbeiro', 'Lista de quem passou do prazo de voltar'],
  salao:     ['Duração real de cada serviço', 'Sem conflito de horário na agenda', 'Confirmação automática no WhatsApp'],
  estetica:  ['Histórico completo de cada cliente', 'Agenda por profissional', 'Retornos organizados no mesmo painel'],
  autonomo:  ['Link próprio para colocar no WhatsApp', 'Agenda pessoal no celular', 'Histórico de clientes sem planilha'],
};

// ─── Abas de recursos (índice de FEATURES → rótulo curto) ─────────────────────
export const FEATURE_TAB_LABELS = ['Agendamento 24h', 'Confirmação', 'Equipe', 'Faturamento', 'Serviços', 'Clientes'];

// ─── Faixa de números: só fatos do produto, sem métricas inventadas ───────────
export const STATS = [
  { value: '24h',  label: 'de agendamento online, mesmo com o negócio fechado' },
  { value: '3',    label: 'passos entre criar a conta e receber o primeiro cliente' },
  { value: 'R$ 0', label: 'de cobrança por agendamento: só a mensalidade fixa' },
  { value: `R$ ${PLANS[0].monthly}`, label: 'por mês no plano inicial, com Trial grátis antes' },
];
