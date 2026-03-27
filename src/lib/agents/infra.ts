import { callOxloAPI } from "../oxlo";
import { Fix } from "./types";

export async function runInfraAgent(
  logs: string,
  summary: string,
  context: Record<string, string>
): Promise<Fix[]> {
  const contextBlock =
    Object.keys(context).length > 0
      ? `\n\nContext files provided:\n${Object.entries(context)
          .map(([name, content]) => `### ${name}\n${content}`)
          .join("\n\n")}`
      : "";

  const response = await callOxloAPI(
    [
      {
        role: "system",
        content: `You are the Infra_Agent — an infrastructure reliability expert specializing in Docker, Kubernetes, Redis, RabbitMQ, and cloud services.
You receive server logs and optional context files (docker-compose.yml, K8s manifests, etc.).
Reference specific ports, service names, and config values from the context files when available.
Generate exactly 3 targeted fixes.
Output ONLY a JSON array (no markdown):
[{ "title": string, "description": string, "cli_command": string|null, "patch": string|null, "effort": "low"|"medium"|"high", "risk_level": "Low"|"Medium"|"High" }]`,
      },
      {
        role: "user",
        content: `Triage summary: ${summary}\n\nLogs:\n${logs}${contextBlock}`,
      },
    ],
    0.5
  );

  return parseFixArray(response);
}

function parseFixArray(raw: string): Fix[] {
  try {
    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return [{ title: "Infra Fix", description: raw, cli_command: null, patch: null, effort: "medium", risk_level: "Medium" }];
  }
}
