import { useEffect, useRef, useState } from 'react';
import { tone, wait, type GameProps } from './shared';

const PADS = [
  { label: 'Rosa', note: 523.25, d: 'M16 28S3 20 3 11.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 13 3.5C29 20 16 28 16 28z' },
  { label: 'Menta', note: 659.25, d: 'M16 3c2 7 6 11 13 13-7 2-11 6-13 13-2-7-6-11-13-13 7-2 11-6 13-13z' },
  { label: 'Giallo', note: 783.99, d: 'M16 4a12 12 0 1 1 0 24 12 12 0 0 1 0-24z' },
  { label: 'Lilla', note: 987.77, d: 'M20 4a12 12 0 1 0 8 19A11 11 0 0 1 20 4z' }
];

/** Memory: ripeti la sequenza di colori, che si allunga di uno a ogni round. */
export function Memory({ run, setMsg, setScore, finish }: GameProps) {
  const [lit, setLit] = useState<number | null>(null);
  const [locked, setLocked] = useState(true);
  const g = useRef({ seq: [] as number[], pos: 0, alive: false });

  const flash = async (i: number, ms: number) => { setLit(i); tone(PADS[i].note); await wait(ms); setLit(l => (l === i ? null : l)); };

  const nextRound = async (alive: () => boolean) => {
    const st = g.current;
    st.seq.push(Math.floor(Math.random() * 4)); st.pos = 0;
    setScore(`Round ${st.seq.length}`); setMsg('Guarda bene…'); setLocked(true);
    await wait(500);
    const speed = Math.max(260, 460 - st.seq.length * 18);
    for (const i of st.seq) { if (!alive()) return; await flash(i, speed); await wait(130); }
    if (!alive()) return;
    setMsg('Tocca a te!'); setLocked(false);
  };

  useEffect(() => {
    if (!run) return;
    let alive = true;
    g.current = { seq: [], pos: 0, alive: true };
    void nextRound(() => alive);
    return () => { alive = false; g.current.alive = false; };
  }, [run]);

  const press = async (i: number) => {
    const st = g.current;
    if (locked || !st.alive) return;
    void flash(i, 200);
    if (i !== st.seq[st.pos]) { setLocked(true); tone(180, .4, 'sawtooth'); st.alive = false; finish(st.seq.length - 1); return; }
    st.pos++;
    if (st.pos === st.seq.length) {
      setLocked(true); setMsg('Perfetto!');
      await wait(650);
      if (st.alive && g.current === st) void nextRound(() => st.alive && g.current === st);
    }
  };

  return (
    <div className="pads">
      {PADS.map((p, i) => (
        <button key={i} className={`pad p${i}` + (lit === i ? ' lit' : '')} type="button" aria-label={p.label} disabled={locked} onClick={() => press(i)}>
          <svg viewBox="0 0 32 32"><path d={p.d} /></svg>
        </button>
      ))}
    </div>
  );
}
