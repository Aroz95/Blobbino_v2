import { useEffect, useRef } from 'react';
import { FOODS, TASTY } from '../game/content';
import { pick } from '../game/util';
import { EMOJI_FONT } from '../scene/draw';
import { tone, type GameProps } from './shared';

interface Item { kind: 'food' | 'star' | 'poop'; e: string; x: number; y: number; v: number; done?: boolean; hit?: boolean }

/** Acchiappa la pappa: muovi il blob col dito, prendi il cibo, evita la cacca. 3 vite, massimo 60 secondi. */
export function Catch({ run, pal, setMsg, setScore, finish }: GameProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const target = useRef(.5);

  // input: dito, mouse e frecce
  useEffect(() => {
    const c = ref.current!;
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      target.current = Math.max(.08, Math.min(.92, (e.clientX - r.left) / r.width));
    };
    const down = (e: PointerEvent) => { move(e); c.setPointerCapture?.(e.pointerId); };
    const drag = (e: PointerEvent) => { if (e.pointerType === 'mouse' || e.buttons) move(e); };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') target.current = Math.max(.08, target.current - .12);
      if (e.key === 'ArrowRight') target.current = Math.min(.92, target.current + .12);
    };
    c.addEventListener('pointerdown', down); c.addEventListener('pointermove', drag);
    document.addEventListener('keydown', key);
    return () => { c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', drag); document.removeEventListener('keydown', key); };
  }, []);

  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!;
    const floor = getComputedStyle(document.documentElement).getPropertyValue('--floor').trim();
    let px = target.current, items: Item[] = [], score = 0, lives = 3, t = 0, spawn = 0, raf = 0, last = performance.now();
    const hud = () => setScore(`${score} punti · ${'♥'.repeat(Math.max(0, lives))}${'♡'.repeat(3 - Math.max(0, lives))}`);

    const draw = () => {
      const dpr = Math.min(2, devicePixelRatio || 1), W = c.clientWidth, H = c.clientHeight;
      if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = floor; ctx.fillRect(0, H * .93, W, H * .07);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${Math.round(W * .1)}px ${EMOJI_FONT}`;
      for (const it of items) if (!it.hit) ctx.fillText(it.e, it.x * W, it.y * H);
      const R = W * .11, x = px * W, y = H * .87;
      ctx.fillStyle = pal.b; ctx.beginPath(); ctx.ellipse(x, y, R, R * .78, 0, 0, 7); ctx.fill();
      ctx.fillStyle = pal.a; ctx.beginPath(); ctx.ellipse(x - R * .3, y - R * .35, R * .25, R * .14, -.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#3b2842';
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * R * .32, y - R * .05, R * .09, R * .13, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#ff6f9a'; ctx.beginPath(); ctx.ellipse(x, y + R * .28, R * .14, R * .12, 0, 0, 7); ctx.fill();
    };

    if (!run) { draw(); return; }

    setMsg('Trascina il dito per muoverti.'); hud();
    let over = false;
    const step = (dt: number) => {
      t += dt; spawn -= dt;
      px += (target.current - px) * Math.min(1, dt * 14);
      if (spawn <= 0) {
        spawn = Math.max(.42, 1.05 - t * .012);
        const r = Math.random(), kind: Item['kind'] = r < .14 ? 'poop' : r < .23 ? 'star' : 'food';
        items.push({ kind, x: .08 + Math.random() * .84, y: -.05, v: .26 + Math.min(.34, t * .006) + Math.random() * .06,
          e: kind === 'poop' ? '💩' : kind === 'star' ? '⭐' : FOODS[pick(TASTY)].e });
      }
      for (const it of items) {
        it.y += it.v * dt;
        if (!it.done && it.y > .8 && it.y < .92 && Math.abs(it.x - px) < .12) {
          it.done = true; it.hit = true;
          if (it.kind === 'poop') { lives--; tone(160, .35, 'sawtooth'); setMsg('Puah!'); }
          else { score += it.kind === 'star' ? 3 : 1; tone(it.kind === 'star' ? 1046 : 784, .12); }
          hud();
        }
        if (!it.done && it.y > 1.02) {
          it.done = true;
          if (it.kind === 'food') { lives--; tone(220, .2); setMsg('Ops, è caduto!'); hud(); }
        }
      }
      items = items.filter(it => !it.done || (!it.hit && it.y < 1.1));
      if (lives <= 0 || t > 60) { over = true; finish(score); }
    };
    const loop = (now: number) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      step(dt); draw();
      if (!over) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { over = true; cancelAnimationFrame(raf); };
  }, [run]);

  return <canvas ref={ref} className="gcanvas" aria-label="Campo di gioco: trascina il dito per muovere il blob" />;
}
