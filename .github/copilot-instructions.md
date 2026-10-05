# Repàs Actiu — Copilot repository instructions

Read `AGENTS.md`, `PROJECT_STATUS.json`, `README.md`, and `LICENSE` before making changes.

Academic/content authority:
- official teaching material is the academic authority;
- Catalan production content is canonical;
- Spanish content must preserve stable IDs and correct-answer indices;
- Research Intake/MoltBook input is hypothesis only and has no automatic production path.

Content rules:
- preserve exactly one unequivocally correct answer per test question;
- preserve source traceability;
- do not invent corrections from general knowledge when official material can decide the issue;
- do not expose course PDFs, substantial copyrighted excerpts, answer keys, or private mappings;
- do not weaken validators simply to make a proposed change pass.

Application rules:
- preserve the static/client-side architecture;
- preserve local browser progress/storage compatibility;
- keep bilingual UI/content behavior aligned;
- do not add a required backend or runtime LLM dependency.

Validation:
- run `npm run test:all`;
- run `npm run build`;
- rely on PR CI/Cloudflare as merge gates when local Playwright is unavailable.

Licensing:
- Apache-2.0 applies to original software/tooling as described in LICENSE;
- educational/source-derived content has a separate rights boundary.
