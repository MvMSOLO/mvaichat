---
name: Tailwind v3 invalid utility class gotchas
description: Classes that look valid but don't exist in Tailwind v3 — cause silent no-op
---

These utility classes DO NOT exist in Tailwind v3 (the version used here):
- `size-4.5` — use `size-4` or `size-5` instead
- `h-13` — use `h-12` or `h-14` instead
- `duration-600` — use `duration-500` or `duration-700` instead

**Why:** Tailwind v3 only generates classes for values in its default theme. Non-standard values like 4.5, 13, 600 are not included.

**How to apply:** Whenever writing Tailwind classes, stick to the standard scale: 4, 5, 6, 8, 10, 12, 14, 16 for sizing; 100, 150, 200, 300, 500, 700 for duration.
