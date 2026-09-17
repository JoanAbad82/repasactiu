# Repàs Actiu — auditoria de màxima confiança — 2026-09-17

`REPASACTIU_MAX_CONFIDENCE_AUDIT=PASS`

## Abast

S'ha reauditat el catàleg publicat de **526 preguntes** amb l'objectiu de reduir al màxim el risc tècnic, editorial, bilingüe i acadèmic. Aquesta certificació no presenta l'absència d'errors humans com una prova matemàtica; sí que deixa exhaustivament comprovables els invariants tècnics i documenta la revisió acadèmica sobre les fonts autoritzades.

## Continuïtat de la revisió acadèmica

Les **450 preguntes UF0517** ja havien estat revisades contra els sis PDF autoritzats en la certificació del 2026-09-16. La comparació Git entre el commit auditat `59bae36072b6650d2661622596764cd9631a3e08` i el commit de producció previ a aquesta auditoria `dc725e6be3483a51e92282f1c32dc5cace65e318` confirma que la incorporació d'UF0518 no va modificar cap banc canònic UF0517, cap traducció castellana UF0517 ni cap fitxer d'ajudes UF0517.

Per tant, la revisió acadèmica prèvia de les 450 preguntes continua sent aplicable sense extrapolar-la a contingut modificat.

## Revisió completa d'UF0518

Les **76 preguntes UF0518** (`uf0518-b1-001` a `uf0518-b1-076`) s'han revisat individualment contra el PDF autoritzat `1. La comunicació escrita cartes comercials i documents administratius (1).pdf`.

S'ha comprovat per a cada pregunta:

- enunciat;
- opció marcada com a correcta;
- plausibilitat de les altres opcions;
- explicació;
- correspondència de la traducció castellana;
- coherència de l'ajuda de memòria;
- correspondència amb la pàgina assignada al manifest de traçabilitat.

Cobertura revisada:

- 001–004 → pàgina 3;
- 005 → pàgina 4;
- 006–008 → pàgina 5;
- 009–013 → pàgina 6;
- 014–017 → pàgina 7;
- 018–022 → pàgina 8;
- 023–027 → pàgina 9;
- 028–030 → pàgina 10;
- 031–033 → pàgina 11;
- 034–036 → pàgina 12;
- 037–039 → pàgina 13;
- 040–041 → pàgina 14;
- 042–046 → pàgina 15;
- 047–049 → pàgina 16;
- 050–053 → pàgina 17;
- 054–057 → pàgina 20;
- 058–062 → pàgina 22;
- 063–065 → pàgina 23;
- 066–069 → pàgina 24;
- 070–072 → pàgina 25;
- 073–076 → pàgina 26.

**Resultat de la segona revisió acadèmica UF0518: 76/76 PASS.** No s'ha detectat cap nova resposta incorrecta ni ambigüitat que exigeixi modificar el banc.

## Nou auditor editorial automatitzat

S'ha incorporat `scripts/content-quality-lib.mjs` a `npm run audit:full`.

El nou control comprova, entre altres invariants:

- duplicats exactes d'enunciat després de normalitzar majúscules, accents, puntuació i espais;
- possibles restes inequívoces de català als camps castellans;
- cobertura de traducció;
- cobertura de traçabilitat;
- fonts declarades existents;
- rangs de pàgina vàlids i dins del nombre físic de pàgines declarat;
- traçabilitats duplicades o òrfenes.

Durant el desenvolupament, una primera versió del detector lingüístic va produir falsos positius perquè `\b` de JavaScript no és un límit Unicode fiable amb caràcters accentuats. Es va identificar la causa i substituir per tokenització Unicode de paraules completes. El detector final té prova de regressió específica.

## TDD i incidències de la pròpia auditoria

La implementació del nou auditor es va iniciar amb una prova RED que fallava perquè el mòdul encara no existia. Posteriorment es va afegir una prova RED perquè `audit:full` exigís explícitament el nou control.

L'ampliació E2E va detectar una fallada a la nova prova de recorregut d'examen. La investigació va demostrar que era un error del test, no del producte: intentava finalitzar l'examen a la pregunta 9. La prova es va corregir perquè navegui fins a la pregunta 10 i després finalitzi. La suite completa va quedar verda.

## Resultat automatitzat final — CI #157

Commit auditat: `43d5ebd40ac2ec4b090c3ef683e28c09db6601c7`.

| Control | Resultat |
|---|---:|
| Preguntes canòniques | 526/526 PASS |
| Traduccions castellanes | 526/526 PASS |
| Ajudes de memòria bilingües | 526/526 PASS |
| Traçabilitat | 526/526 PASS |
| Fonts acadèmiques autoritzades | 7 |
| Duplicats exactes normalitzats | 0 |
| Permutacions per pregunta | 24/24 |
| Idiomes per permutació | 2/2 |
| Casos de posició de resposta | 25.248/25.248 PASS |
| Unit tests | 69/69 PASS |
| E2E Playwright | 17/17 PASS |

Els E2E reforçats inclouen també persistència d'errors i mode de repàs, canvi d'idioma, finalització completa d'un examen de 10 preguntes amb blancs, revisió de resultats i UF0518 en castellà en viewport mòbil sense desbordament horitzontal.

## Garantia correcta

La conclusió defensable és:

**PASS tècnic de màxima confiança sobre els invariants automatitzables, PASS de revisió acadèmica sobre les fonts docents autoritzades i cap defecte acadèmic nou detectat en la segona revisió d'UF0518.**

No es declara una impossibilitat matemàtica d'error humà residual. Qualsevol ampliació futura haurà de tornar a executar `npm run audit:full` i mantenir la traçabilitat de fonts.
