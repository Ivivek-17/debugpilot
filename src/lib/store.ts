/**
 * In-memory store for Hackathon MVP
 * Note: Next.js API running on Vercel is stateless. 
 * This memory store will reset across cold starts.
 * Swap to Vercel KV or Postgres for persistent storage in production.
 */

export interface Incident {
  id: string;
  timestamp: string;
  originalLogs: string;
  diagnosis: Record<string, unknown>;
  fixes: Record<string, unknown>;
  selectedFix: Record<string, unknown>;
  report: string;
}

// Global scope to survive hot-reloads in dev
const globalStore = global as unknown as { incidents: Incident[] };
if (!globalStore.incidents) {
  globalStore.incidents = [];
}

export const addIncident = (incident: Incident) => {
  globalStore.incidents.unshift(incident); // newest first
  return incident;
}

export const getIncidents = () => {
  return globalStore.incidents;
}

export const getIncidentById = (id: string) => {
  return globalStore.incidents.find(i => i.id === id);
}
