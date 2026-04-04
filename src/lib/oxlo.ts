/**
 * DebugPilot - Oxlo API Client (Hackathon Version)
 * 
 * This client mimics an OpenAI-compatible /chat/completions endpoint structure.
 * Substitute the BASE_URL and ensure your API KEY is in .env
 */

const OXLO_API_KEY = process.env.OXLO_API_KEY || "";
const OXLO_ENDPOINT = process.env.OXLO_ENDPOINT || "https://api.oxlo.ai/v1/chat/completions";
const MODEL_NAME = process.env.OXLO_MODEL || "gemini-2.0-flash";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callOxloAPI(messages: ChatMessage[], temperature = 0.7): Promise<string> {
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
  } catch (error) {
    console.error("Oxlo API Call Failed:", error);
    // Return a fallback for testing if API is not yet configured or reachable
    return `[Mock Oxlo Response]: Failed to reach API. Error: ${error}`;
  }
}
