import { useEffect, useRef, useState } from 'react';
import type { GameId } from './game/content';
import { on, ui } from './game/bus';
import { bath, cuddle, drink, medicine, ready, toggleSleep, type ShopSection } from './game/actions';
import { stageName } from './game/state';
import type { Notice } from './game/types';
import { fmtDur } from './game/util';
import { getState, update, useGame } from './store/game';
import { Star, TabIcon } from './components/Icons';
import { Home, type ActionId } from './screens/Home';
import { Shop } from './screens/Shop';
import { Album } from './screens/Album';
import { FoodSheet, GamesSheet, WalkSheet } from './sheets/CareSheets';
import { BackupSheet, NoticeSheet, ResetSheet } from './sheets/OtherSheets';
import { GameModal } from './minigames/GameModal';

type Tab = 'casa' | 'negozio' | 'album';
type SheetKind = 'food' | 'games' | 'walk' | 'backup' | 'reset';
const TABS: { id: Tab; label: string }[] = [{ id: 'casa', label: 'Casa' }, { id: 'negozio', label: 'Negozio' }, { id: 'album', label: 'Album' }];

export function App({ awayMs }: { awayMs: number }) {
  const s = useGame();
  const [tab, setTabState] = useState<Tab>('casa');
  const [shopSec, setShopSec] = useState<ShopSection>('food');
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [game, setGame] = useState<GameId | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [bubble, setBubble] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pop, setPop] = useState(false);
  const [unseen, setUnseen] = useState(false);

  const notice = !sheet && !game ? notices[0] : undefined;
  const modalOpen = !!(sheet || game || notice);

  // Il blob "parla" nel fumetto se sei in cameretta senza pannelli aperti, altrimenti con un avviso in basso.
  const ctx = useRef({ tab, modalOpen });
  ctx.current = { tab, modalOpen };
  useEffect(() => {
    let bt = 0, tt = 0, pt = 0;
    const showToast = (msg: string, ms = 2400) => { setToast(msg); clearTimeout(tt); tt = window.setTimeout(() => setToast(null), ms); };
    const offs = [
      on('say', ({ msg, ms = 2600 }) => {
        if (ctx.current.tab !== 'casa' || ctx.current.modalOpen) return showToast(msg, ms);
        setBubble(msg); clearTimeout(bt); bt = window.setTimeout(() => setBubble(null), ms);
      }),
      on('toast', ({ msg, ms }) => showToast(msg, ms)),
      on('coins', () => { setPop(true); clearTimeout(pt); pt = window.setTimeout(() => setPop(false), 220); }),
      on('sticker', () => setUnseen(true)),
      on('notice', n => setNotices(q => [...q, n]))
    ];
    if (awayMs > 30 * 60e3 && getState()?.stage !== 'egg' && !getState()?.walk) ui.say(`Bentornato! Sei stato via ${fmtDur(awayMs)}.`, 3500);
    return () => { offs.forEach(off => off()); clearTimeout(bt); clearTimeout(tt); clearTimeout(pt); };
  }, [awayMs]);

  const setTab = (t: Tab) => {
    setTabState(t);
    if (t === 'album') setUnseen(false);
    window.scrollTo(0, 0);
  };

  /** Si può aprire un pannello di cura? Se no, il blob spiega perché. */
  const canOpen = (): boolean => {
    const st = getState();
    if (!st) { document.getElementById('nameInput')?.focus(); return false; }
    if (st.stage === 'egg' || st.walk) { update(ready); return false; }
    if (st.sleeping) { ui.say(`Shh… ${st.name} sta dormendo.`); return false; }
    return true;
  };

  const onAction = (a: ActionId) => {
    if (!getState()) { document.getElementById('nameInput')?.focus(); return; }
    switch (a) {
      case 'meal': if (canOpen()) setSheet('food'); break;
      case 'play': if (canOpen()) setSheet('games'); break;
      case 'walk': if (canOpen()) setSheet('walk'); break;
      case 'drink': update(drink); break;
      case 'cuddle': update(cuddle); break;
      case 'bath': update(bath); break;
      case 'medicine': update(medicine); break;
      case 'light': update(toggleSleep); break;
    }
  };

  const onWish = () => {
    const w = getState()?.wish;
    if (!w) return;
    if (w.type === 'hat') { setShopSec('hats'); setTab('negozio'); return; }
    onAction(({ food: 'meal', game: 'play', walk: 'walk', cuddle: 'cuddle', bath: 'bath' } as const)[w.type]);
  };

  const now = Date.now();
  const age = !s ? 'In attesa di un nome'
    : s.stage === 'egg' ? `Si schiude tra ${Math.max(0, Math.ceil((s.hatchAt - now) / 1000))} s`
    : `Età ${fmtDur(now - (s.hatchedAt ?? now))}`;

  return (
    <>
      <div className="app">
        <header className="top">
          <div className="who">
            <div className="brand">Blobbino</div>
            <h1>{s ? s.name : 'Un uovo misterioso'}</h1>
            <div className="sub"><span className="chip">{stageName(s)}</span><span className="age">{age}</span></div>
          </div>
          <div className={'coins' + (pop ? ' pop' : '')} title="Stelline" aria-label={`${s?.coins ?? 0} stelline`}>
            <Star /><b>{s?.coins ?? 0}</b>
          </div>
        </header>

        {tab === 'casa' && <Home s={s} bubble={bubble} onAction={onAction} onWish={onWish} onBackup={() => setSheet('backup')} onReset={() => setSheet('reset')} />}
        {tab === 'negozio' && <Shop s={s} sec={shopSec} setSec={setShopSec} />}
        {tab === 'album' && <Album s={s} />}
      </div>

      <nav className="tabbar" role="tablist" aria-label="Sezioni">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {TabIcon[t.id]}{t.label}
            {t.id === 'album' && unseen && tab !== 'album' && <span className="dot" />}
            {t.id === 'casa' && !!s?.wish && tab !== 'casa' && <span className="dot" />}
          </button>
        ))}
      </nav>

      {s && sheet === 'food' && <FoodSheet s={s} onClose={() => setSheet(null)} onShop={() => { setSheet(null); setShopSec('food'); setTab('negozio'); }} />}
      {s && sheet === 'games' && <GamesSheet s={s} onClose={() => setSheet(null)} onPlay={id => { setSheet(null); setGame(id); }} />}
      {s && sheet === 'walk' && <WalkSheet s={s} onClose={() => setSheet(null)} />}
      {s && sheet === 'backup' && <BackupSheet s={s} onClose={() => setSheet(null)} />}
      {sheet === 'reset' && <ResetSheet s={s} onClose={() => setSheet(null)} />}
      {notice && <NoticeSheet n={notice} onClose={() => setNotices(q => q.slice(1))} />}
      {game && <GameModal id={game} onClose={() => setGame(null)} />}

      <div className={'toast' + (toast ? ' show' : '')} role="status" aria-live="polite">{toast}</div>
    </>
  );
}
