# Repàs Actiu — Source-grounded expansion to 450 questions

**Date:** 2026-09-16

## Goal

Expand Repàs Actiu from 320 to 450 questions using only the six original UF0517 course PDFs, while preserving every existing canonical question byte-for-byte and keeping Catalan/Spanish parity, answer-shuffle safety, explanations, memory aids, statistics and progress behavior.

## Fixed content allocation

| Block | Existing | Add | Final |
|---|---:|---:|---:|
| bloc-1 | 42 | 8 | 50 |
| bloc-2 | 56 | 14 | 70 |
| bloc-3 | 56 | 14 | 70 |
| bloc-4 | 40 | 20 | 60 |
| bloc-5 | 46 | 14 | 60 |
| unitat-2-bloc-1 | 80 | 60 | 140 |
| **Total** | **320** | **130** | **450** |

The allocation comes from `docs/content/UF0517_COVERAGE_AUDIT_2026-09-16.md`. If a proposed question cannot be grounded unambiguously in its source PDF or is semantically redundant with the current bank, it must be rewritten within the same source scope or omitted; external knowledge must never be used to fill the gap.

## Source contract

Only these files may justify new academic content:

- Bloc 1: `1. L’organització entitats públiques i privades (Funcions i tipus d’empresa)_BLOC_1.pdf`
- Bloc 2: `2. Classes d’empreses, jerarquia empresarial i funció administrativa_BLOC_2.pdf`
- Bloc 3: `3_Lestructura_empresa_organigrames_BLOC_3.pdf`
- Bloc 4: `Els departaments_BLOC 4.pdf`
- Bloc 5: `5 .Organització bàsica de lEstat i la Unió Europea_BLOC_5.pdf`
- U2 Bloc 1: `Unitat 2_Lorganització dels RRHH.pdf`

No web research or general administrative knowledge is allowed for question content.

## Architecture decision

Do not append to the 12 existing bank files. Add one immutable expansion bank per logical block and teach the catalog to load an array of supplemental bank files.

New files:

- `site/data/bloc_1_expansion.json`
- `site/data/bloc_2_expansion.json`
- `site/data/bloc_3_expansion.json`
- `site/data/bloc_4_expansion.json`
- `site/data/bloc_5_expansion.json`
- `site/data/unitat_2_bloc_1_expansion.json`

`course.json` will gain `additionalFiles` for each block. Existing `file` and `extraFile` remain valid, so the change is backward-compatible and explicit.

Spanish translation and memory-aid files remain one file per logical block. They will be extended to cover the new IDs because they are supplemental presentation data and do not define `correct`.

## Stable IDs

- Bloc 1: `b1-043`…`b1-050`
- Bloc 2: `b2-057`…`b2-070`
- Bloc 3: `b3-057`…`b3-070`
- Bloc 4: `b4-041`…`b4-060`
- Bloc 5: `b5-047`…`b5-060`
- U2 Bloc 1: `u2b1-081`…`u2b1-140`

No existing ID may change.

---

## Task 1 — Freeze the 320-question baseline and write RED tests

**Files:**
- Modify: `tests/unit/course-content.test.mjs`
- Modify: `tests/unit/catalog.test.mjs`

### Steps

1. Extend the byte-preservation test to all 12 existing canonical bank files, including Bloc 4 and U2.
2. Add a test asserting `course.json` declares exactly one `additionalFiles` entry for every logical block.
3. Add a test expecting expansion counts `8,14,14,20,14,60` and exact final counts `50,70,70,60,60,140`.
4. Add a test expecting exactly 450 canonical IDs, 450 Spanish translations and 450 memory aids.
5. Add catalog tests proving that `loadBlockBundle` merges base + legacy `extraFile` + all `additionalFiles` in order and rejects supplemental files with another `blockId`.
6. Run CI on the branch before implementation. Required result: RED for missing `additionalFiles`/expansion files and old hard-coded totals.

## Task 2 — Generalize the bank loader

**Files:**
- Modify: `site/js/catalog.js`
- Modify: `site/js/app.js`

### Interface

Change bundle loading from:

`loadBlockBundle(file, extraFile, fetchImpl, translationFile, memoryAidFile)`

to a backward-compatible form with an optional supplemental array, e.g.:

`loadBlockBundle(file, extraFile, fetchImpl, translationFile, memoryAidFile, additionalFiles=[])`

### Steps

1. Load base bank.
2. Load legacy `extraFile` when present.
3. Iterate `additionalFiles` in declared order.
4. Reject any supplemental bank whose `blockId` differs from base.
5. Merge all questions before attaching translation and memory data; this preserves exact-ID coverage checks.
6. In `app.js`, pass `meta.additionalFiles||[]`.
7. Run unit tests; catalog-specific tests must turn GREEN while content-count tests remain RED until data is added.

## Task 3 — Generalize the validator

**Files:**
- Modify: `scripts/validate-question-banks.mjs`

### Steps

