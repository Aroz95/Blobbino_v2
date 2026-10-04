// Tutti i contenuti del gioco: cibi, cappelli, arredi, minigiochi, luoghi, figurine.
// Per aggiungere un oggetto basta aggiungere l'id alla lista e la sua scheda qui sotto.

export const STAT_KEYS = ['hunger', 'thirst', 'fun', 'energy', 'hygiene', 'health'] as const;
export type StatKey = typeof STAT_KEYS[number];
export const STAT_LABEL: Record<StatKey, string> = {
  hunger: 'Pancia', thirst: 'Acqua', fun: 'Gioia', energy: 'Energia', hygiene: 'Pulizia', health: 'Salute'
};
export const STAT_COLOR: Record<StatKey, string> = {
  hunger: '#ff9ec7', thirst: '#7cc8ff', fun: '#ffc94f', energy: '#a893ff', hygiene: '#6fdcb6', health: '#ff7eb0'
};

export const BRANCH_IDS = ['nuvola', 'stellino', 'budino', 'muschio'] as const;
export type Branch = typeof BRANCH_IDS[number];
export const BRANCHES: Record<Branch, { name: string; desc: string }> = {
  nuvola: { name: 'Nuvola', desc: 'morbido e sereno, cresciuto con tante attenzioni' },
  stellino: { name: 'Stellino', desc: 'pieno di energia, adora giocare' },
  budino: { name: 'Budino', desc: 'goloso e coccolone' },
  muschio: { name: 'Muschio', desc: "un po' timido, ha imparato a cavarsela da solo" }
};

export interface Food { e: string; n: string; price: number; hunger: number; fun: number; health?: number; thirst?: number; sweet?: boolean }
export const FOOD_IDS = ['pappa', 'mela', 'carota', 'fragola', 'biscotto', 'onigiri', 'zuppa', 'budino', 'pizzetta', 'gelato'] as const;
export type FoodId = typeof FOOD_IDS[number];
export const FOODS: Record<FoodId, Food> = {
  pappa: { e: '🥣', n: 'Pappa', price: 0, hunger: 22, fun: 0 },
  mela: { e: '🍎', n: 'Mela', price: 4, hunger: 18, fun: 4, health: 4 },
  carota: { e: '🥕', n: 'Carota', price: 4, hunger: 16, fun: 2, health: 6 },
  fragola: { e: '🍓', n: 'Fragola', price: 6, hunger: 12, fun: 12, sweet: true },
  biscotto: { e: '🍪', n: 'Biscotto', price: 5, hunger: 10, fun: 12, sweet: true },
  onigiri: { e: '🍙', n: 'Onigiri', price: 7, hunger: 35, fun: 6 },
  zuppa: { e: '🍲', n: 'Zuppa calda', price: 8, hunger: 30, fun: 4, health: 12 },
  budino: { e: '🍮', n: 'Budino', price: 8, hunger: 14, fun: 18, sweet: true },
  pizzetta: { e: '🍕', n: 'Pizzetta', price: 9, hunger: 40, fun: 10 },
  gelato: { e: '🍦', n: 'Gelato', price: 10, hunger: 12, fun: 22, sweet: true, thirst: 6 }
};
/** Cibi che si comprano (tutti tranne la pappa gratuita). */
export const TASTY: FoodId[] = FOOD_IDS.filter(k => k !== 'pappa');

export const HAT_IDS = ['fiore', 'fiocco', 'berretto', 'cilindro', 'corona'] as const;
export type HatId = typeof HAT_IDS[number];
export const HATS: Record<HatId, { e: string; n: string; price: number }> = {
  fiore: { e: '🌸', n: 'Fiore', price: 25 },
  fiocco: { e: '🎀', n: 'Fiocco', price: 30 },
  berretto: { e: '🧢', n: 'Berretto', price: 40 },
  cilindro: { e: '🎩', n: 'Cilindro', price: 60 },
  corona: { e: '👑', n: 'Coroncina', price: 90 }
};

/** x, y e s sono frazioni della cameretta (s = altezza dell'oggetto). */
export const FURN_IDS = ['quadro', 'orso', 'lanterna', 'radio', 'pianta'] as const;
export type FurnId = typeof FURN_IDS[number];
export const FURN: Record<FurnId, { e: string; n: string; price: number; x: number; y: number; s: number }> = {
  quadro: { e: '🖼️', n: 'Quadro', price: 30, x: .53, y: .2, s: .13 },
  orso: { e: '🧸', n: 'Orsetto', price: 40, x: .08, y: .8, s: .15 },
  lanterna: { e: '🏮', n: 'Lanterna', price: 45, x: .9, y: .235, s: .1 },
  radio: { e: '📻', n: 'Radiolina', price: 50, x: .78, y: .9, s: .1 },
  pianta: { e: '🪴', n: 'Pianta grande', price: 55, x: .93, y: .77, s: .2 }
};

export const GAME_IDS = ['memory', 'catch', 'hide'] as const;
export type GameId = typeof GAME_IDS[number];
export const GAMES: Record<GameId, { e: string; n: string; d: string; unit: string }> = {
  memory: { e: '🎨', n: 'Memory dei colori', d: 'Ripeti la sequenza che si illumina.', unit: 'round' },
  catch: { e: '🧺', n: 'Acchiappa la pappa', d: 'Prendi il cibo che cade. Evita la cacca!', unit: 'punti' },
  hide: { e: '📦', n: 'Nascondino', d: 'Segui la scatola dove si nasconde.', unit: 'di fila' }
};

