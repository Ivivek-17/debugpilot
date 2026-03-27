import { callOxloAPI } from "../oxlo";
import { runTriageAgent } from "./triage";
import { runDbAgent } from "./db";
import { runInfraAgent } from "./infra";
import { runNetworkAgent } from "./network";
import { runCriticAgent, MAX_CRITIC_RETRIES } from "./critic";
import { SseEvent, Fix, Incident } from "./types";
import { addIncident } from "../store";
import { randomUUID } from "crypto";

async function runReportAgent(
  triage: object,
  selectedFix: object
): Promise<string> {
  return callOxloAPI(
    [
      {
        role: "system",
        content: `You are the Report Agent. Write a concise professional incident report in Markdown.
Include: ## Incident Summary, ## Root Cause, ## Selected Fix, ## Risk Assessment, ## Next Steps.
Keep it under 400 words.`,
      },
      {
        role: "user",
        content: `Triage:\n${JSON.stringify(triage, null, 2)}\n\nSelected Fix:\n${JSON.stringify(selectedFix, null, 2)}`,
      },
    ],
    0.4
  );
}

/**
 * The Supervisor Orchestrator.
 * Yields SseEvent objects for the stream route to serialize.
 * Uses an async generator so each agent result is emitted immediately.
 */
export async function* orchestrate(
  logs: string,
  context: Record<string, string>
): AsyncGenerator<SseEvent> {

  // ── Step 1: Triage ──────────────────────────────────────────
  yield { type: "agent_start", agent: "Triage", message: "Classifying error domain from logs..." };

  let triage;
  try {
    triage = await runTriageAgent(logs);
    yield { type: "agent_done", agent: "Triage", data: triage };
  } catch (err: any) {
    yield { type: "agent_error", agent: "Triage", message: `Triage failed: ${err.message}. Defaulting to Infra_Agent.` };
    triage = { domain: "infra" as const, confidence: "low" as const, summary: "Unable to classify — defaulting to infrastructure diagnosis." };
  }

  // ── Step 2: Domain Worker ────────────────────────────────────
  const workerName = `${triage.domain.toUpperCase()}_Agent`;
  yield { type: "agent_start", agent: workerName, message: `Generating specialist fixes for domain: ${triage.domain}...` };

  let fixes: Fix[] = [];
  try {
    if (triage.domain === "db") {
      fixes = await runDbAgent(logs, triage.summary, context);
    } else if (triage.domain === "network") {
      fixes = await runNetworkAgent(logs, triage.summary, context);
    } else {
      // infra + unknown both go to Infra_Agent
      fixes = await runInfraAgent(logs, triage.summary, context);
    }
    yield { type: "agent_done", agent: workerName, data: { fixes } };
  } catch (err: any) {
    yield { type: "agent_error", agent: workerName, message: `${workerName} failed: ${err.message}. Proceeding with heuristic fix.` };
    fixes = [{
      title: "Restart Failed Service",
      description: "Restart the failing service and monitor logs for recurrence. Check resource limits.",
      cli_command: "systemctl restart <service-name>",
      patch: null,
      effort: "low",
      risk_level: "Low",
    }];
  }

  // ── Step 3: Critic Review Loop ───────────────────────────────
  let criticResult = null;
  let currentFixes = fixes;

  for (let attempt = 1; attempt <= MAX_CRITIC_RETRIES; attempt++) {
    yield { type: "agent_start", agent: "Critic", message: `Peer-reviewing fixes (attempt ${attempt}/${MAX_CRITIC_RETRIES})...` };

    try {
      criticResult = await runCriticAgent(currentFixes, attempt);
      yield { type: "agent_done", agent: "Critic", data: criticResult };

      if (criticResult.approved) {
        break; // exit retry loop
      }

      if (attempt < MAX_CRITIC_RETRIES) {
        yield {
          type: "critic_retry",
          attempt,
          reason: criticResult.reason,
        };
        // Send rejected fixes back to worker for refinement
        yield { type: "agent_start", agent: workerName, message: `Critic rejected fixes (attempt ${attempt}). Regenerating with guidance...` };
        try {
          const hint = `Previous fixes were rejected by Critic for: ${criticResult.reason}. Generate improved alternatives.`;
          if (triage.domain === "db") {
            currentFixes = await runDbAgent(`${logs}\n\nHint: ${hint}`, triage.summary, context);
          } else if (triage.domain === "network") {
            currentFixes = await runNetworkAgent(`${logs}\n\nHint: ${hint}`, triage.summary, context);
          } else {
            currentFixes = await runInfraAgent(`${logs}\n\nHint: ${hint}`, triage.summary, context);
          }
          yield { type: "agent_done", agent: workerName, data: { fixes: currentFixes } };
        } catch (err: any) {
          yield { type: "agent_error", agent: workerName, message: `Regeneration failed: ${err.message}` };
        }
      }
    } catch (err: any) {
      yield { type: "agent_error", agent: "Critic", message: `Critic agent error: ${err.message}. Auto-approving safest fix.` };
      criticResult = {
        approved: true,
        selected_fix_title: currentFixes[0]?.title ?? "Best Available",
        reason: "Auto-approved after critic failure.",
        risk_level: "Medium" as const,
        warnings: [],
      };
      break;
    }
  }

  // If all critic retries exhausted without approval → HITL
  if (criticResult && !criticResult.approved) {
    yield { type: "hitl_required", fixes: currentFixes };
    return; // stop here — frontend will handle user intervention
  }

  // ── Step 4: Report (streamed chunk by chunk) ─────────────────
  yield { type: "agent_start", agent: "Report", message: "Generating incident report..." };

  let reportText = "";
  try {
    reportText = await runReportAgent(triage, criticResult!);
    // Stream report word-by-word for typewriter effect
    const words = reportText.split(" ");
    for (let i = 0; i < words.length; i += 4) {
      yield { type: "report_chunk", chunk: words.slice(i, i + 4).join(" ") + " " };
    }
    yield { type: "agent_done", agent: "Report", data: { length: reportText.length } };
  } catch (err: any) {
    yield { type: "agent_error", agent: "Report", message: `Report generation failed: ${err.message}` };
    reportText = "Report generation failed. See agent chatter for details.";
  }

  // ── Step 5: Persist & Complete ───────────────────────────────
  const incident: Incident = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    originalLogs: logs,
    context,
    domain: triage.domain,
    triage,
    fixes: currentFixes,
    selectedFix: criticResult!,
    report: reportText,
  };

  addIncident(incident as any);

  yield { type: "complete", incident };
}
