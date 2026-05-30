# MV AI v9 — Living AI Cockpit

MV AI is a "living AI cockpit" — a cinematic multi-modal AI chat app with 8 AI modes, multi-model routing with automatic fallback, 12+ MCP tools, and Ozing, the AI companion mascot with 19 mood states.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mv-ai run dev` — run the web frontend (port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `OPENROUTER_API_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Framer Motion, Tailwind v3, Radix UI, TanStack Query, React Router v7
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Auth: Clerk
- AI: OpenRouter (Laguna M.1, GPT OSS, Nemotron, Gemma, DeepSeek, GLM 4.5 Air, Perplexity)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mv-ai/src/pages/Chat.tsx` — main chat orchestrator, message reactions, empty state
- `artifacts/mv-ai/src/pages/Landing.tsx` — landing page with hero, modes, agents
- `artifacts/mv-ai/src/components/MessageContent.tsx` — markdown renderer, code blocks, image zoom
- `artifacts/mv-ai/src/components/Ozing.tsx` — 2D mascot with 19 mood states
- `artifacts/mv-ai/src/lib/autonomy.ts` — client-side MCP tool executor
- `artifacts/mv-ai/src/lib/models.ts` — AI model config per mode
- `artifacts/mv-ai/src/index.css` — ECLIPSE design system v7, animations
- `artifacts/api-server/src/routes/chat.ts` — streaming AI, tools, multi-agent, system prompt
- `artifacts/api-server/src/routes/` — conversations, messages, profile, settings
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle ORM schema files

## Architecture decisions

- OpenRouter used as AI gateway — single API key routes to multiple free models
- All AI streaming via SSE (Server-Sent Events) for real-time token delivery
- MCP tools: server processes calculator/search/image, client handles navigation/apps
- `/api/multi-agent` implemented as server-side sequential agents (Researcher→Strategist→Creator→Refiner)
- Clerk handles auth entirely — no password storage
- Frontend uses camelCase for API, snake_case for internal settings keys
- Multi-model routing with automatic fallback per mode (see `MODEL_ROUTING` in chat.ts)

## Product

- **8 AI modes**: Humanoid, Ideal, Code, Vision, Search, Voice, Agents, Social
- **Multi-model routing**: Laguna M.1, GPT OSS 120B/20B, Nemotron 3 Super, GLM 4.5 Air, DeepSeek V4 Flash, Gemma 4
- **12+ MCP tools**: generate_image, web_search, calculator, youtube_action, instagram_dm, telegram_action, open_app, call_contact, send_sms, create_reminder, copy_to_clipboard, open_url
- **Ozing mascot**: 19 mood states with 3D rendering
- **Message reactions**: 👍👎 + copy + regenerate on every AI message
- **Conversation search**: real-time filtering in sidebar
- **Export chat**: download as .txt
- **Timestamps**: toggle per-message time display
- **Streaming code blocks**: live scan animation during generation, line numbers, run button for JS/TS/HTML
- **Skills system**: custom AI skills injected into system prompt
- **GitHub integration**: repo browsing panel

## User preferences

- User writes in Uzbek — app uses Uzbek as primary UI language
- Batch all tool calls in parallel to save credits
- Big parallel writes preferred over serial edits

## Gotchas

- `pnpm --filter @workspace/db run push` must be run after schema changes
- HMR is active on both frontend (Vite) and API (esbuild rebuild on restart)
- react-syntax-highlighter has no @types — use `// @ts-ignore` pattern
- Settings snake_case internally: `voice_enabled`, `sound_enabled`, `response_length` etc.
- Voice mode uses Web Speech API — mobile Safari requires user gesture
- esbuild doesn't support TypeScript `catch (e: any)` — use `catch (e)` instead
- The api-server chat.ts outer try/catch wraps the entire handler body

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
