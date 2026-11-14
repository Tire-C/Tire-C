# Prima versione da valutare — verifica tecnica e visiva

Stato: candidato per valutazione personale, non approvato per il profilo e non dichiarato successo artistico definitivo.

- Codice verificato: `f20e011a36523c302efac61372b6ecfe0e4a88cf`.
- Output e diagnostica: `c0f8a6e97a32fb8d4bcb340e9e47753fbbca7124`.
- [Esecuzione cloud conclusa](https://github.com/Tire-C/Tire-C/actions/runs/43505233274).
- 47 controlli superati; 28 istanti della timeline acquisiti, oltre a viste alternative, ritratto e confronti browser.
- [Programma HTML autonomo](review/odyssey.html), 531.166 byte. Scaricare il singolo file e aprirlo nel browser per osservarlo: nessuna installazione, build o server locale.
- [Galleria diagnostica](diagnostics/README.md), [dati dei test](diagnostics/report.json).
- Pages non attivato; nessun URL di hosting dell'applicazione viene dichiarato disponibile.

## Verifica separata dei dieci criteri

| Criterio | Evidenza osservata e limite |
|---|---|
| Qualità geometrica | Otto ambienti con estensione XYZ, testa con lineamenti, corpo articolato seduto, sedia, tavolo, tastiera e monitor con spessore. Forma umana volutamente stilizzata e parametrica, non ritratto realistico. |
| Profondità | Prospettiva, differenze di scala tra primo piano e fondo, occlusione tra glifi. Acquisizioni laterale e posteriore confermano geometria non planare. |
| Fluidità | Riproduzione reale e pausa verificate. La continuità numerica della camera è testata su 3.200 campioni. Nessuna garanzia di frame rate su GPU fisica; il software renderer è lento. |
| Complessità | 28.000 istanze per ambiente interno. Testa 11.510, corpo 20.500, postazione 18.979 campioni. I numeri non sono una misura di qualità artistica. |
| Leggibilità binaria | Glifi 0/1 osservabili nei primi piani; densità adattata alla distanza. Nelle inquadrature lontane i caratteri diventano molto piccoli: ingrandire con Inspect 3D per esaminarli. |
| Continuità camera | Un unico spazio e percorso; l'universo è già collocato nel cranio. Il ciclo termina con una dissolvenza e riparte dall'immersione. |
| Trasformazioni | Morphing GPU tra campioni tridimensionali; orbite e meccanismi con rotazioni procedurali. Il finale riordina i glifi ed elimina gradualmente quelli eccedenti. |
| Rivelazione | Osservati più istanti tra 16 e 22 s: i meccanismi restano visibili mentre emergono volto e cranio. Una dissolvenza selettiva della calotta rende leggibile l'interno; successivamente la superficie si ricompone. |
| Creatore al computer | Scena osservata in Chromium, Firefox e WebKit, anche lateralmente e da dietro. Mani, gambe, seduta e postazione hanno coordinate spaziali effettive. |
| Finale | Testo esatto “Hi, I am Tire”, composto da glifi binari e mantenuto per 3,5 s prima della dissolvenza. Acquisizioni desktop e verticali esaminate; margini laterali testati. |

Queste osservazioni supportano la validità tecnica della prima versione. L'efficacia narrativa e l'approvazione artistica restano dell'utente.

## Ambiente e prestazioni

Tutte le installazioni, build, esecuzioni e acquisizioni sono avvenute su GitHub Actions, runner standard `ubuntu-24.04` del repository pubblico. Nessun comando locale, download sul computer dell'utente, servizio a pagamento, noleggio GPU o fatturazione attivata.

Chromium: ANGLE SwiftShader su CPU remota. La misurazione con lettura effettiva dei pixel ha registrato mediana 531.4 ms e p95 608.6 ms per campione. **Non è un risultato fluido e non è una misura delle prestazioni su GPU reale.** Le precedenti misure basate sul solo invio comandi/finish erano insufficienti e sono state sostituite.

Firefox: rendering riuscito con contesto software e display virtuale Xvfb; renderer riportato “llvmpipe, or similar”.
WebKit: rendering della scena riuscito nel runner. La stringa esposta “Apple GPU” non prova la presenza di una GPU fisica e non viene utilizzata per dichiarare tale verifica.

Copertura browser: suite principale e timeline su Chromium; verifica della scena del creatore su Firefox e WebKit. Non equivale a una suite completa su tutti i browser/dispositivi o al test di Safari su hardware Apple.

Durante la sola osservazione, il browser dello spettatore usa la propria implementazione WebGL. Non viene richiesta alcuna compilazione o elaborazione esterna al normale programma visualizzato.

## README e protezione profilo

La prova SMIL in [compatibility/README.md](compatibility/README.md) è stata osservata nel vero rendering Markdown di GitHub con un browser remoto: i pixel dell'immagine cambiano nel tempo senza JavaScript. Questo prova compatibilità dichiarativa di base, non equivalenza con l'opera 3D. Non si propone di integrare il piccolo test o una sua versione impoverita.

Il README originale è invariato e conservato in [audit/README.original.md](audit/README.original.md).
- Main originale: `0f00154f3651c7bed8cf8660780bb3c1750ed9bc`.
- Blob README: `1d0114fe01e78f186042fc760e37b66d6cf9c090`.
- SHA-256 README: `f1abfb3998faf6b417398d8755de720779cc0b874e667d113a4134c207673b3e`.

[Proposta di aggiunta minima e ripristino](integration/PROPOSAL.md): applicabile soltanto dopo approvazione, mantenendo tutti i byte preesistenti e un commit dedicato reversibile. Attualmente non serve alcun ripristino del profilo: main non è stato modificato.
