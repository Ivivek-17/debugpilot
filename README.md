# 🦉 DebugPilot – Kinetic AI Copilot

**The Technical Nexus for Automated Backend Incident Resolution.**

DebugPilot is a high-performance, multi-agent incident response system. Built with the **Kinetic Glacialist** design system, it delivers a tech-noir, high-fidelity experience for diagnosing, resolving, and validating backend service failures in real-time.

---

## ✨ Key Features & Aesthetics

- **Kinetic Glacialist UI:** A premium, tech-noir aesthetic featuring sharp geometric precision, neon cyan accents, and reactive glassmorphism.
- **3D Reactive Mascot (Owly):** A custom Three.js owl that interacts with the user and visually reflects the internal state of the AI agents (Thinking, Success, Error, etc.).
- **Multi-Agent Orchestration:** Specialized agents collaborate to isolate root causes and synthesize validated resolutions.
- **Secure Persistence:** Localized authentication and session management with memory-first storage for rapid developer feedback.

---

## 🏗 Industrial Tech Stack

Engineered for precision and speed:
- **Framework:** Next.js 16 (App Router)
- **Library:** React 19
- **Engine:** Three.js (Procedural 3D Mascot)
- **Styling:** Tailwind CSS v4 + Kinetic Token System
- **Typography:** Space Grotesk (Display) & JetBrains Mono (Code)
- **Intelligence:** Oxlo API Multi-Agent Pipeline

---

## 🧠 The Agent Nexus

The core engine utilizes a specialized pipeline (`src/lib/agents.ts`) representing distinct system roles:

1.  **Triage Agent:** Conducts initial log analysis and impact assessment.
2.  **Domain Specialists (DB, Infra, Network):** Specialized agents that deep-dive into database locks, infrastructure bottlenecks, or connectivity anomalies.
3.  **The Critic:** Sequentially evaluates generated fixes to eliminate regressions and promote stable resolutions.
4.  **Success Orchestrator:** Synthesizes the final resolution and pushes the fix telemetry.

---

## 🚀 Local Development

### 1. Environment Config
Create a `.env.local` file at the root:

```bash
# reasoning model (DeepSeek or Claude suggested)
OXLO_MODEL="deepseek-v3.2"

# Your Oxlo API Secret
OXLO_API_KEY="your_oxlo_api_key_here"

# API Endpoint
OXLO_ENDPOINT="https://api.oxlo.ai/v1/chat/completions"
```

### 2. Ignition
```bash
npm install
npm run dev
```
Open `http://localhost:3000` to initiate the diagnostic nexus.

---

## 🛡️ Security Architecture

All AI orchestration is handled through **Next.js Server Actions** and secure API routes to prevent sensitive token leakage. The system uses masked input payloads and strictly sanitized telemetry buffers for end-to-end security. 
