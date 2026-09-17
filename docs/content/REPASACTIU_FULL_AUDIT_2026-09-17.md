# Auditoria combinada de Repàs Actiu — 2026-09-17

## Abast

Aquesta certificació cobreix el banc publicat després d'incorporar **UF0518 Bloc 1 — La comunicació escrita, cartes comercials i documents administratius** al banc UF0517 ja auditat.

## Fonts acadèmiques

- UF0517 conserva les sis fonts PDF autoritzades de la certificació anterior.
- UF0518 utilitza exclusivament `1. La comunicació escrita cartes comercials i documents administratius (1).pdf`, 28 pàgines.
- No s'ha utilitzat coneixement web, legislació externa ni coneixement general per crear o validar les preguntes UF0518.

## Resultats estructurals

- Preguntes UF0517 preservades: **450**.
- Preguntes noves UF0518 Bloc 1: **76**.
- Total publicat: **526**.
- Traduccions castellanes: **526/526**.
- Ajudes de memòria bilingües: **526/526**.
- Traçabilitat acadèmica: **526/526**.
- Correctes UF0518 per índex 0/1/2/3: **19/19/19/19**.

## Auditoria de permutacions

Cada pregunta es prova amb les 24 ordenacions possibles de quatre respostes en català i castellà mitjançant el motor real de `shuffleQuestionOptions()`.

`526 × 24 × 2 = 25.248 casos`

Resultat esperat i requerit per CI: **25.248/25.248 PASS**.

Aquest control protegeix específicament contra la classe d'error que podia desalinear l'opció correcta catalana i la traducció castellana després de barrejar les respostes.

## UF0518 — cobertura

La revisió pàgina per pàgina queda documentada a `UF0518_BLOC1_COVERAGE_AUDIT_2026-09-17.md`. El banc cobreix únicament contingut desenvolupat al PDF: fonaments de comunicació escrita, elements, funcions del llenguatge, qualitat i registre, cartes comercials i estructura, tipus de cartes, ofici, memoràndum, circular i sol·licitud.

Els objectius generals de UF0518 sobre recepció, classificació, paqueteria, enviament o mitjans telemàtics no s'han convertit en preguntes quan el Bloc 1 no desenvolupa el concepte.

## Protecció de UF0517

Els 450 ítems UF0517 mantenen els mateixos IDs i índexs canònics de resposta correcta. Els 320 bancs previs protegits continuen sota comprovació byte-per-byte. La nova UF utilitza IDs independents `uf0518-b1-NNN`, de manera que no remapeja el progrés existent.

## Automatització

`npm run audit:full` executa en cadena:

1. validació de bancs i catàleg;
2. validació multi-manifest de traçabilitat acadèmica;
3. contracte bilingüe i editorial;
4. 25.248 comprovacions de permutació;
5. tots els unit tests;
6. tots els E2E Playwright.

Els auditors ja no codifiquen el total històric de 450: deriven la mida publicada del catàleg, de manera que futures ampliacions no necessiten reprogramar el contracte només per canviar el recompte.

## Estat de certificació

Les capes de dades, traçabilitat, bilingüisme, memòria i permutacions han estat verificades amb **PASS** per al banc de 526 preguntes. La certificació de branca només es considera definitiva quan el CI final de la PR passa també tots els E2E actualitzats; la certificació de publicació només es considera completa després del squash merge i un smoke test fresc sobre `repasactiu.pages.dev`.

La garantia correcta és: controls tècnics exhaustius sobre els invariants descrits i revisió acadèmica font-grounded d'alta garantia. No és una prova matemàtica de la impossibilitat absoluta d'un error d'interpretació humana.
