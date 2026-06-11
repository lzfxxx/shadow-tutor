# Codex for OSS — application notes (internal draft)

Working draft of answers for the [Codex for OSS](https://openai.com/form/codex-for-oss/) form.
Internal; refine before submitting. Be honest — the project is early but strategically aligned.

## What the project is

Shadow Tutor is a **native Codex/Claude Code skill** that runs *inside* a coding session. After
an AI-assisted task, it picks the **one load-bearing decision** the developer most likely doesn't
truly understand, makes them **predict why before it reveals** (breaking the "I get it" illusion),
then teaches the why — including the options the AI rejected — bound to the session's real diffs,
with an optional exercise graded by the project's own tests. It runs on the user's existing
subscription (no API key), and ships the *same* skill to both Codex and Claude Code.

## Why it matters to the ecosystem

AI coding agents make it trivial to ship code you don't understand. Learning lives in the
**struggle**, and the agent removes it — producing an ability illusion and permanent dependence.
"Junior engineers stay junior" is a real, widely-discussed downside of AI-assisted development.
Shadow Tutor is a direct, lightweight intervention: it re-inserts the cognitive friction **without
hurting productivity** (it's post-session and opt-in).

Crucially, it's built **with Codex's own extension paradigm** — a skill + `AGENTS.md`, the exact
pattern OpenAI promotes for Codex-friendly repos. It's an **amplifier** of the Codex ecosystem
(making AI-assisted coding additive to developer skill), not just a consumer of it.

## Maintainer status

Sole maintainer with write access to `github.com/lzfxxx/shadow-tutor` (public, MIT). Identity /
maintainer status verifiable on request.

## Evidence of quality & active maintenance

- A teaching-quality **eval harness** (`eval/run-eval.mjs`) plays out a simulated-student
  dialogue (predict → imperfect answer → tailored reveal) and scores it against a rubric;
  fixtures across React / Python asyncio / Django ORM average **15.3/16**. Quality is measurable
  and regression-tested, not hand-wavy.
- CI (unit tests across Node 18/20/22 + eval prompt-assembly + installer check), issue/PR
  templates, CONTRIBUTING, CHANGELOG, maintainer playbooks (`docs/dev/`).
- The repo itself follows the Codex best-practice patterns (AGENTS.md with mandatory skill-usage
  gates, progressive-disclosure skills, scripts-as-tiny-CLIs).

## Adoption plan

- Zero-friction install already live: `npx skills add lzfxxx/shadow-tutor` (the skills-CLI
  standard), `npx shadow-tutor install`, `./install.sh`, and Codex `$skill-installer <repo-url>`.
- Submit to the **openai/skills** catalog (`.experimental/`) and a Claude Code plugin marketplace.
- Grow the eval regression set with real recorded sessions across languages/frameworks; publish
  example reviews to demonstrate value.

## Honest positioning (for the "anything else" field)

This is an early project, not a project with large existing adoption. What it has is (1) a real,
named ecosystem problem it addresses, (2) tight strategic alignment with Codex's skills paradigm,
and (3) measurable teaching quality. The requested benefit (Codex access / credits) would go
directly into tightening teaching quality to consistently-passing and expanding the real-session
regression set — i.e. into making the skill genuinely good, which is the whole bet.
