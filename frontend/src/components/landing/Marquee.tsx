interface MarqueeProps {
  children: React.ReactNode;
  reverse?: boolean;
  className?: string;
}

/** Faixa em loop infinito. O conteúdo é duplicado para emendar sem salto; pausa no hover. */
export default function Marquee({ children, reverse, className = '' }: MarqueeProps) {
  return (
    <div className={`group flex overflow-hidden mask-fade-x ${className}`}>
      <div className={`flex w-max shrink-0 group-hover:[animation-play-state:paused] ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}>
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
