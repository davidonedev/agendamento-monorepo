interface SectionHeadingProps {
  badge: string;
  title: React.ReactNode;
  description?: string;
}

/** Cabeçalho padrão das seções da landing: selo, título e subtítulo centralizados. */
export default function SectionHeading({ badge, title, description }: SectionHeadingProps) {
  return (
    <div className="reveal mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-landing-line bg-landing-surface px-3.5 py-1 text-xs font-medium text-landing-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-landing-petrol" />
        {badge}
      </span>
      <h2 className="mt-5 font-display text-3xl font-bold leading-[1.1] tracking-tight text-landing-ink sm:text-[2.75rem]">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-landing-muted">
          {description}
        </p>
      )}
    </div>
  );
}
