# Repàs Actiu — Full Question Bank Certification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Certificar de forma exhaustiva el banc de 450 preguntes de Repàs Actiu, tant tècnicament com respecte dels sis PDF originals del curs, i deixar els controls automatitzats per a futures ampliacions.

**Architecture:** Afegirem una auditoria tècnica exhaustiva que comprovi totes les 24 permutacions possibles de quatre opcions per a cada pregunta i idioma. Afegirem també un registre de traçabilitat font→pregunta per a les 450 preguntes, validat automàticament, i un informe final que separi clarament garanties automàtiques i revisió editorial contra el temari.

**Tech Stack:** Node.js 22, ES modules, `node:test`, Playwright, JSON, GitHub Actions.

**Spec:** `docs/content/UF0517_COVERAGE_AUDIT_2026-09-16.md`

## Global Constraints

- Fonts acadèmiques exclusives: els sis PDF originals UF0517 disponibles a la biblioteca del projecte.
- No introduir coneixement general, web ni legislació externa per validar o corregir contingut.
- Les preguntes continuen tenint exactament quatre opcions i una sola resposta correcta.
- Català és el contingut canònic; castellà no duplica el camp `correct`.
- Qualsevol correcció de contingut detectada ha de quedar justificada per la font.
- Les ajudes de memòria continuen limitades a 144 caràcters per idioma.
- La certificació no pot declarar 100% acadèmic en sentit matemàtic: ha de distingir exhaustivitat tècnica de revisió editorial humana/font-grounded.

---

### Task 1: Contracte d'auditoria exhaustiva de permutacions

**Files:**
- Create: `tests/unit/full-permutation-audit.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: els 18 bancs, 12 fitxers de traducció i `shuffleQuestionOptions()`.
- Produces: comprovació de 450 × 24 × 2 = 21.600 casos lingüístics de posició de resposta correcta.

- [ ] Escriure la prova que enumera les 24 permutacions de quatre opcions.
- [ ] Per cada pregunta, construir cadascuna de les 24 ordenacions i verificar que l'opció canònica correcta i la seva traducció castellana queden al mateix índex lògic.
- [ ] Verificar que cap permutació perd o duplica opcions.
- [ ] Afegir `npm run test:audit:permutations`.
- [ ] Executar i confirmar PASS de 21.600 casos.

### Task 2: Traçabilitat acadèmica 450/450

**Files:**
- Create: `docs/content/UF0517_SOURCE_TRACEABILITY.json`
- Create: `scripts/validate-source-traceability.mjs`
- Create: `tests/unit/source-traceability.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Cada ID de pregunta tindrà exactament una entrada amb: `source`, `pages`, `topic`, `status`, `reviewedAnswer`, `reviewedExplanation`.
- `status` només admet `PASS` o `CORRECTED`.

- [ ] Recuperar i revisar els sis PDF originals, preservant la terminologia de la font.
- [ ] Revisar les 450 preguntes una per una: enunciat, opció marcada com correcta i explicació.
- [ ] Registrar la pàgina o interval de pàgines que suporta cada pregunta.
- [ ] Corregir únicament els ítems que contradiguin o excedeixin la font.
- [ ] Validar que el manifest cobreix exactament els 450 IDs sense absències ni sobrants.
- [ ] Validar que totes les pàgines són enters positius i que `source` és un dels sis PDF autoritzats.
- [ ] Afegir `npm run test:audit:sources`.

### Task 3: Paritat lingüística i contracte editorial

**Files:**
- Create: `tests/unit/bilingual-semantic-contract.test.mjs`
- Modify: `scripts/validate-question-banks.mjs`

**Interfaces:**
- Produces: verificació estructural 450/450 de català/castellà i de les ajudes de memòria.

- [ ] Verificar quatre opcions no buides i sense duplicats exactes per pregunta i idioma.
- [ ] Verificar que les traduccions mantenen cardinalitat i ordre semàntic segons l'índex canònic abans del shuffle.
- [ ] Verificar que explicació i ajuda de memòria existeixen en ambdós idiomes.
- [ ] Verificar longitud ≤144 de totes les ajudes.
- [ ] Verificar IDs únics i correspondència exacta entre banc, traducció, ajuda i traçabilitat.

### Task 4: Informe de certificació i CI

**Files:**
- Create: `docs/content/UF0517_FULL_AUDIT_2026-09-16.md`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml` only if `test:all` does not already include the new audit commands.

**Interfaces:**
- Produces: `npm run audit:full` i informe final reproduïble.

- [ ] Afegir una ordre única que executi validació de bancs, fonts, permutacions, unit tests i E2E.
- [ ] L'informe ha d'incloure recompte total, distribució per blocs, 21.600 casos de permutació, 450 entrades de traçabilitat i qualsevol correcció editorial realitzada.
- [ ] Executar CI completa en la branca.
- [ ] Revisar diff final i obrir PR.
- [ ] Fer squash merge només després de CI GREEN.
- [ ] Fer smoke fresc a `https://repasactiu.pages.dev` després del desplegament.

## Self-review

- Cobertura: tècnica, bilingüe, font acadèmica, memòria, CI i producció incloses.
- Sense placeholders funcionals: els camps, scripts i resultats esperats estan definits.
- Consistència: 450 preguntes, 24 permutacions, 2 idiomes = 21.600 casos lingüístics de posició de resposta.
