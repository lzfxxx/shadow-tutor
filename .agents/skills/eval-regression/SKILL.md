---
name: eval-regression
description: Run the teaching-quality eval and confirm the rubric score has not regressed. Use this BEFORE and AFTER any change to METHODOLOGY.md or anything under skill/, since teaching quality is the product and a silent drop there is the worst failure mode. Also use when a PR touches review-authoring behavior.
---

# eval-regression

Guard the one metric that matters: does the auto-generated review still teach well?

## Contract

**Trigger:** a change to `METHODOLOGY.md`, `skill/SKILL.md`, or any review-authoring logic.

**Steps:**
1. Establish a baseline first if you haven't: run `npm run eval` on the current `main` and record each fixture's `total` and `verdict` (artifacts land in `eval/out/`).
2. Apply the change.
3. Run `npm run eval` again (or `npm run eval:dry` if no model quota is available — note that dry mode only checks prompt assembly, not scores).
4. Compare per-fixture rubric totals.

**Pass condition:** every fixture stays **≥13/16** and no fixture regresses versus baseline. If a dimension legitimately improved at the cost of another, explain the trade-off.

**Output:** a short before/after table (`fixture | before | after | verdict`) and a one-line judgment: safe to merge or not. If it regressed, identify which rubric dimension dropped and why.

## Notes
- Real scoring needs `claude` or `codex` on PATH (uses the user's own quota). In CI, only `eval:dry` runs.
- Grow the regression set by adding real fixtures (see `$add-fixture`); a single fixture is a weak guard.
