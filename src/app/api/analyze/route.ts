import { NextResponse } from "next/server";
import { orchestrate } from "@/lib/agents/orchestrator";
import { getIncidents } from "@/lib/store";
import { SseEvent } from "@/lib/agents/types";

/**
 * POST /api/analyze
 * Non-streaming fallback — collects all orchestrator events and returns JSON.
 * Useful for programmatic clients that don't support SSE.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { logs, context = {} } = body;

    if (!logs?.trim()) {
      return NextResponse.json({ error: "No logs provided." }, { status: 400 });
    }

    let incident = null;
    const events: SseEvent[] = [];

    for await (const event of orchestrate(logs, context)) {
      events.push(event);
      if (event.type === "complete") {
        incident = event.incident;
        break;
      }
      if (event.type === "hitl_required") {
        return NextResponse.json({ success: false, hitl: true, fixes: event.fixes });
      }
    }

    if (!incident) {
      return NextResponse.json({ error: "Pipeline did not complete." }, { status: 500 });
    }

    return NextResponse.json({ success: true, incident, events });
  } catch (error: unknown) {
    console.error("Analysis Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze logs." },
      { status: 500 }
    );
  }
}

import { supabase } from "@/lib/supabase";

/**
 * GET /api/analyze
 * Returns the incident history persistently from Supabase (falling back to memory if needed).
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("bug_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data) {
      return NextResponse.json({ incidents: getIncidents() });
    }

    const mappedIncidents = data.map(row => ({
      id: row.id,
      timestamp: row.created_at,
      originalLogs: row.log_text,
      domain: "resolved",
      triage: { summary: row.diagnosis },
      fixes: [],
      selectedFix: row.fix_details,
      report: `Persisted Resolution: ${row.fix_title}`
    }));

    return NextResponse.json({ incidents: mappedIncidents });
  } catch (err) {
    return NextResponse.json({ incidents: getIncidents() });
  }
}
