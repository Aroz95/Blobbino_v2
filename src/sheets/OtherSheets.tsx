import { useState } from 'react';
import type { GameState, Notice } from '../game/types';
import { replaceState } from '../store/game';
import { decodeBackup, encodeBackup } from '../store/backup';
import { ui } from '../game/bus';
import { Row, Sheet } from '../components/Sheet';

export function NoticeSheet({ n, onClose }: { n: Notice; onClose: () => void }) {
  return (
    <Sheet title={n.title} onClose={onClose}>
      <div className="loot">
        {n.story && <p className="story">{n.story}</p>}
        {n.intro && <p>{n.intro}</p>}
        <div className="rows">
          {n.rows.map((r, i) => <Row key={i} e={r.e} title={r.title} sub={r.sub} hl={r.hl} />)}
        </div>
      </div>
      <div className="sheet-actions"><button className="btn" type="button" onClick={onClose}>{n.button}</button></div>
    </Sheet>
  );
}

export function ResetSheet({ s, onClose }: { s: GameState | null; onClose: () => void }) {
  return (
    <Sheet title="Ricominciare da capo?" onClose={onClose}>
      <p className="sheet-text">
        {s ? `${s.name}, i suoi gusti, le stelline e le figurine verranno cancellati. Se vuoi tenerlo, prima salva un codice di backup.` : 'Non c’è ancora nessun blob da cancellare.'}
      </p>
      <div className="sheet-actions">
        <button className="btn ghost" type="button" onClick={onClose}>Annulla</button>
        {s && <button className="btn" type="button" onClick={() => { replaceState(null); onClose(); window.scrollTo(0, 0); }}>Sì, ricomincia</button>}
      </div>
    </Sheet>
  );
}

export function BackupSheet({ s, onClose }: { s: GameState; onClose: () => void }) {
  // Il codice si calcola una volta all'apertura: non deve cambiare mentre lo copi.
  const [code] = useState(() => encodeBackup(s));
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<GameState | null>(null);

  const copy = async () => {
    try { await navigator.clipboard.writeText(code); ui.toast('Codice copiato'); }
    catch {
      const el = document.getElementById('backupOut') as HTMLTextAreaElement | null;
      el?.select(); ui.toast('Seleziona il testo e copialo a mano');
    }
  };
  const check = () => {
    try { setPending(decodeBackup(input)); setError(''); }
    catch (e) { setPending(null); setError(e instanceof Error ? e.message : 'Codice non valido.'); }
  };

  return (
    <Sheet title="Backup" onClose={onClose}>
      <div className="backup">
        <label className="label" htmlFor="backupOut">Il codice di {s.name}</label>
        <p className="sheet-text">Copialo e conservalo, per esempio nelle Note. Con questo codice ritrovi il blob su un altro telefono o dopo aver reinstallato l'app.</p>
        <textarea id="backupOut" readOnly value={code} rows={3} onFocus={e => e.currentTarget.select()} />
        <div className="sheet-actions"><button className="btn" type="button" onClick={copy}>Copia codice</button></div>

        <label className="label" htmlFor="backupIn">Ripristina da un codice</label>
        <textarea id="backupIn" rows={3} placeholder="BLOB1-…" value={input}
          onChange={e => { setInput(e.target.value); setError(''); setPending(null); }} />
        {error && <p className="err">{error}</p>}
        {pending ? (
          <div className="confirm-box">
            <p className="sheet-text">Trovato <b>{pending.name}</b>. Se continui, {s.name} verrà sostituito.</p>
            <div className="sheet-actions">
              <button className="btn ghost" type="button" onClick={() => setPending(null)}>Annulla</button>
              <button className="btn" type="button" onClick={() => { replaceState(pending); onClose(); ui.toast(`Bentornato ${pending.name}!`); }}>Sostituisci</button>
            </div>
          </div>
        ) : (
          <div className="sheet-actions"><button className="btn ghost" type="button" onClick={check} disabled={!input.trim()}>Controlla codice</button></div>
        )}
      </div>
    </Sheet>
  );
}
