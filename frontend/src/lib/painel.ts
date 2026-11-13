import { addDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** "2026-11-12" → "12/11/2026" (sem passar por Date/fuso, para não deslocar o dia). */
export function formatDayBR(isoDay: string): string {
  const [y, m, d] = isoDay.split('-');
  return `${d}/${m}/${y}`;
}

/** Dia da semana abreviado e sem ponto: "Seg", "Ter"... */
export function weekdayShort(isoDay: string): string {
  const s = format(parseISO(isoDay), 'EEEE', { locale: ptBR }).slice(0, 3);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function dayNumber(isoDay: string): string {
  return isoDay.split('-')[2];
}

/** Rótulo do próximo agendamento: "Hoje", "Amanhã" ou "qui, 14/11". */
export function relativeDayLabel(isoDay: string, todayIso: string): string {
  if (isoDay === todayIso) return 'Hoje';
  if (isoDay === format(addDays(parseISO(todayIso), 1), 'yyyy-MM-dd')) return 'Amanhã';
  return `${weekdayShort(isoDay).toLowerCase()}, ${isoDay.split('-')[2]}/${isoDay.split('-')[1]}`;
}

/** Variação em relação ao período anterior, em texto. */
export function deltaText(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? 'igual aos 7 dias anteriores' : 'sem cadastros nos 7 dias anteriores';
  const diff = current - previous;
  if (diff === 0) return 'igual aos 7 dias anteriores';
  return `${diff > 0 ? '+' : ''}${diff} em relação aos 7 dias anteriores`;
}
