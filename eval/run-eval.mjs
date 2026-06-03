#!/usr/bin/env node
// Shadow Tutor teaching-quality regression harness — simulated-student dialogue.
//
// The product is a predict-before-reveal EXCHANGE, not a one-shot document, so the harness
// has to play out a short dialogue. For each fixture it runs four LLM calls:
//   1) Tutor (loaded with METHODOLOGY): pick the ONE point and ask the PREDICT question — STOP there.
//   2) Student (a simulated learner at the target level): answer the prediction realistically.
//   3) Tutor: continue — REVEAL tailored to the student's answer, optional LOCK, positive close.
//   4) Judge: score the assembled dialogue against rubric.md.
//
// Honest limits (do not oversell a passing score): n = number of fixtures, the student is itself an
// LLM, and the judge is an LLM grading against an author-written rubric. This measures the SHAPE of
// the exchange (does it predict-before-reveal, break an illusion, stay on one point), not real human
// learning. Real signal needs real users.
//
// Usage:
//   node eval/run-eval.mjs                 # auto-detect provider, run all fixtures
//   node eval/run-eval.mjs --provider codex
//   node eval/run-eval.mjs --dry           # assemble stage-1 prompts only, no model calls
//   node eval/run-eval.mjs --only useMemo

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

// The simulated learner — embody the target user, and answer imperfectly (that's the point).
const STUDENT_PERSONA =
  "You are a motivated junior developer. You can read code and have shipped small features, but you " +
  "have NOT internalized the deeper 'why' behind framework decisions. Answer the tutor's question the " +
  "way a real learner at this level would — a short, honest first instinct that may be partially right, " +
  "wrong, or 'no idea'. Do NOT research, do NOT reason like an expert, do NOT look anything up. One or " +
  "two sentences. If you genuinely wouldn't know, say so plainly.";

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
  if (!provider) return null;
  const [cmd, args] = provider === "codex" ? ["codex", ["exec", "-"]] : ["claude", ["-p"]];
  const res = spawnSync(cmd, args, { input: prompt, encoding: "utf8", timeout: 300_000, maxBuffer: 64 * 1024 * 1024 });
  if (res.status !== 0) {
    console.error(`  [${label}] ${provider} exit ${res.status}: ${(res.stderr || "").slice(0, 400)}`);
    return null;
  }
  return res.stdout.trim();
}

function extractJson(text) {
  if (!text) return null;
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try { return JSON.parse(text.slice(s, e + 1)); } catch { return null; }
}

const EVAL_NOTE =
  "Note (eval mode): the block below is a RECORDED session. Treat it as the session you just had. " +
  "Do not read log files, do not modify files or run commands — produce only your chat turn.";

// Stage 1 — tutor selects one point and asks the prediction; must STOP before revealing.
function buildPredictPrompt(fixture) {
  return `${METHODOLOGY}

---
# Task (eval mode — PREDICT phase only)
${EVAL_NOTE}
Do Step 0–2 of the flow ONLY: silently select the ONE load-bearing point, then ask the user your PREDICT question. **STOP there. Output only your opening line(s) and the prediction question. Do NOT reveal or explain anything yet.**

## Session record
${fixture}`;
}

// Stage 2 — simulated student answers.
function buildStudentPrompt(fixture, predictTurn) {
  return `${STUDENT_PERSONA}

Here is the code context you were just working on with the AI:
${fixture}

The tutor just said this to you:
"""
${predictTurn}
"""

Answer the tutor's question now, in character.`;
}

// Stage 3 — tutor reveals, tailored to the student's answer.
function buildRevealPrompt(fixture, predictTurn, studentAnswer) {
  return `${METHODOLOGY}

---
# Task (eval mode — REVEAL phase)
${EVAL_NOTE}
You already opened the exchange with:
"""
${predictTurn}
"""
The learner replied:
"""
${studentAnswer}
"""
Now continue with Step 3–6: REVEAL tailored exactly to what they said, an optional light LOCK, and a positive close. (For LOCK, describe the exercise; mark grading as "would run your tests" — this is offline.) Output only your chat turn.

## Session record (for your reference)
${fixture}`;
}

