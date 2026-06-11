# Shadow Tutor

> The AI just wrote code that works — but could *you* explain it? Shadow Tutor runs **inside your own Claude Code or Codex session**: after a chunk of AI-assisted work, it picks the **one load-bearing decision** you most likely can't explain, makes you **predict why before it reveals**, then teaches the why — including the alternative the AI rejected — on your own code.

[![CI](https://github.com/lzfxxx/shadow-tutor/actions/workflows/ci.yml/badge.svg)](https://github.com/lzfxxx/shadow-tutor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![version](https://img.shields.io/badge/version-0.2.0-blue)

[English](./README.md) · [中文](./README.zh-CN.md)

## Install

```bash
npx skills add lzfxxx/shadow-tutor
```

Then finish some real coding with your agent and type `/shadow-tutor` (or just say *"what should I learn from this?"*).

<details>
<summary>Other install options</summary>

```bash
# Claude Code plugin marketplace
#   /plugin marketplace add lzfxxx/shadow-tutor
#   /plugin install shadow-tutor@shadow-tutor

# Codex skill-installer, straight from this repo
#   $skill-installer https://github.com/lzfxxx/shadow-tutor

# npx installer (installs into both Claude Code and Codex)
npx shadow-tutor install            # or: npx shadow-tutor install cc | codex

# Clone and run the shell installer
git clone https://github.com/lzfxxx/shadow-tutor && cd shadow-tutor
./install.sh                        # or: ./install.sh cc | ./install.sh codex
```
</details>

## The problem

AI coding agents let you ship things that *run* but that you don't *understand*. Learning happens in the **struggle**, and the AI removed the struggle. The result is an ability illusion and permanent dependence: the productive friction where skill is built has been optimized away.

Worse, reading the AI's explanation doesn't fix it — explanations slide off. What sticks is the moment you commit to a guess and discover you were wrong. Shadow Tutor engineers exactly that moment, **without destroying your productivity** (it's post-session and opt-in).

## How it works

You code with the AI as usual → reach a stopping point → `/shadow-tutor` → it:

1. Reads your knowledge profile (`~/.shadow-tutor/knowledge.json`) to skip what you've already shown you know;
2. Silently picks the **one** load-bearing decision from this session you most likely don't truly understand — a non-obvious choice, a silently-handled pitfall, never boilerplate;
3. Shows you the actual line and asks you to **predict**: *why this, and what would break otherwise?* — then **waits**;
4. **Reveals, tailored to your answer**: confirms the part you got, teaches the part you missed, and gives you the alternative the AI rejected and why — the judgment you can't get from docs;
5. Offers an optional 60-second exercise on your own code (if your project has tests, it runs them for real feedback);
6. Updates your profile, so the next review digs one level deeper instead of repeating itself.

One point, one screen, no grading, no guilt — it's a help tool for developers who want to grow, not an exam. "No idea" is a perfectly good answer: that's the illusion breaking in real time.

## What it looks like

From a [real session transcript](./examples/sample-session.md) (produced by the eval harness, scored 15/16 by the rubric):

> **Tutor:** Here's a call I made in your `ProductList`:
> ```tsx
> const filtered = useMemo(
>   () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
>   [products, query]   // ← this line
> );
> ```
> Before I explain anything — the dependency array has **both** `products` and `query`. Why both? Specifically: if I'd written just `[query]`, the search would still *feel* like it works when you type. So what exactly would break, and when?
>
> **You:** *(commit to a guess — or say "no idea")*
>
> **Tutor:** *(reveals, aimed precisely at where your guess fell short — ending with:)* …Every dep you leave off is a value quietly frozen, waiting to bite.

## Why it's so simple

When you invoke it in-session, the model **already has the whole session in context** — its own reasoning, every diff, every rejected option. No log parsing, no adapters, no external API, no separate quota: the review is generated in your current session on the subscription you already pay for. Claude Code and Codex use the identical skill format, so **one** `skills/shadow-tutor/` bundle serves both, zero fork.

The entire product is one high-quality teaching methodology ([`METHODOLOGY.md`](./skills/shadow-tutor/METHODOLOGY.md)) plus a per-user knowledge profile.

## Repository layout

```
skills/shadow-tutor/        # ★ the product — self-contained skill bundle (every installer copies this)
  SKILL.md                  #   entry point: triggers + the predict-before-reveal contract
  METHODOLOGY.md            #   the teaching methodology (change behavior here)
  scripts/knowledge.mjs     #   knowledge-profile read/write/validate (guards against corruption)
scripts/knowledge.test.mjs  # node:test suite (npm test)
eval/                       # teaching-quality regression harness (the measure of success)
  run-eval.mjs              #   simulated-student dialogue: predict → answer → reveal → judge
  rubric.md                 #   what "taught well" means, in 8 scored dimensions
  fixtures/{cc,codex}/      #   recorded sessions (React, Python asyncio, Django ORM)
claude/commands/            # optional /shadow-tutor slash command for Claude Code
plugins/ + .claude-plugin/  # generated Claude Code marketplace layout (node bin/cli.mjs build)
bin/cli.mjs                 # cross-platform installer + plugin builder (npx shadow-tutor install)
install.sh                  # shell installer
docs/dev/                   # maintainer playbooks (eval regression gate, adding fixtures)
taxonomy.yaml               # ~130 junior-concept seed (for profile aggregation)
```

## Development: iterating on teaching quality

The one life-or-death question is **"does the exchange actually teach?"** The eval harness plays out a real dialogue per fixture — tutor asks the PREDICT question, a simulated imperfect student answers, the tutor reveals tailored to that answer, and a judge scores the whole exchange against [the rubric](./eval/rubric.md):

```bash
npm test                 # unit tests for the knowledge profile
npm run eval:dry         # assemble prompts only, no model calls (saves quota)
npm run eval             # real run via claude -p / codex exec, then rubric scoring
node eval/run-eval.mjs --only useMemo   # one fixture
```

Current scores: **15.3/16 average** across React / Python asyncio / Django ORM fixtures. (Honest limits: n=3, the student and judge are themselves LLMs — this measures the *shape* of the exchange, not human learning. Real signal needs real users; recorded-session fixtures welcome, see [CONTRIBUTING.md](./CONTRIBUTING.md).)

Edit `skills/shadow-tutor/METHODOLOGY.md`, re-run, and check the score didn't drop — that's the whole loop ([docs/dev/eval-regression.md](./docs/dev/eval-regression.md)).

## Design notes

- **Predict-before-reveal is the product.** Explaining first throws away the only moment where learning happens — the gap between your committed guess and the truth. Every other choice (one point, one screen, evidence-bound) exists to protect that moment.
- **In-session, hook-free.** Post-hoc learning needs no real-time mechanism; the skill rides your normal session. See `AGENTS.md` for the architecture rationale.
- **Privacy.** Reviews and the knowledge profile live under `~/.shadow-tutor/` (not in your project), local by default. No network calls, no telemetry.

## Roadmap

- **P1 — optional auto-trigger** (a SessionEnd hook / lightweight watcher) for users who want it, kept off the skill's critical path.
- **P2 — richer LOCK exercises** (fix-the-injected-bug) + HTML rendering of reviews.
- **P3 — deeper spaced recall** across sessions (today: a light "due concept" callback rides each invocation).
- **P4 — independent analysis layer** (to mitigate self-review bias) / dashboard / multi-user.

## License

MIT — see [LICENSE](./LICENSE).
