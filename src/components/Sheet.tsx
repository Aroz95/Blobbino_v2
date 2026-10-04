import { useEffect, type ReactNode } from 'react';

/** Pannello che sale dal basso. Si chiude con la ×, toccando fuori o con Esc. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheetwrap" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="x" type="button" aria-label="Chiudi" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Una riga con emoji, titolo, sottotitolo e un'azione a destra. */
export function Row({ e, title, tag, sub, hl, action }: {
  e: string; title: string; tag?: string; sub: string; hl?: boolean; action?: ReactNode;
}) {
  return (
    <div className={'rowi' + (hl ? ' hl' : '')}>
      <div className="em">{e}</div>
      <div><b>{title}{tag && <span className="tag">{tag}</span>}</b><small>{sub}</small></div>
      {action ?? <span />}
    </div>
  );
}
