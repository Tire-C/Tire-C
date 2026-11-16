# Revisione 5 — viaggio continuo

Candidato verificato tecnicamente e osservato attraverso diagnostica visiva cloud. L'approvazione artistica resta a Tire; nessuna integrazione nel profilo è stata effettuata.

- Sorgente verificato: `3877a3ba32d21be97e6e5bd2af781f554a52f036`.
- Programma e immagini: `cb4e9728be6a690199a924a7b20a6533bf3249ee`.
- [Test cloud conclusi](https://github.com/Tire-C/Tire-C/actions/runs/43896294995): **56 controlli superati**, nessun errore JavaScript o shader.
- [Apri l'anteprima diretta verificata](https://htmlpreview.github.io/?https://github.com/Tire-C/Tire-C/blob/cb4e9728be6a690199a924a7b20a6533bf3249ee/odyssey/review/odyssey.html); [10 controlli del collegamento e del contenitore CodePen superati](https://github.com/Tire-C/Tire-C/actions/runs/43897072761). Il servizio di anteprima legge il file pubblico già autorizzato; non attiva Pages nel repository.
- [Programma HTML autonomo](review/odyssey.html), [galleria diagnostica](diagnostics/README.md), [rapporto completo](diagnostics/report.json).
- Durata: **14 secondi**.

## Che cosa cambia

Il viaggio attraversa ambienti tridimensionali che coesistono nello stesso spazio. I generatori degli otto mondi approvati sono conservati; il vecchio morph tra indici arbitrari è sostituito da un percorso spaziale continuo, con ambienti vicini già visibili in profondità. Una trama di filamenti binari li collega.

La camera segue una curva analitica con parametrizzazione per lunghezza d'arco. Non si arresta né riparte al cambio di mondo. I test misurano velocità interna uniforme e rotazione continua; durante la riproduzione non avvengono nuove allocazioni o caricamenti di buffer geometrici. I buffer e i programmi grafici vengono preparati prima dell'avvio.

Il rendering del viaggio usa un vertice per glifo, con attenuazione continua della luminosità, dimensione massima controllata e esclusione delle strutture fuori dall'inquadratura. Restano prospettiva reale, coordinate XYZ, profondità e glifi 0/1 come unica geometria visibile.

La base anatomica CC0 della revisione 4 è mantenuta. Questa iterazione modifica il suo ruolo nella regia: rivelazione rapida, figura completa più leggibile a distanza e ritiro lungo una direzione fissa, senza orbita laterale o sosta sul volto. Non viene dichiarata una nuova ricostruzione anatomica.

La lettura autorizzata di un numero limitato di indici e note ha orientato la regia verso le connessioni fra informazione, materia, cognizione e ingegneria. Nessun testo privato, documento personale, volto specifico o identificativo personale è incluso nel prodotto pubblico. Un riferimento pubblico pertinente è [Orbital](https://github.com/Tire-C/orbital).

## Ritmo

| Intervallo | Funzione |
|---|---|
| 0–11,00 s | Viaggio continuo nei mondi |
| 11,00–11,85 s | Rivelazione della mente e allontanamento |
| 11,85–12,05 s | Creatore al computer: 0,20 s |
| 12,05–12,45 s | Riordino spaziale nella firma |
| 12,45–13,80 s | Firma completa: 1,35 s |
| 13,80–14,00 s | Dissolvenza |

Firma esatta: **Hi, I am Tire**. In verticale viene conservata l'estensione orizzontale dell'inquadratura, con margini verificati.

## Movimento nei mondi

Tutti i mondi conservano tre livelli di attività: correnti nei tunnel, pacchetti fra architetture di dati, sistemi orbitali, molecole e legami, strutture matematiche, corpi astronomici, segnali neurali, ingranaggi e trasmissioni. Le strutture secondarie mantengono un unico tempo continuo anche mentre la camera attraversa gli ambienti adiacenti. Il test con camera e geometria primaria congelate rileva movimento e contributo visivo in ciascuno degli otto domini.

## Verifica visiva e tecnica

| Aspetto | Evidenza e limite |
|---|---|
| Geometria | Otto ambienti estesi su XYZ; sorgenti scientifiche conservate; anatomia e postazione realmente spaziali. |
| Profondità | Primo piano, ambienti vicini, occlusione, variazione prospettica e parallax osservati. |
| Movimento | Traiettoria continua, velocità uniforme e sequenze di transizione campionate a intervalli di 1/30 s. GPU fisica non verificata. |
| Complessità | Tutti i domini popolati da attività secondarie; 12 zone dello schermo occupate nei campioni osservati. |
| Glifi | Solo 0/1 contribuiscono al colore. Il dettaglio tipografico si riduce inevitabilmente nelle viste lontane e sul telefono. |
| Camera | Nessun salto di stato fra mondi; uscita finale con direzione fissa. |
| Trasformazioni | Attraversamenti spaziali continui; firma con corrispondenza ordinata dei punti, senza rimescolamento casuale. |
| Mente | Gli ambienti sono già contenuti geometricamente nel cranio; più istanti dell'emersione del volto sono stati osservati. |
| Creatore | Figura, mani, seduta e postazione osservate; la vista completa è breve e il volto lontano non è un ritratto dettagliato. |
| Finale | Testo esatto, margini desktop/verticali, passaggio senza salto visibile e durata di lettura verificati. |

Sono stati osservati la galleria degli otto mondi, le sequenze ravvicinate di transizione, gli istanti della rivelazione, la figura completa e la firma desktop/verticale. Gli screenshot sono diagnostica, non fotogrammi usati dal prodotto.

## Prestazioni: confronto corretto

Confronto nello stesso job, stesso rasterizzatore SwiftShader e framebuffer 1280×720, con lettura sincrona dei pixel:

| Versione | Mediana | p95 |
|---|---:|---:|
| R4 | 285.1 ms | 330.5 ms |
| R5 | 52.6 ms | 70.8 ms |

Il rapporto delle mediane è **5.4×**. Questo misura il costo del rendering software su CPU remota. **Non misura gli FPS su GPU fisica e non certifica 60 FPS sul dispositivo dello spettatore.** Fra runner diversi i tempi assoluti variano; il confronto valido è quello interno allo stesso job. Il precedente passaggio di test aveva misurato circa 6,1×.

Chromium esegue la suite completa. Firefox e WebKit hanno renderizzato fisica, creatore e firma nello stesso ambiente Linux con rendering software. La stringa “Apple GPU” restituita da WebKit non viene interpretata come prova di hardware Apple. L'applicazione offre Auto, Detail e Fluidity; Auto può ridurre la risoluzione in caso di frame lenti.

Un primo tentativo di acquisizione è andato in timeout; è stata corretta la sincronizzazione della diagnostica. La misura finale usa readback effettivo dei pixel: il solo invio dei comandi grafici non è stato usato come prova prestazionale.

## Cloud, protezione e ripristino

Tutte le esecuzioni di sviluppo, generazione anatomica, installazioni, build e test sono avvenute sui runner standard pubblici `ubuntu-24.04` di GitHub Actions, [gratuiti secondo la documentazione GitHub](https://docs.github.com/en/billing/concepts/product-billing/github-actions). Nessun runner a pagamento, artifact/cache upload, servizio a consumo o fatturazione attivato. Nessuno sviluppo o test eseguito sul PC dell'utente.

Branch esclusivo: `work/binary-mind-odyssey`. Baseline di questa revisione: `0d42b73085c85ba9e308603692b1d736bf0c1a54`.

Main: `0f00154f3651c7bed8cf8660780bb3c1750ed9bc`. README e copia originale: blob `1d0114fe01e78f186042fc760e37b66d6cf9c090`, SHA-256 `f1abfb3998faf6b417398d8755de720779cc0b874e667d113a4134c207673b3e`.

Per annullare la revisione, preparare un commit inverso limitato al suo diff dalla baseline, confrontando prima eventuali modifiche successive. Non usare reset o force-push. Il profilo non richiede ripristino perché non è stato modificato.

GitHub Pages non è attivato. Il motore WebGL non è incorporabile in un'immagine del README; il precedente test SMIL riguarda solo l'animazione dichiarativa di base. Una futura aggiunta al profilo richiede approvazione esplicita e seguirà [la procedura di inserimento minimo reversibile](integration/PROPOSAL.md), preservando byte per byte il testo preesistente.
