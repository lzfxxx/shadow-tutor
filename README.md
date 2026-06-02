# Shadow Tutor

AI 编程工具让小白也能做出能跑的东西——但用户什么都没学到。代码能跑，能力不长，初级永远初级。Shadow Tutor 把 AI 替你省掉的"挣扎"还回来：每完成一段编码，它基于**这次会话**给你一份短而准的复盘，讲清"为什么这么做"，并逼你做几个练习真正记住。

## 它是什么

一个 **in-session skill**，跑在你自己的 Claude Code 或 Codex 会话里：

- **不是独立 CLI、不挂 hook、不调外部 API。** 你在会话里 `/shadow-tutor` 唤起即可。
- **用你自己的额度。** 复盘就在当前会话里生成，花的是你已付的订阅。
- **Claude Code 和 Codex 都是原生 skill。** 两家 skill 格式一致（`<skills>/<name>/SKILL.md` + `name`/`description`），所以共用**同一份** `skill/SKILL.md` + `METHODOLOGY.md`，分别装进各自的 skills 目录，零分叉。

为什么这么简单：在会话里调用时，模型上下文里**已经装着这次会话的全部**——它自己的推理、所有 diff、每个决策。不需要在会话之外重建上下文，于是日志解析、适配器、子进程全都不需要。

## 安装

```bash
./install.sh         # 同时装 CC 和 Codex
./install.sh cc      # 只装 Claude Code
./install.sh codex   # 只装 Codex
```

装好后，在任一工具里完成一段编码后唤起 `/shadow-tutor`。

## 怎么用

正常和 AI 一起写代码 → 告一段落 → `/shadow-tutor` → 它会：
1. 读你的知识档案 `~/.shadow-tutor/knowledge.json`（抑制你已会的）；
2. 从这次会话里挑 **3–5 个** 你大概率没看懂、但重要的点（先举证、再开讲）；
3. 每个点讲清**为什么这样而不那样**（含 AI 否决掉的方案），都绑定你这次的真实代码；
4. 带你做 2–3 个**强制回忆**的练习，能跑测试的直接跑测试判分；
5. 更新你的知识档案，下次不再重复教你已会的。

## 仓库结构

```
METHODOLOGY.md        # 产品主体：教学方法论（改行为改这里）
taxonomy.yaml         # ~150 初级概念种子（知识档案挂靠用）
scripts/knowledge.mjs # 知识档案读写/校验薄脚本（防模型写坏 JSON）
skill/SKILL.md        # 共享 skill 薄壳（CC + Codex 同一份）
claude/commands/      # CC-only 可选 slash command 入口
install.sh            # 组装自包含 bundle 装进两家 skills 目录
eval/                 # 教学质量回归 harness（产品成败的度量）
  run-eval.mjs        # 无头加载 skill 跑 fixture → rubric 打分
  rubric.md           # "好复盘" 评分标准
  fixtures/{cc,codex} # 录好的真实会话
```

## 开发：迭代教学质量

产品唯一的生死问题是 **"自动复盘到底教不教得会人"**。所以核心开发循环是对着 eval harness 调 `METHODOLOGY.md`：

```bash
node eval/run-eval.mjs --dry          # 只组装 prompt 看内容，不调模型（省额度）
node eval/run-eval.mjs                # 用 claude -p / codex exec 实跑 + rubric 打分
node eval/run-eval.mjs --only useMemo # 只跑某个 fixture
```

改完 `METHODOLOGY.md` 重跑，看 rubric 分有没有掉。先录几个**真实会话**进 `eval/fixtures/`（见该目录 README），把分调到稳定合格，再谈打磨。

## 路线（已规划，未实现）

- **P1 可选自动触发**：给想要自动的用户提供 CC SessionEnd hook / 轻量 watcher（不动 skill 骨架）。
- **P2** `fix-the-bug` 练习 + HTML 复盘。
- **P3** 间隔重复 / 置信度衰减。
- **P4** 独立分析层（缓解"自我复盘"偏差）/ Web 仪表盘 / 多用户。
- **P5** 小白模式 + embedding 概念匹配。
