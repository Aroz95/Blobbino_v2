// Tutto ciò che il giocatore (o il tempo) può fare al blob.
// Ogni funzione riceve una copia dello stato e la modifica: il salvataggio lo fa lo store.
import { FOODS, GAMES, HATS, FURN, PLACES, STICKERS, TASTY, GAME_IDS, PLACE_IDS,
  type FoodId, type FurnId, type GameId, type HatId, type PlaceId } from './content';
import { emit, ui } from './bus';
import { giveSticker, log, reveal } from './state';
import type { GameState, Notice, Wish } from './types';
import { HOUR, MIN, clamp, dayKey, pick, rnd } from './util';

function addCoins(s: GameState, n: number) {
  s.coins += n;
  if (n) emit('coins', undefined);
}

/** Controlla che il blob sia qui e sveglio abbastanza per interagire. */
export function ready(s: GameState): boolean {
  if (s.stage === 'egg') { ui.bounce(); ui.say("È ancora un uovo. Tienilo al caldo, manca poco!"); return false; }
  if (s.walk) { ui.say(`${s.name} è ancora ${PLACES[s.walk.place].dove}.`); return false; }
  return true;
}
function awake(s: GameState): boolean {
  if (s.sleeping) { ui.say(`Shh… ${s.name} sta dormendo.`); return false; }
  return true;
}

/* ---------- desideri ---------- */

export function makeWish(s: GameState, now = Date.now()): Wish {
  const opts: Omit<Wish, 'exp'>[] = [];
  const add = (w: Omit<Wish, 'exp'>, weight = 1) => { for (let i = 0; i < weight; i++) opts.push(w); };

  const food = Math.random() < .35 ? s.traits.favFood : pick(TASTY.filter(k => k !== s.traits.hateFood));
  add({ type: 'food', target: food, e: FOODS[food].e, text: `vorrebbe ${FOODS[food].n.toLowerCase()}`, reward: FOODS[food].price + rnd(5, 9) }, 3);

  const g = Math.random() < .35 ? s.traits.favGame : pick(GAME_IDS);
  add({ type: 'game', target: g, e: GAMES[g].e, text: `vuole giocare a ${GAMES[g].n}`, reward: rnd(8, 12) }, 2);

  if (s.energy > 35 && !s.sick) {
    const p = Math.random() < .35 ? s.traits.favPlace : pick(PLACE_IDS);
    add({ type: 'walk', target: p, e: PLACES[p].e, text: `sogna una passeggiata ${PLACES[p].dove}`, reward: rnd(8, 12) }, 2);
  }
  add({ type: 'cuddle', e: '🤗', text: 'ha voglia di coccole', reward: rnd(5, 8) });
  if (s.hygiene < 85 || s.poops) add({ type: 'bath', e: '🫧', text: 'vorrebbe fare il bagnetto', reward: rnd(5, 8) });
  const hats = s.hats.filter(h => h !== s.hat);
  if (hats.length) {
    const h = pick(hats);
    add({ type: 'hat', target: h, e: HATS[h].e, text: `vorrebbe indossare ${HATS[h].n.toLowerCase()}`, reward: rnd(6, 10) }, 2);
  }
  return { ...pick(opts), exp: now + 2 * HOUR };
}

/** Se l'azione appena fatta era il desiderio del blob, lo premia. */
export function fulfill(s: GameState, type: Wish['type'], target?: string): boolean {
  const w = s.wish;
  if (!w || w.type !== type || (w.target && w.target !== target)) return false;
  addCoins(s, w.reward);
  s.trust = clamp(s.trust + 5); s.fun = clamp(s.fun + 6); s.wishesDone++;
  log(s, Date.now(), `Desiderio esaudito: ${s.name} ${w.text}. +${w.reward} stelline.`);
  giveSticker(s, 'desiderio');
  if (s.wishesDone >= 10) giveSticker(s, 'desideri10');
  s.wish = null;
  s.nextWishAt = Date.now() + rnd(35, 90) * MIN;
  ui.burst('sparkle', 12);
  setTimeout(() => ui.say(`Desiderio esaudito! +${w.reward} stelline`, 2800), 900);
  return true;
}

/* ---------- orologio: chiamato ogni secondo ---------- */

/** Restituisce true se lo stato va salvato subito. */
export function tick(s: GameState, now = Date.now()): boolean {
  if (s.stage === 'egg') return false;
  let changed = false;
  if (s.walk?.back) { walkReturn(s, now); changed = true; }
  if (s.daily.last !== dayKey(now)) { dailyGift(s, now); changed = true; }
  if (s.wish && now > s.wish.exp) {
    log(s, now, `${s.name} ci è rimasto male: nessuno ha esaudito il suo desiderio.`);
    s.trust = clamp(s.trust - 2); s.wish = null; s.nextWishAt = now + rnd(30, 70) * MIN; changed = true;
  }
  if (!s.wish && now >= s.nextWishAt && !s.walk && !s.sleeping) {
    s.wish = makeWish(s, now);
    log(s, now, `${s.name} ${s.wish.text}.`);
    ui.say(`${s.wish.e} ${s.name} ${s.wish.text}!`, 3200);
    changed = true;
  }
  return changed;
}

