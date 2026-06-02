#!/usr/bin/env node
// Shadow Tutor —— 用户知识档案的读写/校验薄脚本。
// 故意做得很薄：唯一职责是保证 ~/.shadow-tutor/knowledge.json 不被模型写坏。
//
// 用法：
//   node knowledge.mjs get                      打印当前档案（不存在则打印空档案）
//   node knowledge.mjs init '<json>'            用校准信息初始化（已存在则拒绝，除非 --force）
//   node knowledge.mjs update '<json>'          合并更新若干概念的状态/置信度
//   node knowledge.mjs validate '<json>'        只校验不写盘，给模型自检用
//
// 概念状态机：unknown -> introduced -> learning -> mastered
//
// update 的入参形如：
//   { "concepts": { "react.useMemo": { "state": "learning", "confidence": 0.6,
//                                       "note": "能解释但没独立写出" } } }

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

const DIR = join(homedir(), ".shadow-tutor");
const FILE = join(DIR, "knowledge.json");
const SCHEMA_VERSION = 1;
const STATES = ["unknown", "introduced", "learning", "mastered"];

function emptyProfile() {
  return { version: SCHEMA_VERSION, concepts: {}, meta: { createdAt: null, updatedAt: null } };
}

function load() {
  if (!existsSync(FILE)) return emptyProfile();
  try {
    const p = JSON.parse(readFileSync(FILE, "utf8"));
    validateProfile(p); // 自身落盘的也校验，损坏则抛
    return p;
  } catch (e) {
    throw new Error(`现有档案无法解析/不合法（${FILE}）：${e.message}。请人工检查，避免覆盖丢数据。`);
  }
}

// ---- 校验：模型可能写脏，这里是唯一防线 ----
function validateProfile(p) {
  if (typeof p !== "object" || p === null) throw new Error("档案必须是对象");
  if (p.version !== SCHEMA_VERSION) throw new Error(`version 必须是 ${SCHEMA_VERSION}`);
  if (typeof p.concepts !== "object" || p.concepts === null) throw new Error("concepts 必须是对象");
  for (const [id, c] of Object.entries(p.concepts)) validateConcept(id, c);
  return p;
}

function validateConcept(id, c) {
  if (!/^[a-z0-9][a-z0-9._-]{0,80}$/i.test(id)) throw new Error(`概念 id 非法：${id}`);
  if (typeof c !== "object" || c === null) throw new Error(`概念 ${id} 必须是对象`);
  if (!STATES.includes(c.state)) throw new Error(`概念 ${id} 的 state 非法：${c.state}（应为 ${STATES.join("/")}）`);
  if (typeof c.confidence !== "number" || c.confidence < 0 || c.confidence > 1)
    throw new Error(`概念 ${id} 的 confidence 必须是 0..1`);
  if (c.note != null && typeof c.note !== "string") throw new Error(`概念 ${id} 的 note 必须是字符串`);
}

function parseArg(raw, label) {
  if (!raw) throw new Error(`${label} 需要一个 JSON 参数`);
  let obj;
  try { obj = JSON.parse(raw); } catch (e) { throw new Error(`${label} 的 JSON 解析失败：${e.message}`); }
  return obj;
}

function atomicWrite(profile) {
  validateProfile(profile);
  mkdirSync(dirname(FILE), { recursive: true });
  const now = new Date().toISOString();
  profile.meta ??= {};
  profile.meta.createdAt ??= now;
  profile.meta.updatedAt = now;
  const tmp = FILE + ".tmp";
  writeFileSync(tmp, JSON.stringify(profile, null, 2) + "\n", "utf8");
  renameSync(tmp, FILE); // 原子替换，避免半截写入
}

// ---- 子命令 ----
function cmdGet() {
  process.stdout.write(JSON.stringify(load(), null, 2) + "\n");
}

function cmdInit(raw, force) {
  if (existsSync(FILE) && !force) throw new Error(`档案已存在（${FILE}）。如确需覆盖请加 --force。`);
  const incoming = parseArg(raw, "init");
  const p = emptyProfile();
  for (const [id, c] of Object.entries(incoming.concepts ?? {})) {
    p.concepts[id] = normalizeConcept(c);
  }
  atomicWrite(p);
  process.stdout.write(`已初始化档案，含 ${Object.keys(p.concepts).length} 个概念。\n`);
}

function cmdUpdate(raw) {
  const incoming = parseArg(raw, "update");
  if (typeof incoming.concepts !== "object" || incoming.concepts === null)
    throw new Error("update 入参需含 concepts 对象");
  const p = load();
  let n = 0;
  for (const [id, c] of Object.entries(incoming.concepts)) {
    p.concepts[id] = { ...(p.concepts[id] ?? {}), ...normalizeConcept(c, p.concepts[id]) };
    n++;
  }
  atomicWrite(p);
  process.stdout.write(`已更新 ${n} 个概念。\n`);
}

function cmdValidate(raw) {
  const incoming = parseArg(raw, "validate");
  // 既支持校验整份档案，也支持校验一组 concepts
  if (incoming.version != null) validateProfile(incoming);
  else for (const [id, c] of Object.entries(incoming.concepts ?? {})) validateConcept(id, normalizeConcept(c));
  process.stdout.write("OK：合法。\n");
}

function normalizeConcept(c, prev) {
  const out = {
    state: c.state ?? prev?.state ?? "introduced",
    confidence: c.confidence ?? prev?.confidence ?? 0.3,
    lastSeen: new Date().toISOString(),
  };
  if (c.note != null) out.note = c.note;
  else if (prev?.note != null) out.note = prev.note;
  validateConcept("x", out);
  return out;
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const force = rest.includes("--force");
  const arg = rest.find((a) => !a.startsWith("--"));
  try {
    switch (cmd) {
      case "get": return cmdGet();
      case "init": return cmdInit(arg, force);
      case "update": return cmdUpdate(arg);
      case "validate": return cmdValidate(arg);
      default:
        process.stderr.write("用法：knowledge.mjs <get|init|update|validate> [json] [--force]\n");
        process.exit(2);
    }
  } catch (e) {
    process.stderr.write(`错误：${e.message}\n`);
    process.exit(1);
  }
}

main();
