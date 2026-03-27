import { callOxloAPI } from "../oxlo";

export interface TriageResult {
  domain: "db" | "infra" | "network" | "unknown";
  confidence: "high" | "medium" | "low";
  summary: string;
}

export async function runTriageAgent(
  logs: string
): Promise<TriageResult> {
  const response = await callOxloAPI(
    [
      {
        role: "system",
        content: `You are the Triage Agent for DebugPilot — a specialized router.
Your ONLY job is to classify the error domain from the logs.
Output ONLY a JSON object (no markdown):
{ "domain": "db"|"infra"|"network"|"unknown", "confidence": "high"|"medium"|"low", "summary": "<one sentence>" }

Domain guide:
- "db"      → SQL/NoSQL errors, connection pool exhaustion, query failures, ORM errors
- "infra"   → Docker, Kubernetes, Redis, memory/CPU, pod crashes, container exits
- "network" → DNS failures, 503s, gateway timeouts, SSL certificate, CORS, rate limiting
- "unknown" → cannot determine`,
      },
      {
        role: "user",
        content: `Logs to triage:\n\n${logs}`,
      },
    ],
    0.1 // very low temp for routing decisions
  );

  try {
    const clean = response.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) as TriageResult;
  } catch {
    return { domain: "unknown", confidence: "low", summary: response };
  }
}
