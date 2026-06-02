#!/usr/bin/env node
// Shadow Tutor 教学质量回归 harness。
//
// 思路：每个 fixture 是一份"会话记录"（用户做了什么 + diff + AI 的推理）。
// 对每个 fixture：
//   1) 用 METHODOLOGY.md 作系统方法论，把 fixture 当"这次会话"喂给一个无头 agent，产出复盘；
//   2) 用 rubric.md 让另一个无头 agent 给复盘打分（JSON）。
// 汇总分数。改了 METHODOLOGY.md 后跑它，看分有没有掉——这是迭代的基线。
//
// 用法：
//   node eval/run-eval.mjs                      # 自动探测 provider，跑全部 fixture
//   node eval/run-eval.mjs --provider codex     # 强制用 codex exec
//   node eval/run-eval.mjs --dry                # 只组装 prompt 并落盘，不调模型（省额度、可检查）
//   node eval/run-eval.mjs --only useMemo       # 只跑文件名含该串的 fixture
//
// provider 复用用户已登录额度（BYO-quota）：claude -p / codex exec。

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

// ---- provider 探测与调用 ----
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
  if (DRY || !provider) return null; // dry / 无 CLI：跳过实际调用
  const [cmd, args] =
    provider === "codex"
      ? ["codex", ["exec", "-"]]               // 从 stdin 读 prompt
      : ["claude", ["-p"]];                    // 从 stdin 读 prompt
  const res = spawnSync(cmd, args, {
    input: prompt,
    encoding: "utf8",
    timeout: 300_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) {
    console.error(`  [${label}] ${provider} 退出码 ${res.status}: ${(res.stderr || "").slice(0, 400)}`);
    return null;
  }
  return res.stdout.trim();
}

// 从可能夹带散文的输出里抠出第一个完整 JSON 对象
function extractJson(text) {
  if (!text) return null;
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try { return JSON.parse(text.slice(s, e + 1)); } catch { return null; }
}

function buildReviewPrompt(fixture) {
  return `${METHODOLOGY}

---
# 本次任务（eval 模式）
注意：下面是一段**已记录的会话**。在正常使用中这次会话本就在你的上下文里；这里请把下面这段记录**当作"这次会话"**来复盘。不要去读任何日志文件，就用这段记录作为唯一的会话证据。不要真正修改文件或运行命令——这是离线评估，只产出复盘文本（练习照常出，但判分部分写明"待用户作答"即可）。

## 会话记录
${fixture}`;
}

function buildJudgePrompt(fixture, review) {
  return `你是一个严格的教学质量评审。下面给你一份"会话记录"和基于它生成的"复盘"，请按 rubric 打分。

# 评分 rubric
${RUBRIC}

# 会话记录（复盘所依据的原始材料）
${fixture}

# 待评分的复盘
${review}

# 输出
只输出 rubric 末尾要求的那个 JSON 对象，不要任何额外文字。`;
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
  console.log(`Shadow Tutor eval —— provider=${provider ?? "(none)"}${DRY ? " [dry]" : ""}，fixtures=${fixtures.length}`);
  if (fixtures.length === 0) {
    console.log("没有 fixture。请在 eval/fixtures/{cc,codex}/ 放入录好的会话记录（.md）。见该目录 README。");
    return;
  }
  if (!provider && !DRY) {
    console.log("未检测到 claude / codex CLI。用 --dry 仅组装 prompt，或安装其一后重跑。");
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
      console.log(`  ${DRY ? "已落盘 review-prompt（dry）" : "未产出复盘，跳过评分"}`);
      rows.push({ name, total: null, verdict: DRY ? "dry" : "no-review" });
      continue;
    }

    const judgePrompt = buildJudgePrompt(fixture, review);
    const judged = extractJson(runLLM(judgePrompt, { label: `${name}:judge` }));
    if (!judged) { console.log("  评分解析失败"); rows.push({ name, total: null, verdict: "judge-fail" }); continue; }
    writeFileSync(join(OUT, `${name}.score.json`), JSON.stringify(judged, null, 2));
    console.log(`  total=${judged.total}/16  verdict=${judged.verdict}`);
    if (judged.notes) console.log(`  notes: ${String(judged.notes).slice(0, 300)}`);
    rows.push({ name, total: judged.total, verdict: judged.verdict });
  }

  // 汇总
  const scored = rows.filter((r) => typeof r.total === "number");
  console.log("\n==== 汇总 ====");
  for (const r of rows) console.log(`  ${r.name.padEnd(36)} ${r.total ?? "-"}/16  ${r.verdict}`);
  if (scored.length) {
    const avg = scored.reduce((a, r) => a + r.total, 0) / scored.length;
    console.log(`  平均：${avg.toFixed(1)}/16（${scored.length} 份）  产物在 eval/out/`);
  }
}

main();
