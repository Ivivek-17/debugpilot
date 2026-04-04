# 🦉 DebugPilot – Kinetic AI Copilot

**The Technical Nexus for Automated Backend Incident Resolution.**

DebugPilot is a high-performance, multi-agent incident response system. Built with the **Kinetic Glacialist** design system, it delivers a tech-noir, high-fidelity experience for diagnosing, resolving, and validating backend service failures in real-time.

---

## ✨ Key Features & Aesthetics

- **Kinetic Glacialist UI:** A premium, tech-noir aesthetic featuring sharp geometric precision, neon cyan accents, and reactive glassmorphism.
- **3D Reactive Mascot (Owly):** A custom Three.js owl that interacts with the user and visually reflects the internal state of the AI agents (Thinking, Success, Error, etc.).
- **Pre-Canned Scenarios:** Instant injection of 6 distinct, highly realistic system failure states (OOM, Payment Timeout, Deadlocks, etc.) for rapid demo delivery.
- **Anomaly Visualization:** A custom Framer Motion component that dynamically tracks and visualizes real-time log spikes and system metrics.
- **Context Injection:** Drag-and-drop support for application configurations (`docker-compose.yml`, `package.json`, `schema.prisma`) to enable deeper AI cross-referencing.
- **Multi-Agent Orchestration:** Specialized agents (Triage, DB, Infra, Network, Critic, Report) collaborate sequentially to resolve incidents.
- **Enterprise Integrations:** One-click "Notify Slack" support via server-side proxy and automated "Download MD" for finalized RCA reports.
- **Typewriter Agent Chatter:** Sequence-based terminal output that captures the satisfying visualization of "AI Agents Thinking" in real-time.

---

## 🏗 Industrial Tech Stack

Engineered for precision and speed:
- **Framework:** Next.js 16 (App Router)
- **Library:** React 19
- **Animation:** Framer Motion (Metric Graphs)
- **Engine:** Three.js (Procedural 3D Mascot)
- **Styling:** Tailwind CSS v4 + Kinetic Token System
- **Typography:** Space Grotesk (Display) & JetBrains Mono (Code)
- **Intelligence:** Oxlo API Multi-Agent Pipeline

---

## 🧠 The Agent Nexus

The core engine utilizes a specialized pipeline (`src/app/api/analyze/stream/route.ts`) representing distinct system roles:

1.  **Triage Agent:** Conducts initial log analysis and impact assessment.
2.  **Domain Specialists (DB, Infra, Network):** Specialized agents that deep-dive into database locks, infrastructure bottlenecks, or connectivity anomalies.
3.  **The Critic:** Sequentially evaluates generated fixes to eliminate regressions and promote stable resolutions.
4.  **Success Orchestrator (Report):** Synthesizes the final resolution and produces high-fidelity markdown documentation.

---

## 🚀 Local Development

### 1. Environment Config
Create a `.env.local` file at the root:

```bash
# Reasoning model (DeepSeek or Claude-3.5-Sonnet)
OXLO_MODEL="deepseek-v3.2"

# Your Oxlo API Secret
OXLO_API_KEY="your_oxlo_api_key_here"

# API Endpoint
OXLO_ENDPOINT="https://api.oxlo.ai/v1/chat/completions"

# Slack Webhook (Optional)
SLACK_WEBHOOK_URL="your_webhook_url_here"
```

### 2. Ignition
```bash
npm install
npm run dev
```
Open `http://localhost:3000` to initiate the diagnostic nexus.

---

## 🛡️ Security Architecture

All AI orchestration is handled through **SSE (Server-Sent Events)** streaming and secure API routes to prevent sensitive token leakage. The system uses masked input payloads and strictly sanitized telemetry buffers for end-to-end security. 
