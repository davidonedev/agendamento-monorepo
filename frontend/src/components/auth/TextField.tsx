import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/aceternity/input';
import { Label } from '@/components/aceternity/label';
import { cn } from '@/lib/utils';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  /** Mensagem de erro: marca o campo como inválido (aria-invalid) e é lida pelo leitor de tela. */
  error?: string;
  hint?: ReactNode;
  /** Conteúdo à direita do rótulo (ex.: link "Esqueci minha senha"). */
  labelAside?: ReactNode;
  /** Texto fixo dentro do campo, à esquerda (ex.: "agendepro.com/"). */
  prefixText?: string;
  /** Elemento dentro do campo, à direita (ex.: botão de mostrar senha). */
  trailing?: ReactNode;
}

/** Campo de texto: Label + Input (Aceternity) + erro/dica ligados por aria-describedby. */
export function TextField({ id, label, error, hint, labelAside, prefixText, trailing, className, required, ...props }: TextFieldProps) {
  const describedBy = [error && `${id}-error`, hint && !error && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>
          {label}
          {required && <span aria-hidden className="text-lp-danger"> *</span>}
        </Label>
        {labelAside}
      </div>
      <div className="relative">
        {prefixText && (
          <span aria-hidden className="pointer-events-none absolute left-[18px] top-1/2 z-10 -translate-y-1/2 select-none whitespace-nowrap text-sm text-lp-muted">
            {prefixText}
          </span>
        )}
        <Input
          id={id}
          invalid={!!error}
          required={required}
          aria-describedby={describedBy}
          className={cn(prefixText && 'pl-[8.25rem]', trailing && 'pr-12', className)}
          {...props}
        />
        {trailing && <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">{trailing}</div>}
      </div>
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-sm font-medium text-lp-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-lp-muted">{hint}</p>}
    </div>
  );
}

/** Campo de senha com botão mostrar/ocultar (aria-label + aria-pressed). */
export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          className="flex h-8 w-8 items-center justify-center rounded-md text-lp-muted transition-colors hover:text-lp-black"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      }
    />
  );
}
