# Repàs Actiu — Mode Examen difícil — Design Spec

**Date:** 2026-09-18  
**Repository:** `JoanAbad82/repasactiu`  
**Approved design basis:** preserve the current 526-question catalog and add a new hard-exam mode that changes distractors only.

## 1. Goal

Add a new **Mode Examen difícil / Modo Examen difícil** to Repàs Actiu without deleting or changing any existing study, exam, review, progress, scoring, translation, memory-aid, or source-traceability behavior.

The hard mode must keep, for every published question:

- the same question ID;
- the same canonical prompt;
- the same academically correct answer;
- the same explanation;
- the same memory aid;
- the same source traceability;
- the same Spanish prompt/answer meaning;
- the same scoring and blank-answer behavior as normal exam mode.

Only the three incorrect alternatives are replaced by a dedicated set of harder distractors.

## 2. Product behavior

The setup screen for a normal block or “all material” exposes four paths:

1. Mode Estudi / Modo Estudio
2. Mode Examen / Modo Examen
3. **Mode Examen difícil / Modo Examen difícil**
4. Repassar errors / Repasar errores

Hard exam follows normal exam semantics:

- selectable question count: 10 / 20 / 30 / all;
- optional −0.33 wrong-answer penalty;
- unanswered questions allowed;
- no correctness feedback, explanation, or memory aid during the exam;
- results and answer review available after completion;
- progress/history/error statistics use the existing question IDs.

Review mode remains based on the canonical/practice question representation and is not replaced by hard distractors.

## 3. Data architecture

### 3.1 Overlay, not duplicated question banks

Hard content is stored as a **distractor overlay keyed by existing question ID**. It does not duplicate the canonical question, correct answer, explanation, memory aid, or correct index.

Logical record:

```json
{
  "b1-001": {
    "ca": ["distractor 1", "distractor 2", "distractor 3"],
    "es": ["distractor 1", "distractor 2", "distractor 3"]
  }
}
```

There must be exactly one hard record for each of the 526 published IDs.

### 3.2 Files

Use one overlay file per logical published block so content remains reviewable:

- `site/data/hard/bloc-1.json`
- `site/data/hard/bloc-2.json`
- `site/data/hard/bloc-3.json`
- `site/data/hard/bloc-4.json`
- `site/data/hard/bloc-5.json`
- `site/data/hard/unitat-2-bloc-1.json`
- `site/data/hard/uf0518-bloc-1.json`

Each file declares its `blockId` and an indexed `questions` object.

`site/data/course.json` gains a `hardDistractorFile` field for each block.

### 3.3 Effective-content ordering

Load sequence:

1. canonical question bank(s);
2. Spanish translation(s);
3. memory aids;
4. `content_corrections.json`;
5. hard-distractor overlay.

Hard composition must therefore use the **effective corrected canonical and Spanish correct answer text**.

## 4. Hard-question composition

A pure helper composes a hard version of one effective question.

Inputs:

- effective question;
- hard overlay record;
- language-aware translation already attached.

Canonical hard options are:

- exactly one existing canonical correct-answer text;
- exactly three Catalan hard distractors.

Spanish hard options are:

- exactly one existing Spanish correct-answer text at the corresponding semantic position;
- exactly three Spanish hard distractors.

The helper returns a normal question object compatible with the existing quiz engine. It must not mutate the source question.

The existing `shuffleQuestionOptions()` remains the single mechanism that randomizes answer order and keeps Catalan/Spanish aligned.

## 5. Editorial standard for hard distractors

Every hard record is manually/LLM reviewed against the authorized course PDF(s).

For each question:

- normally 2–3 distractors should be plausible at first reading;
- at most one distractor may be obviously dismissible;
- distractors should be from the same conceptual family, nearby classification, process step, role, document, exception, or common confusion;
- wording length/register should be reasonably similar to the correct answer where practical;
- avoid joke answers, category mismatches, direct contradictions that reveal the answer, and giveaway absolutes such as “always/never” unless academically justified;
- no distractor may be defensible as equally correct under the source material;
- academic unambiguity has priority over difficulty.

At least two hard distractors per language must differ from the current practice-mode incorrect alternatives after normalized comparison.

## 6. Source discipline

No new academic truth is introduced by hard mode. Distractors may use concepts from the authorized material, but the correct answer remains the already-audited canonical answer.

Authorized sources remain the seven course PDFs already represented by source-traceability manifests:

- six UF0517 PDFs;
- one UF0518 Bloc 1 PDF.

If a plausible distractor cannot be written without becoming ambiguous, use a slightly easier but unambiguously wrong source-grounded distractor.

## 7. Bilingual invariants

Each hard overlay record has exactly three Catalan and three Spanish distractors.

The Spanish hard mode must preserve the same semantic correct answer as Catalan under every option shuffle.

Language switching during an active hard exam must:

- retain the selected option semantically;
- retain the current question;
- retain the answer order mapping;
- show the Spanish/Catalan hard distractors corresponding to the same shuffled positions.

## 8. Validation and audit

Add a hard-mode validator that fails if:

- coverage is not exactly 526 effective IDs;
- an unknown/orphan ID exists;
- block ID mismatches;
- either language lacks exactly three non-empty distractors;
- hard distractors contain duplicates after normalization;
- a hard distractor equals the effective correct answer after normalization;
- fewer than two distractors differ from practice-mode incorrect alternatives;
- Spanish fields contain unambiguous Catalan leakage according to the existing content-quality detector;
- hard-mode files are not declared exactly once by the course catalog.

Extend permutation auditing so every question is tested in:

- practice representation: 24 permutations × 2 languages = 48 cases/question;
- hard representation: 24 permutations × 2 languages = 48 cases/question.

Expected total position/alignment cases for 526 questions: **50,496**.

## 9. Test requirements

### Unit

Cover:

- overlay loading and exact-ID validation;
- hard composition keeps canonical correct answer;
- hard composition does not mutate canonical input;
- Spanish correct-answer alignment;
- shuffle alignment in hard mode;
- content corrections are applied before hard composition;
- hard overlay validation rules;
- UI renders hard mode in Catalan and Spanish;
- hard mode maps to exam semantics for scoring/feedback.

### E2E

Cover at minimum:

- existing Mode Estudi unchanged;
- existing Mode Examen unchanged;
- hard mode appears as a separate setup option;
- hard exam starts for a single block and for all material;
- no feedback/memory aid before completion;
- blanks and penalty behavior match normal exam;
- language switch during hard exam preserves selected answer;
- results and review show the hard options actually presented;
- mobile viewport remains usable;
- existing progress/history survives use of hard mode.

## 10. Backward compatibility

No deletion or renaming of current IDs, bank files, translations, memory aids, state key, or modes.

Existing `localStorage` state version remains compatible. Hard-exam history may use mode value `hard-exam`; readers must tolerate it without migration.

Current normal exam continues to use existing practice distractors.

## 11. Delivery gates

Implementation is not eligible for merge until all are true:

- 526/526 hard overlays exist in both languages;
- 50,496/50,496 permutation/alignment cases pass;
- source/content audit passes;
- full unit suite passes;
- full Playwright E2E passes;
- PR diff is reviewed for accidental canonical-bank changes;
- Cloudflare preview is smoke-tested;
- after squash merge, production deployment commit matches `main`;
- fresh production smoke verifies normal practice/exam plus hard exam in both languages.

## 12. Non-goals

This version does **not**:

- rewrite prompts;
- change correct answers;
- add new academic questions;
- generate distractors dynamically at runtime;
- use an external AI API in the production app;
- remove or simplify existing modes;
- redesign scoring or progress.
