# Shadow Tutor

> A post-session programming tutor that runs **inside your own Codex or Claude Code session**. After you finish a chunk of AI-assisted work, it teaches you *why* the AI made each decision and drills you with forced-recall exercises — so your skills actually grow.

[![CI](https://github.com/lzfxxx/shadow-tutor/actions/workflows/ci.yml/badge.svg)](https://github.com/lzfxxx/shadow-tutor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![version](https://img.shields.io/badge/version-0.1.0-blue)

[English](./README.md) · [中文](./README.zh-CN.md)

## The problem

AI coding agents (Codex, Claude Code) let a novice ship things that *run* — but that they don't *understand*. Learning happens in the **struggle**, and the AI removed the struggle. The result: an ability illusion and permanent dependence. Junior engineers stay junior, because the productive friction where skill is built has been optimized away.

Shadow Tutor puts that friction back — **without destroying productivity.**

## What it is

An **in-session skill** that runs in your own Codex or Claude Code session:

- **No separate CLI to babysit, no hooks, no external API.** You invoke `/shadow-tutor` inside the session.
- **Uses your own quota.** The review is generated in your current session, on the subscription you already pay for.
- **Native skill on both Codex and Claude Code.** Both use the identical skill format (`<skills>/<name>/SKILL.md` + `name`/`description`), so the *same* `skill/SKILL.md` + `METHODOLOGY.md` is installed into each — zero fork.

Why this is so simple: when you invoke it in-session, the model **already has the whole session in context** — its own reasoning, every diff, every decision. There's no need to reconstruct the session from logs, so adapters, subprocesses, and log parsing all disappear. The entire product is **one high-quality teaching methodology** (`METHODOLOGY.md`) **plus a per-user knowledge profile.**

## How it works

You code with the AI as usual → reach a stopping point → `/shadow-tutor` → it:

1. Reads your knowledge profile `~/.shadow-tutor/knowledge.json` (to suppress what you already know);
2. Picks **3–5** points from this session you most likely missed but that matter (cite-evidence-first, then teach);
3. Explains **why this and not that** for each (including the options the AI rejected), every point bound to your real code;
4. Walks you through 2–3 **forced-recall** exercises; where tests exist, it runs them to grade;
5. Updates your profile, so next time it won't re-teach what you've learned.

## Install

```bash
# Option A — one-liner via npx (cross-platform, installs into both tools)
npx shadow-tutor install            # or: npx shadow-tutor install cc | codex

# Option B — Claude Code plugin marketplace
#   /plugin marketplace add lzfxxx/shadow-tutor
#   /plugin install shadow-tutor@shadow-tutor

# Option C — Codex skill-installer, straight from this repo
#   $skill-installer https://github.com/lzfxxx/shadow-tutor

# Option D — clone and run the installer
git clone https://github.com/lzfxxx/shadow-tutor && cd shadow-tutor
./install.sh                        # or: ./install.sh cc | ./install.sh codex
```

Then, in either tool, finish some coding and invoke `/shadow-tutor`.

## What a review looks like

See [`examples/sample-review.md`](./examples/sample-review.md) for a full real review (scored **15/16** by the eval rubric). A taste:

> ### [decision] `useMemo` here isn't for "performance" — it's to avoid recomputing on unrelated re-renders
> **Why it did it this way:** writing `products.filter(...)` directly in render is fine for small arrays — the AI considered exactly that. The real motivation: the component re-renders for reasons unrelated to filtering… The underlying concept you're missing: **a React component function is called repeatedly, and everything in its body recomputes by default.**
>
> **Exercise (fill-the-faded-blank):** complete the dependency array. If you wrote only `[query]`, what exact symptom would the user see?

## Repository layout

```
METHODOLOGY.md         # the product: teaching methodology (change behavior here)
skill/SKILL.md         # shared skill shell (Codex + Claude Code, one source)
scripts/knowledge.mjs  # knowledge-profile read/write/validate (guards against model corruption)
scripts/knowledge.test.mjs  # node:test suite (npm test)
taxonomy.yaml          # ~130 junior-concept seed (for profile aggregation)
claude/commands/       # Claude Code-only optional slash command
bin/cli.mjs            # cross-platform installer (npx shadow-tutor install)
install.sh             # shell installer (assembles bundles into both skills dirs)
AGENTS.md              # Codex-friendly repo instructions (build/test + skill rules)
.agents/skills/        # repo-local maintenance skills (dogfooding the Codex pattern)
eval/                  # teaching-quality regression harness (the measure of success)
  run-eval.mjs         # headlessly load the skill against fixtures → rubric scoring
  rubric.md            # "good review" scoring rubric
  fixtures/{cc,codex}  # recorded real sessions
```

## Development: iterating on teaching quality

The product's one life-or-death question is **"does the auto-generated review actually teach?"** So the core dev loop is tuning `METHODOLOGY.md` against the eval harness:

```bash
npm test                 # unit tests for the knowledge profile
npm run eval:dry         # assemble prompts only, no model calls (saves quota)
npm run eval             # real run via claude -p / codex exec, then rubric scoring
node eval/run-eval.mjs --only useMemo   # one fixture
```

Edit `METHODOLOGY.md`, re-run, and check the rubric score didn't drop. Record a few **real sessions** into `eval/fixtures/` (see that dir's README) to grow the regression set beyond the single seed fixture. See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Design notes

- **In-session, hook-free.** Post-hoc learning needs no real-time mechanism; hooks are real-time and Codex-specific, so depending on them would both be redundant and lock the design to one tool. See the architecture rationale in `AGENTS.md`.
- **BYO-quota.** Generation runs in your session via the same model you're already using.
- **Privacy.** Reviews and the knowledge profile live under `~/.shadow-tutor/` (not in your project), local by default.

## Roadmap

- **P1 — optional auto-trigger** for users who want it (a Claude Code SessionEnd hook / lightweight watcher), kept off the skill's critical path.
- **P2** — `fix-the-bug` exercises + HTML review rendering.
- **P3** — spaced repetition / confidence decay.
- **P4** — an independent analysis layer (to mitigate "self-review" bias) / web dashboard / multi-user.
- **P5** — beginner mode + embedding-based concept matching.

## License

MIT — see [LICENSE](./LICENSE).
