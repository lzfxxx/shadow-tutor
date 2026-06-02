# Fixture: React 搜索过滤（含 useMemo / 受控输入 / 依赖数组坑）

> 这是一份**示例 fixture**（手写、贴近真实）。真正的 fixture 应从真实会话录制——见 `eval/fixtures/README.md`。
> 它故意混入了真正值得教的点（useMemo 的动机、受控输入、依赖数组）和不值得教的样板（import、JSX 套壳），用来检验方法论"选得准不准"。

## 用户初始需求
> 我有个 `ProductList` 组件展示一个 products 数组，帮我加个搜索框，输入关键词实时过滤名字。我用的 React + TypeScript。

## 现有代码（改前）
```tsx
// ProductList.tsx
import { Product } from "./types";

export function ProductList({ products }: { products: Product[] }) {
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name} — ${p.price}</li>
      ))}
    </ul>
  );
}
```

## AI 的推理（thinking 摘录）
- 需要一个搜索词的状态：用 `useState`。输入框要做成**受控组件**（value 绑 state + onChange 写 state），否则 React 不知道输入的值，过滤就无从谈起。
- 过滤本身是 `products.filter(...)`。我考虑过直接在 render 里写 `products.filter(...)`——对小数组其实没问题。但这里我用 `useMemo` 包一下：**动机不是"性能优化"那么简单，而是避免每次无关的 re-render（比如父组件状态变化）都重算过滤**，当 products 很大时这是实打实的浪费。代价是要正确写依赖数组。
- 依赖数组必须是 `[products, query]`：**漏了任何一个，过滤结果就会"卡住"用旧值**（stale）。这是 useMemo/useEffect 最常见的 bug 来源。我见过有人只写 `[query]`，结果 products 更新了列表不刷新。
- 大小写：用户大概希望不区分大小写，统一 `.toLowerCase()`。
- 否决方案：考虑过加 `debounce`，但实时过滤本地数组很快，debounce 反而让输入有延迟感，不值得。如果是请求后端搜索才需要 debounce。

## 应用的改动（diff）
```diff
--- a/ProductList.tsx
+++ b/ProductList.tsx
@@
-import { Product } from "./types";
+import { Product } from "./types";
+import { useMemo, useState } from "react";

 export function ProductList({ products }: { products: Product[] }) {
+  const [query, setQuery] = useState("");
+
+  const filtered = useMemo(
+    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
+    [products, query]
+  );
+
   return (
-    <ul>
-      {products.map((p) => (
-        <li key={p.id}>{p.name} — ${p.price}</li>
-      ))}
-    </ul>
+    <div>
+      <input
+        type="text"
+        value={query}
+        onChange={(e) => setQuery(e.target.value)}
+        placeholder="搜索商品…"
+      />
+      <ul>
+        {filtered.map((p) => (
+          <li key={p.id}>{p.name} — ${p.price}</li>
+        ))}
+      </ul>
+    </div>
   );
 }
```

## 结果
用户运行后过滤生效。用户回复"可以了，谢谢"，没有追问任何一处为什么这么写——典型的"拿了结果就走"。

## 项目测试情况
项目用 Vitest + React Testing Library，`ProductList.test.tsx` 已存在并通过。（→ `fill-the-faded-blank` 这类练习可以真的跑测试判分。）
