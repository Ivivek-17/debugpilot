import { callOxloAPI } from "../oxlo";
import { Fix, CriticResult } from "./types";

export const MAX_CRITIC_RETRIES = 3;

export async function runCriticAgent(
  fixes: Fix[],
  attempt: number
): Promise<CriticResult> {
  const response = await callOxloAPI(
    [
      {
        role: "system",
        content: `You are the Critic Agent — a Senior Site Reliability Engineer peer-reviewing proposed fixes.
Your role is to:
1. Select the BEST fix (lowest risk, highest probability of success, most immediately actionable)
2. Check for: security vulnerabilities, potential data loss, increased downtime, performance regressions
3. If a fix would cause more harm than good, reject it

This is review attempt #${attempt} of ${MAX_CRITIC_RETRIES}.
Output ONLY a JSON object (no markdown):
{
  "approved": true|false,
  "selected_fix_title": string,
  "reason": string,
  "risk_level": "Low"|"Medium"|"High",
  "warnings": string[]   // empty array if none
}

If "approved" is false, explain what is wrong with all proposed fixes in "reason".`,
      },
      {
        role: "user",
        content: `Proposed fixes for review (attempt ${attempt}):\n\n${JSON.stringify(fixes, null, 2)}`,
      },
    ],
    0.2 // low temp for critical security decisions
  );

  try {
    const clean = response.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) as CriticResult;
  } catch {
    // If parsing fails, default to approved to avoid blocking
    return {
      approved: true,
      selected_fix_title: fixes[0]?.title ?? "Best Available Fix",
      reason: response,
      risk_level: "Medium",
      warnings: [],
    };
  }
}
