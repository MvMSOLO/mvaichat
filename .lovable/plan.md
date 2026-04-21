
# MV AI — Plan

An AI companion app powered by **Ozing**, a custom-drawn cat mascot that lives across every screen and reacts to everything you do.

## Brand & Identity
- **Product name:** MV AI
- **Mascot:** Ozing — an original SVG cat with a soft pastel coat, oversized expressive eyes, tiny side-tufts, a curled tail, and a glowing collar gem that changes color by mood
- **Visual language:** Soft premium glassmorphism, layered surfaces, aurora gradients (lavender → mint → peach), refined shadows, subtle inner glows
- **Typography:** Display sans for headlines, geometric sans for body, mono for code
- **Motion:** Spring-based, tactile, ~100+ micro-interaction states

## Ozing the Cat — Mascot System
Custom SVG character with morphing parts (ears, eyes, mouth, tail, collar gem, paws). Reactive states include:
- **Idle loops:** breathing, blinking, occasional yawn, tail flick
- **Reactions:** hover-curious, tap-bounce, typing-watching, listening-ear-twitch, thinking-paw-on-chin, loading-tail-spin, success-sparkle, error-wobble, surprise-puff, sleep-Zzz, celebration-confetti, confusion-head-tilt
- **Auth-aware:** covers eyes with paws when password field is focused; peeks at email
- **Context-aware:** drifts to corners on mobile, hides during fullscreen reading, reappears on scroll
- **Voice-aware:** opens mouth in sync with TTS, ears perk while listening
- Optional cute chirp/purr sound cues (toggle in settings)

## Screens & Flows

### 1. Landing / Home
Hero with Ozing in a floating glass orb, aurora background, animated tagline, "Meet Ozing" CTA, feature cards for each internal model, smooth scroll reveals.

### 2. Auth (Lovable Cloud)
- Email/password sign-up + login + reset password page
- Ozing reacts: peeks at email, covers eyes for password, celebrates on success, sad wobble on error
- Profiles table auto-created on signup (display name, avatar, voice prefs)
- Smooth morph transitions between login/register

### 3. Main Chat (Desktop split-pane / Mobile fullscreen)
- **Sidebar (desktop):** chat history, new chat, pinned, model switcher, tools, settings
- **Mobile:** collapsible drawer + bottom action bar
- **Composer:** plus menu (attach, screenshot, voice), mic button with waveform, model chip, send
- **Streaming responses** with typing shimmer and Ozing watching
- **Smart rendering:** the AI picks the best layout per answer — plain, card, code (syntax highlighted), table, step-by-step, visual summary, action buttons, compact vs deep mode
- **Follow-up suggestions** as elegant chips
- Direct, useful tone — no filler phrases

### 4. Custom Internal Models (switcher with native feel)
- **Humanoid** — general conversation
- **Ideal** — deep reasoning
- **Code Editor** — coding & debugging
- **Vision** — image & screenshot understanding
- **Search** — web-connected answers
- **Voice** — spoken assistant

Each model has its own color, icon, Ozing collar-gem hue, and system prompt. All powered by Lovable AI Gateway (Gemini + GPT-5 family) routed through a single edge function.

### 5. Panel — Floating Mini AI
- Button in main UI opens a **draggable floating window** on desktop, **bottom sheet** on mobile
- Compact Ozing assistant inside for quick tasks
- **Screen capture** (browser getDisplayMedia) + **image upload/paste** fallback
- Captured image auto-sends to Vision model with optional prompt
- Quick actions: summarize, explain, translate, extract text

### 6. Voice Mode
- Web Speech API for input (mic) + output (TTS)
- Animated waveform, listening pulse, speaking lip-sync on Ozing
- Visual permission prompts, graceful errors
- Voice on/off and voice tone in settings

### 7. Settings
- Profile, Ozing personality (playful/calm/silent), sound on/off, theme accents, voice picker, manage models, sign out

### 8. Error / Empty / 404
Ozing in matching emotional state (lost, sleeping, confused) with helpful CTA.

## Rich Message Capabilities
- Markdown, tables, syntax-highlighted code with copy
- Card layouts for structured info
- Inline action buttons (regenerate, copy, speak, save, branch)
- Image generation outputs (via Lovable AI image models) rendered in styled frames
- Source citations for Search model

## Animation Layer (100+ states)
Page transitions, panel slide-ins, message bubble morph-in, mascot reactions, button press feedback, hover glows, scroll parallax on landing, sidebar collapse, model-switch color sweep, mic pulse, waveform, streaming shimmer, success sparkles, error wobbles, drag physics for the Panel.

## Backend (Lovable Cloud)
- **Auth:** email/password + reset flow
- **Tables:** `profiles`, `conversations`, `messages`, `user_settings`, `user_roles` (separate, with `has_role` security-definer)
- **RLS** on every user-owned table
- **Storage bucket:** `attachments` (images, screenshots) with per-user RLS
- **Edge functions:**
  - `chat` — streaming AI responses, model routing, system prompts per model
  - `vision` — image/screenshot analysis
  - `search` — web-connected answers (uses model's grounding)
  - `generate-image` — image generation

## Responsive Strategy
- **Desktop (≥1024px):** sidebar + chat + optional panel as floating window
- **Tablet:** collapsible sidebar overlay
- **Mobile:** fullscreen chat, bottom action bar, drawer history, Panel as bottom sheet, Ozing repositioned to avoid keyboard

## Out of Scope for v1 (easy to add later)
Code execution sandbox, plugin marketplace, team workspaces, billing — architecture is built to extend.

---

After approval I'll implement this in stages: design system + Ozing → auth + Cloud → chat + AI gateway → Panel + Vision → Voice → polish pass.
