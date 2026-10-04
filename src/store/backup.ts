// Codice di backup: tutto il blob in una riga di testo da copiare e incollare altrove.
import { migrate } from '../game/state';
import type { GameState } from '../game/types';

const PREFIX = 'BLOB1-';

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(b64: string): string {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeBackup(s: GameState): string {
  return PREFIX + toBase64(JSON.stringify(s));
}

/** Lancia un errore con un messaggio leggibile se il codice non è valido. */
export function decodeBackup(code: string): GameState {
  const clean = code.trim().replace(/\s+/g, '');
  if (!clean.startsWith(PREFIX)) throw new Error('Il codice deve iniziare con BLOB1-. Copialo per intero.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64(clean.slice(PREFIX.length)));
  } catch {
    throw new Error('Il codice è incompleto o modificato. Prova a copiarlo di nuovo.');
  }
  const s = migrate(parsed);
  if (!s) throw new Error('Questo codice non contiene un blob.');
  return s;
}
