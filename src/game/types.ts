import type { Branch, FoodId, FurnId, GameId, HatId, PlaceId, StatKey, StickerId } from './content';

export type Stage = 'egg' | 'baby' | 'child' | 'adult';

export interface LogEntry { t: number; m: string }

export type WishType = 'food' | 'game' | 'walk' | 'cuddle' | 'bath' | 'hat';
export interface Wish {
  type: WishType;
  target?: string;
  e: string;
  text: string;
  reward: number;
  exp: number;
}

export interface Walk { place: PlaceId; start: number; end: number; back?: boolean }

export interface Traits { favFood: FoodId; hateFood: FoodId; favGame: GameId; favPlace: PlaceId }
export type TraitKey = keyof Traits;

export type Stats = Record<StatKey, number>;

/** Tutto ciò che viene salvato. Le date sono millisecondi (Date.now()). */
export interface GameState extends Stats {
  v: number;
  name: string;
  stage: Stage;
  branch: Branch | null;
  born: number;
  hatchAt: number;
  hatchedAt: number | null;
  last: number;

  trust: number;
  sick: boolean;
  sleeping: boolean;
  distrust: boolean;
  poops: number;
  poopClock: number;
  riskClock: number;

  // medie usate per decidere l'evoluzione
  careSum: number;
  funSum: number;
  trustSum: number;
  careH: number;
  snacks: number;
  plays: number;
  cuddles: number[];

  coins: number;
  inv: Partial<Record<FoodId, number>>;
  hats: HatId[];
  hat: HatId | null;
  furn: FurnId[];
  furnOn: FurnId[];

  traits: Traits;
  known: Partial<Record<TraitKey, boolean>>;
  stickers: Partial<Record<StickerId, number>>;

  wish: Wish | null;
  nextWishAt: number;
  walk: Walk | null;
  daily: { last: string; streak: number };
  records: Record<GameId, number>;
  wishesDone: number;
  walks: number;

  log: LogEntry[];
}

/** Riquadro che compare a tutto schermo quando succede qualcosa (regalo, ritorno dalla passeggiata). */
export interface Notice {
  title: string;
  intro?: string;
  story?: string;
  rows: { e: string; title: string; sub: string; hl?: boolean }[];
  button: string;
}
