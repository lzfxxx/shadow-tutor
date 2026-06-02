# Fixture: React search filter (useMemo / controlled input / dependency-array pitfall)

> This is an **example fixture** (hand-written, realistic). Real fixtures should be recorded from real sessions — see `eval/fixtures/README.md`.
> It deliberately mixes genuinely teachable points (the motivation for useMemo, controlled inputs, dependency arrays) with not-worth-teaching boilerplate (imports, JSX wrapping), to test whether the methodology "selects precisely."

## User's initial request
> I have a `ProductList` component that renders a products array. Add a search box that filters by name in real time. I'm using React + TypeScript.

## Existing code (before)
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

## AI's reasoning (thinking excerpt)
- Need state for the search term: use `useState`. The input must be a **controlled component** (value bound to state + onChange writing state), otherwise React doesn't know the input's value and there's nothing to filter on.
- The filter itself is `products.filter(...)`. I considered writing `products.filter(...)` directly in render — for small arrays that's actually fine. But here I wrap it in `useMemo`: **the motivation isn't simply "performance," it's to avoid recomputing the filter on every unrelated re-render** (e.g. a parent state change). When products is large that's real waste. The cost is having to write the dependency array correctly.
- The dependency array must be `[products, query]`: **dropping either one makes the filtered result "stick" at a stale value**. This is the #1 source of useMemo/useEffect bugs. I've seen people write only `[query]`, then products updates but the list doesn't refresh.
- Case sensitivity: the user probably wants case-insensitive matching, so normalize with `.toLowerCase()`.
- Rejected option: I considered adding `debounce`, but filtering a local array in real time is fast, and debounce would only add input lag — not worth it. Debounce is for when each keystroke fires a backend request.

## Applied change (diff)
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
+        placeholder="Search products…"
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

## Outcome
The user ran it and filtering works. The user replied "great, thanks" without asking why anything was written that way — the classic "take the result and move on."

## Project test setup
The project uses Vitest + React Testing Library; `ProductList.test.tsx` already exists and passes. (→ a `fill-the-faded-blank` exercise can actually run the tests to grade.)