export const PLACE_IDS = ['parco', 'lago', 'bosco'] as const;
export type PlaceId = typeof PLACE_IDS[number];
export interface Place {
  e: string; n: string; dove: string; min: number; energy: number; coins: [number, number]; chance: number;
  stickers: StickerId[]; stories: ((name: string) => string)[];
}
export const PLACES: Record<PlaceId, Place> = {
  parco: {
    e: '🌳', n: 'Parco', dove: 'al parco', min: 15, energy: 10, coins: [3, 8], chance: .5,
    stickers: ['scoiattolo', 'foglia', 'palloncino', 'coccinella'],
    stories: [
      n => `${n} ha rincorso le foglie finché non gli è girata la testa.`,
      n => `${n} ha fatto amicizia con un bambino che mangiava un gelato.`,
      n => `${n} ha dormito dieci minuti su una panchina al sole.`,
      n => `${n} ha provato lo scivolo. Due volte. Poi tre.`
    ]
  },
  lago: {
    e: '🦆', n: 'Lago', dove: 'al lago', min: 30, energy: 16, coins: [6, 14], chance: .6,
    stickers: ['anatroccolo', 'sasso', 'conchiglia', 'ninfea'],
    stories: [
      n => `${n} ha guardato le anatre per mezz'ora senza muoversi.`,
      n => `${n} ha provato a far rimbalzare un sasso. Il sasso non era d'accordo.`,
      n => `${n} si è specchiato nell'acqua e si è fatto una linguaccia.`,
      n => `${n} ha contato le barchette: sette, forse otto.`
    ]
  },
  bosco: {
    e: '🌲', n: 'Bosco', dove: 'nel bosco', min: 60, energy: 24, coins: [10, 22], chance: .75,
    stickers: ['fungo', 'lucciola', 'gufo', 'pigna'],
    stories: [
      n => `${n} ha seguito un sentiero di funghi fino a una radura segreta.`,
      n => `${n} ha sentito un gufo e ha risposto “uh uh”. Sono amici adesso.`,
      n => `${n} si è perso per un attimo, poi ha ritrovato la strada seguendo le lucciole.`,
      n => `${n} ha raccolto castagne e ne ha mangiate metà per strada.`
    ]
  }
};

export const STICKER_IDS = [
  'scoiattolo', 'foglia', 'palloncino', 'coccinella',
  'anatroccolo', 'sasso', 'conchiglia', 'ninfea',
  'fungo', 'lucciola', 'gufo', 'pigna',
  'schiusa', 'desiderio', 'desideri10', 'gusti',
  'memory8', 'catch25', 'hide5', 'settimana',
  'evo_nuvola', 'evo_stellino', 'evo_budino', 'evo_muschio'
] as const;
export type StickerId = typeof STICKER_IDS[number];
export const STICKERS: Record<StickerId, { e: string; n: string; how: string }> = {
  scoiattolo: { e: '🐿️', n: 'Scoiattolo', how: 'Al parco' },
  foglia: { e: '🍁', n: 'Foglia rossa', how: 'Al parco' },
  palloncino: { e: '🎈', n: 'Palloncino', how: 'Al parco' },
  coccinella: { e: '🐞', n: 'Coccinella', how: 'Al parco' },
  anatroccolo: { e: '🐥', n: 'Anatroccolo', how: 'Al lago' },
  sasso: { e: '🪨', n: 'Sasso piatto', how: 'Al lago' },
  conchiglia: { e: '🐚', n: 'Conchiglia', how: 'Al lago' },
  ninfea: { e: '🪷', n: 'Ninfea', how: 'Al lago' },
  fungo: { e: '🍄', n: 'Fungo magico', how: 'Nel bosco' },
  lucciola: { e: '✨', n: 'Lucciole', how: 'Nel bosco' },
  gufo: { e: '🦉', n: 'Gufo saggio', how: 'Nel bosco' },
  pigna: { e: '🌰', n: 'Castagna', how: 'Nel bosco' },
  schiusa: { e: '🐣', n: 'Benvenuto', how: "Schiudi l'uovo" },
  desiderio: { e: '💭', n: 'Primo desiderio', how: 'Esaudisci un desiderio' },
  desideri10: { e: '🌟', n: 'Dieci desideri', how: 'Esaudisci 10 desideri' },
  gusti: { e: '🔍', n: 'Lo conosci bene', how: 'Scopri tutti i gusti' },
  memory8: { e: '🧠', n: 'Super memoria', how: 'Memory: 8 round' },
  catch25: { e: '🧺', n: 'Mani veloci', how: 'Acchiappa: 25 punti' },
  hide5: { e: '🕵️', n: 'Occhio di falco', how: 'Nascondino: 5 di fila' },
  settimana: { e: '📅', n: 'Una settimana', how: '7 giorni di fila' },
  evo_nuvola: { e: '☁️', n: 'Nuvola', how: 'Evoluzione segreta' },
  evo_stellino: { e: '⭐', n: 'Stellino', how: 'Evoluzione segreta' },
  evo_budino: { e: '🍮', n: 'Budino', how: 'Evoluzione segreta' },
  evo_muschio: { e: '🌿', n: 'Muschio', how: 'Evoluzione segreta' }
};

/** Colori del corpo per stadio/evoluzione. a = riflesso, b = colore pieno. */
export type Kind = 'baby' | 'child' | Branch;
export const PAL: Record<Kind, { a: string; b: string }> = {
  baby: { a: '#ffd3e6', b: '#ff9fca' }, child: { a: '#c2f5e2', b: '#78d9b6' },
  nuvola: { a: '#e3f3ff', b: '#9fcff7' }, stellino: { a: '#fff0b8', b: '#ffc84a' },
  budino: { a: '#ffe0c4', b: '#ffab76' }, muschio: { a: '#d7efcb', b: '#95c882' }
};
