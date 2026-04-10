import { NextResponse } from "next/server";
import { orchestrate } from "@/lib/agents/orchestrator";
import { getIncidents } from "@/lib/store";
import { supabase } from "@/lib/supabase";
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

/**
 * GET /api/analyze
 * Returns the incident history from Supabase + in-memory fallback.
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("bug_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[History] Supabase query error:", error.message);
    }

    const supabaseIncidents = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      timestamp: row.created_at as string,
      originalLogs: row.log_text as string,
      domain: (row.domain as string) || "resolved",
      triage: { summary: row.diagnosis as string },
      fixes: Array.isArray(row.fixes) ? row.fixes : [],
      selectedFix: typeof row.fix_details === "object" && row.fix_details !== null
        ? row.fix_details
        : { selected_fix_title: row.fix_title as string, reason: "Persisted resolution", risk_level: "Medium", warnings: [] },
      report: (row.report as string) || `Persisted Resolution: ${row.fix_title}`
    }));

    // Merge: Supabase records first, then any in-memory-only records
    const memoryIncidents = getIncidents();
    const allIncidents = [...supabaseIncidents, ...memoryIncidents];

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = allIncidents.filter(inc => {
      const key = (inc as Record<string, unknown>).id as string;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ incidents: unique });
  } catch (err) {
    console.error("[History] Unexpected error:", err);
    return NextResponse.json({ incidents: getIncidents() });
  }
}
