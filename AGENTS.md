# AGENTS.md — repository instructions for coding agents

Shadow Tutor is an **in-session post-session learning review** delivered as a native skill for
both Codex and Claude Code. The product is `METHODOLOGY.md` (a teaching methodology) plus thin
supporting code. Keep changes small, evidence-checked, and language-neutral.

## Build / test / eval

```bash
npm test            # node:test unit tests for scripts/ — must stay green
npm run eval:dry    # assemble eval prompts without model calls (no quota needed; CI-safe)
npm run eval        # real eval via `claude -p` / `codex exec` — scores reviews against the rubric
./install.sh        # assemble + install the skill into ~/.claude/skills and ~/.codex/skills
```

There is no build step; everything is plain ESM `.mjs` and markdown.

## Mandatory skill-usage rules (if/then)

- **Before** editing `METHODOLOGY.md` or anything under `skill/`, use `$eval-regression`:
  run the eval and confirm the rubric score does **not** drop (must stay ≥13, no regression on
  existing fixtures). Teaching quality is the product; a silent regression here is the worst
  failure mode.
- **When** adding a recorded coding session as a test fixture, use `$add-fixture` to normalize it
  to the fixture format and place it under `eval/fixtures/{cc,codex}/`.
- **When** changing `scripts/knowledge.mjs`, add or update a case in `scripts/knowledge.test.mjs`
  and keep `npm test` green.

(These `$skill` references live in `.agents/skills/` — repo-local skills Codex auto-discovers.)

## Conventions

- **Runtime files stay English and language-neutral.** The skill responds in the user's language
  (default English); don't hard-code a language in `METHODOLOGY.md` or `skill/SKILL.md`.
- **`scripts/knowledge.mjs` is intentionally thin** — its only job is to keep the user knowledge
  profile from being corrupted. Don't grow it into business logic.
- **One source for the skill.** `skill/SKILL.md` + `METHODOLOGY.md` are shared by both tools;
  never fork per-tool copies in the repo (the installer copies them into each tool's dir).
- Keep `METHODOLOGY.md` changes faithful to its iron rules (≤5 points, evidence-bound, why-over-
  what, mandatory graded exercises, one-page length).

## Security / privacy

- Never write user data into the repo. Reviews and the knowledge profile live under
  `~/.shadow-tutor/` on the user's machine, local by default.
- The eval harness shells out to `claude` / `codex` using the user's existing login — it does not
  require or store API keys. `--dry` runs make no model calls and are safe in CI.
- Do not add network calls or telemetry.
