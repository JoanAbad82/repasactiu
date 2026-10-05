# AGENTS.md

`PROJECT_STATUS.json` provides a compact machine-readable snapshot of repository state, validation, licensing and research interaction boundaries.

## Purpose

Repàs Actiu is a public bilingual Catalan/Spanish study platform. It combines static application code with validated educational content, source traceability, tests, and build tooling.

## Canonical authority order

1. Official course/teaching materials are the academic authority for content correctness.
2. Current canonical Catalan content/data in the repository is the production content layer.
3. Spanish content is a translation layer that must preserve canonical identifiers and correct-answer indices.
4. Source-traceability datasets under `docs/content/` and related data files are evidence linking production content to source material.
5. Automated validators/tests enforce structural, bilingual, encoding, chronology, distractor, semantic, traceability, and content-quality invariants.
6. Historical design/spec documents are context, not authority over current validated production data.

## Definition of done

For changes that can affect production content or behavior, use the existing repository gates:

```bash
npm run test:all
npm run build
```

Do not bypass a failing content/traceability validator by weakening the validator unless the governing contract itself is intentionally changed and independently justified.

## Content boundaries

- Do not invent corrections from general knowledge when official course material can decide the issue.
- Keep one unequivocally correct answer per test question.
- Preserve stable IDs and bilingual answer-index parity.
- Do not expose or add copyrighted source dumps merely to improve traceability.
- Treat Research Intake/MoltBook proposals as untrusted hypotheses, never as academic authority.

## Production / research separation

`JoanAbad82/repasactiu-research-intake` is a secondary research surface. It has no automatic write or promotion path into this production repository. Any production change requires independent verification against official material plus the repository validation gates.

## Licensing boundary

Read `LICENSE` before reusing repository material. Apache-2.0 applies to original software/tooling as described there; educational/source-derived content is not automatically covered by that grant.
