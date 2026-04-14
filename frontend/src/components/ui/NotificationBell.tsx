import { useState, useEffect, useRef } from 'react';
import { Bell, CalendarPlus, XCircle, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AppNotification } from '@/hooks/useAppointmentNotifications';

// ─── Toast individual ─────────────────────────────────────────────────────────
function Toast({ notif, onDismiss }: { notif: AppNotification; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const isNew = notif.type === 'new_booking';

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl w-full pointer-events-auto
        animate-in slide-in-from-bottom-4 fade-in duration-300
        ${isNew
          ? 'bg-green-50  border-green-200  dark:bg-green-900/40 dark:border-green-700'
          : 'bg-red-50   border-red-200   dark:bg-red-900/40  dark:border-red-700'}`}
    >
      <div className={`mt-0.5 shrink-0 ${isNew ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
        {isNew ? <CalendarPlus className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isNew ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
          {isNew ? 'Novo agendamento!' : 'Agendamento cancelado'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {notif.clientName} · {notif.serviceName}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(parseISO(notif.date), "d 'de' MMM", { locale: ptBR })} às {notif.time}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  notifications: AppNotification[];
  unreadCount:   number;
  markAllRead:   () => void;
  activeToasts:  AppNotification[];
  dismissToast:  (id: string) => void;
  clearAll:      () => void;
}

// ─── Bell + dropdown ──────────────────────────────────────────────────────────
export function NotificationBell({ notifications, unreadCount, markAllRead, activeToasts, dismissToast, clearAll }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleToggle = () => {
    setOpen(o => !o);
    if (!open) markAllRead();
  };

  return (
    <>
      {/* ── Botão ── */}
      <div className="relative" ref={ref}>
        <Button variant="ghost" size="icon" onClick={handleToggle} title="Notificações">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none select-none animate-in zoom-in duration-200">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* ── Dropdown ── */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-1rem))] bg-card border rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-semibold">Notificações</p>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={clearAll}
                    title="Limpar todas"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Lista */}
            <div className="max-h-[400px] overflow-y-auto divide-y">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map(n => {
                  const isNew = n.type === 'new_booking';
                  const ago   = formatDistanceToNow(n.timestamp, { locale: ptBR, addSuffix: true });

                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30
                        ${!n.read ? 'bg-primary/5' : ''}`}
                    >
                      {/* Ícone */}
                      <div className={`mt-0.5 shrink-0 p-1.5 rounded-lg
                        ${isNew ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                                : 'bg-red-100  text-red-500  dark:bg-red-900/40  dark:text-red-400'}`}>
                        {isNew ? <CalendarPlus className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {isNew ? 'Novo agendamento' : 'Cancelamento'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {n.clientName} · {n.serviceName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(n.date), "d 'de' MMM", { locale: ptBR })} às {n.time}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{ago}</p>
                      </div>

                      {/* Indicador de não-lido */}
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Toasts (canto inferior direito) ── */}
      <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-80 z-[9999] flex flex-col gap-2 pointer-events-none">
        {activeToasts.map(t => (
          <Toast key={t.id} notif={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>
  );
}
