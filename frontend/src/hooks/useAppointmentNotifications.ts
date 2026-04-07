import { useState, useEffect, useRef, useCallback } from 'react';
import type { Appointment, Client, Service } from '@/types';

export interface AppNotification {
  id: string;
  type: 'new_booking' | 'cancelled';
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  timestamp: number;
  read: boolean;
}

function playSound(type: 'new_booking' | 'cancelled') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    if (type === 'new_booking') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.18);
    }
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.55);
  } catch {
    // AudioContext unavailable or blocked
  }
}

async function browserNotify(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico', tag: 'agendepro' });
  }
}

export function useAppointmentNotifications(
  appointments: Appointment[],
  clients: Client[],
  services: Service[],
) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToasts,  setActiveToasts]  = useState<AppNotification[]>([]);
  const prevRef   = useRef<Appointment[] | null>(null);
  const clientsRef  = useRef(clients);
  const servicesRef = useRef(services);
  clientsRef.current  = clients;
  servicesRef.current = services;

  useEffect(() => {
    // Initialise on first render without firing
    if (prevRef.current === null) {
      prevRef.current = appointments;
      return;
    }

    const prev = prevRef.current;
    const toAdd: AppNotification[] = [];

    appointments.forEach(a => {
      const prevAppt = prev.find(p => p.id === a.id);
      const client = clientsRef.current.find(c => c.id === a.clientId);
      const svc    = servicesRef.current.find(s => s.id === a.serviceId);

      const base = {
        id: `n-${Date.now()}-${a.id}-${Math.random()}`,
        clientName:  client?.name ?? '—',
        serviceName: svc?.name    ?? '—',
        date:        a.date,
        time:        a.startTime,
        timestamp:   Date.now(),
        read:        false,
      };

      // New booking (new ID with status pending)
      if (!prevAppt && a.status === 'pending') {
        toAdd.push({ ...base, type: 'new_booking' });
      }

      // Client-initiated cancellation (status flipped to cancelled from something else)
      if (prevAppt && prevAppt.status !== 'cancelled' && a.status === 'cancelled') {
        toAdd.push({ ...base, type: 'cancelled' });
      }
    });

    if (toAdd.length > 0) {
      setNotifications(ns => [...toAdd, ...ns].slice(0, 50));
      setActiveToasts(ts => [...ts, ...toAdd]);
      playSound(toAdd[0].type);
      toAdd.forEach(n => {
        const title = n.type === 'new_booking' ? 'Novo agendamento! 📅' : 'Agendamento cancelado ❌';
        browserNotify(title, `${n.clientName} · ${n.serviceName} às ${n.time}`);
      });
    }

    prevRef.current = appointments;
  }, [appointments]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(() =>
    setNotifications(ns => ns.map(n => ({ ...n, read: true }))), []);

  const dismissToast = useCallback((id: string) =>
    setActiveToasts(ts => ts.filter(t => t.id !== id)), []);

  return { notifications, unreadCount, markAllRead, activeToasts, dismissToast };
}
