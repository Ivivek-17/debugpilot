import { callOxloAPI } from "../oxlo";
import { Fix } from "./types";

export async function runNetworkAgent(
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
        content: `You are the Network_Agent — a network reliability expert specializing in DNS resolution, HTTP 5xx errors, gateway timeouts, SSL/TLS, CORS, and rate limiting.
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
    return [{ title: "Network Fix", description: raw, cli_command: null, patch: null, effort: "medium", risk_level: "Medium" }];
  }
}
