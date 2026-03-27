# DebugPilot

**Enterprise AI Copilot for Automated Backend Failure Resolution**

DebugPilot is a closed-loop incident response and AI debugging orchestrator. Engineered for modern microservice and serverless architectures, this platform ingests raw server telemetry/logs, semantically analyzes failure points, synthesizes potential resolutions, and quantitatively evaluates them to deliver highly actionable Root Cause Analyses (RCAs).

---

## 🏗 Architecture & Tech Stack

The architecture is designed to be highly modular, stateless, and instantly deployable on Edge networks:
- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS v4 (Custom Glassmorphism Design System)
- **AI Orchestration:** Multi-agent reasoning via the **Oxlo API**
- **State & Animations:** React Hooks + Framer Motion
- **Deployment Strategy:** Vercel Serverless / Edge Functions

## 🧠 Multi-Agent Pipeline

The core AI logic operates on a sophisticated pipeline (`src/lib/agents.ts`) representing specialized system roles:
1. **Trace Analyzer (Diagnosis Agent):** Parses raw exception traces to isolate the failing microservice, pinpoint exact timestamps, and synthesize the technical root cause dynamically.
2. **Resolution Generator (Fix Agent):** Compiles an array of potential code-level or infrastructure-level fixes, automatically stratifying them by architectural risk and implementation effort.
3. **Validation Engine (Evaluation Agent):** Critiques the generated fixes sequentially. It filters out high-risk anomalies and promotes the most stabilized solution.
4. **Post-Mortem Synthesizer (Report Agent):** Auto-generates an internal Markdown RCA report for engineering teams.

---

## 🚀 Local Development Setup

### 1. Configure the Environment
Copy the example environment structure into a local `.env` file at the repository root. **Never commit your API keys.**

```bash
# Define the designated model for reasoning (Default: deepseek-v3.2)
OXLO_MODEL="deepseek-v3.2"

# Your strict Oxlo API Key (Keep this secret)
OXLO_API_KEY="your_oxlo_api_key_here"

# The standard Chat Completions endpoint
OXLO_ENDPOINT="https://api.oxlo.ai/v1/chat/completions"
```

### 2. Install & Run
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000` to access the DebugPilot interface.

---

## 🛡️ Security & Best Practices

- **Ephemeral Storage:** By default, incident history is localized in memory during development. For production staging, the adapter (`src/lib/store.ts`) should be connected to a secure persistence layer such as Vercel Redis KV or Supabase.
- **Key Masking:** The `OXLO_API_KEY` is completely obfuscated from the client. All AI agent orchestration happens securely via Next.js Serverless API routes (`/api/analyze/route.ts`).
- **Input Sanitization:** Log payloads are sanitized payload buffers to ensure safety before interacting with the LLM API layer. 
