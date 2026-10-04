import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { boot, startClock } from './store/game';
import { askPersistence } from './store/storage';
import './styles.css';

const awayMs = boot();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App awayMs={awayMs} />
  </StrictMode>
);
startClock();
askPersistence();

// Funzionamento offline: solo per la web app pubblicata, non in sviluppo né dentro l'app nativa (Capacitor).
const isNative = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
if (import.meta.env.PROD && !isNative && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
