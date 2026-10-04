import { FOODS, GAMES, PLACES, STICKERS, STICKER_IDS } from '../game/content';
import type { GameState } from '../game/types';

export function Album({ s }: { s: GameState | null }) {
  const T = s?.traits, K = s?.known ?? {};
  const traits: [string, string | null, string][] = [
    ['Cibo preferito', T && K.favFood ? `${FOODS[T.favFood].e} ${FOODS[T.favFood].n}` : null, 'Prova cibi diversi'],
    ['Cibo che odia', T && K.hateFood ? `${FOODS[T.hateFood].e} ${FOODS[T.hateFood].n}` : null, 'Lo scopri a tue spese'],
    ['Gioco preferito', T && K.favGame ? `${GAMES[T.favGame].e} ${GAMES[T.favGame].n}` : null, 'Gioca a tutti e tre'],
    ['Posto preferito', T && K.favPlace ? `${PLACES[T.favPlace].e} ${PLACES[T.favPlace].n}` : null, 'Portalo a passeggio']
  ];
  const r = s?.records ?? { memory: 0, catch: 0, hide: 0 };
  const have = STICKER_IDS.filter(id => s?.stickers[id]).length;

  return (
    <section className="tab">
      <section className="card">
        <h2 className="sec">{s ? `I gusti di ${s.name}` : 'I suoi gusti'}</h2>
        <div className="traits">
          {traits.map(([label, value, hint]) => (
            <div className="trait" key={label}>
              <span className="label">{label}</span>
              <div className={'v' + (value ? '' : ' unk')}>{value ?? '???'}</div>
              <small>{value ? 'Scoperto' : hint}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="sec">Record</h2>
        <div className="recs">
          <Rec n={r.memory} l={['Memory', 'round']} />
          <Rec n={r.catch} l={['Acchiappa', 'punti']} />
          <Rec n={r.hide} l={['Nascondino', 'di fila']} />
          {s && <>
            <Rec n={s.wishesDone} l={['Desideri', 'esauditi']} />
            <Rec n={s.walks} l={['Passeggiate', 'fatte']} />
            <Rec n={s.daily.streak} l={['Giorni', 'di fila']} />
          </>}
        </div>
      </section>

      <section className="card">
        <h2 className="sec">Figurine <span className="count">{have} / {STICKER_IDS.length}</span></h2>
        <div className="stickers">
          {STICKER_IDS.map(id => {
            const S = STICKERS[id], got = !!s?.stickers[id];
            return (
              <div key={id} className={'stk' + (got ? '' : ' miss')} title={got ? S.n : S.how}>
                <span className="em">{S.e}</span>
                <small>{got ? S.n : S.how}</small>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function Rec({ n, l }: { n: number; l: [string, string] }) {
  return <div className="rec"><b>{n}</b><span>{l[0]}<br />{l[1]}</span></div>;
}
