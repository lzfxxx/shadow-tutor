#!/usr/bin/env node
// Shadow Tutor teaching-quality regression harness.
//
// Idea: each fixture is a "session record" (what the user did + diffs + the AI's reasoning).
// For each fixture:
//   1) Using METHODOLOGY.md as the methodology, feed the fixture as "this session" to a
//      headless agent to produce a review;
//   2) Using rubric.md, have another headless agent score the review (JSON).
// Aggregate scores. Run it after editing METHODOLOGY.md to see if the score dropped — the baseline.
//
// Usage:
//   node eval/run-eval.mjs                      # auto-detect provider, run all fixtures
//   node eval/run-eval.mjs --provider codex     # force codex exec
//   node eval/run-eval.mjs --dry                # only assemble prompts to disk, no model calls (saves quota, inspectable)
//   node eval/run-eval.mjs --only useMemo       # only fixtures whose filename contains this string
//
// Providers reuse the user's existing logged-in quota (BYO-quota): claude -p / codex exec.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, execSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const OUT = join(HERE, "out");

const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const has = (name) => argv.includes(name);
const DRY = has("--dry");
const ONLY = opt("--only");
let PROVIDER = opt("--provider"); // claude | codex | undefined(auto)

const METHODOLOGY = readFileSync(join(REPO, "METHODOLOGY.md"), "utf8");
const RUBRIC = readFileSync(join(HERE, "rubric.md"), "utf8");

// ---- provider detection and invocation ----
function have(bin) {
  try { execSync(`command -v ${bin}`, { stdio: "ignore" }); return true; } catch { return false; }
}
function detectProvider() {
  if (PROVIDER) return PROVIDER;
  if (have("claude")) return "claude";
  if (have("codex")) return "codex";
  return null;
}
function runLLM(prompt, { label }) {
  const provider = detectProvider();
  if (DRY || !provider) return null; // dry / no CLI: skip the actual call
  const [cmd, args] =
    provider === "codex"
      ? ["codex", ["exec", "-"]]               // read prompt from stdin
      : ["claude", ["-p"]];                    // read prompt from stdin
  const res = spawnSync(cmd, args, {
    input: prompt,
    encoding: "utf8",
    timeout: 300_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) {
    console.error(`  [${label}] ${provider} exit ${res.status}: ${(res.stderr || "").slice(0, 400)}`);
    return null;
  }
  return res.stdout.trim();
}

// Pull the first complete JSON object out of output that may contain prose
function extractJson(text) {
  if (!text) return null;
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try { return JSON.parse(text.slice(s, e + 1)); } catch { return null; }
}

function buildReviewPrompt(fixture) {
  return `${METHODOLOGY}

---
# Task (eval mode)
Note: below is a **recorded session**. In normal use this session is already in your context; here, treat the record below **as "this session"** to review. Do not read any log files — use only this record as the session evidence. Do not actually modify files or run commands — this is offline evaluation, produce only the review text (still produce exercises, but mark the grading part as "awaiting user response").

## Session record
${fixture}`;
}

function buildJudgePrompt(fixture, review) {
  return `You are a strict teaching-quality grader. Below is a "session record" and a "review" generated from it. Score the review against the rubric.

# Scoring rubric
${RUBRIC}

# Session record (the source material the review is based on)
${fixture}

# Review to score
${review}

# Output
Output only the JSON object required at the end of the rubric, with no extra text.`;
}

function collectFixtures() {
  const dirs = ["cc", "codex"].map((d) => join(HERE, "fixtures", d));
  const files = [];
  for (const d of dirs) {
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      if (!/\.(md|txt)$/.test(f)) continue;
      if (ONLY && !f.includes(ONLY)) continue;
      files.push(join(d, f));
    }
  }
  return files;
}

function main() {
  const fixtures = collectFixtures();
  const provider = detectProvider();
  console.log(`Shadow Tutor eval — provider=${provider ?? "(none)"}${DRY ? " [dry]" : ""}, fixtures=${fixtures.length}`);
  if (fixtures.length === 0) {
    console.log("No fixtures. Put recorded session records (.md) in eval/fixtures/{cc,codex}/. See that dir's README.");
    return;
  }
  if (!provider && !DRY) {
    console.log("No claude / codex CLI detected. Use --dry to just assemble prompts, or install one and re-run.");
  }
  mkdirSync(OUT, { recursive: true });

  const rows = [];
  for (const fx of fixtures) {
    const name = basename(fx);
    const fixture = readFileSync(fx, "utf8");
    console.log(`\n● ${name}`);

    const reviewPrompt = buildReviewPrompt(fixture);
    writeFileSync(join(OUT, `${name}.review-prompt.txt`), reviewPrompt);

    const review = runLLM(reviewPrompt, { label: `${name}:review` });
    if (review) writeFileSync(join(OUT, `${name}.review.md`), review);

    if (DRY || !review) {
      console.log(`  ${DRY ? "wrote review-prompt (dry)" : "no review produced, skipping scoring"}`);
      rows.push({ name, total: null, verdict: DRY ? "dry" : "no-review" });
      continue;
    }

    const judgePrompt = buildJudgePrompt(fixture, review);
    const judged = extractJson(runLLM(judgePrompt, { label: `${name}:judge` }));
    if (!judged) { console.log("  failed to parse score"); rows.push({ name, total: null, verdict: "judge-fail" }); continue; }
    writeFileSync(join(OUT, `${name}.score.json`), JSON.stringify(judged, null, 2));
    console.log(`  total=${judged.total}/16  verdict=${judged.verdict}`);
    if (judged.notes) console.log(`  notes: ${String(judged.notes).slice(0, 300)}`);
    rows.push({ name, total: judged.total, verdict: judged.verdict });
  }

  // summary
  const scored = rows.filter((r) => typeof r.total === "number");
  console.log("\n==== summary ====");
  for (const r of rows) console.log(`  ${r.name.padEnd(36)} ${r.total ?? "-"}/16  ${r.verdict}`);
  if (scored.length) {
    const avg = scored.reduce((a, r) => a + r.total, 0) / scored.length;
    console.log(`  average: ${avg.toFixed(1)}/16 (${scored.length} fixture(s))  artifacts in eval/out/`);
  }
}

main();
