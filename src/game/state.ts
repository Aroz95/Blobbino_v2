// Il modello del blob: creazione, aggiornamento dei salvataggi vecchi e scorrere del tempo.
import { BRANCHES, GAME_IDS, PLACE_IDS, STAT_KEYS, STICKERS, TASTY, type Branch, type Kind, type StickerId } from './content';
import { emit } from './bus';
import type { GameState, Traits, TraitKey } from './types';
import { HOUR, MIN, clamp, pick } from './util';

export const SAVE_VERSION = 2;

export function rollTraits(): Traits {
  const f = TASTY.slice().sort(() => Math.random() - .5);
  return { favFood: f[0], hateFood: f[1], favGame: pick(GAME_IDS), favPlace: pick(PLACE_IDS) };
}

/** Porta qualsiasi salvataggio (anche quelli della prima versione) alla forma attuale. */
export function migrate(raw: any): GameState | null {
  if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string') return null;
  const now = Date.now();
  const defaults: Partial<GameState> = {
    coins: 20, inv: { mela: 2, biscotto: 1 }, hats: [], hat: null, furn: [], furnOn: [], known: {}, stickers: {},
    wish: null, nextWishAt: (raw.hatchAt || now) + 2 * MIN, walk: null, daily: { last: '', streak: 0 },
    records: { memory: 0, catch: 0, hide: 0 }, wishesDone: 0, walks: 0, snacks: 0, plays: 0, cuddles: [], log: []
  };
  const s = raw as GameState;
  for (const k of Object.keys(defaults) as (keyof GameState)[]) {
    if (s[k] === undefined) (s as unknown as Record<string, unknown>)[k] = defaults[k];
  }
  if (!s.traits) s.traits = rollTraits();
  if (s.stage !== 'egg' && !s.stickers.schiusa) s.stickers.schiusa = s.hatchedAt || now;
  if (s.stage === 'adult' && s.branch && !s.stickers[`evo_${s.branch}`]) s.stickers[`evo_${s.branch}`] = now;
  s.v = SAVE_VERSION;
  return s;
}

export function newState(name: string): GameState {
  const now = Date.now();
  return migrate({
    v: SAVE_VERSION, name, stage: 'egg', branch: null, born: now, hatchAt: now + 40000, hatchedAt: null, last: now,
    hunger: 80, thirst: 80, fun: 70, energy: 90, hygiene: 100, health: 100, trust: 60,
    sick: false, sleeping: false, distrust: false, poops: 0, poopClock: 0, riskClock: 0,
    careSum: 0, funSum: 0, trustSum: 0, careH: 0,
    log: [{ t: now, m: `${name} è un uovo tiepido. Tienilo d'occhio!` }]
  })!;
}

export function log(s: GameState, t: number, m: string) {
  s.log.unshift({ t, m });
  s.log.length = Math.min(s.log.length, 14);
}

export const core = (s: GameState) => (s.hunger + s.thirst + s.fun + s.energy + s.hygiene) / 5;
export const kindOf = (s: GameState): Kind => (s.stage === 'adult' && s.branch) ? s.branch : (s.stage === 'child' ? 'child' : 'baby');

export function giveSticker(s: GameState, id: StickerId, t = Date.now()): boolean {
  if (s.stickers[id]) return false;
  s.stickers[id] = t;
  log(s, t, `Nuova figurina: ${STICKERS[id].e} ${STICKERS[id].n}.`);
  emit('sticker', undefined);
  return true;
}

/** Segna un gusto come scoperto. Restituisce true solo la prima volta. */
export function reveal(s: GameState, key: TraitKey): boolean {
  if (s.known[key]) return false;
  s.known[key] = true;
  if ((['favFood', 'hateFood', 'favGame', 'favPlace'] as TraitKey[]).every(k => s.known[k])) giveSticker(s, 'gusti');
  return true;
}

function pickBranch(s: GameState): Branch {
  const H = Math.max(s.careH, 1), care = s.careSum / H, fun = s.funSum / H, trust = s.trustSum / H;
  const ageD = Math.max((s.last - (s.hatchedAt ?? s.last)) / HOUR / 24, .25);
  if (trust < 45 || care < 40) return 'muschio';
  if (s.snacks / ageD >= 4) return 'budino';
  if (fun - care >= 3 && s.plays >= 6) return 'stellino';
  return 'nuvola';
}

/**
 * Fa scorrere il tempo fino a `to`, a passi di 10 minuti, anche dopo giorni di assenza.
 * Restituisce true se è successo qualcosa da scrivere nel diario.
 */
