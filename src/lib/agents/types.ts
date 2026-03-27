export interface Fix {
  title: string;
  description: string;
  cli_command: string | null;
  patch: string | null;
  effort: "low" | "medium" | "high";
  risk_level: "Low" | "Medium" | "High";
}

export interface CriticResult {
  approved: boolean;
  selected_fix_title: string;
  reason: string;
  risk_level: "Low" | "Medium" | "High";
  warnings?: string[];
}

export interface Incident {
  id: string;
  timestamp: string;
  originalLogs: string;
  context: Record<string, string>;
  domain: string;
  triage: { domain: string; confidence: string; summary: string };
  fixes: Fix[];
  selectedFix: CriticResult;
  report: string;
}

export type SseEvent =
  | { type: "agent_start"; agent: string; message: string }
  | { type: "agent_done"; agent: string; data: any }
  | { type: "critic_retry"; attempt: number; reason: string }
  | { type: "hitl_required"; fixes: Fix[] }
  | { type: "report_chunk"; chunk: string }
  | { type: "complete"; incident: Incident }
  | { type: "agent_error"; agent: string; message: string };
