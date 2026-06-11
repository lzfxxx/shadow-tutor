# AGENTS.md — repository instructions for coding agents

Shadow Tutor is an **in-session post-session tutor** delivered as a native skill for both Codex
and Claude Code. The product is `skills/shadow-tutor/METHODOLOGY.md` (a teaching methodology)
plus thin supporting code. Keep changes small, evidence-checked, and language-neutral.

## Layout in one line

`skills/shadow-tutor/` **is** the product — a self-contained skill bundle
(`SKILL.md` + `METHODOLOGY.md` + `scripts/knowledge.mjs`) that every install path
(`npx skills add`, plugin marketplace, `install.sh`, `node bin/cli.mjs install`) copies verbatim.
Never fork per-tool copies; `plugins/` is generated from it by `node bin/cli.mjs build`.

## Build / test / eval

```bash
npm test            # node:test unit tests — must stay green
npm run eval:dry    # assemble eval prompts without model calls (no quota needed; CI-safe)
npm run eval        # real eval via `claude -p` / `codex exec` — simulated-student dialogue + rubric
node bin/cli.mjs build   # regenerate plugins/shadow-tutor/ after changing the bundle (CI checks sync)
./install.sh        # install the skill into ~/.claude/skills and ~/.codex/skills
```

There is no build step for the skill itself; everything is plain ESM `.mjs` and markdown.

## Mandatory rules (if/then)

- **Before** editing `skills/shadow-tutor/` (especially `METHODOLOGY.md`), follow
  [`docs/dev/eval-regression.md`](./docs/dev/eval-regression.md): run the eval and confirm the
  rubric score does **not** drop (must stay ≥13, no regression on existing fixtures). Teaching
  quality is the product; a silent regression here is the worst failure mode.
- **When** adding a recorded coding session as a test fixture, follow
  [`docs/dev/add-fixture.md`](./docs/dev/add-fixture.md) to normalize it and place it under
  `eval/fixtures/{cc,codex}/`.
- **When** changing `skills/shadow-tutor/scripts/knowledge.mjs`, add or update a case in
  `scripts/knowledge.test.mjs` and keep `npm test` green.
- **After** changing anything under `skills/shadow-tutor/` or `claude/commands/`, run
  `node bin/cli.mjs build` and commit the regenerated `plugins/`.

## Conventions

- **Runtime files stay English and language-neutral.** The skill responds in the user's language
  (default English); don't hard-code a language in the bundle.
- **`knowledge.mjs` is intentionally thin** — its only job is to keep the user knowledge profile
  from being corrupted. Don't grow it into business logic.
- Keep `METHODOLOGY.md` changes faithful to its iron rules: **one load-bearing point (at most
  two), predict before you reveal, evidence-bound to this session, the user's own code, one
  screen, respect the learner** (it's a help tool, not a test — no grading pressure, no
  anti-cheating, no guilt).

## Security / privacy

- Never write user data into the repo. Reviews and the knowledge profile live under
  `~/.shadow-tutor/` on the user's machine, local by default.
- The eval harness shells out to `claude` / `codex` using the user's existing login — it does not
  require or store API keys. `--dry` runs make no model calls and are safe in CI.
- Do not add network calls or telemetry.