function dailyGift(s: GameState, now: number) {
  const streak = s.daily.last === dayKey(now - 24 * HOUR) ? s.daily.streak + 1 : 1;
  const coins = 8 + Math.min(streak, 7) * 2;
  let food: FoodId | null = null;
  if (Math.random() < .5) { food = pick(TASTY); s.inv[food] = (s.inv[food] ?? 0) + 1; }
  s.daily = { last: dayKey(now), streak };
  addCoins(s, coins);
  const week = streak >= 7 && giveSticker(s, 'settimana');
  log(s, now, `Regalo del giorno: +${coins} stelline${food ? ` e ${FOODS[food].e} ${FOODS[food].n.toLowerCase()}` : ''}.`);
  const rows: Notice['rows'] = [{ e: '⭐', title: `+${coins} stelline`, sub: 'Da spendere nel negozio' }];
  if (food) rows.push({ e: FOODS[food].e, title: FOODS[food].n, sub: 'Aggiunto alla dispensa' });
  if (week) rows.push({ e: '📅', title: 'Figurina: Una settimana', sub: 'Sette giorni insieme!', hl: true });
  ui.notice({
    title: 'Regalo del giorno',
    intro: streak > 1
      ? `Sei passato a trovare ${s.name} per ${streak} giorni di fila.`
      : `Ogni giorno che passi a trovare ${s.name} c'è un regalo. Più giorni di fila, più è grande.`,
    rows, button: 'Grazie!'
  });
}

function walkReturn(s: GameState, now: number) {
  const w = s.walk!, P = PLACES[w.place], fav = s.traits.favPlace === w.place;
  let coins = Math.round(rnd(P.coins[0], P.coins[1]) * (fav ? 1.5 : 1));
  let food: FoodId | null = null;
  if (Math.random() < .4) { food = pick(TASTY); s.inv[food] = (s.inv[food] ?? 0) + 1; }
  let stk: typeof P.stickers[number] | null = null, dup = false;
  if (Math.random() < P.chance + (fav ? .25 : 0)) {
    stk = pick(P.stickers);
    if (s.stickers[stk]) { dup = true; coins += 5; } else giveSticker(s, stk, now);
  }
  const story = pick(P.stories)(s.name);
  const newFav = fav && reveal(s, 'favPlace');
  s.fun = clamp(s.fun + (fav ? 15 : 6)); s.trust = clamp(s.trust + 2); s.walks++;
  addCoins(s, coins);
  s.walk = null;
  log(s, now, story);
  const rows: Notice['rows'] = [{ e: '⭐', title: `+${coins} stelline`, sub: fav ? 'Bonus posto preferito' : 'Trovate per strada' }];
  if (food) rows.push({ e: FOODS[food].e, title: FOODS[food].n, sub: 'Aggiunto alla dispensa' });
  if (stk) rows.push({
    e: STICKERS[stk].e, hl: !dup,
    title: `${dup ? 'Doppione' : 'Nuova figurina'}: ${STICKERS[stk].n}`,
    sub: dup ? "Ce l'avevi già: +5 stelline" : "Guardala nell'album"
  });
  ui.notice({
    title: `${s.name} è tornato!`, story,
    intro: newFav ? `Hai scoperto un suo gusto: il posto che preferisce è il ${P.n.toLowerCase()} ${P.e}.` : undefined,
    rows, button: 'Bentornato!'
  });
}

/* ---------- cura ---------- */

export function tapPet(s: GameState) {
  ui.bounce();
  if (s.stage === 'egg') ui.say('Toc toc! Qualcosa si muove là dentro.');
  else if (s.walk) ui.say(`${s.name} è ${PLACES[s.walk.place].dove}.`);
  else if (s.sleeping) ui.say('Zzz…');
  else if (s.wish) ui.say(`${s.wish.e} ${s.name} ${s.wish.text}…`);
  else if (s.trust < 35) ui.say(`${s.name} fa un passo indietro.`);
  else { ui.burst('heart', 2); ui.say(pick(['Ciao!', 'Ehi, sei tu!', 'Pio pio!', 'Che si fa oggi?']), 1600); }
}

