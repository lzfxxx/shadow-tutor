# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] — 2026-06-11

The predict-before-reveal release.

### Changed
- **Teaching core rewritten** (`METHODOLOGY.md`): instead of 3–5 review cards with graded
  exercises, the tutor now picks the **one load-bearing decision** you most likely don't truly
  understand, makes you **predict why before it reveals** (breaking the "I get it" illusion),
  then teaches the why — including the rejected alternative — tailored to your answer, with an
  optional light LOCK exercise. One screen, positive close, no grading pressure, no anti-cheating.
- **Repo layout: the skill bundle is now `skills/shadow-tutor/`** (SKILL.md + METHODOLOGY.md +
  scripts/), a self-contained directory every installer copies verbatim. This makes
  **`npx skills add lzfxxx/shadow-tutor`** (the [skills CLI](https://github.com/vercel-labs/skills))
  work out of the box — previously it installed a bare SKILL.md without its methodology.
- **Eval harness upgraded to a simulated-student dialogue** (tutor predicts → student answers
  imperfectly → tutor reveals tailored → judge scores). Three fixtures across React, Python
  (asyncio) and Django ORM average **15.3/16** on the new rubric.
- Slash command, plugin marketplace descriptions, READMEs and the example all rewritten to match
  the new core (they previously described the 0.1.0 card-based flow).

### Removed
- `.agents/skills/` repo-local maintenance skills — folded into `docs/dev/*.md` playbooks so
  public skill installers list exactly **one** skill for this repo.

## [0.1.0] — 2026-06-02

Initial release.

### Added
- `METHODOLOGY.md` — the teaching methodology (the product itself): evidence-first two-phase
  flow, gap-ranking with suppression of known concepts, worked→faded review cards, forced-recall
  exercises with test-based grading, structured closeout.
- Shared `skill/SKILL.md` installed as a **native skill on both Codex and Claude Code**.
- `scripts/knowledge.mjs` — per-user knowledge profile with schema validation and atomic writes,
  plus a `node:test` suite (`scripts/knowledge.test.mjs`).
- `taxonomy.yaml` — ~130 junior-engineer concept seed.
- `bin/cli.mjs` (`npx shadow-tutor install`) and `install.sh` — installers for both tools.
- `eval/` — teaching-quality regression harness (`run-eval.mjs`) + rubric + seed fixture;
  the seed fixture scored 15/16.
- `AGENTS.md` and `.agents/skills/` — Codex-friendly repo instructions and dogfooded
  maintenance skills.
- GitHub CI, issue/PR templates, English + 中文 READMEs, MIT license.

[Unreleased]: https://github.com/lzfxxx/shadow-tutor/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/lzfxxx/shadow-tutor/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/lzfxxx/shadow-tutor/releases/tag/v0.1.0
