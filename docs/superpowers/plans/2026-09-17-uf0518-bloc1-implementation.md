# UF0518 Bloc 1 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add UF0518 Bloc 1 as a new, independently grouped study block in Repàs Actiu using only the uploaded 28-page course PDF, while preserving all 450 existing UF0517 questions and progress compatibility.

**Architecture:** Reuse the current catalogue/quiz pipeline by registering a new block in `site/data/course.json` and adding one canonical Catalan bank, one Spanish indexed translation file, one bilingual memory-aid file, and one UF0518 source-traceability manifest. Generalize audit scripts so totals are derived dynamically from the catalogue rather than hard-coded to 450, then certify the combined site exhaustively.

**Tech Stack:** Static HTML/CSS/JavaScript, JSON data banks, Node.js 22, `node:test`, Playwright, GitHub Actions, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-17-uf0518-bloc1-design.md`

## Global Constraints

- The uploaded `1. La comunicació escrita cartes comercials i documents administratius (1).pdf` is the only academic authority for new UF0518 questions.
- Do not infer questions from UF0518 objectives when the concept is not developed in Bloc 1.
- Preserve all 450 existing UF0517 IDs, canonical `correct` indices and stored-progress keys.
- New IDs use `uf0518-b1-NNN`.
- Exactly four distinct answer options and one correct answer per question.
- Catalan canonical; Spanish translation must not redefine `correct`.
- Every new question gets an explanation and bilingual memory aid (`example` or `idea`) <=144 Unicode characters per language.
- Audits must derive current totals from the catalogue, not assume 450.
- Merge only after `npm run audit:full` and CI are green; then validate deployed production in Catalan and Spanish.

---

### Task 1: Coverage audit and final question count

**Files:**
- Create: `docs/content/UF0518_BLOC1_COVERAGE_AUDIT_2026-09-17.md`

**Interfaces:**
- Consumes: uploaded 28-page UF0518 PDF.
- Produces: approved topic/page coverage map and exact target question count used by later tasks.

- [ ] **Step 1: Build a page-by-page source map**

Record pages 3-26 with `COVER`, `COMBINE`, or `EXCLUDE`, using these source zones as anchors: p3 definition; p4-5 importance; p6 elements; p7 public/private written communication; p8 language functions; p9-12 quality/register/errors/recommendations; p13-20 commercial letters; p21-26 administrative documents.

- [ ] **Step 2: Define question allocation by concept**

Allocate questions only where a distinct learning objective exists. Include practical cases and distinction questions; merge repetitive examples into one concept.

- [ ] **Step 3: Fix exact target count from the audit**

Document the count and why it is academically supportable. Do not force 70-80 if coverage does not justify it.

- [ ] **Step 4: Commit**

Commit coverage audit before writing banks.

### Task 2: TDD — generalize count-dependent audits

**Files:**
- Modify: `scripts/audit-bilingual-contract.mjs`
- Modify: `scripts/audit-permutations.mjs`
- Modify: `scripts/validate-source-traceability.mjs`
- Modify as required: `scripts/validate-question-banks.mjs`
- Test: `tests/unit/full-permutation-audit.test.mjs`
- Test: `tests/unit/source-traceability.test.mjs`
- Test: new `tests/unit/dynamic-course-count.test.mjs`

**Interfaces:**
- Consumes: `site/data/course.json` and all files registered there.
- Produces: dynamic `{questions, translations, memoryAids, permutationCases}` counts with no fixed 450 assertion.

- [ ] **Step 1: Write failing tests**

Add a fixture/catalogue case proving validators accept a total other than 450 and compute `questionCount * 24 * 2` permutation cases.

- [ ] **Step 2: Run unit tests and confirm RED**

Run `npm run test:unit`; expected failure must point to the hard-coded 450 assumptions.

- [ ] **Step 3: Implement minimal dynamic counting**

Replace fixed-count checks with totals derived from registered banks; preserve uniqueness, translation, memory-aid and correction validation.

- [ ] **Step 4: Run unit tests and confirm GREEN**

Run `npm run test:unit` and `npm run test:audit:permutations`.

- [ ] **Step 5: Commit**

Commit audit generalization separately from content.

### Task 3: Register UF0518 and add RED integration contract

**Files:**
- Modify: `site/data/course.json`
- Test: new `tests/unit/uf0518-catalog.test.mjs`
- Test: relevant E2E spec under `tests/e2e/`

**Interfaces:**
- Produces catalogue block `uf0518-bloc-1` with Catalan/Spanish UF and block titles and paths to three data files.

- [ ] **Step 1: Write failing catalogue/UI tests**

Assert a separate `UF0518 — Gestió auxiliar de la correspondència i paqueteria a l’empresa` group exists, with one block titled `La comunicació escrita, cartes comercials i documents administratius`.

- [ ] **Step 2: Run tests and confirm RED**

The failure must be absence of UF0518, not an unrelated error.

- [ ] **Step 3: Register block paths in `course.json`**

Use:
- canonical: `data/uf0518_bloc_1.json`
- Spanish: `data/i18n/es/uf0518-bloc-1.json`
- memory: `data/memory/uf0518-bloc-1.json`

- [ ] **Step 4: Keep tests RED for missing content files**

This verifies the catalogue points at required new assets before they are created.

### Task 4: Write canonical Catalan UF0518 bank

**Files:**
- Create: `site/data/uf0518_bloc_1.json`

**Interfaces:**
- Produces exact IDs `uf0518-b1-001...NNN` from Task 1 target count.

- [ ] **Step 1: Author questions from the coverage audit**

For every question include `id`, `block`, `topic`, `question`, `options[4]`, `correct`, `explanation`.

- [ ] **Step 2: Balance correct indices**

Distribute correct positions as evenly as mathematically possible across 0/1/2/3; do not alter semantics merely to hit exact equality.

- [ ] **Step 3: Validate academic scope**

Check each item against its page/range in the uploaded PDF. Remove any question relying on knowledge not present in the source.

- [ ] **Step 4: Run data/unit tests**

Expect failures only for missing Spanish/memory/trace files until subsequent tasks.

- [ ] **Step 5: Commit canonical bank**

### Task 5: Add full Spanish translation and memory aids

**Files:**
- Create: `site/data/i18n/es/uf0518-bloc-1.json`
- Create: `site/data/memory/uf0518-bloc-1.json`

**Interfaces:**
- Translation keys exactly equal canonical IDs; no `correct` field in translations.
- Memory keys exactly equal canonical IDs, each with `{type, ca, es}`.

- [ ] **Step 1: Translate all prompts/topics/options/explanations**

Preserve semantic option alignment exactly by index.

- [ ] **Step 2: Add memory aids**

Prefer practical examples; use `idea` only when a practical application is artificial. Enforce <=144 Unicode characters for both languages.

- [ ] **Step 3: Run bilingual/data audits**

Run `npm run test:data` and `npm run test:audit:bilingual`; expected GREEN for content contracts.

- [ ] **Step 4: Run exhaustive permutations**

Run `npm run test:audit:permutations`; expected cases = combined question count × 24 × 2.

- [ ] **Step 5: Commit bilingual content**

### Task 6: Add UF0518 source traceability and preserve UF0517 certification

**Files:**
- Create: `docs/content/UF0518_SOURCE_TRACEABILITY.json`
- Create: `docs/content/UF0518_FULL_AUDIT_2026-09-17.md`
- Modify: `scripts/validate-source-traceability.mjs`
- Test: `tests/unit/source-traceability.test.mjs`
- Test: `tests/unit/source-regressions.test.mjs`

**Interfaces:**
- Every `uf0518-b1-NNN` maps to the uploaded PDF and a narrow page/pageRange.
- UF0517 manifest remains valid and unchanged in academic meaning.

- [ ] **Step 1: Write failing source test for UF0518**

Require exact coverage of all new IDs and reject broad blanket range 1-28.

- [ ] **Step 2: Run test and confirm RED**

- [ ] **Step 3: Create traceability manifest**

Use specific page or narrow page ranges matching each question's concept.

- [ ] **Step 4: Extend validator to validate both manifests**

Report totals per UF and combined total. Reject unknown sources, invalid ranges, missing IDs, duplicate IDs or orphan trace entries.

- [ ] **Step 5: Add UF0517 regression assertion**

Capture all existing 450 IDs and `correct` indices and prove they remain unchanged.

- [ ] **Step 6: Run source/unit audits and commit**

### Task 7: E2E bilingual UF0518 flow

**Files:**
- Add/modify E2E spec under `tests/e2e/`.

**Interfaces:**
- Covers catalogue -> setup -> study question -> answer -> feedback -> language switch -> aligned answer/explanation/memory.

- [ ] **Step 1: Write E2E assertions**

Assert UF0518 appears separately, open the new block, start 10-question Study mode, answer one question, confirm explanation/memory aid, switch to Spanish, and verify same question state/semantic correct answer remains aligned.

- [ ] **Step 2: Run targeted E2E**

Confirm GREEN without sleeps/racy timing; wait on visible application state.

- [ ] **Step 3: Run all E2E**

`npm run test:e2e` must pass all existing and new tests.

- [ ] **Step 4: Commit E2E coverage**

### Task 8: Full certification, PR, merge and production

**Files:**
- Update: `docs/content/UF0518_FULL_AUDIT_2026-09-17.md` with exact final metrics.

**Interfaces:**
- Produces final auditable metrics: new questions, combined total, translations, memory aids, permutation cases, unit/E2E counts, CI run, merge SHA, production smoke result.

- [ ] **Step 1: Run fresh local/full CI equivalent**

Run `npm run audit:full`; require PASS at every layer.

- [ ] **Step 2: Review complete diff**

Confirm no accidental change to existing UF0517 canonical IDs/correct indices and no unrelated refactor.

- [ ] **Step 3: Open/update draft PR and wait for GitHub CI**

Do not merge on a stale or failing run.

- [ ] **Step 4: Mark ready and squash merge**

Use expected HEAD SHA to prevent merging a moved branch.

- [ ] **Step 5: Wait for Cloudflare Pages**

Verify production serves the merged catalogue and UF0518 data.

- [ ] **Step 6: Fresh production smoke test**

On `https://repasactiu.pages.dev`: confirm separate UF0518 card, exact question count, start quiz in Catalan, answer, switch to Spanish, verify feedback/explanation/memory alignment, and reload to verify language/progress behavior remains valid.

- [ ] **Step 7: Final report**

State exact counts and evidence. Do not claim mathematical impossibility of residual human academic error.
