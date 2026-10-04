import { useState, type FormEvent } from 'react';
import { BRANCHES, PLACES, STAT_COLOR, STAT_KEYS, STAT_LABEL } from '../game/content';
import { mood, newState, trustHint } from '../game/state';
import type { GameState } from '../game/types';
import { HOUR, MIN, fmtDur, fmtTime } from '../game/util';
import { tapPet } from '../game/actions';
import { replaceState, update } from '../store/game';
import { Scene } from '../scene/Scene';
import { ActionIcon } from '../components/Icons';
import { ui } from '../game/bus';

export type ActionId = keyof typeof ActionIcon;
const ACTIONS: { id: ActionId; label: string }[] = [
  { id: 'meal', label: 'Cibo' }, { id: 'drink', label: 'Acqua' }, { id: 'play', label: 'Giochi' }, { id: 'walk', label: 'Passeggia' },
  { id: 'cuddle', label: 'Coccole' }, { id: 'bath', label: 'Bagnetto' }, { id: 'medicine', label: 'Medicina' }, { id: 'light', label: 'Nanna' }
];
const WISH_ACTION: Record<string, ActionId | undefined> = { food: 'meal', game: 'play', walk: 'walk', cuddle: 'cuddle', bath: 'bath' };

interface Props {
  s: GameState | null;
  bubble: string | null;
  onAction: (a: ActionId) => void;
  onWish: () => void;
  onBackup: () => void;
  onReset: () => void;
}

export function Home({ s, bubble, onAction, onWish, onBackup, onReset }: Props) {
  const now = Date.now(), egg = !s || s.stage === 'egg';
  return (
    <section className="tab">
      <div className="habitat">
        <Scene onTap={() => { if (s) update(tapPet); }} />
        {s?.walk && (
          <div className="away">
            {s.name} è {PLACES[s.walk.place].dove} {PLACES[s.walk.place].e}
            <small>{s.walk.back ? 'Sta rientrando…' : `Torna tra ${fmtDur(s.walk.end - now)}`}</small>
          </div>
        )}
        <div className={'bubble' + (bubble ? ' show' : '')} role="status" aria-live="polite">{bubble}</div>
        {!s && <Namer />}
      </div>

      <div className="moodline">
        <span>Umore: <b>{mood(s).t}</b></span>
        <span>{nextStage(s, now)}</span>
      </div>

      <WishCard s={s} now={now} onWish={onWish} />

      <section className="card trust" aria-label="Amicizia">
        <div className="row"><span className="label">Fiducia e amicizia</span><span className="val">{s ? Math.round(s.trust) : 60}</span></div>
        <div className="bar big"><i style={{ width: `${s ? Math.round(s.trust) : 60}%`, background: s && s.trust < 35 ? 'var(--warn)' : 'var(--accent)' }} /></div>
        <div className="hint">{trustHint(s)}</div>
      </section>

      <section className="card stats" aria-label="Bisogni">
        {STAT_KEYS.map(k => {
          const v = s ? Math.round(s[k]) : 0;
          return (
            <div key={k} className={'stat' + (!egg && v < 25 ? ' low' : '')}>
              <div className="row"><span>{STAT_LABEL[k]}</span><span>{egg ? '—' : v}</span></div>
              <div className="bar"><i style={{ width: `${egg ? 0 : v}%`, background: STAT_COLOR[k] }} /></div>
            </div>
          );
        })}
      </section>

      <Actions s={s} onAction={onAction} />

      <section className="card diary" aria-label="Diario">
        <h2 className="sec">Diario</h2>
        <ol>
          {(s ? s.log : [{ t: now, m: 'Un uovo tondo e caldo aspetta qualcuno che se ne prenda cura.' }]).slice(0, 8).map((e, i) => (
            <li key={e.t + ':' + i}><time>{fmtTime(e.t)}</time><span>{e.m}</span></li>
          ))}
        </ol>
      </section>

      <div className="foot">
        <span>Salvato su questo dispositivo</span>
        <span className="foot-links">
          {s && <button className="linkbtn" type="button" onClick={onBackup}>Backup</button>}
          <button className="linkbtn" type="button" onClick={onReset}>Ricomincia da capo</button>
        </span>
      </div>
    </section>
  );
}

