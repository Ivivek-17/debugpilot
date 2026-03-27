import { orchestrate } from "@/lib/agents/orchestrator";

export const maxDuration = 60; // Vercel: keep SSE alive up to 60s

export async function POST(request: Request) {
  let logs: string;
  let context: Record<string, string>;

  try {
    const body = await request.json();
    logs = body.logs;
    context = body.context ?? {};

    if (!logs?.trim()) {
      return new Response(JSON.stringify({ error: "No logs provided." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Controller already closed — ignore
        }
      };

      try {
        for await (const event of orchestrate(logs, context)) {
          sendEvent(event);
          // Stop feeding the stream if hitl_required (frontend takes over)
          if (event.type === "complete" || event.type === "hitl_required") {
            break;
          }
        }
      } catch (err: any) {
        sendEvent({
          type: "agent_error",
          agent: "System",
          message: `Orchestrator crashed: ${err.message ?? "Unknown error"}`,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering for SSE
    },
  });
}