export function simulate(s: GameState, to: number): boolean {
  let ev = false;
  if (s.stage === 'egg') {
    if (to < s.hatchAt) { s.last = to; return false; }
    s.stage = 'baby'; s.hatchedAt = s.hatchAt; s.last = s.hatchAt;
    log(s, s.hatchAt, `Crack! L'uovo si è schiuso: benvenuto ${s.name}!`);
    giveSticker(s, 'schiusa', s.hatchAt);
    ev = true;
  }
  const hatchedAt = s.hatchedAt ?? s.hatchAt;
  let t = s.last;
  if (to - t > 14 * 24 * HOUR) t = to - 14 * 24 * HOUR;
  while (t < to) {
    const ms = Math.min(10 * MIN, to - t), h = ms / HOUR;
    t += ms;
    const away = !!s.walk && !s.walk.back;
    if (away) {
      s.hunger -= 6 * h; s.thirst -= 9 * h; s.fun += 4 * h; s.energy -= 8 * h; s.hygiene -= 4 * h;
      if (t >= s.walk!.end) { s.walk!.back = true; ev = true; }
    } else {
      const sl = s.sleeping, k = sl ? .45 : 1;
      s.hunger -= 6 * h * k; s.thirst -= 8 * h * k;
      s.fun -= (s.sick ? 9 : 5.5) * h * (sl ? .3 : 1);
      s.energy += sl ? 14 * h : -4.5 * h;
      s.hygiene -= (3.5 + 4 * s.poops) * h;
      s.poopClock += h * (sl ? .4 : 1);
      if (s.poopClock >= 3.5) { s.poopClock -= 3.5; if (s.poops < 3) { s.poops++; ev = true; } }
    }
    for (const key of STAT_KEYS) if (key !== 'health') s[key] = clamp(s[key]);
    const c = core(s);
    if (s.sick) s.health -= 4 * h; else if (c > 45) s.health += 3 * h;
    s.health = Math.max(5, clamp(s.health));
    const risky = s.hygiene < 25 || s.poops >= 3 || (s.hunger < 15 && s.thirst < 15) || s.health < 30;
    s.riskClock = risky ? s.riskClock + h : Math.max(0, s.riskClock - h);
    if (!s.sick && s.riskClock >= 1) { s.sick = true; s.riskClock = 0; log(s, t, `${s.name} si è ammalato. Serve una medicina.`); ev = true; }
    if (c < 30) s.trust -= 4 * h; else if (c < 45) s.trust -= 1.5 * h; else if (c > 65) s.trust += .6 * h;
    s.trust = clamp(s.trust);
    if (!s.distrust && s.trust < 35) { s.distrust = true; log(s, t, `${s.name} si sente trascurato e non si fida più tanto.`); ev = true; }
    if (s.distrust && s.trust >= 50) { s.distrust = false; log(s, t, `${s.name} si fida di nuovo di te.`); ev = true; }
    if (!away) {
      if (!s.sleeping && s.energy < 12) { s.sleeping = true; log(s, t, `${s.name} è crollato dal sonno.`); ev = true; }
      if (s.sleeping && s.energy >= 100) { s.sleeping = false; log(s, t, `${s.name} si è svegliato riposato.`); ev = true; }
    }
    if (s.stage !== 'adult') { s.careSum += c * h; s.funSum += s.fun * h; s.trustSum += s.trust * h; s.careH += h; }
    const age = (t - hatchedAt) / HOUR;
    if (s.stage === 'baby' && age >= 6) { s.stage = 'child'; log(s, t, `${s.name} è cresciuto: ora è un piccolo blob!`); ev = true; }
    if (s.stage === 'child' && age >= 48) {
      s.stage = 'adult'; s.branch = pickBranch(s);
      const b = BRANCHES[s.branch];
      log(s, t, `${s.name} si è evoluto in ${b.name}: ${b.desc}.`);
      giveSticker(s, `evo_${s.branch}`, t);
      ev = true;
    }
  }
  s.last = to;
  return ev;
}

/* ---------- letture per l'interfaccia ---------- */

export type MoodKey = 'egg' | 'away' | 'sleep' | 'sick' | 'distrust' | 'sad' | 'tired' | 'happy' | 'ok';
export function mood(s: GameState | null): { k: MoodKey; t: string } {
  if (!s || s.stage === 'egg') return { k: 'egg', t: 'nel guscio' };
  if (s.walk) return { k: 'away', t: 'in giro' };
  if (s.sleeping) return { k: 'sleep', t: 'dorme della grossa' };
  if (s.sick) return { k: 'sick', t: 'malaticcio' };
  if (s.trust < 35) return { k: 'distrust', t: 'diffidente' };
  const c = core(s);
  if (c < 35) return { k: 'sad', t: 'giù di morale' };
  if (s.energy < 25) return { k: 'tired', t: 'assonnato' };
  if (s.fun > 65 && c > 60) return { k: 'happy', t: 'felicissimo' };
  return { k: 'ok', t: 'tranquillo' };
}

export function stageName(s: GameState | null): string {
  if (!s) return 'Uovo';
  const base = { egg: 'Uovo', baby: 'Cucciolo', child: 'Piccolo', adult: 'Adulto' }[s.stage];
  return base + (s.branch ? ` · ${BRANCHES[s.branch].name}` : '');
}

export function trustHint(s: GameState | null): string {
  if (!s || s.stage === 'egg') return 'La fiducia cresce quando ti prendi cura di lui.';
  if (s.trust < 35) return 'Si tiene a distanza e a volte rifiuta il cibo. Coccole, giochi e desideri esauditi lo aiutano a fidarsi di nuovo.';
  if (s.trust < 60) return 'Ti conosce, ma aspetta di vedere se ci sei davvero.';
  if (s.trust < 85) return 'Ti vuole bene e ti viene incontro quando arrivi.';
  return 'Siete inseparabili.';
}
