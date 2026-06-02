#!/usr/bin/env node
// Shadow Tutor CLI — cross-platform installer (so `npx shadow-tutor install` works on any OS).
// Mirrors install.sh: assembles a self-contained skill bundle (SKILL.md + METHODOLOGY.md +
// scripts/) into each tool's skills directory. Both Claude Code and Codex use the same
// SKILL.md format, so they share one source.

import { cpSync, mkdirSync, copyFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".."); // package root

const targets = {
  cc: {
    label: "Claude Code",
    skills: process.env.CLAUDE_SKILLS_DIR || join(homedir(), ".claude", "skills"),
    commands: process.env.CLAUDE_COMMANDS_DIR || join(homedir(), ".claude", "commands"),
  },
  codex: {
    label: "Codex",
    skills: process.env.CODEX_SKILLS_DIR || join(homedir(), ".codex", "skills"),
  },
};

function installSkillInto(skillsRoot) {
  const dest = join(skillsRoot, "shadow-tutor");
  mkdirSync(join(dest, "scripts"), { recursive: true });
  copyFileSync(join(ROOT, "skill", "SKILL.md"), join(dest, "SKILL.md"));
  copyFileSync(join(ROOT, "METHODOLOGY.md"), join(dest, "METHODOLOGY.md"));
  copyFileSync(join(ROOT, "scripts", "knowledge.mjs"), join(dest, "scripts", "knowledge.mjs"));
  return dest;
}

function installCC() {
  console.log("→ Claude Code");
  console.log("  skill →", installSkillInto(targets.cc.skills));
  mkdirSync(targets.cc.commands, { recursive: true });
  const cmd = join(targets.cc.commands, "shadow-tutor.md");
  copyFileSync(join(ROOT, "claude", "commands", "shadow-tutor.md"), cmd);
  console.log("  command →", cmd);
}

function installCodex() {
  console.log("→ Codex");
  console.log("  skill →", installSkillInto(targets.codex.skills));
}

function install(which) {
  if (which === "cc" || which === "claude") installCC();
  else if (which === "codex") installCodex();
  else { installCC(); installCodex(); }
  console.log('Done. Invoke with /shadow-tutor (or just say "review what we just did" — the skill description auto-triggers).');
}

const [cmd, arg] = process.argv.slice(2);
switch (cmd) {
  case "install":
    install(arg || "all");
    break;
  default:
    console.log("Shadow Tutor — in-session post-session learning review for Codex / Claude Code");
    console.log("");
    console.log("Usage:");
    console.log("  shadow-tutor install [cc|codex|all]   install the skill (default: all)");
    if (cmd && cmd !== "help" && cmd !== "--help" && cmd !== "-h") process.exitCode = 2;
}
