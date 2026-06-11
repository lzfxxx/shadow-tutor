# Shadow Tutor

> AI 刚写的代码能跑——但**你**能解释它吗？Shadow Tutor 跑在**你自己的 Claude Code 或 Codex 会话里**：一段 AI 辅助编码结束后，它挑出**那一个**你大概率说不清的承重决策，**先逼你预测为什么，再揭晓**，然后在你自己的代码上把"为什么"教透——包括 AI 否决掉的那条路。

[English](./README.md) · [中文](./README.zh-CN.md)

## 安装

```bash
npx skills add lzfxxx/shadow-tutor
```

然后正常跟 agent 写一段代码，敲 `/shadow-tutor`（或直接说"复盘一下我该学什么"）。

<details>
<summary>其他安装方式</summary>

```bash
# Claude Code 插件市场
#   /plugin marketplace add lzfxxx/shadow-tutor
#   /plugin install shadow-tutor@shadow-tutor

# Codex 内直接从仓库装
#   $skill-installer https://github.com/lzfxxx/shadow-tutor

# npx 安装器（同时装进 Claude Code 和 Codex）
npx shadow-tutor install            # 或 npx shadow-tutor install cc | codex

# 克隆后跑安装脚本
git clone https://github.com/lzfxxx/shadow-tutor && cd shadow-tutor
./install.sh                        # 或 ./install.sh cc | ./install.sh codex
```
</details>

## 问题

AI 编程工具让你做出**能跑**但**不理解**的东西。学习发生在"挣扎"里，而 AI 把挣扎消除了——结果是能力幻觉 + 永久依赖。更糟的是，光看 AI 的解释治不了这个：解释看完就滑走了。真正留下来的，是你**先押了一个答案、然后发现自己错了**的那一刻。Shadow Tutor 制造的就是这一刻——而且不毁掉生产力（事后复盘、自愿触发）。

## 怎么用

正常和 AI 写代码 → 告一段落 → `/shadow-tutor` → 它会：

1. 读你的知识档案（`~/.shadow-tutor/knowledge.json`），跳过你已证明会的；
2. 默默挑出这次会话里**那一个**你大概率没真懂的承重决策——非显然的选择、被悄悄处理掉的坑，永远不挑样板代码；
3. 把那行真实代码摆给你，让你**先预测**：为什么这样写？换种写法会坏在哪？——然后**等你回答**；
4. **按你的答案定制揭晓**：你答对的部分确认，答漏的部分补上，再给你 AI 当时否决的方案和否决理由——这是文档里学不到的判断力；
5. 可选做一个 60 秒的小练习，就在你自己的代码上（项目有测试就真跑测试给反馈）；
6. 更新你的档案，下次复盘往深一层挖，不重复教。

一次一个点、一屏讲完、不打分、不施压——这是给想变强的开发者的帮助工具，不是考试。"不知道"是个好答案：那正是幻觉被当场戳破的瞬间。

## 长什么样

来自一份[真实会话记录](./examples/sample-session.md)（eval harness 实跑产出，rubric 评分 15/16）：

> **导师：** 这是我在你 `ProductList` 里做的一个决定：
> ```tsx
> const filtered = useMemo(
>   () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
>   [products, query]   // ← 这一行
> );
> ```
> 在我解释之前——依赖数组里 `products` 和 `query` **都有**。为什么要两个？具体点：如果只写 `[query]`，你打字时搜索*感觉上*照样能用。那到底会坏什么、什么时候坏？
>
> **你：**（押一个答案——或者说"不知道"）
>
> **导师：**（精准对着你答案的缺口揭晓——最后一句是：）……依赖数组里每漏一个值，就有一个值被悄悄冻住，等着咬你。

## 为什么能这么简单

在会话里调用时，模型上下文里**已经装着这次会话的全部**——它自己的推理、每个 diff、每个被否决的选项。不需要解析日志、不需要适配器、不调外部 API、不花额外的钱：复盘就在你当前会话里生成，用你已付的订阅。Claude Code 和 Codex 的 skill 格式完全一致，所以**同一个** `skills/shadow-tutor/` bundle 两家通用，零分叉。

整个产品 = 一份高质量教学方法论（[`METHODOLOGY.md`](./skills/shadow-tutor/METHODOLOGY.md)）+ 一个用户知识档案。

## 仓库结构

```
skills/shadow-tutor/        # ★ 产品本体——自包含 skill bundle（所有安装方式都整目录拷贝它）
  SKILL.md                  #   入口：触发条件 + predict-before-reveal 契约
  METHODOLOGY.md            #   教学方法论（改行为改这里）
  scripts/knowledge.mjs     #   知识档案读写/校验（防写坏）
scripts/knowledge.test.mjs  # 单测（npm test）
eval/                       # 教学质量回归 harness（产品成败的度量）
  run-eval.mjs              #   模拟学生对话：出题 → 作答 → 揭晓 → 评分
  rubric.md                 #   "教得好"的 8 个维度
  fixtures/{cc,codex}/      #   录制的会话（React、Python asyncio、Django ORM）
claude/commands/            # 可选的 /shadow-tutor slash command（Claude Code）
plugins/ + .claude-plugin/  # 生成的 Claude Code 插件市场布局（node bin/cli.mjs build）
bin/cli.mjs                 # 跨平台安装器 + 插件构建（npx shadow-tutor install）
install.sh                  # shell 安装器
docs/dev/                   # 维护者手册（eval 回归门禁、添加 fixture）
taxonomy.yaml               # ~130 初级概念种子
```

## 开发：迭代教学质量

唯一的生死问题是**"这场对话到底教没教会"**。eval harness 对每个 fixture 真演一场对话——导师出预测题、模拟的不完美学生作答、导师按答案定制揭晓、judge 按 [rubric](./eval/rubric.md) 给整场对话打分：

```bash
npm test                 # 知识档案单测
npm run eval:dry         # 只组装 prompt，不调模型（省额度）
npm run eval             # 用 claude -p / codex exec 实跑 + rubric 打分
```

当前分数：React / Python asyncio / Django ORM 三个 fixture **平均 15.3/16**。（诚实声明：n=3，学生和评委都是 LLM——这量的是对话的*形状*，不是真人学习效果。真实信号需要真实用户；欢迎贡献录制会话 fixture，见 [CONTRIBUTING.md](./CONTRIBUTING.md)。）

改 `skills/shadow-tutor/METHODOLOGY.md`，重跑，确认分数没掉——开发循环就这一个（[docs/dev/eval-regression.md](./docs/dev/eval-regression.md)）。

## 设计笔记

- **predict-before-reveal 就是产品。** 先解释等于扔掉了学习发生的唯一时刻——你押下的答案和真相之间的落差。其他所有规则（一个点、一屏、绑定真实证据）都是为了保护这个时刻。
- **in-session、无 hook。** 事后学习不需要实时机制，skill 直接骑在你的正常会话上。架构理由见 `AGENTS.md`。
- **隐私。** 复盘和知识档案都在 `~/.shadow-tutor/`（不进你的项目），默认本地。无网络调用、无遥测。

## 许可证

MIT —— 见 [LICENSE](./LICENSE)。
