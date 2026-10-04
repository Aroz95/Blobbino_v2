import { FOODS, GAMES, GAME_IDS, PLACES, PLACE_IDS, TASTY, type FoodId, type GameId } from '../game/content';
import { buyAndFeed, feed, startWalk } from '../game/actions';
import type { GameState } from '../game/types';
import { update } from '../store/game';
import { Row, Sheet } from '../components/Sheet';
import { Star } from '../components/Icons';

export function FoodSheet({ s, onClose, onShop }: { s: GameState; onClose: () => void; onShop: () => void }) {
  const w = s.wish?.type === 'food' ? s.wish : null;
  const give = (id: FoodId) => { onClose(); update(st => feed(st, id)); };
  const missing = w && !s.inv[w.target as FoodId] ? (w.target as FoodId) : null;
  const tagFor = (id: FoodId) => w?.target === id ? 'Desiderio'
    : s.known.favFood && s.traits.favFood === id ? 'Preferito'
    : s.known.hateFood && s.traits.hateFood === id ? 'Lo odia' : undefined;

  return (
    <Sheet title="Cosa gli dai?" onClose={onClose}>
      <div className="rows">
        {missing && (
          <Row e={FOODS[missing].e} title={FOODS[missing].n} tag="Desiderio" sub="Non ce l'hai in dispensa" hl
            action={
              <button className={'btn small' + (s.coins < FOODS[missing].price ? ' poor' : '')} type="button"
                onClick={() => { if (s.coins >= FOODS[missing].price) onClose(); update(st => buyAndFeed(st, missing)); }}>
                <Star />{FOODS[missing].price}
              </button>
            } />
        )}
        {(['pappa', ...TASTY] as FoodId[]).filter(id => id === 'pappa' || (s.inv[id] ?? 0) > 0).map(id => (
          <Row key={id} e={FOODS[id].e} title={FOODS[id].n} tag={tagFor(id)} hl={w?.target === id}
            sub={id === 'pappa' ? 'Sempre disponibile' : `In dispensa: ${s.inv[id]}`}
            action={<button className="btn small" type="button" onClick={() => give(id)}>Dai</button>} />
        ))}
      </div>
      <div className="sheet-actions">
        <button className="btn ghost" type="button" onClick={onShop}>Compra altro cibo</button>
      </div>
    </Sheet>
  );
}

export function GamesSheet({ s, onClose, onPlay }: { s: GameState; onClose: () => void; onPlay: (id: GameId) => void }) {
  return (
    <Sheet title="A cosa giochiamo?" onClose={onClose}>
      <div className="rows">
        {GAME_IDS.map(id => {
          const G = GAMES[id], wished = s.wish?.type === 'game' && s.wish.target === id;
          const tag = wished ? 'Desiderio' : s.known.favGame && s.traits.favGame === id ? 'Preferito' : undefined;
          return (
            <Row key={id} e={G.e} title={G.n} tag={tag} hl={wished} sub={`${G.d} Record: ${s.records[id]} ${G.unit}`}
              action={<button className="btn small" type="button" onClick={() => onPlay(id)}>Gioca</button>} />
          );
        })}
      </div>
    </Sheet>
  );
}

export function WalkSheet({ s, onClose }: { s: GameState; onClose: () => void }) {
  return (
    <Sheet title="Dove andiamo?" onClose={onClose}>
      <div className="rows">
        {PLACE_IDS.map(id => {
          const P = PLACES[id], wished = s.wish?.type === 'walk' && s.wish.target === id;
          const tag = wished ? 'Desiderio' : s.known.favPlace && s.traits.favPlace === id ? 'Preferito' : undefined;
          return (
            <Row key={id} e={P.e} title={P.n} tag={tag} hl={wished} sub={`${P.min} min · energia −${P.energy} · più lontano, più tesori`}
              action={<button className="btn small" type="button" onClick={() => { if (update(st => startWalk(st, id))) onClose(); }}>Parti</button>} />
          );
        })}
      </div>
      <p className="shopnote sheet-note">Mentre è via i bisogni calano lo stesso. Al ritorno porta stelline, a volte cibo e figurine.</p>
    </Sheet>
  );
}
