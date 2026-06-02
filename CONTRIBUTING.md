# Contributing to Shadow Tutor

Thanks for helping make AI-assisted coding teach instead of just deliver. The product is **one teaching methodology** (`METHODOLOGY.md`) plus a small amount of supporting code, so most contributions fall into a few clear buckets.

## Ground rules

- The single life-or-death question is **"does the auto-generated review actually teach?"** Every change to `METHODOLOGY.md` or `skill/` must be checked against the eval harness — **the rubric score must not drop.**
- Keep the runtime surface tiny and language-neutral. The skill responds in the user's language (default English).
- Keep `scripts/knowledge.mjs` thin: its only job is to keep the knowledge profile from being corrupted. New behavior there needs a test in `scripts/knowledge.test.mjs`.

## Dev setup

```bash
git clone https://github.com/lzfxxx/shadow-tutor && cd shadow-tutor
npm test            # unit tests (node:test) — must be green
npm run eval:dry    # assemble eval prompts without calling a model
npm run eval        # real run via claude -p / codex exec (uses your own quota)
```

## Common contributions

### 1. Improve the teaching methodology (`METHODOLOGY.md`)
This is the highest-value change. Workflow:
1. Make sure you have at least one **real** fixture in `eval/fixtures/` (see below).
2. Run `npm run eval` and note the current rubric scores.
3. Edit `METHODOLOGY.md`.
4. Re-run `npm run eval`. **Scores must stay ≥13 and not regress** on existing fixtures.
5. In your PR, paste before/after rubric scores.

### 2. Add a recorded-session fixture (`eval/fixtures/{cc,codex}/`)
More real fixtures = a stronger regression set. Record a real session and distill it to the format in `eval/fixtures/cc/react-search-filter.md`. Keep the AI's reasoning ("why" and "what it rejected") — that's the lifeblood of good teaching. See `eval/fixtures/README.md`.

### 3. Extend the concept taxonomy (`taxonomy.yaml`)
Add concepts juniors commonly get wrong. Use `category.kebab-dotted` ids. Each entry should be something "easy to get wrong or commonly misunderstood," not trivia.

### 4. Code / tooling
Changes to `scripts/`, `bin/`, `install.sh`, or `eval/` need `npm test` green and, where relevant, a new test.

## PR checklist

- [ ] `npm test` passes
- [ ] If `METHODOLOGY.md`/`skill/` changed: before/after eval rubric scores included, no regression
- [ ] Runtime files stay English + language-neutral
- [ ] Docs updated if behavior or layout changed

## License

By contributing you agree your contributions are licensed under the project's [MIT License](./LICENSE).
