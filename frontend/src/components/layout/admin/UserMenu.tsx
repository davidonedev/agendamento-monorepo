import { Clock, Palette, UserCircle, CircleHelp, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  name: string;
  email?: string;
  photoUrl?: string;
  accentColor: string;
  onLogout: () => void;
}

const initialsOf = (name: string) => name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();

/**
 * Avatar do usuário com menu suspenso. O Radix já cuida de fechar ao clicar fora e com Esc, e da
 * navegação por teclado (setas, Home/End, Enter). Foto se houver; senão, as iniciais.
 * TODO: "Meu horário", "Aparência", "Minha Conta" e "Ajuda" ainda não têm rota nem ação.
 */
export function UserMenu({ name, email, photoUrl, accentColor, onLogout }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu do usuário"
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar className="h-8 w-8">
          {photoUrl && <AvatarImage src={photoUrl} alt="" />}
          <AvatarFallback className="text-xs text-white" style={{ backgroundColor: accentColor }}>{initialsOf(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{name}</p>
          {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2"><Clock className="h-4 w-4 text-muted-foreground" aria-hidden />Meu horário</DropdownMenuItem>
        <DropdownMenuItem className="gap-2"><Palette className="h-4 w-4 text-muted-foreground" aria-hidden />Aparência</DropdownMenuItem>
        <DropdownMenuItem className="gap-2"><UserCircle className="h-4 w-4 text-muted-foreground" aria-hidden />Minha Conta</DropdownMenuItem>
        <DropdownMenuItem className="gap-2"><CircleHelp className="h-4 w-4 text-muted-foreground" aria-hidden />Ajuda</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} className="gap-2 text-red-600 focus:bg-red-500/10 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"><LogOut className="h-4 w-4" aria-hidden />Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
