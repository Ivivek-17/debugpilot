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

/**
 * GET /api/analyze
 * Returns the in-memory incident history.
 */
export async function GET() {
  return NextResponse.json({ incidents: getIncidents() });
}
