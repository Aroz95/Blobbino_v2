import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { tone, wait, type GameProps } from './shared';

const SLOT_LEFT = [4, 36, 68]; // posizione orizzontale (%) delle tre scatole

/** Nascondino: il blob si nasconde sotto una scatola, le scatole si mescolano, trovalo. */
export function Hide({ run, pal, setMsg, setScore, finish }: GameProps) {
  const [pos, setPos] = useState([0, 1, 2]);        // pos[scatola] = posto occupato
  const [up, setUp] = useState<boolean[]>([false, false, false]);
  const [blobBox, setBlobBox] = useState<number | null>(null);
  const [dur, setDur] = useState(300);
  const [locked, setLocked] = useState(true);
  const g = useRef<{ hid: number; streak: number; pos: number[]; alive: () => boolean }>(
    { hid: 0, streak: 0, pos: [0, 1, 2], alive: () => false }
  );

  const lift = (i: number, v: boolean) => setUp(u => u.map((x, j) => (j === i ? v : x)));

  const round = async () => {
    const st = g.current, alive = st.alive;
    setLocked(true); setUp([false, false, false]); setDur(300);
    st.hid = Math.floor(Math.random() * 3);
    setMsg('Guarda dove si nasconde…');
    setBlobBox(st.hid); lift(st.hid, true);
    await wait(1000); if (!alive()) return;
    lift(st.hid, false); await wait(380); if (!alive()) return;
    setBlobBox(null);
    const swaps = Math.min(14, 3 + st.streak), d = Math.max(170, 430 - st.streak * 35);
    setDur(d); setMsg('Mescolo…');
    for (let k = 0; k < swaps; k++) {
      const a = Math.floor(Math.random() * 3);
      let b = Math.floor(Math.random() * 3); if (b === a) b = (a + 1) % 3;
      const next = st.pos.slice(); [next[a], next[b]] = [next[b], next[a]];
      st.pos = next; setPos(next);
      tone(440 + k * 20, .06, 'sine');
      await wait(d + 40); if (!alive()) return;
    }
    setMsg("Dov'è finito?"); setLocked(false);
  };

  useEffect(() => {
    if (!run) return;
    let on = true;
    g.current = { hid: 0, streak: 0, pos: [0, 1, 2], alive: () => on };
    setPos([0, 1, 2]); setScore('Di fila: 0');
    void round();
    return () => { on = false; };
  }, [run]);

  const tap = async (i: number) => {
    const st = g.current;
    if (locked || !st.alive()) return;
    setLocked(true); lift(i, true);
    if (i === st.hid) {
      setBlobBox(i); st.streak++;
      tone(880, .15); tone(1175, .2);
      setScore(`Di fila: ${st.streak}`); setMsg('Trovato!');
      await wait(900); if (st.alive()) void round();
    } else {
      tone(196, .35, 'sawtooth'); setMsg('Era di qua!');
      await wait(450); if (!st.alive()) return;
      lift(st.hid, true); setBlobBox(st.hid);
      await wait(900); if (!st.alive()) return;
      finish(st.streak);
    }
  };

  return (
    <div className="hide">
      <div className="floor" />
      {blobBox !== null && (
        <div className="hblob" style={{ left: `${SLOT_LEFT[pos[blobBox]] + 4}%` }}>
          <svg viewBox="0 0 100 80" aria-hidden="true">
            <path d="M50 6C78 6 94 30 94 52c0 18-14 24-44 24S6 70 6 52C6 30 22 6 50 6z" fill={pal.b} />
            <ellipse cx="36" cy="44" rx="5" ry="7" fill="#3b2842" /><ellipse cx="64" cy="44" rx="5" ry="7" fill="#3b2842" />
            <path d="M42 58q8 7 16 0" stroke="#3b2842" strokeWidth="4" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      )}
      {[0, 1, 2].map(i => (
        <button key={i} className={'box' + (up[i] ? ' up' : '')} type="button" aria-label={`Scatola ${i + 1}`} disabled={locked}
          style={{ left: `${SLOT_LEFT[pos[i]]}%`, '--d': `${dur}ms` } as CSSProperties} onClick={() => tap(i)} />
      ))}
    </div>
  );
}
