# Shadow Tutor

> 一个跑在**你自己 Codex 或 Claude Code 会话里**的事后复盘式编程导师。用 AI 写完一段代码后，它基于这次会话教你"为什么这么做"，并用强制回忆的练习逼你真正记住——让你的能力真的在长。

[English](./README.md) · [中文](./README.zh-CN.md)

## 问题

AI 编程工具让小白也能做出**能跑**但**不理解**的东西。学习发生在"挣扎"里，而 AI 把挣扎消除了。结果是能力幻觉 + 永久依赖：初级工程师永远停在初级，因为真正长本事的"认知摩擦"被优化掉了。

Shadow Tutor 把这层摩擦还回来——**且不毁掉生产力。**

## 它是什么

一个 **in-session skill**，跑在你自己的 Codex 或 Claude Code 会话里：

- **不是独立 CLI、不挂 hook、不调外部 API。** 你在会话里 `/shadow-tutor` 唤起即可。
- **用你自己的额度。** 复盘就在当前会话里生成，花的是你已付的订阅。
- **Claude Code 和 Codex 都是原生 skill。** 两家 skill 格式一致（`<skills>/<name>/SKILL.md` + `name`/`description`），所以共用**同一份** `skill/SKILL.md` + `METHODOLOGY.md`，分别装进各自的 skills 目录，零分叉。

为什么这么简单：在会话里调用时，模型上下文里**已经装着这次会话的全部**——它自己的推理、所有 diff、每个决策。不需要在会话之外重建上下文，于是日志解析、适配器、子进程全都不需要。产品的全部 = **一份高质量的教学方法论**（`METHODOLOGY.md`）**+ 一个用户知识档案**。

## 怎么用

正常和 AI 一起写代码 → 告一段落 → `/shadow-tutor` → 它会：

1. 读你的知识档案 `~/.shadow-tutor/knowledge.json`（抑制你已会的）；
2. 从这次会话里挑 **3–5 个** 你大概率没看懂、但重要的点（先举证、再开讲）；
3. 每个点讲清**为什么这样而不那样**（含 AI 否决掉的方案），都绑定你这次的真实代码；
4. 带你做 2–3 个**强制回忆**的练习，能跑测试的直接跑测试判分；
5. 更新你的知识档案，下次不再重复教你已会的。

## 安装

```bash
# 方式 A —— npx 一行（跨平台）
npx shadow-tutor install            # 同时装进 Codex 和 Claude Code

# 方式 B —— 克隆后跑安装脚本
git clone https://github.com/lzfxxx/shadow-tutor && cd shadow-tutor
./install.sh                        # 或 ./install.sh cc | ./install.sh codex

# 方式 C —— Codex 内直接从仓库装
# 在 Codex 里：  $skill-installer https://github.com/lzfxxx/shadow-tutor
```

装好后，在任一工具里完成一段编码后唤起 `/shadow-tutor`。

## 仓库结构

```
METHODOLOGY.md         # 产品主体：教学方法论（改行为改这里）
skill/SKILL.md         # 共享 skill 薄壳（Codex + Claude Code 同一份）
scripts/knowledge.mjs  # 知识档案读写/校验（防模型写坏 JSON）
taxonomy.yaml          # ~130 初级概念种子
bin/cli.mjs            # 跨平台安装器（npx shadow-tutor install）
install.sh             # shell 安装器
AGENTS.md              # Codex-friendly 仓库说明（build/test + skill 规则）
.agents/skills/        # repo-local 维护 skill（dogfood Codex 范式）
eval/                  # 教学质量回归 harness（产品成败的度量）
```

## 开发：迭代教学质量

产品唯一的生死问题是 **"自动复盘到底教不教得会人"**。核心开发循环是对着 eval harness 调 `METHODOLOGY.md`：

```bash
npm test                 # 知识档案单测
npm run eval:dry         # 只组装 prompt，不调模型（省额度）
npm run eval             # 用 claude -p / codex exec 实跑 + rubric 打分
```

改完 `METHODOLOGY.md` 重跑，看 rubric 分有没有掉。详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

MIT —— 见 [LICENSE](./LICENSE)。
