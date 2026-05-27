# 🤖 MV AI v9 — Next-Generation AI Cockpit

**MV AI v9** is the latest evolution of the "living AI cockpit" — a cutting-edge, multi-modal AI chat application with enhanced AI models, improved performance, and advanced features. Built around **Ozing**, an intelligent AI companion mascot with 19 mood states.

> **Status:** Production Ready  
> **Version:** 9.0.0  
> **Language Composition:** TypeScript 73% • Python 16.9% • HTML 4.3% • CSS 3.1% • JavaScript 2% • PLpgSQL 0.4% • Shell 0.3%  
> **Repository:** https://github.com/MvMSOLO/mvaichat

---

## ✨ What's New in v9

### 🚀 Multi-Model Intelligence
- **Laguna M.1** — Primary model for conversational AI (Poolside)
- **GPT OSS 120B/20B** — Open-weight reasoning models (OpenAI)
- **Nemotron 3 Super** — NVIDIA hybrid MoE model (120B)
- **GLM 4.5 Air** — Lightweight agent model (Z.ai)
- **DeepSeek V4 Flash** — Efficient MoE model
- **Auto-switch** — Automatic fallback between models based on availability
- **Gemma 4/3** — Google multimodal models

### 🎨 UI/UX Upgrades
- Enhanced ECLIPSE v3 design with smoother animations
- Better code block rendering with syntax highlighting
- Improved image handling with zoom and download
- Smoother transitions and hardware-accelerated animations

---

## 🎯 Core Features

### 8 AI Modes with v9 Multi-Model Routing

| Mode | Primary Model | Fallback Models | Status |
|------|---------------|-----------------|--------|
| **Humanoid** | Laguna M.1 | Nemotron 3 Super, GPT OSS, GLM 4.5 Air | ✅ Ready |
| **Ideal** | Laguna M.1 | GPT OSS, Nemotron 3 Super, DeepSeek V4 | ✅ Ready |
| **Code** | GPT OSS 120B | Qwen 2.5, Laguna XS.2, Gemma 4 | ✅ Ready |
| **Vision** | Nemotron 3 Super | Laguna M.1, Nemotron 30B | ✅ Ready |
| **Search** | Perplexity Sonar | — | ✅ Ready |
| **Voice** | Gemma 3 | GPT OSS 20B | ✅ Ready |
| **Agents** | Laguna M.1 | Nemotron 3 Super, GPT OSS, GLM 4.5 Air | ✅ Enhanced |
| **Social** | Laguna M.1 | Nemotron 3 Super, GPT OSS 20B | ✅ Ready |

### Multi-Agent Pipeline

Sequential processing with context passing between agents:

1. **Researcher** — Information gathering with caching
2. **Strategist** — Strategy development with context awareness
3. **Creator** — Content generation with style preservation
4. **Refiner** — Optimization with quality validation

### MCP Tools

| Tool | Handler | Description |
|------|---------|-------------|
| `generate_image` | Server | AI image generation via Pollinations |
| `web_search` | Server | DuckDuckGo instant search |
| `calculator` | Server | Math expression evaluation |
| `youtube_action` | Client | YouTube app actions |
| `open_app` | Client | Native app opening |
| `instagram_dm` | Client | Instagram DM composer |
| `telegram_action` | Client | Telegram actions |
| `call_contact` | Client | Phone calling |
| `send_sms` | Client | SMS sending |
| `create_reminder` | Client | Browser reminders |
| `copy_to_clipboard` | Client | Clipboard copying |
| `open_url` | Client | URL opening |

---

## 📋 Quick Start

### Prerequisites
- **Node.js** 24+
- **pnpm** 8.0+
- **PostgreSQL** 14+
- **Environment Variables:**
  ```bash
  DATABASE_URL=postgresql://user:pass@localhost/mvaichat
  CLERK_SECRET_KEY=<your-clerk-secret>
  CLERK_PUBLISHABLE_KEY=<your-clerk-pk>
  OPENROUTER_API_KEY=<your-openrouter-key>
  ```

### Installation & Running

```bash
# Clone repository
git clone https://github.com/MvMSOLO/mvaichat.git
cd mvaichat

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Run database migrations
pnpm --filter @workspace/db run push

# Start development servers
# Terminal 1: API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2: Frontend (auto port)
pnpm --filter @workspace/mv-ai run dev
```

---

## 🏗️ Architecture

### Package Structure
```
mvaichat/
├── artifacts/
│   ├── api-server/              # Express API (TypeScript)
│   │   └── src/routes/chat.ts   # Multi-model routing endpoint
│   ├── mv-ai/                   # React Frontend
│   └── mv-ai-mobile/            # Expo Mobile app
├── lib/
│   └── db/                      # Database schema
├── .vscode/mcp.json             # Expo MCP configuration
└── pnpm-workspace.yaml
```

---

## 🔐 Security

- **Clerk** handles all authentication
- No password storage
- Per-user rate limiting
- No tracking or telemetry

---

## 📞 Support

For help:
1. Check [GitHub Issues](https://github.com/MvMSOLO/mvaichat/issues)
2. Join [Discussions](https://github.com/MvMSOLO/mvaichat/discussions)

---

**Last Updated**: 2026-05-27  
**Version**: 9.0.0  
**Status**: Production Ready