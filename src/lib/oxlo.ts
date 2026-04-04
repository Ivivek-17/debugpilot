/**
 * DebugPilot - Oxlo API Client
 * 
 * OpenAI-compatible /chat/completions client.
 * All secrets are read from environment variables — see .env.example.
 */

const OXLO_API_KEY = process.env.OXLO_API_KEY || "";
const OXLO_ENDPOINT = process.env.OXLO_ENDPOINT || "https://api.oxlo.ai/v1/chat/completions";
const MODEL_NAME = process.env.OXLO_MODEL || "deepseek-v3.2";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callOxloAPI(messages: ChatMessage[], temperature = 0.7): Promise<string> {
  if (!OXLO_API_KEY) {
    console.error("[DebugPilot] OXLO_API_KEY is not set. Add it to .env.local or Vercel Environment Variables.");
    throw new Error("OXLO_API_KEY is not configured. Please set it in your environment variables.");
  }

  try {
    const response = await fetch(OXLO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OXLO_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages,
        temperature
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Oxlo API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: unknown) {
    console.error("[DebugPilot] Oxlo API Call Failed:", error instanceof Error ? error.message : error);
    throw error; // propagate to orchestrator, which handles it gracefully via SSE
  }
}

