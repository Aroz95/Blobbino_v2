// Disegno della cameretta su canvas: stanza, arredi, blob, fumetto del desiderio, particelle.
// Non usa React: Scene.tsx chiama renderer.frame() a ogni fotogramma.
import { FURN, HATS, PAL } from '../game/content';
import type { ParticleType } from '../game/bus';
import { kindOf, mood } from '../game/state';
import type { GameState } from '../game/types';

export const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

interface Particle { type: ParticleType; x: number; y: number; vx: number; vy: number; life: number; age: number; s: number }
type Tokens = Record<'wall' | 'wall-2' | 'floor' | 'rug' | 'panel' | 'ink' | 'line', string>;

export function createRenderer(canvas: HTMLCanvasElement, getState: () => GameState | null) {
  const ctx = canvas.getContext('2d')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, lastT = performance.now(), tapBounce = 0;
  let particles: Particle[] = [];
  let petPos = { x: 0, y: 0, r: 40 };
  const tokens = {} as Tokens;

  function readTokens() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['wall', 'wall-2', 'floor', 'rug', 'panel', 'ink', 'line'] as const) tokens[k] = cs.getPropertyValue('--' + k).trim();
  }
  readTokens();

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = canvas.clientWidth, h = canvas.clientHeight;
    if (w !== W || h !== H) { W = w; H = h; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  }

  /* ---- forme ---- */
  const heart = (x: number, y: number, s: number) => {
    ctx.beginPath(); ctx.moveTo(x, y + s * .3); ctx.bezierCurveTo(x, y - s * .3, x - s, y - s * .3, x - s, y + s * .2);
    ctx.bezierCurveTo(x - s, y + s * .7, x, y + s, x, y + s * 1.2); ctx.bezierCurveTo(x, y + s, x + s, y + s * .7, x + s, y + s * .2);
    ctx.bezierCurveTo(x + s, y - s * .3, x, y - s * .3, x, y + s * .3); ctx.fill();
  };
  const star4 = (x: number, y: number, s: number) => {
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill();
  };
  const star5 = (x: number, y: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  };
  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  const cloud = (x: number, y: number, r: number) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.arc(x + r, y - r * .4, r * 1.1, 0, 7); ctx.arc(x + r * 2, y, r * .9, 0, 7); ctx.fill();
  };
  const emoji = (e: string, x: number, y: number, size: number, rot = 0) => {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
    ctx.font = `${Math.round(size)}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(e, 0, 0); ctx.restore();
  };

  /* ---- stanza ---- */
  function drawRoom(t: number, night: boolean, s: GameState | null) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, tokens['wall-2']); g.addColorStop(1, tokens.wall);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = tokens.line;
    for (let y = 18; y < H * .7; y += 34) for (let x = ((y / 34) % 2) * 17 + 10; x < W; x += 34) { ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill(); }
    const wx = W * .07, wy = H * .1, ww = W * .27, wh = H * .33;
    ctx.fillStyle = tokens.panel; roundRect(wx - 6, wy - 6, ww + 12, wh + 12, 16); ctx.fill();
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
    if (night) { sky.addColorStop(0, '#26235a'); sky.addColorStop(1, '#4a3d7c'); } else { sky.addColorStop(0, '#aee0ff'); sky.addColorStop(1, '#e2f4ff'); }
    ctx.fillStyle = sky; roundRect(wx, wy, ww, wh, 11); ctx.fill();
    ctx.save(); roundRect(wx, wy, ww, wh, 11); ctx.clip();
    if (night) {
      ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(wx + ww * .68, wy + wh * .35, ww * .14, 0, 7); ctx.fill();
      ctx.fillStyle = '#4a3d7c'; ctx.beginPath(); ctx.arc(wx + ww * .74, wy + wh * .3, ww * .12, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 6; i++) { ctx.globalAlpha = .4 + .6 * (.5 + .5 * Math.sin(t * 2 + i * 2)); star4(wx + ww * (((i * 37) % 90 + 5) / 100), wy + wh * (((i * 53) % 70 + 10) / 100), 2.5); }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#ffd86b'; ctx.beginPath(); ctx.arc(wx + ww * .7, wy + wh * .32, ww * .13, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; cloud(wx + ((t * 6) % (ww + 60)) - 30, wy + wh * .65, ww * .12);
    }
    ctx.restore();
    ctx.fillStyle = tokens.panel; ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh); ctx.fillRect(wx, wy + wh / 2 - 2, ww, 4);
    const sx = W * .72, sy = H * .3;
    ctx.fillStyle = tokens.panel; roundRect(sx, sy, W * .2, 7, 3); ctx.fill();
    ctx.fillStyle = '#ffb3cf'; roundRect(sx + W * .07, sy - 18, 20, 18, 5); ctx.fill();
    ctx.fillStyle = '#7fcf9e';
    for (const a of [-.6, 0, .6]) { ctx.save(); ctx.translate(sx + W * .07 + 10, sy - 18); ctx.rotate(a + Math.sin(t * 1.3) * .05); ctx.beginPath(); ctx.ellipse(0, -10, 5, 11, 0, 0, 7); ctx.fill(); ctx.restore(); }
    const fy = H * .72; ctx.fillStyle = tokens.floor; ctx.fillRect(0, fy, W, H - fy);
    ctx.fillStyle = tokens.rug; ctx.beginPath(); ctx.ellipse(W * .56, H * .88, W * .3, H * .08, 0, 0, 7); ctx.fill();
    if (s) for (const id of s.furnOn) { const F = FURN[id]; emoji(F.e, F.x * W, F.y * H, F.s * H); }
  }

  function drawPoop(x: number, y: number, s: number, t: number) {
    ctx.fillStyle = '#c79a78';
    ctx.beginPath(); ctx.ellipse(x, y, s, s * .45, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y - s * .45, s * .72, s * .36, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + s * .05, y - s * .82, s * .42, s * .28, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3b2842'; ctx.beginPath(); ctx.arc(x - s * .25, y - s * .4, s * .08, 0, 7); ctx.arc(x + s * .25, y - s * .4, s * .08, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(160,140,120,.5)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) {
      const o = (t * 18 + i * 12) % 24; ctx.globalAlpha = 1 - o / 24; ctx.beginPath();
      ctx.moveTo(x - 6 + i * 12, y - s * 1.2 - o); ctx.quadraticCurveTo(x - 2 + i * 12, y - s * 1.4 - o, x - 6 + i * 12, y - s * 1.6 - o); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawEgg(cx: number, cy: number, r: number, t: number, s: GameState | null) {
    const left = s ? Math.max(0, (s.hatchAt - Date.now()) / 1000) : 99;
    const shake = (left < 12 ? .16 : .05) * Math.sin(t * (left < 12 ? 14 : 3)) + tapBounce * .2 * Math.sin(t * 20);
    ctx.save(); ctx.translate(cx, cy + r * .9); ctx.rotate(shake); ctx.translate(0, -r * .9);
    ctx.fillStyle = 'rgba(80,30,60,.12)'; ctx.beginPath(); ctx.ellipse(0, r * .95, r * .7, r * .14, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(-r * .3, -r * .4, r * .1, 0, 0, r * 1.2); g.addColorStop(0, '#fffaf2'); g.addColorStop(1, '#ffe0c6');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * .72, r * .92, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffb3d1';
    for (const [x, y, z] of [[-.3, -.3, .13], [.25, -.5, .09], [.3, .1, .15], [-.2, .35, .1], [.05, -.05, .07]]) { ctx.beginPath(); ctx.arc(x * r, y * r, z * r, 0, 7); ctx.fill(); }
    if (left < 15) {
      ctx.strokeStyle = '#8a6a5a'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.beginPath();
      const p = [[-.55, -.1], [-.35, -.25], [-.18, -.05], [0, -.28], [.18, -.08], [.35, -.3], [.55, -.12]];
      const n = Math.ceil(((15 - left) / 15) * p.length);
      p.slice(0, n).forEach(([x, y], i) => (i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r)));
      ctx.stroke();
    }
    ctx.restore();
  }

  function blobPath(cx: number, cy: number, rx: number, ry: number, t: number, kind: string) {
    const N = 48, pts: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      let r = 1 + .025 * Math.sin(a * 3 + t * 2);
      if (kind === 'nuvola' && Math.sin(a) < .2) r += .07 * Math.max(0, Math.cos(a * 6));
      const x = Math.cos(a) * rx * r;
      let y = Math.sin(a) * ry * r;
      if (y > ry * .78) y = ry * .78 + (y - ry * .78) * .3;
      pts.push([cx + x, cy + y]);
    }
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const p = pts[i], q = pts[(i + 1) % N], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      if (!i) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(p[0], p[1], mx, my);
    }
    const p = pts[0], q = pts[1];
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    ctx.closePath();
  }

  /* ---- blob ---- */
  function drawPet(t: number, s: GameState | null) {
    const m = mood(s).k, floorY = H * .86, base = Math.min(W, H) * .25;
    if (!s || s.stage === 'egg') { const r = base * .8; petPos = { x: W * .56, y: floorY - r * .9, r }; drawEgg(W * .56, floorY - r * .9, r, t, s); return; }
    if (s.walk) { petPos = { x: W * .56, y: floorY - base, r: base }; return; }
    const kind = kindOf(s), sc = s.stage === 'baby' ? .68 : s.stage === 'child' ? .84 : 1, R = base * sc, pal = PAL[kind];
    let x = W * .56;
    if (m === 'distrust') x = W * .82;
    else if (m !== 'sleep' && m !== 'sick' && !reduced) x += Math.sin(t * .35) * W * .1;
    const amp = reduced ? .3 : 1;
    let hop = m === 'happy' ? Math.abs(Math.sin(t * 3.2)) * R * .18 * amp : 0;
    hop += tapBounce * R * .3 * Math.abs(Math.sin(t * 12));
    const breathe = Math.sin(t * (m === 'sleep' ? 1.2 : 2.2)) * .045 * amp;
    const rx = R * (1 + breathe), ry = R * .88 * (1 - breathe), cy = floorY - ry * .78 - hop;
    petPos = { x, y: cy, r: R };

    ctx.fillStyle = 'rgba(80,30,60,.14)'; ctx.beginPath(); ctx.ellipse(x, floorY + 2, rx * .85 * (1 - (hop / R) * .8), R * .13, 0, 0, 7); ctx.fill();
    if (kind === 'stellino' && !s.hat) {
      ctx.strokeStyle = pal.b; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, cy - ry * .9);
      ctx.quadraticCurveTo(x + R * .25 * Math.sin(t * 2), cy - ry * 1.25, x + R * .1 * Math.sin(t * 2), cy - ry * 1.45); ctx.stroke();
      ctx.fillStyle = '#ffcf3f'; star5(x + R * .1 * Math.sin(t * 2), cy - ry * 1.5, R * .2);
    }
    if (s.stage === 'child') { ctx.fillStyle = pal.b; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * rx * .55, cy - ry * .78, R * .17, R * .22, d * .4, 0, 7); ctx.fill(); } }
    if (kind === 'muschio' && !s.hat) {
      ctx.fillStyle = '#6fbf73'; ctx.save(); ctx.translate(x, cy - ry * .92); ctx.rotate(Math.sin(t * 1.5) * .15);
      ctx.beginPath(); ctx.ellipse(-R * .12, -R * .12, R * .1, R * .2, -.7, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(R * .12, -R * .14, R * .1, R * .22, .7, 0, 7); ctx.fill(); ctx.restore();
    }
    blobPath(x, cy, rx, ry, t, kind);
    const g = ctx.createRadialGradient(x - rx * .35, cy - ry * .45, R * .1, x, cy, R * 1.15);
    g.addColorStop(0, pal.a); g.addColorStop(1, pal.b); ctx.fillStyle = g; ctx.fill();
    if (m === 'sick') { ctx.fillStyle = 'rgba(150,200,110,.35)'; ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x - rx * .42, cy - ry * .5, R * .14, R * .08, -.6, 0, 7); ctx.fill();
    if (kind === 'budino') {
      ctx.fillStyle = '#b8683a'; ctx.beginPath(); ctx.moveTo(x - rx * .72, cy - ry * .5);
      for (let i = 0; i <= 8; i++) ctx.lineTo(x - rx * .72 + (rx * 1.44 * i) / 8, cy - ry * .5 + (i % 2 ? R * .18 : R * .02));
      ctx.quadraticCurveTo(x, cy - ry * 1.25, x - rx * .72, cy - ry * .5); ctx.fill();
      if (!s.hat) { ctx.fillStyle = '#ff4f6d'; ctx.beginPath(); ctx.arc(x + R * .05, cy - ry * 1.02, R * .13, 0, 7); ctx.fill(); }
    }
    if (kind === 'baby' && !s.hat) {
      ctx.strokeStyle = pal.b; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, cy - ry * .95);
      ctx.bezierCurveTo(x + R * .2, cy - ry * 1.3, x + R * .28, cy - ry * 1.02, x + R * .12, cy - ry * 1.05); ctx.stroke();
    }
    if (kind === 'nuvola') {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) { const a = t * .8 + i * 2.1; ctx.globalAlpha = .6 + .4 * Math.sin(t * 3 + i); star4(x + Math.cos(a) * rx * 1.15, cy - ry * .9 + Math.sin(a) * R * .18, R * .07); }
      ctx.globalAlpha = 1;
    }

    // viso
    const look = m === 'distrust' ? -R * .16 : Math.sin(t * .35) * R * .05;
    const ex = R * .3, ey = cy - ry * .08, fx = x + look, er = R * .1;
    ctx.fillStyle = '#ff8fb3'; ctx.globalAlpha = .55;
    ctx.beginPath(); ctx.ellipse(fx - ex * 1.45, ey + R * .2, R * .12, R * .07, 0, 0, 7); ctx.ellipse(fx + ex * 1.45, ey + R * .2, R * .12, R * .07, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    if (kind === 'muschio') { ctx.fillStyle = '#8fb87a'; for (const [dx, dy] of [[-1.3, .05], [-1.1, .12], [1.3, .05], [1.1, .12]]) { ctx.beginPath(); ctx.arc(fx + dx * ex, ey + R * .13 + dy * R, R * .025, 0, 7); ctx.fill(); } }
    ctx.fillStyle = ctx.strokeStyle = '#3b2842'; ctx.lineWidth = Math.max(2, R * .05); ctx.lineCap = 'round';
    const blink = t % 4.3 < .13;
    for (const d of [-1, 1]) {
      const X = fx + d * ex, Y = ey;
      if (m === 'sleep' || (blink && m !== 'happy' && m !== 'sick')) { ctx.beginPath(); ctx.arc(X, Y - er * .2, er * .9, .15 * Math.PI, .85 * Math.PI); ctx.stroke(); }
      else if (m === 'happy') { ctx.beginPath(); ctx.arc(X, Y + er * .5, er, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
      else if (m === 'sick') { ctx.beginPath(); for (let a = 0; a < Math.PI * 4; a += .3) { const rr = (er * a) / (Math.PI * 4); ctx.lineTo(X + Math.cos(a + t * 3) * rr, Y + Math.sin(a + t * 3) * rr); } ctx.stroke(); }
      else {
        const h = m === 'tired' ? er * .55 : er * 1.25;
        ctx.beginPath(); ctx.ellipse(X, Y, er * .85, h, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X - er * .3 + (m === 'distrust' ? -er * .2 : 0), Y - h * .4, er * .32, 0, 7); ctx.fill(); ctx.fillStyle = '#3b2842';
        if (m === 'sad' || m === 'distrust') { ctx.beginPath(); ctx.moveTo(X - d * er * 1.1, Y - er * 2.2); ctx.lineTo(X + d * er * .4, Y - er * 1.7); ctx.stroke(); }
      }
    }
    const my = ey + R * .28;
    ctx.beginPath();
    if (m === 'happy') { ctx.fillStyle = '#ff6f9a'; ctx.moveTo(fx - R * .13, my - R * .02); ctx.quadraticCurveTo(fx, my + R * .22, fx + R * .13, my - R * .02); ctx.closePath(); ctx.fill(); }
    else if (m === 'sleep') { ctx.ellipse(fx, my, R * .04, R * .05, 0, 0, 7); ctx.fill(); }
    else if (m === 'sad' || m === 'distrust') { ctx.arc(fx, my + R * .1, R * .1, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); }
    else if (m === 'sick') { ctx.moveTo(fx - R * .12, my); for (let i = 1; i <= 4; i++) ctx.quadraticCurveTo(fx - R * .12 + R * .06 * (i - .5), my + (i % 2 ? -1 : 1) * R * .05, fx - R * .12 + R * .06 * i, my); ctx.stroke(); }
    else { ctx.arc(fx, my - R * .06, R * .09, .2 * Math.PI, .8 * Math.PI); ctx.stroke(); }
    if (m === 'distrust') {
      ctx.fillStyle = '#8fd0ff'; const p = (t * 20) % 20; ctx.globalAlpha = 1 - p / 20;
      ctx.beginPath(); ctx.ellipse(fx + ex + er * .4, ey + R * .15 + p, R * .035, R * .055, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (s.hat) emoji(HATS[s.hat].e, x + R * .06, cy - ry * .98, R * .62, -.14);
    if (m === 'sleep') {
      ctx.fillStyle = tokens.ink;
      for (let i = 0; i < 3; i++) {
        const p = (t * .5 + i / 3) % 1; ctx.globalAlpha = 1 - p;
        ctx.font = `${Math.round(R * (.16 + p * .14))}px "Mochiy Pop One", sans-serif`;
        ctx.fillText('z', x + rx * .7 + p * R * .4, cy - ry * .6 - p * R * .8);
      }
      ctx.globalAlpha = 1;
    }
    if (m === 'sick') {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ff7d9a'; ctx.lineWidth = 2; ctx.save(); ctx.translate(x + rx * .55, cy - ry * .75); ctx.rotate(.3);
      roundRect(-R * .2, -R * .07, R * .4, R * .14, R * .05); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    // fumetto del desiderio
    if (s.wish && !s.sleeping) {
      const bob = Math.sin(t * 2) * 3, br = Math.max(26, R * .42);
      const bx = Math.min(W - br - 6, x + R * .95), by = Math.max(br * .8 + 6, cy - ry - br * .6) + bob;
      ctx.fillStyle = tokens.panel; ctx.strokeStyle = tokens.line; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + R * .55, cy - ry * .75 + bob * .5, br * .1, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + R * .72, cy - ry * .95 + bob * .7, br * .16, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(bx, by, br, br * .78, 0, 0, 7); ctx.fill(); ctx.stroke();
      emoji(s.wish.e, bx, by + 1, br * .95);
    }
  }

  function drawParticles(dt: number) {
    particles = particles.filter(p => (p.age += dt) < p.life);
    for (const p of particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.type === 'crumb' || p.type === 'drop' ? 120 : -10) * dt;
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
      if (p.type === 'heart') { ctx.fillStyle = '#ff6fae'; heart(p.x, p.y, p.s * .7); }
      else if (p.type === 'sparkle') { ctx.fillStyle = '#ffd24a'; star4(p.x, p.y, p.s); }
      else if (p.type === 'drop') { ctx.fillStyle = '#7cc8ff'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.s * .35, p.s * .5, 0, 0, 7); ctx.fill(); }
      else { ctx.fillStyle = '#e8b97f'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * .3, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  return {
    readTokens,
    burst(type: ParticleType, n: number) {
      for (let i = 0; i < n; i++) particles.push({
        type, x: petPos.x + (Math.random() - .5) * petPos.r, y: petPos.y - petPos.r * .4,
        vx: (Math.random() - .5) * 60, vy: -40 - Math.random() * 60, life: 1.4 + Math.random() * .6, age: 0, s: 6 + Math.random() * 6
      });
    },
    bounce() { tapBounce = 1; },
    frame(now: number) {
      const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
      fit();
      if (!W || !H) return;
      const s = getState(), t = now / 1000;
      tapBounce = Math.max(0, tapBounce - dt * 1.6);
      const hr = new Date().getHours();
      drawRoom(t, hr >= 20 || hr < 7, s);
      if (s && s.poops && !s.walk) for (let i = 0; i < s.poops; i++) drawPoop(W * (.2 + i * .1), H * .93, Math.min(W, H) * .045, t + i);
      drawPet(t, s);
      drawParticles(dt);
      if (s && s.sleeping && !s.walk) { ctx.fillStyle = 'rgba(30,15,60,.32)'; ctx.fillRect(0, 0, W, H); }
    }
  };
}
