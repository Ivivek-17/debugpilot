import { callOxloAPI } from "../oxlo";
import { Fix } from "./types";

export async function runDbAgent(
  logs: string,
  summary: string,
  context: Record<string, string>
): Promise<Fix[]> {
  const contextBlock =
    Object.keys(context).length > 0
      ? `\n\nContext files provided by user:\n${Object.entries(context)
          .map(([name, content]) => `### ${name}\n${content}`)
          .join("\n\n")}`
      : "";

  const response = await callOxloAPI(
    [
      {
        role: "system",
        content: `You are the DB_Agent — a database reliability expert specializing in SQL, NoSQL, connection pooling, and ORM issues.
You receive server logs and optional context files (schema, package.json, docker-compose.yml).
Generate exactly 3 targeted fixes referencing specific file configs where available.
Output ONLY a JSON array (no markdown):
[{ "title": string, "description": string, "cli_command": string|null, "patch": string|null, "effort": "low"|"medium"|"high", "risk_level": "Low"|"Medium"|"High" }]
- cli_command: a bash command the user can run to apply the fix (or null)
- patch: a unified diff snippet (or null)`,
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
    return [{ title: "DB Fix", description: raw, cli_command: null, patch: null, effort: "medium", risk_level: "Medium" }];
  }
}
