#!/usr/bin/env bash
# Shadow Tutor 安装脚本。
# Claude Code 与 Codex 的 skill 格式一致（都是 <skills>/<name>/SKILL.md + name/description frontmatter），
# 所以两家共用同一份 skill 源：skills/shadow-tutor/ 本身就是自包含 bundle
# （SKILL.md + METHODOLOGY.md + scripts/），整目录拷贝即可。重复运行 = 覆盖更新（幂等）。
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CC_SKILLS="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
CC_CMD="${CLAUDE_COMMANDS_DIR:-$HOME/.claude/commands}"
CODEX_SKILLS="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"

say() { printf '  %s\n' "$1"; }

# 把自包含 skill bundle 装进给定 skills 根目录
install_skill_into() {
  local root="$1" dest="$1/shadow-tutor"
  mkdir -p "$dest"
  cp -R "$REPO/skills/shadow-tutor/." "$dest/"
  say "skill → $dest"
}

install_cc() {
  echo "→ Claude Code"
  install_skill_into "$CC_SKILLS"
  mkdir -p "$CC_CMD"
  cp "$REPO/claude/commands/shadow-tutor.md" "$CC_CMD/shadow-tutor.md"   # 可选 slash command 入口
  say "command → $CC_CMD/shadow-tutor.md"
}

install_codex() {
  echo "→ Codex"
  install_skill_into "$CODEX_SKILLS"
}

target="${1:-all}"
case "$target" in
  cc|claude)  install_cc ;;
  codex)      install_codex ;;
  all)        install_cc; install_codex ;;
  *) echo "用法：install.sh [cc|codex|all]"; exit 2 ;;
esac
echo "完成。两家都用 /shadow-tutor 唤起（或直接说\"复盘一下\"，靠 skill description 自动触发）。"
