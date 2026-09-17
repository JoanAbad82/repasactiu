# Repàs Actiu — UF0518 Bloc 1 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add UF0518 Bloc 1 as a new, academically separate formative unit in Repàs Actiu, with source-grounded Catalan questions, Spanish translations, memory aids, generalized audits, exhaustive shuffle validation and production verification.

**Architecture:** Reuse the current catalogue/bank/translation/memory-aid model and existing quiz UI. Add one new catalogue block and three new data files, while generalizing validators so the published total is derived from `course.json` instead of being hard-coded to 450. Keep UF0517 source certification intact and add a separate UF0518 page-level traceability manifest.

**Tech Stack:** Static HTML/CSS/ES modules, JSON question banks, Node.js 22, `node:test`, Playwright, GitHub Actions, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-17-uf0518-bloc1-design.md`

## Global Constraints

- Academic authority for UF0518 is only `1. La comunicació escrita cartes comercials i documents administratius (1).pdf` (28 pages).
- Do not derive questions from UF0518 objectives unless the concept is actually developed in Bloc 1.
- Preserve all 450 pre-UF0518 IDs, canonical correct indices and progress keys.
- Catalan is canonical; Spanish translations never contain their own `correct` field.
- Every new question has exactly four distinct options and exactly one correct answer.
- Every new question has a grounded explanation and a bilingual `example` or `idea` memory aid of at most 144 Unicode characters per language.
- New IDs use `uf0518-b1-NNN`.
- UF0518 is a separate `unitId`, not a third unit of UF0517.
- All new answer permutations must be verified in Catalan and Spanish through the real `shuffleQuestionOptions()` implementation.
- Final integration uses a PR and squash merge; no direct feature implementation on `main`.

---

### Task 1: Coverage audit and final question count

**Files:**
- Create: `docs/content/UF0518_BLOC1_COVERAGE_AUDIT_2026-09-17.md`

**Interfaces:**
- Consumes: the approved 28-page UF0518 PDF.
- Produces: a page/topic matrix with `COVER`, `COMBINE` and `EXCLUDE`, plus the authoritative planned ID range and final question count used by Tasks 3–7.

- [ ] Review pages 1–28 and classify every page/topic.
- [ ] Exclude title/closing/bibliography, duplicate-only material and objective-only concepts not developed later.
- [ ] Assign planned IDs to narrow page ranges and count non-duplicative questions.
- [ ] Record the topic distribution and explain why the count is quality-driven rather than quota-driven.
- [ ] Commit the coverage audit before authoring question data.

### Task 2: TDD — remove fixed 450-question assumptions

**Files:**
- Modify: `tests/unit/full-permutation-audit.test.mjs`
- Modify: `tests/unit/bilingual-semantic-contract.test.mjs`
- Modify: `tests/unit/source-traceability.test.mjs`
- Modify: `tests/unit/course-content.test.mjs` where fixed totals are asserted
- Modify: `scripts/validate-question-banks.mjs`
- Modify: `scripts/audit-bilingual-contract.mjs`
- Modify: `scripts/validate-source-traceability.mjs`
- Modify only if needed: `scripts/audit-permutations.mjs`

**Interfaces:**
- Produces validators whose expected question total is derived from the catalogue and loaded banks.
- Source trace validator consumes all `docs/content/*_SOURCE_TRACEABILITY.json` manifests and requires exact one-to-one coverage of published IDs.

- [ ] Add failing tests proving the audit contract must be count-independent and must support more than one source manifest.
- [ ] Push RED test commit and confirm GitHub CI fails for the intended fixed-count reason.
- [ ] Replace fixed `450`, `18`, and `12` bank/translation/memory-file assumptions with catalogue-derived expectations.
- [ ] In `validate-question-banks.mjs`, validate every bank declared by `course.json`, reject duplicate declarations/orphan bank-like files, and compare each bank `blockId` to its catalogue block rather than inferring IDs from legacy filenames.
- [ ] In bilingual audit, require unique IDs and complete translation/memory coverage for `canonical.length`, whatever that number is.
- [ ] In source audit, aggregate UF0517 and UF0518 manifests, validate narrow page ranges and require each published ID to have exactly one trace mapping.
- [ ] Keep the permutation audit formula `questions × 24 × 2`; update tests to assert the formula rather than 21,600.
- [ ] Commit and confirm infrastructure tests are green before adding UF0518 data.

### Task 3: Catalogue contract for UF0518

**Files:**
- Modify: `site/data/course.json`
- Modify: `tests/unit/catalog.test.mjs`
- Modify: `tests/unit/catalog-i18n.test.mjs`
- Modify: `tests/e2e/app.spec.mjs`

**Interfaces:**
- Adds block `uf0518-bloc-1` under unit `uf0518`.
- Bank: `data/uf0518_bloc_1.json`
- Translation: `data/i18n/es/uf0518-bloc-1.json`
- Memory: `data/memory/uf0518-bloc-1.json`

- [ ] Write failing catalogue tests for the new independent UF, Catalan title, Spanish title and block metadata.
- [ ] Add failing E2E assertion that UF0518 is visible separately on the home screen.
- [ ] Register the new block in `course.json` with exact titles from the approved spec.
- [ ] Do not alter existing UF0517 block entries.
- [ ] Confirm catalogue tests pass once placeholder data files exist in later tasks; keep PR draft while data contract is incomplete.

### Task 4: Canonical Catalan UF0518 question bank

**Files:**
- Create: `site/data/uf0518_bloc_1.json`
- Create: `tests/unit/uf0518-content.test.mjs`

**Interfaces:**
- Question IDs: exact contiguous range declared by Task 1.
- Each record: `{id, block:"uf0518-bloc-1", topic, question, options[4], correct, explanation}`.

- [ ] Write tests that assert the exact contiguous ID range, unique prompts, four distinct options, one `correct` index and source-audit count.
- [ ] Author questions only from `COVER`/`COMBINE` concepts in the coverage audit.
- [ ] Mix direct recognition with short practical cases and distinctions among similar concepts.
- [ ] Balance correct-answer positions as evenly as the final count allows.
- [ ] Verify no question relies on reception/distribution/packaging/shipping topics that appear only in UF objectives.
- [ ] Commit canonical content.

### Task 5: Spanish translations and semantic alignment

**Files:**
- Create: `site/data/i18n/es/uf0518-bloc-1.json`
- Extend: `tests/unit/uf0518-content.test.mjs`

**Interfaces:**
- Translation object contains exactly the canonical IDs and fields `topic`, `question`, `options`, `explanation`; never `correct`.

- [ ] Write failing tests for exact ID coverage and absence of `correct` in translations.
- [ ] Translate all canonical prompts/options/topics/explanations into natural Spanish without changing meaning or option order.
- [ ] Assert each Spanish option at the canonical correct index is the semantic translation of the Catalan correct option through the exhaustive real shuffle audit.
- [ ] Commit translations.

### Task 6: Memory aids

**Files:**
- Create: `site/data/memory/uf0518-bloc-1.json`
- Extend: `tests/unit/uf0518-content.test.mjs`

**Interfaces:**
- One entry per question: `{type:"example"|"idea", ca, es}`.

- [ ] Write failing tests for exact coverage and maximum 144 Unicode characters per language.
- [ ] Prefer short practical examples; use `idea` only when a practical application is unnatural.
- [ ] Ensure aids do not introduce facts absent from the PDF and do not reveal answers before response rendering.
- [ ] Commit memory aids.

### Task 7: UF0518 page-level source traceability

**Files:**
- Create: `docs/content/UF0518_SOURCE_TRACEABILITY.json`
- Extend: `tests/unit/source-traceability.test.mjs`

**Interfaces:**
- One authorized source: the uploaded 28-page UF0518 PDF.
- Every new ID maps to a narrow page or page range, normally one page and never a blanket `1–28` range.

- [ ] Add failing test requiring exact trace coverage for every UF0518 ID.
- [ ] Create page-level mappings using the coverage audit.
- [ ] Mark every mapping `PASS` and ensure no UF0517 ID is claimed by the UF0518 manifest.
- [ ] Confirm combined source audit reports UF0517 + UF0518 coverage with no missing or duplicate IDs.
- [ ] Commit traceability.

### Task 8: Regression protection for the existing 450 questions

**Files:**
- Create or modify: `tests/unit/uf0517-regression.test.mjs`
- Use: existing bank files under `site/data/`

**Interfaces:**
- Baseline: pre-feature `main` commit `59bae36072b6650d2661622596764cd9631a3e08`.

- [ ] Build a frozen fixture/hash or explicit `(id, correct)` snapshot for all 450 existing questions from the baseline.
- [ ] Assert current UF0517 publishes exactly those same 450 IDs and correct indices.
- [ ] Assert the new UF0518 IDs do not collide with any existing ID.
- [ ] Commit regression protection.

### Task 9: UF0518 end-to-end behavior

**Files:**
- Modify: `tests/e2e/app.spec.mjs`

**Interfaces:**
- Uses current home/setup/quiz/review UI without a new subsystem.

- [ ] Add E2E test that opens UF0518 Bloc 1 and starts a study quiz.
- [ ] Confirm the displayed question belongs to UF0518 and has four answer options.
- [ ] Answer a question, verify feedback, explanation and memory aid appear.
- [ ] Switch to Spanish during the quiz and verify prompt/options/feedback remain logically aligned.
- [ ] Verify UF0517 progress keys are not reset by accessing UF0518.
- [ ] Commit E2E coverage.

### Task 10: Combined certification and documentation

**Files:**
- Create: `docs/content/UF0518_INTEGRATION_AUDIT_2026-09-17.md`
- Modify if required: `package.json`

**Interfaces:**
- `npm run audit:full` remains the single certification command.

- [ ] Run/trigger `npm run audit:full` through CI.
- [ ] Require question-bank validation, combined source traceability, bilingual contract, full permutations, unit tests and Playwright E2E to pass.
- [ ] Record exact final question total and permutation case count as `total × 24 × 2`.
- [ ] Record UF0518 count, UF0517 preserved count and any academic corrections found during review.
- [ ] Commit final audit report.

### Task 11: PR, review, squash merge and production smoke

**Files:**
- No new production files unless review finds a defect.

**Interfaces:**
- PR: `feature/uf0518-bloc1` → `main`.
- Production: `https://repasactiu.pages.dev`.

- [ ] Keep/open a draft PR during RED/GREEN TDD cycles.
- [ ] Review the final changed-file list and patches; resolve any defect before merge.
- [ ] Confirm final CI on the exact PR head is `success`.
- [ ] Mark PR ready and squash merge using expected head SHA.
- [ ] Confirm `main` points to the merge SHA.
- [ ] Wait until Cloudflare Pages serves the new catalogue/data.
- [ ] Fresh production smoke: UF0518 visible separately, correct question count, Catalan quiz works, Spanish switch works, answer correctness/explanation/memory aid stay aligned.
- [ ] Report exact merge SHA, production PASS and audit totals without claiming mathematical impossibility of residual human academic error.