export function feed(s: GameState, id: FoodId) {
  if (!ready(s) || !awake(s)) return;
  const F = FOODS[id], n = s.name;
  if (s.hunger >= 97) { ui.toast('Ha la pancia piena!'); return; }
  if (id !== 'pappa' && !s.inv[id]) return;
  if (s.trust < 35 && Math.random() < .4) { ui.say(`${n} ti guarda di sbieco e non mangia. Prova con le coccole.`); return; }
  if (id !== 'pappa') s.inv[id] = (s.inv[id] ?? 1) - 1;
  if (id === s.traits.hateFood) {
    const first = reveal(s, 'hateFood');
    s.hunger = clamp(s.hunger + 5); s.fun = clamp(s.fun - 8);
    ui.say(first ? `Bleah! Hai scoperto che ${n} odia ${F.n.toLowerCase()}.` : `Bleah! Lo sapevi che odia ${F.n.toLowerCase()}…`, 3200);
    if (first) log(s, Date.now(), `Scoperto: ${n} odia ${F.n.toLowerCase()} ${F.e}.`);
    return;
  }
  s.hunger = clamp(s.hunger + F.hunger); s.fun = clamp(s.fun + F.fun);
  s.health = clamp(s.health + (F.health ?? 0)); s.thirst = clamp(s.thirst + (F.thirst ?? 0));
  s.trust = clamp(s.trust + 1);
  if (F.sweet) s.snacks++;
  if (id === s.traits.favFood) {
    const first = reveal(s, 'favFood');
    s.fun = clamp(s.fun + 15); s.trust = clamp(s.trust + 3);
    ui.burst('heart', 12); ui.bounce();
    ui.say(first ? `Che festa! Hai scoperto il suo cibo preferito: ${F.n.toLowerCase()}!` : `${F.e} Il suo preferito! Gnam!`, 3200);
    if (first) log(s, Date.now(), `Scoperto: il cibo preferito di ${n} è ${F.n.toLowerCase()} ${F.e}.`);
  } else {
    ui.burst('crumb', 10); ui.say('Gnam gnam!');
  }
  fulfill(s, 'food', id);
}

export function buyAndFeed(s: GameState, id: FoodId) {
  const p = FOODS[id].price;
  if (s.coins < p) { ui.toast(`Ti mancano ${p - s.coins} stelline.`); return; }
  addCoins(s, -p); s.inv[id] = (s.inv[id] ?? 0) + 1;
  feed(s, id);
}

export function drink(s: GameState) {
  if (!ready(s) || !awake(s)) return;
  if (s.thirst >= 95) { ui.say('Non ha sete adesso.'); return; }
  if (s.trust < 35 && Math.random() < .4) { ui.say(`${s.name} resta nel suo angolo.`); return; }
  s.thirst = clamp(s.thirst + 35); s.trust = clamp(s.trust + 1);
  ui.burst('drop', 8); ui.say('Glu glu glu!');
}

export function cuddle(s: GameState) {
  if (!ready(s)) return;
  const now = Date.now();
  s.cuddles = s.cuddles.filter(t => now - t < HOUR);
  if (s.sleeping) {
    s.trust = clamp(s.trust + 1); s.cuddles.push(now);
    ui.burst('heart', 3); ui.say('Sorride nel sonno.');
    return;
  }
  const low = s.trust < 35;
  const gain = Math.max(1, 6 - s.cuddles.length * 1.5);
  s.trust = clamp(s.trust + gain); s.fun = clamp(s.fun + 3); s.cuddles.push(now);
  ui.burst('heart', 9); ui.bounce();
  ui.say(low ? `${s.name} all'inizio si irrigidisce… poi si lascia andare.` : s.cuddles.length > 4 ? 'Ok ok, basta coccole per ora!' : 'Prrr… che bello!');
  fulfill(s, 'cuddle');
}

export function bath(s: GameState) {
  if (!ready(s) || !awake(s)) return;
  if (s.hygiene > 90 && !s.poops) { ui.say('È già pulitissimo!'); return; }
  s.poops = 0; s.hygiene = 100; s.trust = clamp(s.trust + 1); s.fun = clamp(s.fun - 2);
  ui.burst('sparkle', 12); ui.say('Splash! Profuma di sapone.');
  fulfill(s, 'bath');
}

export function medicine(s: GameState) {
  if (!ready(s) || !awake(s)) return;
  if (!s.sick) { ui.say(`${s.name} sta benissimo, niente medicine!`); return; }
  s.sick = false; s.riskClock = 0; s.health = clamp(s.health + 15); s.fun = clamp(s.fun - 5);
  log(s, Date.now(), `${s.name} ha preso la medicina e sta guarendo.`);
  ui.burst('sparkle', 6); ui.say('Bleah… ma va già meglio!');
}

