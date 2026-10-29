import { Link } from 'react-router-dom';
import { ArrowLeft, Scissors } from 'lucide-react';

// Mesmo visual da LoginPage — usado nas telas públicas de recuperação de conta.

export const authInputClass =
  'w-full h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 text-sm ' +
  'outline-none transition-all focus:bg-white/[0.08] focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20';

export const authButtonClass =
  'mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-zinc-900 ' +
  'shadow-[0_0_40px_-10px_rgba(139,92,246,0.7)] transition-all hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-50 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black';

export const authLabelClass = 'block text-sm font-medium text-white/70';

export function AuthShell({ title, subtitle, children, wide = false }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07070a] font-landing text-white antialiased">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 40%, transparent 100%)',
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/25 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/30">
            <Scissors className="h-4 w-4 text-white" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">AgendePro</span>
        </Link>
        <Link to="/login" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>
      </header>

      <main className="relative z-10 flex justify-center px-4 pb-16 pt-6 sm:pt-12">
        <div className={`hero-in w-full ${wide ? 'max-w-[520px]' : 'max-w-[420px]'}`}>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
            <div className="mb-7 text-center">
              <h1 className="font-display text-[1.75rem] font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-white/50">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthAlert({ kind, children }: { kind: 'error' | 'success'; children: React.ReactNode }) {
  const cls = kind === 'error'
    ? 'border-red-500/20 bg-red-500/10 text-red-400'
    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}
