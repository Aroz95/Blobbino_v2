// Unico punto in cui il gioco legge e scrive sul dispositivo.
// Nel browser usa localStorage. Se un giorno l'app va su App Store con Capacitor,
// basta sostituire queste due funzioni con @capacitor/preferences:
// iOS può svuotare il localStorage delle app quando lo spazio scarseggia.
import type { GameState } from '../game/types';

/** Stessa chiave della prima versione: chi aveva già un blob lo ritrova. */
const KEY = 'blobbino-v1';

export interface SaveRecord { state: GameState | null; savedAt: number }

export function readSave(): SaveRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SaveRecord) : null;
  } catch {
    return null;
  }
}

export function writeSave(state: GameState | null): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ state, savedAt: Date.now() } satisfies SaveRecord));
  } catch {
    // Spazio pieno o modalità privata: il gioco continua, al prossimo salvataggio riprova.
  }
}

/** Chiede al browser di non cancellare i dati per fare spazio. */
export function askPersistence(): void {
  try { void navigator.storage?.persist?.(); } catch { /* non supportato */ }
}
