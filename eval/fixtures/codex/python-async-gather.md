# Fixture: Python — speeding up sequential API calls with asyncio.gather

> Hand-written, realistic. Mixes a genuinely teachable concurrency decision (and a non-obvious ordering property) with boilerplate (imports, the client setup), to test selectivity.

## User's initial request
> This function fetches three users one at a time and it's slow. Make it faster. I'm using httpx with async.

## Existing code (before)
```python
async def get_users(client, user_ids):
    results = []
    for uid in user_ids:
        resp = await client.get(f"/users/{uid}")
        results.append(resp.json())
    return results
```

## AI's reasoning (thinking excerpt)
- The loop awaits each request before starting the next, so three 200ms calls take ~600ms. They're independent, so they should run concurrently.
- I'll build the coroutines first, then `await asyncio.gather(*tasks)`. That fires all three and waits for all to finish — ~200ms total.
- Considered `asyncio.as_completed` (process results as they arrive) and threads. Rejected: `as_completed` gives results in *completion* order, which would scramble the mapping to `user_ids`; the caller clearly wants results aligned to the input order. Threads are the wrong tool for IO-bound async code that already has an async client.
- The non-obvious property worth knowing: `gather` returns results in the **order of the arguments**, not the order they finished. So `results[0]` is always user_ids[0], even if it was the slowest. That's exactly why it's the right choice here.
- One thing I'm NOT adding: a concurrency limit. For 3 users it's fine. If this were 1000 ids, firing them all at once could exhaust connections / get rate-limited, and you'd want an `asyncio.Semaphore`. Flagging but not over-engineering for n=3.

## Applied change (diff)
```diff
 async def get_users(client, user_ids):
-    results = []
-    for uid in user_ids:
-        resp = await client.get(f"/users/{uid}")
-        results.append(resp.json())
-    return results
+    async def fetch(uid):
+        resp = await client.get(f"/users/{uid}")
+        return resp.json()
+
+    return await asyncio.gather(*(fetch(uid) for uid in user_ids))
```

## Outcome
Latency dropped from ~600ms to ~200ms. The user said "oh nice, way faster" and moved on — didn't ask why the order still lines up, or why there's no limit.

## Project test setup
pytest + pytest-asyncio; `test_get_users.py` asserts the returned list matches the input order. (→ a fill-the-blank on the gather line can be checked by running it.)
