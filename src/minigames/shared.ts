// Cose in comune ai minigiochi.

export interface GameProps {
  /** 0 = in attesa di "Inizia". Ogni partita nuova ha un numero diverso. */
  run: number;
  pal: { a: string; b: string };
  setMsg: (m: string) => void;
  setScore: (t: string) => void;
  finish: (score: number) => void;
}

export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

let audio: AudioContext | null = null;
/** Un piccolo suono sintetizzato. Su iPhone parte solo dopo il primo tocco. */
export function tone(freq: number, dur = .3, type: OscillatorType = 'triangle') {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio ??= new AC();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(.16, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + dur);
    o.connect(g).connect(audio.destination);
    o.start(); o.stop(audio.currentTime + dur + .01);
  } catch { /* audio non disponibile */ }
}
