# Hard Exam Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic bilingual hard-exam mode for all 526 existing questions by replacing only the three incorrect alternatives with audited, source-grounded distractors.

**Architecture:** Keep the canonical question banks untouched. Add one indexed hard-distractor overlay per logical block, load it after existing corrections, compose a normal question object only when `mode === "hard-exam"`, then pass it through the existing shuffle engine. Extend validators and permutation tests so both normal and hard representations are exhaustively checked.

**Tech Stack:** Static HTML/CSS/ES modules, JSON data, Node.js test runner, Playwright, GitHub Actions, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-18-hard-exam-mode-design.md`

## Global Constraints

- Preserve all 526 current canonical questions, IDs, correct answers, explanations, translations, memory aids and traceability.
- Preserve current Mode Estudi, Mode Examen and Repassar errors behavior.
- Hard mode changes only incorrect answer alternatives.
- Exactly 3 hard distractors per question per language.
- At least 2 hard distractors per language must differ from current practice distractors.
- Correct-answer semantics must remain aligned between Catalan and Spanish under every shuffle.
- Hard distractors must be source-grounded and academically unambiguous.
- No runtime AI or external API dependency in production.
- TDD: every production behavior begins with a test observed failing for the expected reason.

---

### Task 1: Hard-overlay contract and validator

**Files:**
- Create: `site/data/hard/.gitkeep` only if needed for initial RED; remove once JSON exists.
- Create: `scripts/hard-distractor-lib.mjs`
- Create: `tests/unit/hard-distractor.test.mjs`
- Modify: `scripts/validate-question-banks.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `composeHardQuestion(question, hardRecord)`
- Produces: `validateHardRecord(question, hardRecord)`
- Produces: `runHardDistractorAudit()`
- Hard record shape: `{ca: string[3], es: string[3]}`

- [ ] **Step 1: Write failing unit tests for hard composition**

Tests must assert:
```js
const question={
  id:'q1',
  block:'bloc-1',
  question:'Q?',
  options:['Correcta','Fàcil 1','Fàcil 2','Fàcil 3'],
  correct:0,
  explanation:'Exp',
  translations:{es:{question:'¿Q?',options:['Correcta ES','Fácil 1','Fácil 2','Fácil 3'],explanation:'Exp ES'}}
};
const hard={ca:['Difícil A','Difícil B','Difícil C'],es:['Difícil ES A','Difícil ES B','Difícil ES C']};
const result=composeHardQuestion(question,hard);
assert.deepEqual(result.options,['Correcta','Difícil A','Difícil B','Difícil C']);
assert.equal(result.correct,0);
assert.deepEqual(result.translations.es.options,['Correcta ES','Difícil ES A','Difícil ES B','Difícil ES C']);
assert.deepEqual(question.options,['Correcta','Fàcil 1','Fàcil 2','Fàcil 3']);
```

Also test when canonical `correct` is 1, 2 and 3.

- [ ] **Step 2: Run the new unit file and verify RED**

Run: `node --test tests/unit/hard-distractor.test.mjs`  
Expected: FAIL because `scripts/hard-distractor-lib.mjs` does not exist.

- [ ] **Step 3: Implement minimal pure composition and normalization-aware validation**

`composeHardQuestion()` must keep the correct answer in its original semantic slot before shuffle and replace the other three slots, preserving Catalan/Spanish correspondence.

`validateHardRecord()` must reject:
- missing/non-array languages;
- lengths other than 3;
- blank strings;
- normalized duplicates;
- normalized equality with the effective correct answer;
- fewer than 2 distractors different from current incorrect alternatives.

- [ ] **Step 4: Add RED tests for full coverage auditing**

Create fixtures that demonstrate orphan ID, missing ID and duplicate/invalid distractor failures.

- [ ] **Step 5: Implement `runHardDistractorAudit()`**

It reads `course.json`, effective banks after `content_corrections.json`, and every declared `hardDistractorFile`; validates exact published ID coverage and returns counts/errors.

- [ ] **Step 6: Wire the audit into `audit:full`**

Add:
```json
"test:audit:hard": "node scripts/hard-distractor-lib.mjs"
```
and include it before permutation/unit/E2E stages.

- [ ] **Step 7: Commit Task 1**

Commit message: `test: define hard distractor contract`

---

### Task 2: Catalog loading and hard-exam UI behavior

