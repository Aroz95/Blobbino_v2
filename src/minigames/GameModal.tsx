import { useEffect, useState, type ComponentType } from 'react';
import { GAMES, PAL, type GameId } from '../game/content';
import { canPlay, finishGame } from '../game/actions';
import { kindOf } from '../game/state';
import { getState, update } from '../store/game';
import { Catch } from './Catch';
import { Hide } from './Hide';
import { Memory } from './Memory';
import type { GameProps } from './shared';

const IMPL: Record<GameId, ComponentType<GameProps>> = { memory: Memory, catch: Catch, hide: Hide };

/** Finestra comune ai minigiochi: titolo, punteggio, messaggio, Inizia/Esci. */
export function GameModal({ id, onClose }: { id: GameId; onClose: () => void }) {
  const s = getState();
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [msg, setMsg] = useState(GAMES[id].d);
  const [score, setScore] = useState(`Record ${s?.records[id] ?? 0}`);
  const pal = PAL[s ? kindOf(s) : 'baby'];
  const Game = IMPL[id];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const start = () => {
    const st = getState();
    const why = st && canPlay(st);
    if (!st || why) { setMsg(why || ''); return; }
    setPlaying(true); setRun(r => r + 1);
  };
  const finish = (points: number) => {
    const text = update(st => finishGame(st, id, points)) ?? '';
    setPlaying(false); setMsg(text);
    setScore(`Record ${getState()?.records[id] ?? 0}`);
  };

  return (
    <div className="overlay">
      <div className="game" role="dialog" aria-modal="true" aria-label={GAMES[id].n}>
        <div className="ghead"><h2>{GAMES[id].n}</h2><span className="score">{score}</span></div>
        <p className="msg">{msg}</p>
        <Game run={run} pal={pal} setMsg={setMsg} setScore={setScore} finish={finish} />
        <div className="row">
          <button className="btn ghost" type="button" onClick={onClose}>Esci</button>
          {!playing && <button className="btn" type="button" onClick={start}>{run ? 'Gioca ancora' : 'Inizia'}</button>}
        </div>
      </div>
    </div>
  );
}