export function toggleSleep(s: GameState) {
  if (!ready(s)) return;
  if (s.sleeping) {
    s.sleeping = false;
    if (s.energy < 40) { s.trust = clamp(s.trust - 2); ui.say('Brontola: aveva ancora sonno.'); } else ui.say('Buongiorno!');
    return;
  }
  if (s.energy > 85) { ui.say(`${s.name} non ha sonno per niente!`); return; }
  s.sleeping = true;
  log(s, Date.now(), `Hai messo ${s.name} a nanna.`);
  ui.say('Buonanotte…');
}

/** Restituisce true se è partito. */
export function startWalk(s: GameState, id: PlaceId): boolean {
  if (!ready(s) || !awake(s)) return false;
  const P = PLACES[id];
  if (s.sick) { ui.toast(`${s.name} è malato: prima la medicina.`); return false; }
  if (s.energy < P.energy + 5) { ui.toast(`${s.name} è troppo stanco per andare ${P.dove}.`); return false; }
  const now = Date.now();
  s.walk = { place: id, start: now, end: now + P.min * MIN };
  log(s, now, `${s.name} è partito per una passeggiata ${P.dove}.`);
  fulfill(s, 'walk', id);
  ui.say(`Ciao ciao! Torna tra ${P.min} minuti.`);
  return true;
}

/* ---------- negozio ---------- */

export type ShopSection = 'food' | 'hats' | 'furn';

export function buy(s: GameState, sec: ShopSection, id: string) {
  const item = sec === 'food' ? FOODS[id as FoodId] : sec === 'hats' ? HATS[id as HatId] : FURN[id as FurnId];
  if (s.coins < item.price) { ui.toast(`Ti mancano ${item.price - s.coins} stelline. Giochi e passeggiate ne fanno guadagnare.`); return; }
  addCoins(s, -item.price);
  if (sec === 'food') { s.inv[id as FoodId] = (s.inv[id as FoodId] ?? 0) + 1; ui.toast(`${item.e} ${item.n} in dispensa`); }
  else if (sec === 'hats') { s.hats.push(id as HatId); s.hat = id as HatId; ui.toast(`${s.name} indossa ${item.n.toLowerCase()}!`); fulfill(s, 'hat', id); }
  else { s.furn.push(id as FurnId); s.furnOn.push(id as FurnId); ui.toast(`${item.n} nella cameretta`); }
}

export function toggleHat(s: GameState, id: HatId) {
  if (s.hat === id) s.hat = null;
  else { s.hat = id; fulfill(s, 'hat', id); }
}

export function toggleFurn(s: GameState, id: FurnId) {
  s.furnOn = s.furnOn.includes(id) ? s.furnOn.filter(x => x !== id) : [...s.furnOn, id];
}

/* ---------- minigiochi ---------- */

export function canPlay(s: GameState): string | null {
  if (s.stage === 'egg') return "È ancora un uovo.";
  if (s.walk) return `${s.name} è ancora ${PLACES[s.walk.place].dove}.`;
  if (s.sleeping) return `Shh… ${s.name} sta dormendo.`;
  if (s.energy < 12) return `${s.name} è troppo stanco. Lascialo riposare un po'.`;
  return null;
}

/** Applica il risultato di una partita e restituisce il messaggio da mostrare. */
export function finishGame(s: GameState, id: GameId, score: number): string {
  let coins = id === 'memory' ? score * 2 : id === 'catch' ? Math.floor(score / 2) : score * 3;
  let fun = Math.min(40, 6 + (id === 'memory' ? score * 6 : id === 'catch' ? score * 1.2 : score * 7));
  const fav = s.traits.favGame === id;
  if (fav) { fun *= 1.5; coins += 3; }
  addCoins(s, coins);
  s.fun = clamp(s.fun + fun);
  s.trust = clamp(s.trust + Math.min(5, 1 + Math.floor(score / 2)));
  s.energy = clamp(s.energy - 6);
  s.plays++;
  const rec = score > s.records[id];
  if (rec) s.records[id] = score;
  if (id === 'memory' && score >= 8) giveSticker(s, 'memory8');
  if (id === 'catch' && score >= 25) giveSticker(s, 'catch25');
  if (id === 'hide' && score >= 5) giveSticker(s, 'hide5');
  const newFav = fav && reveal(s, 'favGame');
  if (newFav) log(s, Date.now(), `Scoperto: il gioco preferito di ${s.name} è ${GAMES[id].n}.`);
  if (rec && score >= 3) log(s, Date.now(), `Nuovo record a ${GAMES[id].n}: ${score} ${GAMES[id].unit}!`);
  fulfill(s, 'game', id);
  return `${rec && score ? 'Nuovo record! ' : ''}+${coins} stelline.`
    + (newFav ? ' Si vede che è il suo gioco preferito!' : fav ? ' Il suo preferito: bonus!' : '');
}
