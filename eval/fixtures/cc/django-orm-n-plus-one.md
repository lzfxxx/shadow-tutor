# Fixture: Django ORM — killing an N+1 with select_related

> Hand-written, realistic. Mixes a genuinely teachable decision (N+1, and select_related vs prefetch_related) with boilerplate (the view/template wiring), to test selectivity.

## User's initial request
> My posts page is really slow and the debug toolbar says it's running like 50 queries. Each post shows its author's name. Fix the query count.

## Existing code (before)
```python
def post_list(request):
    posts = Post.objects.all()
    return render(request, "posts.html", {"posts": posts})
```
```html
{% for post in posts %}
  <li>{{ post.title }} — {{ post.author.name }}</li>
{% endfor %}
```

## AI's reasoning (thinking excerpt)
- Classic N+1: `Post.objects.all()` runs 1 query for the posts, then `post.author.name` in the template lazily fires 1 more query per post — 50 posts = 51 queries.
- `author` is a ForeignKey (each post has one author), so the fix is `select_related("author")`. That makes the ORM emit a single SQL JOIN, pulling posts and their authors in one query.
- Decision point worth being explicit about: `select_related` vs `prefetch_related`. `select_related` is for forward FK / one-to-one — it does a SQL JOIN. `prefetch_related` is for many-to-many and reverse FK — it runs a second query and joins in Python. Using the wrong one either doesn't help or adds an extra query. Here it's a forward FK, so `select_related`.
- Rejected: manually fetching authors and building a dict. That works but reimplements what the ORM does correctly in one line, and it's easy to get wrong.

## Applied change (diff)
```diff
 def post_list(request):
-    posts = Post.objects.all()
+    posts = Post.objects.select_related("author")
     return render(request, "posts.html", {"posts": posts})
```

## Outcome
Query count dropped from 51 to 1. The user said "perfect, down to 1 query" and moved on — didn't ask why a JOIN replaced 50 queries, or when they'd need prefetch_related instead.

## Project test setup
Django test using `self.assertNumQueries(1)` around the view. (→ a fill-the-blank on the queryset line can be checked by running it.)
