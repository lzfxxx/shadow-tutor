# Fixtures — recorded sessions for eval

Each fixture is a markdown file describing **one real coding session**: the user's request, the before-code, the AI's reasoning (especially "why it decided what it decided, and what it rejected"), the applied diff, the outcome, and whether the project has tests. `run-eval.mjs` feeds it to a headless agent as "this session" to produce a review, then scores the review with the rubric.

## How to record a real fixture

1. Complete a small task normally with Claude Code or Codex.
2. Find the session log:
   - Claude Code: `~/.claude/projects/<cwd-with-/-replaced-by-->/<sessionId>.jsonl`
   - Codex: `~/.codex/sessions/<year>/.../rollout-<ts>-<uuid>.jsonl`
3. Distill it into the structure of `react-search-filter.md` in this folder (keep the AI's thinking/decision rationale — that's the lifeblood of teaching "why").
4. Put it in `cc/` or `codex/` with a descriptive filename.

## What makes a good fixture

- **Mix in noise**: include both genuinely teachable points (non-obvious decisions, easy mistakes) and not-worth-teaching boilerplate (imports, JSX wrapping). That's what tests whether the methodology "selects precisely."
- **Keep the "why" and "what was rejected"**: this is where it differs from a plain diff summary.
- **Note whether there are tests**: determines whether `fill-the-faded-blank` can be graded by running tests.
- Cover varied difficulty/languages/frameworks — don't make everything React.

`react-search-filter.md` is a hand-written example, enough to exercise the harness; for real regression, replace it with actual recorded sessions as soon as possible.
