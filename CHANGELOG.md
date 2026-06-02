# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/lzfxxx/shadow-tutor/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/lzfxxx/shadow-tutor/releases/tag/v0.1.0
