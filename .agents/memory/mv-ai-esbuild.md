---
name: MV AI esbuild TypeScript catch syntax
description: esbuild fails on TypeScript catch-binding type annotations in api-server; fix and outer try/catch pattern for chat route
---

# esbuild TypeScript `catch (e: any)` is unsupported

**Rule:** Never use `catch (e: any)` in `artifacts/api-server/src/` — esbuild rejects it with "Expected ')' but found 'catch'". Use `catch (e)` instead, and cast `e` as `(e as any)` inside the block if you need `.message`.

**Why:** The api-server uses esbuild (not tsc) to bundle. esbuild bundles TypeScript but does not support all TS syntax. Typed catch bindings (`catch (e: SomeType)`) are one such gap. The failure looks like a syntax parse error at the `catch` keyword and halts the build entirely.

**How to apply:** When writing or editing any file under `artifacts/api-server/src/`, use plain `catch (e)` or `catch {}` (empty). Cast inside: `(e as any).message`. Also applies to any new route files added to the api-server.

The main `/api/chat` route handler body must be wrapped in a single outer `try { ... } catch (e) { ... }` — the async handler itself should not rely on Express catching thrown errors from async generators/streams.
