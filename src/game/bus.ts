// Canale tra la logica di gioco e l'interfaccia.
// La logica dice "cosa è successo" (un messaggio, dei cuoricini, una figurina nuova);
// l'interfaccia decide come mostrarlo. Così i moduli in src/game non dipendono da React.
import type { Notice } from './types';

export type ParticleType = 'heart' | 'sparkle' | 'drop' | 'crumb';

export interface UiEvents {
  say: { msg: string; ms?: number };
  toast: { msg: string; ms?: number };
  burst: { type: ParticleType; n: number };
  bounce: undefined;
  coins: undefined;
  sticker: undefined;
  notice: Notice;
}

type Handler<K extends keyof UiEvents> = (payload: UiEvents[K]) => void;
const handlers = new Map<keyof UiEvents, Set<(payload: never) => void>>();

export function on<K extends keyof UiEvents>(type: K, fn: Handler<K>): () => void {
  let set = handlers.get(type);
  if (!set) { set = new Set(); handlers.set(type, set); }
  const s = set as Set<Handler<K>>;
  s.add(fn);
  return () => { s.delete(fn); };
}

export function emit<K extends keyof UiEvents>(type: K, payload: UiEvents[K]): void {
  (handlers.get(type) as Set<Handler<K>> | undefined)?.forEach(fn => fn(payload));
}

export const ui = {
  say: (msg: string, ms?: number) => emit('say', { msg, ms }),
  toast: (msg: string, ms?: number) => emit('toast', { msg, ms }),
  burst: (type: ParticleType, n = 8) => emit('burst', { type, n }),
  bounce: () => emit('bounce', undefined),
  notice: (n: Notice) => emit('notice', n)
};
