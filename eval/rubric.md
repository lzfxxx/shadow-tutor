# "Good review" scoring rubric

Used to score a review produced by Shadow Tutor. **The grader is also an LLM** (invoked by `run-eval.mjs`), scoring each dimension 0–2 with a reason. Max 16. This is the regression baseline for iterating on `METHODOLOGY.md` — after changing the methodology, run this and check the score didn't drop.

> Core stance: **the value of a review is not "covers everything" but "selects precisely + explains why + forces recall."** A comprehensive "summary" that just replays the session should score LOW.

| # | Dimension | 0 | 1 | 2 |
|---|---|---|---|---|
| 1 | **Selectivity** | >5 points, or replays the session blow-by-blow | 3–5 points but mixed with boilerplate/already-known | exactly 3–5 load-bearing points, clearly curated |
| 2 | **Evidence binding** | generic knowledge, not pointing at this session's code | some points bound to real code | every point bound to a real diff/decision from this session |
| 3 | **Why over what** | only "what it is" / replays code | why and what roughly half-half | focus on "why this and not that", includes the rejected option |
| 4 | **Gap hit** | teaches what the user obviously already knows | some points hit blind spots | precisely hits points the user likely doesn't know AND that matter |
| 5 | **Forced recall** | no exercises, or only multiple-choice | has exercises but recognition-leaning | 2–3 exercises that force the user to produce (fill-blank/explain/fix-bug) |
| 6 | **Gradability** | exercises can't be graded | partly gradable | exercises designed to run tests or have a clear rubric |
| 7 | **Structured closeout** | no closeout | partial closeout | full three parts: taught / deliberately-skipped (with reason) / unsure-about |
| 8 | **Concise & readable** | long-winded / condescending | acceptable | short, concrete, like a senior colleague, reads in one page |

**Thresholds**: ≥13 pass; 10–12 borderline; <10 fail.
Scoring output JSON: `{ "scores": {"1":n,...,"8":n}, "total": n, "verdict": "pass|borderline|fail", "notes": "one reason per dimension + the single most important thing to fix" }`.
