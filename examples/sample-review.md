# Example: a real Shadow Tutor review

> This is a real review produced by the eval harness from the `react-search-filter` fixture, scored **15/16** by the rubric (the one dropped point: it ran slightly long — since fixed by the "one page" rule in `METHODOLOGY.md`). Translated to English from the original run. Regenerate your own with `npm run eval`.

---

This is the review of our session. I first ran the candidates through internally (cite → filter), then taught.

## Shadow Tutor review: adding search filtering to ProductList

This looked like "just add a search box," but the AI made **3 non-obvious decisions** inside it that you took and moved on from without asking why. These happen to be where React most often trips people up. I picked 4 points.

---

### [decision] `useMemo` here isn't "performance optimization" — it's to avoid recomputing on unrelated re-renders

**What it did**
```tsx
const filtered = useMemo(
  () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
  [products, query]
);
```

**Why it did it this way**
- Writing `products.filter(...)` directly in render is **completely fine for small arrays** — the AI explicitly considered that path. So don't treat `useMemo` as "the standard way to write a filter."
- The real motivation: the component will re-render for **reasons unrelated to filtering** (parent state changed, some other state changed). Without `useMemo`, every such unrelated re-render re-filters the whole array. When `products` is large, that's real waste.
- `useMemo`'s semantics: **recompute only when a dependency changes, otherwise reuse last result.** The cost is you must write the dependency array correctly (next card).
- The underlying concept you're missing: **a React component function is called repeatedly, and everything in its body recomputes by default every time.** `useMemo` is the manual "stop" switch.

**Memory anchor**
> useMemo isn't "make it fast," it's "don't recompute for free on unrelated refreshes."

---

### [pitfall] Drop one dependency and the result "sticks" at a stale value

**What it did**
```tsx
[products, query]   // ← this line; get one wrong and you get a bug
```

**Why it did it this way**
- A dependency array means "recompute only when these values change." Drop one, and when it changes you **don't know**, so `filtered` keeps returning the previous stale result.
- The classic incident: writing only `[query]`. Typing filters fine, but **when the parent passes updated `products`, the list doesn't refresh** — because you never told `useMemo` that products is a variable too. The AI flagged exactly this in its thinking.
- This is the **#1 shared bug source** of useMemo / useEffect / useCallback. The rule is simple: **every changing value used inside the closure goes in the array.**

**Memory anchor**
> However many changing values the function uses, that many go in the dependency array. Miss one = stale.

---

### [concept] Controlled input: `value` bound to state is what gives the filter something to read

**What it did**
```tsx
<input
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>
```

**Why it did it this way**
- These two lines are a pair, neither optional: `onChange` writes each keystroke into state, `value={query}` reads state back into the input. **React becomes the single source of truth** for the input's value.
- Why it must be this way: your filter depends on the `query` state. If the input is uncontrolled (no `value` binding), the typed characters live only in the DOM, React **can't see them**, and `filtered` forever filters on an empty string.
- So a controlled input isn't a "style requirement" — it's the **precondition** for the feature to work.

**Memory anchor**
> To run logic on an input, first capture its value into state; value + onChange come as a pair.

---

### [decision] Rejected debounce — knowing when *not* to do something is worth more than knowing how

**Why it did it this way**
- Many people reflexively add debounce for "real-time search." The AI **explicitly rejected** it here.
- The judgment: a local array `.filter()` is **synchronous and extremely fast**. Adding debounce only introduces input lag — a net negative.
- Where debounce actually belongs: **when each keystroke fires a request** (backend search / an API call), to avoid hammering the backend.
- The underlying judgment: **debounce solves "an expensive side effect happening too often," not "filtering too often."** Local filtering isn't an expensive side effect, so it isn't needed.

**Memory anchor**
> debounce is for firing requests, not for local filters.

---

## Exercises (forced recall — please do them)

**Exercise 1 (fill-the-faded-blank, preferred)**
Complete the two blanks below — these are the load-bearing lines of this session's code:
```tsx
const filtered = useMemo(
  () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
  [ ___ , ___ ]   // ← fill the dependency array
);
```
Then answer: if you wrote only `[query]`, what *specific* symptom would the user observe?
→ Grading: run Vitest (correct dependency array + your symptom description hits "stale").

**Exercise 2 (explain-this-line)**
In your own words: why must `<input>` have `value={query}`? If you delete that line (keep only onChange), does the search box still work, and what happens to filtering?

**Exercise 3 (fix-the-bug)**
I broke this on purpose — find the bug and fix it:
```tsx
const filtered = useMemo(
  () => products.filter((p) => p.name.includes(query)),
  [products, query]
);
```
Hint: it's about case sensitivity — compare to the original and think about what's missing.
→ Grading: run tests (an uppercase query should match a lowercase name).

---

## Closeout

**What I taught**
1. The real motivation for useMemo (avoid recompute on unrelated re-renders, ≠ a performance cure-all)
2. Dropping a dependency → stale value (React hooks' #1 bug)
3. Controlled input is the precondition for filtering, not a style rule
4. The judgment for rejecting debounce (local filter vs firing requests)

**What I deliberately skipped**
- `import { useMemo, useState } from "react"` and the `<div>` wrapper JSX — pure boilerplate/glue. Your IDE prompts these and errors teach them; **not worth your attention.** Telling apart "decisions you must reason through" from "code you write on autopilot" is itself a skill.
- The basic use of `useState("")` — assumed known; say so if not and I'll cover it.

**What I'm unsure about**
I judged your level as a **new user with no profile**, so I covered "controlled input" even though it's fairly basic. If that's too easy for you, tell me and I'll skip it next time and spend the attention on useMemo/dependency-array-level points just above your level.

> One-tap calibration: roughly where are you with React hooks? (1 = only useState / 3 = used useEffect but hit dependency-array bugs / 5 = can explain useMemo and re-render relationship)