1. Expand bank filename pattern to include `_expansion.json`.
2. Validate `course.json` paths from `file`, `extraFile` and every member of `additionalFiles`.
3. Require each bank file to be declared exactly once.
4. Freeze expected per-file counts for the 18 bank files.
5. Require exactly 450 canonical questions.
6. Require translations and memory aids to cover exactly the canonical IDs after all supplemental files are merged.
7. Keep existing checks for duplicate IDs, duplicate question text, four unique non-empty options, one `correct` index 0–3 and mandatory explanation.
8. Add a correctness-distribution diagnostic/test so new questions do not make one option position systematically dominant.

## Task 4 — Add Catalan expansion banks, source-grounded only

**Files:** six new `*_expansion.json` files.

### Editorial contract for each question

- exact source support;
- one unequivocally correct answer;
- four plausible choices;
- applied/comparative formulation preferred over direct recall;
- no semantic duplicate of existing 320 or another new question;
- concise explanation supported by the PDF;
- answer positions deliberately balanced within each expansion file.

### Bloc-specific scopes

**Bloc 1 (+8):** financing and public/private distinctions, interaction of direction/finance/HR/commercial/sales/admin/customer-service functions, applied responsibility/control cases.

**Bloc 2 (+14):** use of profits in lucrative companies; funding of nonprofit entities; multiple simultaneous classification criteria; manufacturer/distributor/service process cases; hierarchy distinctions; planning/organization/coordination/control/direct/audit cases.

**Bloc 3 (+14):** applied discrimination among the ten organization principles; formal/informal coexistence; organigram requirements, interpretation, advantages and limitations.

**Bloc 4 (+20):** departmental functions and shared information; tax/mercantile/financial/sales-personnel document cases; cross-department coordination; assignment criteria; reception-area accessibility, environment, materials, confidentiality and ergonomics.

**Bloc 5 (+14):** separation and relationships among state powers and organs; Audiencia Nacional where explicitly supported; autonomous-president/government roles; local/insular organization; EU institutional comparisons and regulation/directive application.

**U2 Bloc 1 (+60):** coordination mechanisms; procedures; quality controls/indicators; result organization; group size/status/norms/cohesion/power; group structures/types/phases; balanced roles; teamwork benefits/risks; group dynamics, their didactic/social/personal-professional/organizational purposes; selection factors; coordinator task/relationship responsibilities; transferability.

## Task 5 — Add Spanish translations

**Files:**
- Modify six files in `site/data/i18n/es/`.

### Steps

1. Add exactly the 130 new IDs.
2. Translate `topic`, `question`, four `options`, and `explanation` faithfully.
3. Never add `correct` to translation objects.
4. Preserve option semantic order relative to Catalan; runtime shuffle will apply the same permutation to both languages.
5. Validate 450/450 coverage.

## Task 6 — Add bilingual memory aids

**Files:**
- Modify six files in `site/data/memory/`.

### Steps

1. Add exactly the 130 new IDs.
2. Use `type: "example"` when a practical application is natural; otherwise `type: "idea"`.
3. Add Catalan and Spanish text for every new ID.
4. Maximum 144 characters per language, including spaces.
5. The aid must reinforce the concept, not introduce unsupported course content.
6. Validate 450/450 coverage and length limits.

## Task 7 — Update catalog totals and documentation

**Files:**
- Modify: `site/data/course.json`
- Modify: `README.md`
- Modify: `tests/e2e/app.spec.mjs`
- Modify: `tests/e2e/production-smoke.spec.mjs`

### Steps

1. Add `additionalFiles` paths to all six blocks.
2. Replace visible/tested 320 totals with 450 where appropriate.
3. Document final block distribution.
4. Keep UI layout and localStorage schema unchanged.
5. Existing progress remains valid because old IDs are unchanged; new IDs simply begin without history.

## Task 8 — Editorial and structural audit

### Automated checks

- canonical IDs: 450 unique;
- translations: 450 exact coverage;
- memory aids: 450 exact coverage;
- all old 320 bank files byte-identical;
- no duplicate exact question text in CA or ES;
- four unique options per language;
- memory aid length ≤144;
- all correct indices 0–3;
- answer-position distribution for the 130 new questions reasonably balanced;
- no translation object defines `correct`.

### Manual/source checks

For every new question, verify against the corresponding PDF before merge. Reject an item if the source does not support the proposition directly enough to make one answer uniquely correct.

Also review for semantic near-duplicates, especially within Bloc 1 and Bloc 3, where the current banks are already dense.

## Task 9 — Full verification

Run the repository's full CI command:

```text
npm run test:all
```

Acceptance:

- data validator PASS;
- unit tests: 0 failures;
- E2E: 0 failures;
- question count = 450;
- translation count = 450;
- memory aid count = 450;
- all preservation tests PASS.

Open/maintain a PR from `feature/source-grounded-expansion-450` to `main`. Merge only after fresh green CI.

## Task 10 — Production smoke after merge

On `https://repasactiu.pages.dev` verify in a fresh browser session:

1. homepage displays 450 questions;
2. each block card shows final counts 50/70/70/60/60/140;
3. Catalan and Spanish switching still works;
4. a newly added question displays four answers;
5. after answering, correct/incorrect state, explanation and memory aid all render;
6. language switching after reveal keeps correct answer semantics and translates explanation/memory aid;
7. no progress reset is triggered.

Only then close the expansion as production-complete.
