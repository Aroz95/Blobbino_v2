// Lo stato del gioco vive qui, fuori da React.
// I componenti lo leggono con useGame() e lo cambiano con update().
// La cameretta (canvas) lo legge direttamente con getState() a ogni fotogramma.
import { useSyncExternalStore } from 'react';
import { tick as gameTick } from '../game/actions';
import { migrate, simulate } from '../game/state';
import type { GameState } from '../game/types';
import { MIN } from '../game/util';
import { readSave, writeSave } from './storage';

let state: GameState | null = null;
const listeners = new Set<() => void>();
let lastSave = 0;

function notify() { listeners.forEach(l => l()); }
function persist() { writeSave(state); lastSave = Date.now(); }

export const getState = () => state;

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useGame(): GameState | null {
  return useSyncExternalStore(subscribe, getState, getState);
}

/**
 * Applica una modifica su una copia dello stato (dopo aver fatto scorrere il tempo),
 * poi salva e avvisa i componenti. Restituisce quello che restituisce `recipe`.
 */
export function update<T>(recipe: (s: GameState) => T): T | undefined {
  if (!state) return undefined;
  const next = structuredClone(state);
  simulate(next, Date.now());
  const out = recipe(next);
  state = next;
  persist();
  notify();
  return out;
}

/** Sostituisce del tutto lo stato: nuovo uovo, ripristino da backup, reset. */
export function replaceState(s: GameState | null) {
  state = s;
  persist();
  notify();
}

/** Carica il salvataggio e fa passare il tempo trascorso ad app chiusa. Restituisce i ms di assenza. */
export function boot(): number {
  const rec = readSave();
  state = rec?.state ? migrate(rec.state) : null;
  if (!state) return 0;
  const away = Date.now() - state.last;
  simulate(state, Date.now());
  return away;
}

/** Orologio del gioco: ogni secondo aggiorna i bisogni, i desideri, i ritorni dalle passeggiate. */
export function startClock(): () => void {
  const step = () => {
    if (!state) return;
    const next = structuredClone(state);
    const ev = simulate(next, Date.now());
    const important = gameTick(next);
    state = next;
    if (ev || important || Date.now() - lastSave > MIN / 2) persist();
    notify();
  };
  const id = window.setInterval(step, 1000);
  const t = window.setTimeout(step, 400);
  const onVis = () => { if (document.hidden) persist(); else step(); };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pagehide', persist);
  return () => {
    clearInterval(id); clearTimeout(t);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('pagehide', persist);
  };
}
