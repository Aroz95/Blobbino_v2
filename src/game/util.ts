export const HOUR = 3600e3;
export const MIN = 60e3;

export const clamp = (v: number) => Math.max(0, Math.min(100, v));
export const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

export function fmtDur(ms: number): string {
  const m = Math.max(0, Math.ceil(ms / MIN)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d) return `${d}g ${h}h`;
  if (h) return `${h}h ${mm}m`;
  return `${mm} min`;
}

export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function fmtTime(t: number): string {
  const d = new Date(t), today = d.toDateString() === new Date().toDateString();
  return (today ? '' : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + ' ')
    + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}
