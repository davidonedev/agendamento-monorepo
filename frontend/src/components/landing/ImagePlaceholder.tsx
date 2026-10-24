import { ImageIcon } from 'lucide-react';

interface ImagePlaceholderProps {
  /** O que a foto real deve mostrar. Vira o alt text quando a imagem for colocada. */
  hint: string;
  className?: string;
}

/**
 * PLACEHOLDER de imagem: troque por <img src="..." alt={hint} loading="lazy" />
 * com uma foto real e diversa do segmento.
 */
export default function ImagePlaceholder({ hint, className = '' }: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`Espaço para imagem: ${hint}`}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-landing-ink/20 bg-landing-bg p-4 text-center ${className}`}
    >
      <ImageIcon className="h-5 w-5 text-landing-muted" aria-hidden="true" />
      <span className="text-[11px] leading-snug text-landing-muted">[IMAGEM: {hint}]</span>
    </div>
  );
}
