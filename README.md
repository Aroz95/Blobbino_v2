# Blobbino

Un blob virtuale da nutrire, coccolare e far crescere. Web app installabile, funziona offline.

**Gioca:** https://aroz95.github.io/Blobbino/

## Tecnologie

- **React 19 + TypeScript**, compilati con **Vite**
- La cameretta e due minigiochi sono disegnati su **canvas**, senza librerie
- Funzionamento offline con un service worker scritto a mano (`public/sw.js`)
- Pronto per **Capacitor**, se un giorno vuoi pubblicarlo sugli store

## Come è organizzato il codice

```
src/
  game/          La logica del gioco. Non dipende da React.
    content.ts     Cibi, cappelli, arredi, luoghi, figurine: per aggiungere roba si parte da qui
    types.ts       La forma dei dati salvati
    state.ts       Creazione del blob, aggiornamento dei salvataggi vecchi, scorrere del tempo
    actions.ts     Tutto ciò che si può fare: nutrire, giocare, passeggiare, comprare, desideri
    bus.ts         Canale verso l'interfaccia (messaggi, cuoricini, avvisi)
    util.ts        Tempi, numeri casuali, formati
  store/
    game.ts        Dove vive lo stato: useGame() per leggerlo, update() per cambiarlo
    storage.ts     Lettura e scrittura sul dispositivo (unico punto da cambiare per Capacitor)
    backup.ts      Codice di backup BLOB1-…
  scene/           Disegno della cameretta (draw.ts) e componente React (Scene.tsx)
  screens/         Le tre schede: Casa, Negozio, Album
  sheets/          I pannelli che salgono dal basso
  minigames/       Memory, Acchiappa la pappa, Nascondino
  components/      Pezzi riusabili: icone, pannello, riga
  App.tsx          Schede, pannelli, messaggi
  main.tsx         Avvio
public/            Icone, manifest e service worker, copiati così come sono
```

La regola principale: **la logica sta in `src/game` e non sa niente di React**. I componenti leggono lo stato con `useGame()` e lo cambiano con `update(s => azione(s))`. `update` lavora su una copia, fa scorrere il tempo, salva e aggiorna lo schermo.

## Lavorarci sul computer

Serve [Node.js](https://nodejs.org) 20 o più recente.

```bash
npm install
npm run dev        # apre il gioco su http://localhost:5173 e si aggiorna a ogni modifica
npm run typecheck  # controlla gli errori di TypeScript
npm run build      # crea la versione da pubblicare in dist/
```

## Pubblicazione

Ogni volta che qualcosa arriva sul ramo `main`, GitHub compila e pubblica da solo (`.github/workflows/deploy.yml`).

**Dal telefono:** comprimi i file del progetto in uno zip (senza `node_modules` e `dist`) e caricalo con *Add file → Upload files*. Il workflow lo estrae, lo cancella e pubblica.

**Dal computer:** normale `git push`.

Quando aggiorni l'app, cambia `VERSION` in `public/sw.js`: così chi ha l'app installata riceve la versione nuova.

## Verso App Store e Google Play (più avanti)

Serve un Mac con Xcode per iOS, Android Studio per Android.

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npm run build
npx cap add ios        # oppure: npx cap add android
npx cap sync
npx cap open ios
```

La configurazione è già in `capacitor.config.json`. Prima di pubblicare su uno store, sostituisci il contenuto di `src/store/storage.ts` con `@capacitor/preferences`: iOS può cancellare il localStorage delle app quando manca spazio.

## Salvataggio

Il blob è salvato solo sul dispositivo (chiave `blobbino-v1`, che è la stessa della prima versione). Dal link **Backup** in fondo alla Casa si copia un codice da conservare e lo si può ripristinare su un altro dispositivo.