function nextStage(s: GameState | null, now: number): string {
  if (!s || s.hatchedAt == null) return '';
  if (s.stage === 'baby') return `Cresce tra ${fmtDur(s.hatchedAt + 6 * HOUR - now)}`;
  if (s.stage === 'child') return `Si evolve tra ${fmtDur(s.hatchedAt + 48 * HOUR - now)}`;
  if (s.stage === 'adult' && s.branch) return BRANCHES[s.branch].desc;
  return '';
}

function Namer() {
  const [name, setName] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = newState((name.trim() || 'Mochi').slice(0, 14));
    replaceState(s);
    ui.say(`Ciao ${s.name}! Si sta scaldando…`);
  };
  return (
    <form className="namer" onSubmit={submit}>
      <label htmlFor="nameInput">Come chiamerai il tuo blob?</label>
      <div className="row">
        <input id="nameInput" maxLength={14} autoComplete="off" placeholder="Mochi" value={name} onChange={e => setName(e.target.value)} />
        <button className="btn" type="submit">Accogli l'uovo</button>
      </div>
      <p>L'uovo si schiude in meno di un minuto. Da lì in poi il tempo scorre davvero, anche ad app chiusa.</p>
    </form>
  );
}

function WishCard({ s, now, onWish }: { s: GameState | null; now: number; onWish: () => void }) {
  const w = s?.wish;
  if (s && w) {
    return (
      <section className="card wish" aria-live="polite">
        <div className="em">{w.e}</div>
        <div>
          <p className="t">{s.name} {w.text}</p>
          <p className="s">Scade tra {fmtDur(w.exp - now)} · premio {w.reward} stelline</p>
        </div>
        {!s.walk && <button className="btn small" type="button" onClick={onWish}>Accontenta</button>}
      </section>
    );
  }
  const sub = !s || s.stage === 'egg' ? 'Quando nasce, ogni tanto ti chiederà qualcosa.'
    : s.walk ? 'È in giro: niente richieste per ora.'
    : s.sleeping ? 'Mentre dorme non chiede niente.'
    : `Il prossimo arriva tra circa ${fmtDur(Math.max(MIN, s.nextWishAt - now))}.`;
  return (
    <section className="card wish idle">
      <div className="em">💭</div>
      <div><p className="t">Nessun desiderio</p><p className="s">{sub}</p></div>
    </section>
  );
}

function Actions({ s, onAction }: { s: GameState | null; onAction: (a: ActionId) => void }) {
  const live = !!s && s.stage !== 'egg' && !s.walk;
  const need: Partial<Record<ActionId, boolean>> = live ? {
    meal: s.hunger < 30, drink: s.thirst < 30, play: s.fun < 30, cuddle: s.trust < 40,
    bath: s.hygiene < 30 || s.poops > 0, medicine: s.sick, light: !s.sleeping && s.energy < 20
  } : {};
  const wished = live && s.wish ? WISH_ACTION[s.wish.type] : undefined;
  return (
    <nav className="actions" aria-label="Azioni">
      {ACTIONS.map(({ id, label }) => {
        const off = !live || (s.sleeping && id !== 'light' && id !== 'cuddle') || (id === 'medicine' && !s.sick);
        const cls = 'act' + (wished === id ? ' wished' : need[id] ? ' need' : '');
        return (
          <button key={id} className={cls} type="button" aria-disabled={off} onClick={() => onAction(id)}>
            {ActionIcon[id]}
            {id === 'light' && s?.sleeping ? 'Sveglia' : label}
          </button>
        );
      })}
    </nav>
  );
}
