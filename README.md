# 🤖 MV AI v9 — Next-Generation AI Cockpit

**MV AI v9** is the latest evolution of the "living AI cockpit" — a cutting-edge, multi-modal AI chat application with enhanced AI models, improved performance, and advanced features. Built around **Ozing**, an intelligent AI companion mascot with 19 mood states.

> **Status:** Production Ready  
> **Version:** 9.0.0  
> **Language Composition:** TypeScript 73% • Python 16.9% • HTML 4.3% • CSS 3.1% • JavaScript 2%  
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
- **Gemma 4** — Google multimodal model

### 🔧 v9 Enhancements
- Smart model routing with automatic fallback
- Multi-model support in multi-agent pipeline
- Expo MCP integration for mobile development
- Updated system prompts for all modes
- Enhanced error recovery

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

---

## 📋 Installation

```bash
git clone https://github.com/MvMSOLO/mvaichat.git
cd mvaichat
pnpm install
# Set environment variables in your deployment platform
```

---

## 🏗️ Architecture

```
mvaichat/
├── artifacts/
│   ├── api-server/
│   ├── mv-ai/
│   └── mv-ai-mobile/
└── pnpm-workspace.yaml
```

---

**Last Updated**: 2026-05-27  
**Version**: 9.0.0