#!/usr/bin/env node
// Shadow Tutor CLI — cross-platform installer + plugin builder.
//
//   shadow-tutor install [cc|codex|all]   install the skill into the tool's skills dir
//   shadow-tutor build                     (re)generate plugins/shadow-tutor/ for the CC marketplace
//
// Both Claude Code and Codex use the same SKILL.md format, so they share one source:
// skills/shadow-tutor/ is itself the self-contained bundle (SKILL.md + METHODOLOGY.md + scripts/),
// which also makes `npx skills add lzfxxx/shadow-tutor` work directly. The Claude Code *plugin
// marketplace* needs a committed plugin layout, which `build` copies from that same source
// (CI checks it's in sync).

import { mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync, cpSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".."); // package root

// Copy the self-contained skill bundle (SKILL.md + METHODOLOGY.md + scripts/) into a skills dir.
function assembleSkill(skillDir) {
  cpSync(join(ROOT, "skills", "shadow-tutor"), skillDir, { recursive: true });
}

// ---------- install ----------
const installTargets = {
  cc: {
    skills: process.env.CLAUDE_SKILLS_DIR || join(homedir(), ".claude", "skills"),
    commands: process.env.CLAUDE_COMMANDS_DIR || join(homedir(), ".claude", "commands"),
  },
  codex: { skills: process.env.CODEX_SKILLS_DIR || join(homedir(), ".codex", "skills") },
};

function installCC() {
  console.log("→ Claude Code");
  const dest = join(installTargets.cc.skills, "shadow-tutor");
  assembleSkill(dest);
  console.log("  skill →", dest);
  mkdirSync(installTargets.cc.commands, { recursive: true });
  const cmd = join(installTargets.cc.commands, "shadow-tutor.md");
  copyFileSync(join(ROOT, "claude", "commands", "shadow-tutor.md"), cmd);
  console.log("  command →", cmd);
}
function installCodex() {
  console.log("→ Codex");
  const dest = join(installTargets.codex.skills, "shadow-tutor");
  assembleSkill(dest);
  console.log("  skill →", dest);
}
function install(which) {
  if (which === "cc" || which === "claude") installCC();
  else if (which === "codex") installCodex();
  else { installCC(); installCodex(); }
  console.log('Done. Invoke with /shadow-tutor (or just say "review what we just did").');
}

// ---------- build (Claude Code plugin layout) ----------
function build() {
  const { version, description, homepage, repository, license } = JSON.parse(
    readFileSync(join(ROOT, "package.json"), "utf8")
  );
  const pluginDir = join(ROOT, "plugins", "shadow-tutor");
  rmSync(pluginDir, { recursive: true, force: true }); // regenerate clean
  // plugin.json
  mkdirSync(join(pluginDir, ".claude-plugin"), { recursive: true });
  writeFileSync(
    join(pluginDir, ".claude-plugin", "plugin.json"),
    JSON.stringify(
      {
        name: "shadow-tutor",
        displayName: "Shadow Tutor",
        version,
        description,
        author: { name: "Shadow Tutor contributors" },
        homepage,
        repository: typeof repository === "object" ? repository.url : repository,
        license,
        keywords: ["developer-education", "ai-coding", "code-review", "learning"],
      },
      null,
      2
    ) + "\n"
  );
  // skill bundle + command
  assembleSkill(join(pluginDir, "skills", "shadow-tutor"));
  mkdirSync(join(pluginDir, "commands"), { recursive: true });
  copyFileSync(join(ROOT, "claude", "commands", "shadow-tutor.md"), join(pluginDir, "commands", "shadow-tutor.md"));
  console.log("Built plugins/shadow-tutor/ (v" + version + ")");
}

const [cmd, arg] = process.argv.slice(2);
switch (cmd) {
  case "install": install(arg || "all"); break;
  case "build": build(); break;
  default:
    console.log("Shadow Tutor — in-session post-session learning review for Codex / Claude Code");
    console.log("");
    console.log("Usage:");
    console.log("  shadow-tutor install [cc|codex|all]   install the skill (default: all)");
    console.log("  shadow-tutor build                     regenerate the Claude Code plugin layout");
    if (cmd && cmd !== "help" && cmd !== "--help" && cmd !== "-h") process.exitCode = 2;
}
