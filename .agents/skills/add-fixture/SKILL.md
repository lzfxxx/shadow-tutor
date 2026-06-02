---
name: add-fixture
description: Normalize a recorded coding session into an eval fixture and place it correctly. Use when adding a new test fixture from a real Claude Code or Codex session, or when someone pastes a raw session log/transcript that should become a regression fixture for the teaching-quality eval.
---

# add-fixture

Turn a raw recorded session into a clean eval fixture that strengthens the regression set.

## Contract

**Trigger:** adding a recorded session as a test fixture, or being handed a raw session log to convert.

**Input sources:**
- Claude Code: `~/.claude/projects/<slug>/<sessionId>.jsonl`
- Codex: `~/.codex/sessions/<year>/.../rollout-*.jsonl`

**Steps:**
1. Extract from the raw session: the user's request, the before-code, **the AI's reasoning (especially why it chose what it chose and what it rejected)**, the applied diff(s), the outcome, and whether the project has tests.
2. Write it in the structure of `eval/fixtures/cc/react-search-filter.md`.
3. Ensure the fixture **mixes signal and noise** — genuinely teachable points alongside boilerplate — so it actually tests the methodology's selectivity. If the session was trivially all-known or all-boilerplate, say so; it may not be a useful fixture.
4. Save to `eval/fixtures/cc/` or `eval/fixtures/codex/` with a descriptive kebab-case filename.
5. Run `npm run eval:dry` to confirm it's picked up, then (if quota available) `npm run eval --only <name>` to sanity-check it produces a sensible review.

**Output:** the new fixture file + a one-line note on what teachable points it's meant to exercise.

## Notes
- Keep the AI's "why" verbatim where possible — that's the lifeblood of teaching the *why*, and the thing a plain diff summary lacks.
- Redact any secrets/personal data before committing.
