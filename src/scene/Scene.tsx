import { useEffect, useRef } from 'react';
import { on } from '../game/bus';
import { getState } from '../store/game';
import { createRenderer } from './draw';

/** La cameretta animata. Si ridisegna da sola a ogni fotogramma leggendo lo stato del gioco. */
export function Scene({ onTap }: { onTap: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const r = createRenderer(canvas, getState);
    let raf = 0;
    const loop = (now: number) => { r.frame(now); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    const offBurst = on('burst', ({ type, n }) => r.burst(type, n));
    const offBounce = on('bounce', () => r.bounce());
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', r.readTokens);
    const mo = new MutationObserver(r.readTokens);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelAnimationFrame(raf); offBurst(); offBounce();
      mq.removeEventListener('change', r.readTokens); mo.disconnect();
    };
  }, []);

  return <canvas ref={ref} id="scene" onClick={onTap} aria-label="Il tuo blob nella sua cameretta. Tocca per salutarlo." />;
}
