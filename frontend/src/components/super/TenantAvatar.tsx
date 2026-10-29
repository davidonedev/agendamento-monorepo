/**
 * Avatar do tenant reutilizável para todas as views do super admin.
 * Prioriza sempre a logoUrl do tenant; cai para iniciais com a cor do tenant como fundo.
 */
import { hexToHslVars } from '@/lib/utils';

interface TenantAvatarProps {
  name: string;
  logoUrl?: string | null;
  primaryColor: string;
  /** 'sm' = 32px  |  'md' = 40px  |  'lg' = 48px  |  'xl' = 56px */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASS = {
  sm: 'h-8 w-8 text-xs rounded-lg',
  md: 'h-10 w-10 text-sm rounded-lg',
  lg: 'h-12 w-12 text-base rounded-xl',
  xl: 'h-14 w-14 text-lg rounded-xl',
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function TenantAvatar({ name, logoUrl, primaryColor, size = 'md', className = '' }: TenantAvatarProps) {
  const sizeClass = SIZE_CLASS[size];
  const initials  = name
    .split(' ')
    .map((w: string) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={`${sizeClass} ${className} object-cover shrink-0 border`}
      />
    );
  }

  // Texto escuro em cores claras (ex.: amarelo) para manter o contraste
  const isLight = HEX.test(primaryColor) && hexToHslVars(primaryColor).isLight;

  return (
    <div
      aria-hidden="true"
      className={`${sizeClass} ${className} flex items-center justify-center font-bold shrink-0 ${isLight ? 'text-slate-900' : 'text-white'}`}
      style={{ backgroundColor: primaryColor }}
    >
      {initials}
    </div>
  );
}
