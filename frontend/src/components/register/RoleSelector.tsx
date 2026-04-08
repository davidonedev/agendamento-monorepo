import { CalendarCheck, Scissors } from 'lucide-react';
import { usePublicTenant } from '@/context/PublicTenantContext';

export type RegisterRole = 'client' | 'professional';

interface RoleSelectorProps {
  onSelect: (role: RegisterRole) => void;
}

interface RoleCard {
  role: RegisterRole;
  icon: React.ElementType;
  title: string;
  description: string;
  items: string[];
}

const ROLES: RoleCard[] = [
  {
    role: 'client',
    icon: CalendarCheck,
    title: 'Sou Cliente',
    description: 'Quero agendar serviços e acompanhar meus atendimentos.',
    items: [
      'Agende serviços online',
      'Escolha o profissional e horário',
      'Acompanhe seus agendamentos',
    ],
  },
  {
    role: 'professional',
    icon: Scissors,
    title: 'Sou Profissional',
    description: 'Quero oferecer meus serviços e gerenciar minha agenda.',
    items: [
      'Gerencie sua agenda de atendimentos',
      'Configure seus serviços e horários',
      'Acesse relatórios de faturamento',
    ],
  },
];

export default function RoleSelector({ onSelect }: RoleSelectorProps) {
  const { data: { tenant } } = usePublicTenant();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Criar conta em {tenant.name}</h1>
        <p className="text-muted-foreground">Selecione como você deseja se cadastrar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ROLES.map(({ role, icon: Icon, title, description, items }) => (
          <button
            key={role}
            onClick={() => onSelect(role)}
            className="group text-left p-6 rounded-2xl border-2 bg-card transition-all duration-200
              hover:border-[var(--role-color)] hover:shadow-lg hover:-translate-y-0.5
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ '--role-color': tenant.primaryColor } as React.CSSProperties}
          >
            {/* Icon */}
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
              style={{ backgroundColor: `${tenant.primaryColor}20`, color: tenant.primaryColor }}
            >
              <Icon className="h-6 w-6" />
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold mb-1 group-hover:text-[var(--role-color)] transition-colors">
              {title}
            </h2>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4">{description}</p>

            {/* Features */}
            <ul className="space-y-1.5">
              {items.map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span
                    className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tenant.primaryColor }}
                  />
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: tenant.primaryColor }}
            >
              Cadastrar como {role === 'client' ? 'cliente' : 'profissional'}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
