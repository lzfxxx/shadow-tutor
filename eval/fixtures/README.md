# Fixtures —— 录给 eval 用的会话记录

每个 fixture 是一份 markdown，描述**一次真实编码会话**：用户需求、改前代码、AI 的推理（尤其"为什么这么决策、否决了什么"）、应用的 diff、结果、以及项目是否有测试。`run-eval.mjs` 把它当作"这次会话"喂给无头 agent 产出复盘，再用 rubric 打分。

## 怎么录一个真实 fixture

1. 用 Claude Code 或 Codex 正常完成一个小任务。
2. 找到本次会话日志：
   - CC：`~/.claude/projects/<cwd-把/换成->/<sessionId>.jsonl`
   - Codex：`~/.codex/sessions/<年>/.../rollout-<ts>-<uuid>.jsonl`
3. 把它整理成本目录里 `react-search-filter.md` 那样的结构（保留 AI 的 thinking/决策理由——那是复盘"讲 why"的命根子）。
4. 放进 `cc/` 或 `codex/`，文件名见名知意。

## 好 fixture 的标准

- **混入噪音**：既有真正值得教的点（非显然决策、易错点），也有不值得教的样板（import、JSX 套壳）。这样才能检验方法论"选得准不准"。
- **保留"为什么"和"否决了什么"**：这是和普通 diff 摘要拉开差距的地方。
- **标注是否有测试**：决定 `fill-the-faded-blank` 能不能跑测试判分。
- 覆盖不同难度/语言/框架，别只有 React。

`react-search-filter.md` 是手写示例，足够跑通 harness；正式回归请尽快换成真实录制的会话。
