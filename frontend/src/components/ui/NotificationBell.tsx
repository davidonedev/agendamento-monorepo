import { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AppNotification } from '@/hooks/useAppointmentNotifications';

// ─── Single toast card ───────────────────────────────────────────────────────
function Toast({ notif, onDismiss }: { notif: AppNotification; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const isNew = notif.type === 'new_booking';
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl w-full pointer-events-auto
        animate-in slide-in-from-bottom-4 fade-in duration-300
        ${isNew
          ? 'bg-green-50 border-green-200 dark:bg-green-900/40 dark:border-green-700'
          : 'bg-red-50  border-red-200  dark:bg-red-900/40  dark:border-red-700'}`}
    >
      <div className={`mt-0.5 shrink-0 ${isNew ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
        {isNew ? <Calendar className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isNew ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
          {isNew ? 'Novo agendamento!' : 'Agendamento cancelado'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.clientName} · {notif.serviceName}</p>
        <p className="text-xs text-muted-foreground">
          {format(parseISO(notif.date), "d 'de' MMM", { locale: ptBR })} às {notif.time}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Bell + dropdown ─────────────────────────────────────────────────────────
interface Props {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  activeToasts: AppNotification[];
  dismissToast: (id: string) => void;
}

export function NotificationBell({ notifications, unreadCount, markAllRead, activeToasts, dismissToast }: Props) {
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
      {/* ── Bell button ── */}
      <div className="relative" ref={ref}>
        <Button variant="ghost" size="icon" onClick={handleToggle} title="Notificações">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none select-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* ── Dropdown ── */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-1rem))] bg-card border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-semibold">Notificações</p>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map(n => {
                  const isNew = n.type === 'new_booking';
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors ${n.read ? '' : 'bg-primary/5'}`}
                    >
                      <div className={`mt-0.5 shrink-0 ${isNew ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {isNew ? <Calendar className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {isNew ? 'Novo agendamento' : 'Cancelamento'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{n.clientName} · {n.serviceName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(n.date), "d 'de' MMM", { locale: ptBR })} às {n.time}
                        </p>
                      </div>
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

      {/* ── Toast overlay ── */}
      {/* On mobile: stretch edge-to-edge (left-3 right-3). On sm+: fixed width at right */}
      <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-80 z-[9999] flex flex-col gap-2 pointer-events-none">
        {activeToasts.map(t => (
          <Toast key={t.id} notif={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>
  );
}