// Stage 4 — judge scores the whole dialogue.
function buildJudgePrompt(fixture, transcript) {
  return `You are a strict teaching-quality grader. Below is a recorded coding session and a Shadow Tutor exchange about it (tutor → learner → tutor). Score the exchange against the rubric.

# Scoring rubric
${RUBRIC}

# Session record (source material)
${fixture}

# The exchange to score
${transcript}

# Output
Output only the JSON object required at the end of the rubric, nothing else.`;
}

function collectFixtures() {
  const files = [];
  for (const d of ["cc", "codex"].map((x) => join(HERE, "fixtures", x))) {
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
  console.log(`Shadow Tutor eval (simulated student) — provider=${provider ?? "(none)"}${DRY ? " [dry]" : ""}, fixtures=${fixtures.length}`);
  if (fixtures.length === 0) {
    console.log("No fixtures. Put recorded sessions (.md) in eval/fixtures/{cc,codex}/. See that dir's README.");
    return;
  }
  if (!provider && !DRY) console.log("No claude / codex CLI detected. Use --dry, or install one and re-run.");
  mkdirSync(OUT, { recursive: true });

  const rows = [];
  for (const fx of fixtures) {
    const name = basename(fx);
    const fixture = readFileSync(fx, "utf8");
    console.log(`\n● ${name}`);

    const predictPrompt = buildPredictPrompt(fixture);
    writeFileSync(join(OUT, `${name}.1-predict-prompt.txt`), predictPrompt);
    if (DRY || !provider) { console.log("  wrote predict-prompt (dry)"); rows.push({ name, total: null, verdict: "dry" }); continue; }

    const predictTurn = runLLM(predictPrompt, { label: `${name}:predict` });
    if (!predictTurn) { rows.push({ name, total: null, verdict: "no-predict" }); continue; }
    const studentAnswer = runLLM(buildStudentPrompt(fixture, predictTurn), { label: `${name}:student` });
    if (!studentAnswer) { rows.push({ name, total: null, verdict: "no-student" }); continue; }
    const revealTurn = runLLM(buildRevealPrompt(fixture, predictTurn, studentAnswer), { label: `${name}:reveal` });
    if (!revealTurn) { rows.push({ name, total: null, verdict: "no-reveal" }); continue; }

    const transcript = `TUTOR:\n${predictTurn}\n\nLEARNER:\n${studentAnswer}\n\nTUTOR:\n${revealTurn}`;
    writeFileSync(join(OUT, `${name}.2-transcript.md`), transcript);

    const judged = extractJson(runLLM(buildJudgePrompt(fixture, transcript), { label: `${name}:judge` }));
    if (!judged) { console.log("  failed to parse score"); rows.push({ name, total: null, verdict: "judge-fail" }); continue; }
    writeFileSync(join(OUT, `${name}.3-score.json`), JSON.stringify(judged, null, 2));
    console.log(`  total=${judged.total}/16  verdict=${judged.verdict}`);
    if (judged.notes) console.log(`  notes: ${String(judged.notes).slice(0, 300)}`);
    rows.push({ name, total: judged.total, verdict: judged.verdict });
  }

  const scored = rows.filter((r) => typeof r.total === "number");
  console.log("\n==== summary ====");
  for (const r of rows) console.log(`  ${r.name.padEnd(36)} ${r.total ?? "-"}/16  ${r.verdict}`);
  if (scored.length) {
    const avg = scored.reduce((a, r) => a + r.total, 0) / scored.length;
    console.log(`  average: ${avg.toFixed(1)}/16 (${scored.length} fixture(s))  artifacts in eval/out/`);
  }
}

main();