**Files:**
- Modify: `site/data/course.json`
- Modify: `site/js/catalog.js`
- Modify: `site/js/app.js`
- Modify: `site/js/ui.js`
- Modify: `tests/unit/ui.test.mjs`
- Modify/create relevant catalog unit tests
- Modify: `tests/e2e/app.spec.mjs`

**Interfaces:**
- `loadHardDistractors(file, fetchImpl=fetch)`
- each loaded bank exposes `hardDistractors`
- setup mode value: `hard-exam`
- session mode value: `hard-exam`

- [ ] **Step 1: Add failing UI tests**

Assert Catalan setup contains `Mode Examen difícil`; Spanish contains `Modo Examen difícil`. Assert penalty field is visible for both `exam` and `hard-exam`.

- [ ] **Step 2: Verify RED**

Run only UI unit tests. Expected failure: hard mode text/input absent.

- [ ] **Step 3: Implement minimal UI option**

Add bilingual dictionary keys and radio option `value="hard-exam"`. Treat `hard-exam` as exam for penalty visibility.

- [ ] **Step 4: Add failing behavior tests for session construction**

Test that:
- normal study/exam call existing `buildQuiz` with canonical questions;
- hard exam composes each selected question through `composeHardQuestion` before shuffle;
- review mode stays canonical;
- `penaltyEnabled` applies to `exam` and `hard-exam`.

- [ ] **Step 5: Implement catalog load + app hard-mode path**

`course.json` declares exactly one `hardDistractorFile` per block. Load overlays during init. Keep them out of localized/canonical source objects except as bank metadata.

- [ ] **Step 6: Preserve exam rendering semantics**

When `session.mode` is `hard-exam`, pass `mode:'exam'` to `renderQuestionHtml`; therefore no feedback/memory aid appears until completion.

- [ ] **Step 7: Add E2E RED/GREEN for hard-mode presence and no immediate feedback**

Test one block in CA and ES.

- [ ] **Step 8: Commit Task 2**

Commit message: `feat: add hard exam mode plumbing`

---

### Task 3: Author all 526 bilingual hard-distractor overlays

**Files:**
- Create: `site/data/hard/bloc-1.json` — 50 records
- Create: `site/data/hard/bloc-2.json` — 70 records
- Create: `site/data/hard/bloc-3.json` — 70 records
- Create: `site/data/hard/bloc-4.json` — 60 records
- Create: `site/data/hard/bloc-5.json` — 60 records
- Create: `site/data/hard/unitat-2-bloc-1.json` — 140 records
- Create: `site/data/hard/uf0518-bloc-1.json` — 76 records
- Create: `docs/content/HARD_DISTRACTOR_EDITORIAL_AUDIT_2026-09-18.md`

**Interfaces:**
- Exact record shape defined in Task 1.
- IDs must exactly match the effective block questions.

- [ ] **Step 1: Extract question + correct answer + topic + trace window for one block**

Use repository banks plus source-trace manifests and the authorized PDF text. Do not use general knowledge to invent academic distinctions.

- [ ] **Step 2: Author Catalan distractors for the block**

For every ID:
- keep correct answer untouched;
- produce 3 plausible but wrong alternatives;
- at least 2 differ from practice distractors;
- no more than one obviously dismissible option;
- prefer concepts from same/nearby source section.

- [ ] **Step 3: Author Spanish equivalents**

Translate the intended semantic distractors, not word-by-word artifacts. Preserve conceptual alignment with Catalan.

- [ ] **Step 4: Run hard audit for the block**

Run the validator and fix every structural/duplication/equality failure.

- [ ] **Step 5: Editorially re-read the block**

For each question ask:
1. Could a student answer without knowing the material solely because 2–3 distractors are absurd?
2. Could two alternatives reasonably be defended as correct from the source?
3. Is the hard correct answer still exactly the canonical answer?
4. Do CA and ES express the same alternatives?

Record PASS/issues in the audit document.

- [ ] **Step 6: Repeat Steps 1–5 for all seven logical blocks**

Do not proceed to Task 4 until coverage is 526/526.

- [ ] **Step 7: Commit content in reviewable chunks**

One commit per logical block:
`content: add hard distractors for <block>`

---

### Task 4: Exhaustive bilingual permutation audit

