import { callOxloAPI, ChatMessage } from "./oxlo";

// 1. Diagnosis Agent
export async function runDiagnosisAgent(logs: string) {
  const prompt: ChatMessage[] = [
    { role: "system", content: "You are the Diagnosis Agent for DebugPilot. Analyze the provided server logs, pinpoint the exact failure service, the timestamp, and the likely root cause. Be extremely concise and output a structured JSON containing: { failing_service, timestamp, root_cause, details }." },
    { role: "user", content: `Here are the logs:\n\n${logs}` }
  ];
  
  const response = await callOxloAPI(prompt, 0.2);
  return response; // Expected to be JSON string
}

// 2. Fix Generator Agent
export async function runFixAgent(diagnosisJson: string) {
  const prompt: ChatMessage[] = [
    { role: "system", content: "You are the Fix Generation Agent. Based on the JSON diagnosis, generate exactly 3 potential fixes for the issue. Output them as a JSON array of objects: [{ title, description, effort, risk_level }]. Do not output markdown, only the JSON array." },
    { role: "user", content: `Diagnosis:\n${diagnosisJson}` }
  ];

  const response = await callOxloAPI(prompt, 0.7);
  return response;
}

// 3. Evaluation Agent
export async function runEvaluationAgent(fixesJson: string) {
  const prompt: ChatMessage[] = [
    { role: "system", content: "You are the Evaluation Agent. You receive a list of fixes in JSON format. Your job is to select the BEST fix based on lowest risk and highest probability of success. Output a JSON object: { selected_fix_title, reason, code_snippet_if_applicable }." },
    { role: "user", content: `Proposed fixes:\n${fixesJson}` }
  ];

  const response = await callOxloAPI(prompt, 0.3);
  return response;
}

// 4. Report Agent
export async function runReportAgent(diagnosis: string, chosenFix: string) {
  const prompt: ChatMessage[] = [
    { role: "system", content: "You are the Report Agent. Given a diagnosis and the selected fix, write a short, professional Markdown incident report." },
    { role: "user", content: `Diagnosis:\n${diagnosis}\n\nSelected Fix:\n${chosenFix}` }
  ];

  const response = await callOxloAPI(prompt, 0.5);
  return response;
}
