# Repàs Actiu — Auditoria editorial i tècnica del Mode Examen difícil — 2026-09-18

## Resultat

`REPASACTIU_HARD_EXAM_AUDIT=PASS`

Aquesta auditoria cobreix la incorporació del **Mode Examen difícil / Modo Examen difícil** sobre el catàleg publicat de **526 preguntes**, mantenint intactes els bancs canònics de pràctica.

## Invariants preservats

Per a cada pregunta, el mode difícil conserva:

- el mateix ID;
- el mateix enunciat canònic;
- la mateixa resposta correcta;
- la mateixa explicació;
- la mateixa ajuda de memòria;
- la mateixa traçabilitat de font;
- la mateixa correspondència semàntica català/castellà de la resposta correcta.

El mode difícil substitueix exclusivament les tres alternatives incorrectes mitjançant overlays separats.

La comparació final de la branca amb `main@066b249aa55de4bf755cd325257d16c237436abd` confirma que no s'ha modificat cap banc canònic de preguntes, cap traducció canònica, cap fitxer d'ajudes de memòria, cap manifest de traçabilitat ni `content_corrections.json`.

## Cobertura dels overlays

| Bloc | Registres |
|---|---:|
| Bloc 1 | 50 |
| Bloc 2 | 70 |
| Bloc 3 | 70 |
| Bloc 4 | 60 |
| Bloc 5 | 60 |
| Unitat 2 · Bloc 1 | 140 |
| UF0518 · Bloc 1 | 76 |
| **Total** | **526** |

Cada registre conté exactament tres distractors en català i tres en castellà.

## Auditoria editorial automatitzada

El nou `test:audit:hard` comprova sobre el contingut efectiu, després de correccions:

- cobertura exacta 526/526;
- inexistència d'IDs orfes o duplicats;
- correspondència exacta entre bloc i overlay;
- tres distractors no buits per idioma;
- absència de duplicats normalitzats dins d'una pregunta;
- cap distractor igual a la resposta correcta normalitzada;
- almenys dos distractors nous respecte de Pràctica per idioma;
- detecció de fuites inequívoces de català en els distractors castellans;
- màxim d’un distractor per idioma amb absoluts editorials que poden actuar com a pista (`només/sempre/mai/exclusivament/necessàriament/únicament` i equivalents castellans);
- declaració exacta dels set fitxers hard al catàleg.

Resultat final:

- `HARD_DISTRACTOR_AUDIT=PASS`
- `QUESTIONS=526`
- `HARD_RECORDS=526`
- `HARD_FILES=7`

## Remediació editorial durant l'auditoria

Quan el nou auditor es va activar per primera vegada, va detectar **66 preguntes** que no complien l'exigència editorial d'introduir almenys dos distractors realment diferents dels del mode Pràctica.

No es va relaxar el criteri. Es van revisar i substituir aquests 66 registres amb alternatives més pròximes conceptualment, mantenint una única resposta correcta i la correspondència CA/ES.

Durant la revisió posterior també es va detectar i corregir una frase castellana amb un fragment accidental en anglès a `u2b1-113`. Una comprovació addicional dels set overlays no va trobar més senyals angleses equivalents.

Un segon barrido editorial va buscar distractors amb absoluts que podien facilitar l’eliminació mecànica d’opcions. Es van detectar **32 preguntes** amb dos o tres distractors d’aquest tipus. Es van reescriure amb confusions conceptuals més plausibles, sense modificar cap resposta correcta. El criteri es va convertir en una regla permanent de l’auditor i el resultat final és **0 preguntes** amb més d’un distractor d’aquest tipus per idioma.

## Permutacions i alineació bilingüe

L'auditoria de permutacions executa el motor real de barreja sobre les dues representacions:

- Pràctica: 526 × 24 permutacions × 2 idiomes = **25.248 casos**;
- Examen difícil: 526 × 24 permutacions × 2 idiomes = **25.248 casos**;
- total: **50.496/50.496 PASS**.

Això comprova que la posició correcta es conserva i que català i castellà mantenen la mateixa correspondència sota totes les permutacions possibles de quatre opcions.

## Regressió de producte

CI #203 sobre el HEAD de producte i contingut `c17e6f0c134196ba22e9ba81cf9c755d675db39f`:

- validació del banc: PASS;
- traçabilitat de fonts: PASS;
- contracte bilingüe: PASS;
- qualitat de contingut canònic: PASS;
- auditoria hard: PASS;
- permutacions: 50.496/50.496 PASS;
- unit tests: **87/87 PASS**;
- Playwright E2E: **22/22 PASS**.

Els E2E específics del mode difícil verifiquen, entre altres punts:

- opció independent de Mode Estudi i Mode Examen;
- ús real dels distractors de l'overlay;
- absència de feedback i ajuda de memòria durant l'examen;
- inici des d'un bloc i des de Tot el temari;
- canvi CA → ES conservant la resposta seleccionada;
- examen complet de 10 preguntes;
- respostes en blanc;
- penalització de −0,33;
- historial amb `mode: hard-exam`;
- revisió posterior amb les opcions difícils presentades;
- funcionament en viewport mòbil sense desbordament horitzontal.

## Compatibilitat

Es conserva la clau `repasActiu:v1` i no es requereix migració d'estat. Pràctica, Examen normal i Repàs d'errors continuen utilitzant la representació canònica existent. Només `hard-exam` compon les preguntes amb els overlays difícils.

## Límit de la garantia

Les comprovacions anteriors ofereixen una garantia tècnica i editorial forta, però no constitueixen una prova matemàtica que sigui impossible qualsevol ambigüitat lingüística residual. La regla de governança continua sent: si una alternativa difícil pot defensar-se com a correcta segons el temari, s'ha de simplificar abans de publicar-la.

En l'estat certificat no queda cap incidència detectada pels auditors ni per la regressió automatitzada.