**Files:**
- Modify: `scripts/audit-permutations.mjs`
- Modify: `scripts/audit-bilingual-contract.mjs`
- Modify: `tests/unit/quiz-engine.test.mjs`
- Modify: `docs/content/HARD_DISTRACTOR_EDITORIAL_AUDIT_2026-09-18.md`

- [ ] **Step 1: Add failing test for hard permutations**

For a fixture hard question, enumerate all 24 permutations and assert CA/ES semantic correct-answer alignment.

- [ ] **Step 2: Verify RED**

Expected failure because the production audit currently only processes canonical representation.

- [ ] **Step 3: Extend permutation audit to both representations**

Expected totals:
- practice: 25,248
- hard: 25,248
- combined: **50,496**

Output explicit counters:
```text
PRACTICE_PERMUTATION_CASES=25248
HARD_PERMUTATION_CASES=25248
TOTAL_PERMUTATION_CASES=50496
```

- [ ] **Step 4: Extend bilingual contract**

Assert every hard CA record has a corresponding ES record and both preserve the same canonical correct-answer semantic text.

- [ ] **Step 5: Run all audit stages**

Run: `npm run audit:full`  
At this point failures must be investigated, not bypassed.

- [ ] **Step 6: Commit Task 4**

Commit message: `test: exhaustively audit hard exam permutations`

---

### Task 5: Full product regression and difficult-mode E2E

**Files:**
- Modify: `tests/e2e/app.spec.mjs`
- Modify/create: `tests/e2e/hard-exam.spec.mjs`
- Update: `docs/content/HARD_DISTRACTOR_EDITORIAL_AUDIT_2026-09-18.md`

- [ ] **Step 1: Add E2E hard-exam flows**

Cover:
- CA setup and start;
- ES setup and start;
- single block;
- all-material;
- 10-question exam;
- unanswered items;
- penalty on/off;
- no feedback before completion;
- results and 10-item review;
- language switch mid-hard-exam retains selected semantic answer;
- mobile 390×844 has no horizontal overflow;
- existing study/exam/review E2E remain unchanged.

- [ ] **Step 2: Verify RED where new assertions precede production support**

Any newly exposed missing behavior must be reproduced before fix.

- [ ] **Step 3: Fix only demonstrated product defects**

No unrelated refactors.

- [ ] **Step 4: Run full fresh suite**

Run: `npm run audit:full`  
Expected: all data/audits/unit/E2E PASS with 50,496 permutation cases.

- [ ] **Step 5: Freeze editorial audit report**

Record:
- 526/526 hard records CA/ES;
- block counts;
- 50,496 permutation result;
- ambiguity review result;
- any content revisions made during audit.

- [ ] **Step 6: Commit Task 5**

Commit message: `test: certify hard exam mode`

---

### Task 6: Review, PR, Cloudflare preview, merge and production certification

**Files:** no product changes unless review/test exposes a defect.

- [ ] **Step 1: Compare branch against certified main `066b249aa55de4bf755cd325257d16c237436abd`**

Explicitly verify no canonical question-bank, Spanish translation, memory-aid, source-traceability, or `content_corrections.json` file changed unexpectedly.

- [ ] **Step 2: Request independent code/content review if an accessible reviewer agent is available**

Give reviewer:
- spec path;
- plan path;
- base SHA;
- head SHA;
- focus: correct-answer invariance, shuffle alignment, backward compatibility, UI state, data audit.

If no independent agent is accessible from the session, document that fact and perform structured diff review plus CI; do not claim agent review occurred.

- [ ] **Step 3: Run final CI on frozen HEAD**

Require successful `npm run test:all`.

- [ ] **Step 4: Open/ready PR and review all changed filenames/patches**

No merge while any Critical/Important issue remains.

- [ ] **Step 5: Smoke Cloudflare preview**

With TinyFish verify:
- practice mode still works;
- normal exam still works;
- hard exam appears;
- hard exam shows plausible alternative set;
- CA/ES switch works;
- results/review work;
- mobile/desktop no obvious overflow.

- [ ] **Step 6: Squash merge with expected head SHA**

- [ ] **Step 7: Confirm Cloudflare production deploy matches merge SHA**

Use the Cloudflare Pages GitHub check/API evidence.

- [ ] **Step 8: Run fresh production smoke**

Repeat critical flows on `https://repasactiu.pages.dev`.

- [ ] **Step 9: Record certification without mutating deployed main**

Add post-deploy certification to the merged PR discussion.

