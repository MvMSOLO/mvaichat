## MV AI v6 — "Singularity Update"

Kelishilgan dunyoni larzaga soluvchi yangilanish. 6 ta katta blok + 10+ qo'shimcha. Hammasi real ishlaydi, demo emas.

---

### 1. Autonomy (Action Engine)

AI endi **gapirmaydi — bajaradi**.

- Yangi `tools` qatlami (Vercel AI SDK function-calling stilida) chat edge functionga qo'shiladi:
  - `open_url(url)` — frontend `window.open` + native (Capacitor `Browser.open`) bilan **rostdan ochadi**.
  - `open_app(app)` — youtube/instagram/telegram/whatsapp uchun `youtube://`, `tg://`, `intent://` deep-linklar.
  - `call_contact(name|number)` — `tel:` link + Capacitor `CallNumber` (mobil), confirm modal bilan.
  - `send_sms(number, text)` — `sms:` scheme + Capacitor SMS plugin.
  - `github_push(repo, files, message)` — GitHub OAuth (real ulash) → Octokit orqali commit/push, qaytib URL beradi.
  - `web_action(query)` — generik fallback.
- **Confirm flow**: har bir destructive action uchun "Approve / Cancel" cinematic modal (Ozing kimniki ekanini so'raydi).
- **GitHub real connect**: Settings → Connectors → "Connect GitHub" tugmasi (OAuth device flow, token Lovable Cloud da `user_secrets` jadvalida shifrlangan saqlanadi).
- AI vaqt ketsa ham **bajarib bo'lguncha** stream qiladi (`tool_call → executing → result` event'lari chatda jonli ko'rinadi).

### 2. 2026 Brain + Real Code Preview

- Default modellar `gpt-5.2` va `gemini-3.1-pro-preview` ga ko'chiriladi (2026 knowledge).
- Har bir javob oldidan `web-search` avto-trigger bo'ladi (yangilik/fakt detektor regex + LLM router) — javoblar **1 daqiqa oldingacha** yangi.
- Search engine: DuckDuckGo + Wikipedia + **Brave Search HTML** + GitHub trending — parallel, dedup, ranked.
- **Code mode v2**:
  - Har generatsiyadan keyin **avto-lint** (in-browser `esbuild-wasm` + `typescript` worker) — error topilsa AI o'zi 1 marta avto-fix qiladi (self-heal loop).
  - **Live React Preview**: Sandpack bundler ON, console pane, error overlay, hot reload.
  - "Yana xato chiqsa — AI ga jarima" → metric: `code_error_rate` Supabase `code_runs` jadvaliga yoziladi va AI ga system promptda ko'rsatiladi ("you are penalized for shipping broken code").

### 3. Per-Mode Cinematic UI + Smooth Switch

- Yangi `ModeShell.tsx` — har bir mode o'z **theme token**i, o'z layout'i, o'z input panel'i bilan keladi:
  - **Humanoid** — joriy glass dark.
  - **Ideal** — kengroq reading column, serif accent, "thinking trace" sidebar.
  - **Code** — Lovable-vari split: chap chat / o'ng Sandpack live preview, monospace.
  - **Vision** — drag-drop canvas, image grid, zoom lens.
  - **Search** — Perplexity-vari source rail + citation popovers.
  - **Voice** — to'liq orb fullscreen, waveform, no text input.
- Mode switch **alohida thread** ochadi (`conversations.mode` column), eski chat saqlanadi.
- Switch animation: Framer Motion **`AnimatePresence` + layoutId** orqali shell morph (350ms cubic-bezier, blur+scale).

### 4. Cinematic Typing + Real Multimodal Generation

- **Smooth typing**: `StreamingText` qayta yoziladi — char-buffer 60fps RAF loop, easing `cubic-bezier(.16,1,.3,1)`, soft blur→clear, **token oldin appear bo'lib keyin solidify** (Apple Intelligence stili). Auto-scroll inertial.
- Generation indikatori: matn yo'qoladi, o'rniga **"Generating <task>…" skeleton + Ozing think state**. Tugagach bitta atomik render.
- Yangi `/tools` (slash commands) chatda:
  - `/pdf <topic>` → AI matn → `pdf-lib` edge function → Storage → link.
  - `/image <prompt>` → Nano Banana Pro (`google/gemini-3-pro-image-preview`).
  - `/figma <brief>` — GitHub bilan bir xil OAuth flow: Figma ulashni so'raydi, `figma-rest` edge function frame yaratadi, file URL qaytaradi.
  - `/word <topic>` → docx skill orqali .docx.
  - `/site <brief>` → mini-loyiha yaratib Sandpack preview + ZIP export.
- **Word/PDF tushunish**: chat upload → `document--parse_document` analog edge function (pdf.js + mammoth) → text contextga.

### 5. God-Tier Image Engine

Yangi `image-studio` edge function:
1. **Prompt upgrader** — kichik LLM (`gpt-5-mini`) prompt'ni "cinematic, anatomically correct, skin pores, subsurface scattering, 85mm…" qilib kengaytiradi.
2. **Reference fetcher** — agar prompt'da mashhur shaxs (Ronaldo, Messi…) bor bo'lsa: Wikipedia + Bing image scrape → top yuz refi.
3. **User photo merge** — agar foydalanuvchi rasm upload qilsa, u **identity reference** sifatida Nano Banana Pro `image_url` partga qo'shiladi.
4. **Compositor** — bir nechta refsni bitta `multi-image edit` callda birlashtiradi (Gemini 3 Pro Image edit mode).
5. **Text correctness pass** — agar promptda matn bo'lsa, ikkinchi pass `inpaint text` qiladi (xato yozuvlarni tuzatish).
6. **Variants** — 4 ta variant grid, "regenerate this region" lasso tool.

### 6. Bonus 12 ta yangilik (men o'zim qo'shdim)

1. **Memory Core** — `user_memories` jadvali, AI har suhbatdan muhim faktlarni avto-saqlaydi, har javobda inject qiladi (ChatGPT memory style).
2. **Voice Mode v2** — Web Speech API + ElevenLabs streaming TTS connector, barge-in, real-time interrupt.
3. **Vision Live** — `getUserMedia` kamera streami → har 2s kadr Gemini Visionga, real-time describe (AR ko'zoynak hissi).
4. **Screen Capture Analyst** — `getDisplayMedia` orqali ekran share, AI ko'rib turadi va yordam beradi.
5. **Command Palette v2** (`⌘K`) — har bir tool, mode, conversation, settings — fuzzy search.
6. **Conversation Branching** — har xabardan "fork" tugmasi, alternativ daraxt (Claude Projects style).
7. **Shared Links** — `/s/:id` public read-only chat snapshot, OG image avtogen.
8. **Workspace & Roles** — multi-user workspaces, `admin/member` rollar (user_roles jadvali allaqachon bor).
9. **Token & Cost HUD** — pastki o'ngda live token usage, monthly quota ring.
10. **Offline Cache (PWA v2)** — service worker oxirgi 50 xabarni IndexedDB ga, offline read.
11. **Haptic + Sound Design** — har action (send, tool-call, success) micro-haptic (mobile) + UI sfx (mute toggle Settings).
12. **A11y Pass** — full keyboard nav, ARIA live regions, screen reader friendly streaming, kontrast AAA toggle.
13. **Telemetry & Self-Heal** — har edge function xatoligi `error_logs` jadvaliga, dashboard `/admin` da; AI o'z xatolarini ko'radi.

---

### Texnik tarkib (qisqa)

```text
DB migrations:
  - conversations: + mode, branched_from
  - user_memories(user_id, key, value, weight)
  - user_secrets(user_id, provider, encrypted_token)  // GitHub, Figma
  - code_runs(user_id, ok, error, language)
  - error_logs(fn, payload, error)

Edge functions (yangi/yangilanadi):
  chat (tool-calling + 2026 models + auto-search router)
  tools-executor (server-side action runner)
  github-oauth, github-push
  figma-oauth, figma-create
  image-studio (prompt-upgrade + multi-ref + text-fix)
  pdf-gen, docx-gen
  parse-doc (pdf/docx → text)
  web-search-v2 (DDG+Wiki+Brave+GitHub, parallel)
  memory-write, memory-read

Frontend:
  ModeShell + 6 mode skin
  StreamingText v2 (RAF buffer)
  ToolCallCard (jonli action UI)
  ConfirmActionModal
  CodePreviewSplit (Sandpack + lint)
  ImageStudio panel
  SlashCommands menu
  CommandPalette v2
  CameraVision, ScreenShare panels
  TokenHUD, ShareSnapshot
```

Connectors so'raladi (real OAuth): **GitHub**, **Figma**, **ElevenLabs** (TTS uchun, ixtiyoriy).

---

Approve bersangiz, men darhol 1→6 tartibida implement qilaman. Har bosqich oxirida quick QA + sizga ko'rsatish uchun checkpoint qoldiraman.