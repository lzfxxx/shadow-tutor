# Example: two real Shadow Tutor exchanges

> These are **unedited transcripts produced by the eval harness** (`npm run eval`): the tutor runs on a recorded session, a simulated junior developer answers the PREDICT question imperfectly, and the tutor reveals tailored to that answer. A judge scored them 15/16 (React) and 16/16 (Python) against [the rubric](../eval/rubric.md). Honest framing: the "learner" here is itself an LLM playing a junior — these show the *shape* of the exchange, not proof of human learning. Regenerate your own with `npm run eval`.

---

## Exchange 1 — React: the dependency array (session: adding search filtering)

**TUTOR:**

Here's a call I made in your `ProductList`:

```tsx
const filtered = useMemo(
  () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
  [products, query]   // ← this line
);
```

Before I explain anything — the dependency array has **both** `products` and `query`. Why both? Specifically: if I'd written just `[query]`, the search would still *feel* like it works when you type. So what exactly would break, and when?

One line is plenty — or just say "no idea." (That's a perfectly good answer here.)

**LEARNER:**

My gut says: if I only put `[query]`, typing still re-runs the filter so search feels fine — but if the `products` prop itself changes later (like new data loads in from the parent), the memo wouldn't recompute and you'd be filtering the old list. So it'd break when products update but the search term stays the same... I think? Not 100% sure on the timing though.

**TUTOR:**

That's it — you've got the whole mechanism, including the part most people miss: it only *feels* fine because each keystroke changes `query` and forces a recompute. The one thing you flagged — timing — let me sharpen.

`useMemo` recomputes *only* when a dep value changes between renders. With `[query]`: the parent loads new `products` → the component re-renders → `useMemo` sees `query` unchanged → it skips the function and hands back the array it cached against the **old** `products`. So it goes stale the instant `products` changes and stays frozen until the next keystroke moves `query`. It's not a delay — it's "frozen until `query` moves."

Worth knowing the path I rejected: inlining `products.filter(...)` with no memo at all is actually fine for a small list and *can't* go stale. The dependency array is the price you pay for skipping re-filters on unrelated re-renders — so if you take that price, you have to list every value the result depends on.

---

Want to lock it in? I'd blank that one line in your real `ProductList`:

```tsx
const filtered = useMemo(
  () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
  [ ___ ]   // ← fill this
);
```

You fill the array, and I'd run your Vitest suite (`ProductList.test.tsx`) and tell you exactly what passed or failed. Or if you'd rather just keep moving — also totally fine, you clearly have this one.

A minute ago "both deps" was a rule you'd been handed; now you can see the precise failure it prevents — a stale array, frozen until `query` changes. The question that generalizes to every `useMemo`/`useEffect`: *"which of these values, if it changed, should make this recompute?"* Every dep you leave off is a value quietly frozen, waiting to bite.

---

## Exchange 2 — Python: what `asyncio.gather` actually guarantees

**TUTOR:**

Here's a call I made on your code. Your loop was sequential — three 200ms requests, one after another, ~600ms. I replaced it with:

```python
return await asyncio.gather(*(fetch(uid) for uid in user_ids))
```

Now all three requests fire at once and come back in whatever order the server happens to answer — fast ones first, slow ones whenever. But your test asserts the returned list still lines up with `user_ids` (so `results[0]` is user 0, `results[1]` is user 1, …).

Before I explain — **what guarantees `results[0]` is still `user_ids[0]`'s data, even if that particular request was the slowest one to come back?** And as a follow-up: would swapping `gather` for `asyncio.as_completed` keep that guarantee?

One line is plenty — or just say "no idea." Both are good answers.

**LEARNER:**

I *think* `gather` keeps them in the order I passed the coroutines in, so even if user 1's request comes back last, it still lands in `results[1]`? Not totally sure why — and for `as_completed` I'd guess no, the name kind of says it hands them back as they finish, so the order would get scrambled.

**TUTOR:**

Both right — and the part you weren't sure of is exactly the part worth pinning down.

The *why*: `gather` doesn't fill the list as results arrive. It reserves a slot per coroutine up front, by position, and drops each result into its own reserved slot when that one finishes. So completion time is irrelevant — user 1's request can come back dead last and still land in `results[1]`, because that seat was always its. The order comes from the argument list, not the clock.

And yes on `as_completed`: it's literally an iterator that yields whichever finishes next, so the uid→result mapping is gone. If you ever wanted it (to start handling the fast ones early), you'd have to carry the id yourself — `return uid, resp.json()` — and rebuild the alignment. For results that must line up with the input, `gather` is the right call.

---

Want to lock it in? I'd blank the load-bearing word and have you fill it:

```python
return await asyncio.________(*(fetch(uid) for uid in user_ids))
```

One word. If you write it, I'd run your `test_get_users.py` (it asserts input-order alignment) and tell you exactly what passed. Or just take the explanation — your call.

A minute ago `gather` was "fires them all at once, faster." Now you can see the second guarantee riding along inside it — order is by position, not arrival — and you know the one swap (`as_completed`) that throws that guarantee away. That second part is the judgment, not the syntax.
