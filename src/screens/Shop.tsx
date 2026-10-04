import { FOODS, FURN, FURN_IDS, HATS, HAT_IDS, TASTY } from '../game/content';
import { buy, toggleFurn, toggleHat, type ShopSection } from '../game/actions';
import type { GameState } from '../game/types';
import { ui } from '../game/bus';
import { update } from '../store/game';
import { Star } from '../components/Icons';

const NOTES: Record<ShopSection, string> = {
  food: 'Il cibo comprato finisce in dispensa. La pappa è sempre gratis.',
  hats: 'Un cappellino alla volta. Si vede subito sulla sua testa.',
  furn: 'I mobili compaiono nella cameretta. Puoi toglierli e rimetterli quando vuoi.'
};

export function Shop({ s, sec, setSec }: { s: GameState | null; sec: ShopSection; setSec: (s: ShopSection) => void }) {
  const coins = s?.coins ?? 0;
  const guard = (fn: (s: GameState) => void) => () => { if (!s) ui.toast('Prima dai un nome al tuo uovo.'); else update(fn); };

  return (
    <section className="tab">
      <div className="seg" role="tablist" aria-label="Reparti">
        {([['food', 'Cibo'], ['hats', 'Cappelli'], ['furn', 'Arredo']] as const).map(([id, l]) => (
          <button key={id} type="button" role="tab" aria-selected={sec === id} onClick={() => setSec(id)}>{l}</button>
        ))}
      </div>
      <p className="shopnote">{NOTES[sec]}</p>
      <div className="shop">
        {sec === 'food' && TASTY.map(id => {
          const F = FOODS[id], n = s?.inv[id] ?? 0;
          const tag = s?.known.favFood && s.traits.favFood === id ? 'Preferito' : s?.known.hateFood && s.traits.hateFood === id ? 'Lo odia' : '';
          const fx = [`Pancia +${F.hunger}`, F.fun ? `Gioia +${F.fun}` : '', F.health ? `Salute +${F.health}` : ''].filter(Boolean).join(' · ');
          return (
            <div className="item" key={id}>
              <div className="em">{F.e}</div>
              <b>{F.n}{tag && <span className="tag">{tag}</span>}</b>
              <small>{fx}</small>
              {n > 0 && <span className="own">In dispensa: {n}</span>}
              <Price coins={coins} p={F.price} onClick={guard(st => buy(st, 'food', id))} />
            </div>
          );
        })}
        {sec === 'hats' && HAT_IDS.map(id => {
          const H = HATS[id], own = !!s?.hats.includes(id), on = s?.hat === id;
          return (
            <div className="item" key={id}>
              <div className="em">{H.e}</div>
              <b>{H.n}</b>
              <small>{on ? 'Lo indossa adesso' : own ? 'Nel suo armadio' : 'Cappellino'}</small>
              {own
                ? <button className={'btn small' + (on ? ' ghost' : '')} type="button" onClick={guard(st => toggleHat(st, id))}>{on ? 'Togli' : 'Indossa'}</button>
                : <Price coins={coins} p={H.price} onClick={guard(st => buy(st, 'hats', id))} />}
            </div>
          );
        })}
        {sec === 'furn' && FURN_IDS.map(id => {
          const F = FURN[id], own = !!s?.furn.includes(id), on = !!s?.furnOn.includes(id);
          return (
            <div className="item" key={id}>
              <div className="em">{F.e}</div>
              <b>{F.n}</b>
              <small>{on ? 'Nella cameretta' : own ? 'In soffitta' : 'Arredo'}</small>
              {own
                ? <button className={'btn small' + (on ? ' ghost' : '')} type="button" onClick={guard(st => toggleFurn(st, id))}>{on ? 'Togli' : 'Metti'}</button>
                : <Price coins={coins} p={F.price} onClick={guard(st => buy(st, 'furn', id))} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Fuori dal componente Shop: così il pulsante non viene ricreato a ogni secondo e non perde i tocchi. */
function Price({ p, coins, onClick }: { p: number; coins: number; onClick: () => void }) {
  return <button className={'btn small' + (coins < p ? ' poor' : '')} type="button" onClick={onClick}><Star />{p}</button>;
}
