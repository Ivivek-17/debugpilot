import { NextResponse } from "next/server";
import { runDiagnosisAgent, runFixAgent, runEvaluationAgent, runReportAgent } from "@/lib/agents";
import { addIncident } from "@/lib/store";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { logs } = body;

    if (!logs) {
      return NextResponse.json({ error: "No logs provided." }, { status: 400 });
    }

    // Pipeline Step 1: Diagnosis
    const diagnosisRaw = await runDiagnosisAgent(logs);
    
    // Attempt to parse JSON strictly. In a robust system we'd use Zod + retry logic
    let diagnosisJson;
    try {
      // Clean potential markdown blocks
      const cleanJson = diagnosisRaw.replace(/```json/g, "").replace(/```/g, "").trim();
      diagnosisJson = JSON.parse(cleanJson);
    } catch (e) {
      diagnosisJson = { fallback: "true", raw: diagnosisRaw };
    }

    // Pipeline Step 2: Fix Generation
    const fixesRaw = await runFixAgent(JSON.stringify(diagnosisJson));
    let fixesJson;
    try {
      const cleanFixes = fixesRaw.replace(/```json/g, "").replace(/```/g, "").trim();
      fixesJson = JSON.parse(cleanFixes);
    } catch (e) {
      fixesJson = [{ title: "Fallback Fix", description: fixesRaw, effort: "low", risk_level: "low" }];
    }

    // Pipeline Step 3: Evaluation
    const evaluationRaw = await runEvaluationAgent(JSON.stringify(fixesJson));
    let evaluationJson;
    try {
      const cleanEval = evaluationRaw.replace(/```json/g, "").replace(/```/g, "").trim();
      evaluationJson = JSON.parse(cleanEval);
    } catch (e) {
      evaluationJson = { selected_fix_title: "Fallback Eval", reason: evaluationRaw };
    }

    // Pipeline Step 4: Report Generation
    const reportRaw = await runReportAgent(JSON.stringify(diagnosisJson), JSON.stringify(evaluationJson));

    // Store the incident
    const newIncident = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      originalLogs: logs,
      diagnosis: diagnosisJson,
      fixes: fixesJson,
      selectedFix: evaluationJson,
      report: reportRaw
    };

    addIncident(newIncident);

    // Return the full pipeline trace to the frontend
    return NextResponse.json({ success: true, incident: newIncident });
    
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze logs." }, { status: 500 });
  }
}

// Simple endpoint to fetch all incidents for history view
export async function GET() {
  const { getIncidents } = await import("@/lib/store");
  return NextResponse.json({ incidents: getIncidents() });
}
