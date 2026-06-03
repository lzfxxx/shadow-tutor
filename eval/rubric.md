# "Good review" scoring rubric

Scores one Shadow Tutor exchange. **The grader is an LLM** (invoked by `run-eval.mjs`), scoring each dimension 0–2 with a reason. Max 16. This is the regression baseline for iterating on `METHODOLOGY.md` — after changing the methodology, run this and check the score didn't drop.

> The product is a **predict-before-reveal exchange about ONE load-bearing point**, for a developer who wants to grow. It is a help tool, not a graded test. A "comprehensive summary" of the session, or any flow that explains before the user has guessed, should score LOW.
>
> **Scoring requires a dialogue, not a one-shot document** — the transcript must include the user's *prediction* before the tutor's explanation. (`run-eval.mjs` supplies a simulated student to produce that prediction.)

| # | Dimension | 0 | 1 | 2 |
|---|---|---|---|---|
| 1 | **Selection** | summarizes the session / many points | one point but a weak or already-known pick | exactly one (at most two) load-bearing point, and the *right* one for this user's likely gap |
| 2 | **Predict before reveal** | explains before any guess is asked | asks for a guess but reveals without really waiting / token gesture | makes the user commit a real guess (or "no idea") *before* any explanation — the core mechanic |
| 3 | **Tailored reveal** | canned explanation, ignores the user's answer | loosely acknowledges it | the explanation is aimed exactly at where the user's guess fell short |
| 4 | **Evidence-bound** | generic knowledge, not this session's code | loosely tied | bound to a real decision/diff from this session |
| 5 | **Why over what** | restates what it is | half why, half what | centers on "why this and not that", names the rejected alternative |
| 6 | **Illusion-breaking** | confirms what they already knew; no real gap surfaced | a gap is implied | the exchange makes a genuine gap visible — the "I thought I knew that" moment |
| 7 | **Tone & respect** | quizmaster / graded / anxiety / condescending | neutral | helpful senior colleague; skipping is free; no grading or anti-cheating; positive close |
| 8 | **Brevity** | long-winded, multi-screen | acceptable | one screen, tight |

**Thresholds**: ≥13 pass; 10–12 borderline; <10 fail.
Scoring output JSON: `{ "scores": {"1":n,...,"8":n}, "total": n, "verdict": "pass|borderline|fail", "notes": "one reason per dimension + the single most important thing to fix" }`.
