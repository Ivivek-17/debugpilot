"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Activity, Cpu, CheckCircle, FileText, AlertTriangle,
  Loader2, RefreshCw, Clock, Zap, Shield, Terminal, Database,
  ChevronRight, Upload, X, Copy, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import AgentChatter, { ChatterMessage } from "@/components/AgentChatter";
import HitlModal from "@/components/HitlModal";
import DebugBot from "@/components/DebugBot";
import Login from "@/components/Login";
import type { AgentNodeStatus } from "@/components/AgentGraph";
import type { Fix } from "@/lib/agents/types";

// Lazy-load React Flow to avoid SSR issues
const AgentGraph = dynamic(() => import("@/components/AgentGraph"), { ssr: false });

/* ──── Default logs ──────────────────────────────────────────── */
const DEFAULT_LOGS = `[ERROR] 2026-03-27T17:02:56Z - Service 'payment-gateway' failed to start.
[FATAL] Error: Redis Connection Timeout after 5000ms.
[INFO] Attempting to reconnect (1/3)...
[ERROR] Reconnection failed.
[WARN] Request to /api/checkout from IP 192.168.1.5 aborted - 503 Service Unavailable`;

const IDLE_GRAPH: AgentNodeStatus = {
  triage: "idle", worker: "idle", workerLabel: "INFRA_Agent",
  critic: "idle", report: "idle", criticRejecting: false,
};

/* ──── Small helpers ─────────────────────────────────────────── */
function getRiskClass(risk?: string) {
  const r = (risk || "medium").toLowerCase();
  if (r === "low")  return "badge badge-success";
  if (r === "high") return "badge badge-danger";
  return "badge badge-warning";
}

function HeaderStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1.5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.6rem" }}>{label}</span>
      <span className="text-xs font-semibold" style={{ color, fontFamily: "var(--font-display)" }}>{value}</span>
    </div>
  );
}

/* ──── Main Component ────────────────────────────────────────── */
export default function Dashboard() {
  /* ── Auth state ────────────────────────────────── */
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Hydrate auth from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("debugpilot_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
    setAuthLoading(false);
  }, []);

  const handleLogin = (u: { name: string; email: string }) => setUser(u);

  const handleLogout = () => {
    localStorage.removeItem("debugpilot_user");
    setUser(null);
  };

  /* ── Core dashboard state ──────────────────────── */
  const [logs,        setLogs       ] = useState(DEFAULT_LOGS);
  const [loading,     setLoading    ] = useState(false);
  const [incident,    setIncident   ] = useState<any>(null);
  const [history,     setHistory    ] = useState<any[]>([]);
  const [activeTab,   setActiveTab  ] = useState("run");
  const [chatter,     setChatter    ] = useState<ChatterMessage[]>([]);
  const [graphStatus, setGraphStatus] = useState<AgentNodeStatus>(IDLE_GRAPH);
  const [hitlFixes,   setHitlFixes  ] = useState<Fix[] | null>(null);
  const [reportText,  setReportText ] = useState("");
  const [contextFiles, setContextFiles] = useState<Record<string, string>>({});
  const [isDragging,  setIsDragging ] = useState(false);
  const [botState,    setBotState   ] = useState<"idle" | "thinking" | "triage" | "db" | "infra" | "network" | "critic" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef     = useRef<AbortController | null>(null);

  /* ── Chatter helper ─────────────────────────────── */
  const addChatter = useCallback((agent: string, text: string, type: ChatterMessage["type"]) => {
    setChatter(prev => [...prev.slice(-199), { agent, text, type, ts: Date.now() }]);
  }, []);

  /* ── Graph helper ───────────────────────────────── */
  const setGraphNode = useCallback((node: keyof AgentNodeStatus, value: any) => {
    setGraphStatus(prev => ({ ...prev, [node]: value }));
  }, []);

  /* ── File drop / upload ─────────────────────────── */
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        setContextFiles(prev => ({ ...prev, [file.name]: content }));
      };
      reader.readAsText(file);
    });
  };

  const removeContextFile = (name: string) => {
    setContextFiles(prev => { const next = { ...prev }; delete next[name]; return next; });
  };

  /* ── SSE Runner ─────────────────────────────────── */
  const runPipeline = async (hintOverride?: string) => {
    setLoading(true);
    setIncident(null);
    setReportText("");
    setChatter([]);
    setHitlFixes(null);
    setGraphStatus(IDLE_GRAPH);

    abortRef.current = new AbortController();

    addChatter("System", "Initializing multi-agent pipeline via Oxlo API...", "info");

    try {
      const res = await fetch("/api/analyze/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: hintOverride ? `${logs}\n\n[User Hint]: ${hintOverride}` : logs,
          context: contextFiles,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        addChatter("System", `Connection failed: ${res.statusText}`, "error");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          let event: any;
          try { event = JSON.parse(jsonStr); } catch { continue; }

          const agentToState: Record<string, typeof botState> = {
            triage: 'triage', db_agent: 'db', infra_agent: 'infra',
            network_agent: 'network', critic: 'critic', report: 'thinking'
          };

          switch (event.type) {
            case "agent_start":
              setBotState(agentToState[event.agent.toLowerCase()] ?? 'thinking');
              addChatter(event.agent, event.message, "info");
              if (event.agent === "Triage") setGraphNode("triage", "active");
              else if (event.agent?.includes("Agent") && event.agent !== "Critic" && event.agent !== "Report") {
                setGraphStatus(prev => ({ ...prev, worker: "active", workerLabel: event.agent, criticRejecting: false }));
              }
              else if (event.agent === "Critic") setGraphNode("critic", "active");
              else if (event.agent === "Report") setGraphNode("report", "active");
              break;

            case "agent_done":
              addChatter(event.agent, `Completed. ${event.data?.fixes?.length ? `Generated ${event.data.fixes.length} fixes.` : ""}`, "success");
              if (event.agent === "Triage") setGraphNode("triage", "done");
              else if (event.agent?.includes("Agent") && event.agent !== "Critic" && event.agent !== "Report") {
                setGraphStatus(prev => ({ ...prev, worker: "done", criticRejecting: false }));
              }
              else if (event.agent === "Critic") setGraphNode("critic", event.data?.approved ? "done" : "error");
              else if (event.agent === "Report") setGraphNode("report", "done");
              break;

            case "critic_retry":
              addChatter("Critic", `Rejected fixes (attempt ${event.attempt}): ${event.reason}`, "warn");
              setGraphStatus(prev => ({ ...prev, critic: "error", worker: "idle", criticRejecting: true }));
              break;

            case "hitl_required":
              setBotState('critic');
              addChatter("System", "Agents exhausted all retries. Human intervention required.", "warn");
              setHitlFixes(event.fixes);
              setLoading(false);
              return;

            case "report_chunk":
              setReportText(prev => prev + event.chunk);
              break;

            case "complete":
              setBotState('success');
              setTimeout(() => setBotState('idle'), 2500);
              setIncident(event.incident);
              addChatter("System", "Pipeline complete. Incident stored.", "success");
              loadHistory();
              break;

            case "agent_error":
              setBotState('error');
              setTimeout(() => setBotState('idle'), 3000);
              addChatter(event.agent, `[System] ${event.message}. Falling back to cached heuristics...`, "error");
              if (event.agent === "Triage") setGraphNode("triage", "error");
              else if (event.agent?.includes("Agent")) setGraphStatus(prev => ({ ...prev, worker: "error" }));
              else if (event.agent === "Critic") setGraphNode("critic", "error");
              else if (event.agent === "Report") setGraphNode("report", "error");
              break;
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        addChatter("System", `Network error: ${err.message}. Check your connection and try again.`, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/analyze");
      const data = await res.json();
      setHistory(data.incidents || []);
    } catch {}
  };

  const handleForceApply = (fix: Fix) => {
    setHitlFixes(null);
    setIncident({ triage: {}, fixes: [fix], selectedFix: { selected_fix_title: fix.title, reason: "User-forced via HITL.", approved: true, risk_level: fix.risk_level }, report: "Manually applied via Human-in-the-Loop intervention." });
    setReportText("Manually applied via Human-in-the-Loop intervention.");
  };

  const handleRetryWithHint = (hint: string) => {
    setHitlFixes(null);
    runPipeline(hint);
  };

  /* ──────── RENDER ──────── */

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg-base)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  // Login gate
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* HITL Modal */}
      {hitlFixes && (
        <HitlModal
          fixes={hitlFixes}
          onForceApply={handleForceApply}
          onRetryWithHint={handleRetryWithHint}
          onClose={() => setHitlFixes(null)}
        />
      )}

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-40 w-full"
        style={{ background: "rgba(13,17,42,0.88)", backdropFilter: "blur(24px)", borderBottom: "1px solid var(--color-border)", boxShadow: "0 1px 30px rgba(0,0,0,0.5)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex items-center justify-center w-10 h-10"
              style={{ background: "linear-gradient(135deg,rgba(0,240,255,0.08),rgba(124,58,237,0.06))", border: "1px solid rgba(0,240,255,0.20)", borderRadius: "var(--radius-md)", boxShadow: "0 0 16px rgba(0,240,255,0.10)" }}>
              <DebugBot mode="nav" agentState="idle" />
              <span className="status-dot live absolute -top-1 -right-1" style={{ width: 7, height: 7 }} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight gradient-text leading-none" style={{ fontFamily: "var(--font-display)" }}>DebugPilot</h1>
              <p className="leading-none mt-0.5" style={{ fontSize: "0.55rem", color: "var(--color-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-display)" }}>Enterprise multi-agent SRE copilot</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeaderStat icon={Zap}      label="Agents"  value="6 Active"    color="#00f0ff" />
            <HeaderStat icon={Database} label="Model"   value="Oxlo API"    color="#7C3AED" />
            <HeaderStat icon={Shield}   label="Status"  value="Operational" color="#10B981" />
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1 p-1"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
              {[{ id: "run", label: "Analysis", icon: Terminal }, { id: "history", label: "History", icon: Clock }].map(({ id, label, icon: Icon }) => (
                <button key={id} id={`tab-${id}`}
                  onClick={() => { setActiveTab(id); if (id === "history") loadHistory(); }}
                  className={`seg-pill flex items-center gap-1.5 ${activeTab === id ? "seg-pill-active" : "seg-pill-inactive"}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </nav>

            {/* User badge + Logout */}
            <div className="hidden md:flex items-center gap-2 pl-3" style={{ borderLeft: "1px solid var(--color-border)" }}>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-display)" }}>{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors"
                style={{ background: "rgba(255,0,85,0.08)", border: "1px solid rgba(255,0,85,0.2)", borderRadius: "var(--radius-sm)", color: "#ff6688", fontSize: "0.65rem", fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase" }}
                title="Sign out"
              >
                <LogOut className="w-3 h-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">

          {/* ── NEW ANALYSIS TAB ── */}
          {activeTab === "run" && (
            <motion.div key="run" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT PANEL */}
              <div className="lg:col-span-4 flex flex-col gap-4">

                {/* Log Input */}
                <div className="glass p-6 flex flex-col gap-4" style={{ borderRadius: "var(--radius-xl)" }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom: '16px' }}>
                    <DebugBot mode="hero" agentState={botState} />
                    <h1 className="text-xl font-bold tracking-tight gradient-text leading-none" style={{ marginTop: 12, fontFamily: "var(--font-display)" }}>DebugPilot</h1>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
                      <h2 className="font-semibold text-sm" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>Raw log ingestion</h2>
                    </div>
                    <div className="h-px w-full mt-2 mb-3" style={{ background: "linear-gradient(90deg,rgba(0,240,255,0.3),transparent)" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>Paste failing server logs. The Triage agent routes to the right specialist automatically.</p>
                  </div>

                  <textarea id="log-input" value={logs} onChange={e => setLogs(e.target.value)}
                    className="log-textarea w-full p-4 text-sm leading-6" style={{ minHeight: 180 }}
                    placeholder="[ERROR] paste your logs here..." aria-label="Server logs input" />

                  {/* Context Dropzone */}
                  <div>
                    <p style={{ fontSize: "0.6rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "0.5rem" }}>Context injection (optional)</p>
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-center cursor-pointer transition-all"
                      style={{
                        border: `1px dashed ${isDragging ? "rgba(0,240,255,0.5)" : "var(--color-outline)"}`,
                        background: isDragging ? "rgba(0,240,255,0.04)" : "rgba(0,0,0,0.2)",
                        borderRadius: "var(--radius-md)",
                      }}>
                      <Upload className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--color-text-muted)" }} />
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Drop <span style={{ color: "var(--color-text-secondary)" }}>docker-compose.yml</span>, <span style={{ color: "var(--color-text-secondary)" }}>package.json</span>, schema</p>
                      <input ref={fileInputRef} type="file" multiple accept=".json,.yml,.yaml,.prisma,.env,.txt,.env.example"
                        className="hidden" onChange={e => handleFiles(e.target.files)} />
                    </div>

                    {Object.keys(contextFiles).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.keys(contextFiles).map(name => (
                          <div key={name} className="flex items-center gap-1 px-2 py-1 text-[10px]"
                            style={{ background: "var(--color-primary-dim)", border: "1px solid rgba(0,240,255,0.15)", color: "#7DD3FC", borderRadius: "var(--radius-sm)" }}>
                            {name}
                            <button onClick={() => removeContextFile(name)} className="ml-0.5 hover:text-red-400 transition-colors cursor-pointer">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button id="run-btn" onClick={() => runPipeline()} disabled={loading || !logs.trim()}
                    className="btn-shimmer w-full font-semibold py-3 px-4 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-transform active:scale-95 hover:scale-[1.01]"
                    style={{ color: "var(--color-primary-on)", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {loading ? "Pipeline processing…" : "Run AI diagnosis"}
                  </button>
                </div>

                {/* Agent Chatter — below log input on left panel */}
                <AgentChatter messages={chatter} agentState={botState} />
              </div>

              {/* RIGHT PANEL */}
              <div className="lg:col-span-8 flex flex-col gap-5">

                {/* Loading state — with Agent Graph */}
                {loading && !incident && (
                  <div className="glass p-8 flex flex-col items-center justify-center min-h-[340px] text-center" style={{ borderRadius: "var(--radius-xl)" }}>
                    <div className="relative mb-4 animate-float">
                      <div className="w-14 h-14 flex items-center justify-center"
                        style={{ border: "1px solid rgba(0,240,255,0.25)", borderRadius: "var(--radius-md)", boxShadow: "0 0 40px rgba(0,240,255,0.15)" }}>
                        <div className="w-12 h-12 border-t-2 animate-spin-slow absolute" style={{ borderColor: "var(--color-primary)", borderRadius: "50%" }} />
                        <Cpu className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold mb-1" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>Agents processing</h3>
                    <p className="text-xs max-w-xs mb-5" style={{ color: "var(--color-text-muted)" }}>Watch the chatter terminal and graph for real-time updates.</p>
                    <div className="w-full">
                      <AgentGraph status={graphStatus} />
                    </div>
                  </div>
                )}

                {/* Empty state — with Agent Graph */}
                {!loading && !incident && !hitlFixes && (
                  <div className="glass p-8 flex flex-col items-center justify-center min-h-[340px] text-center" style={{ borderRadius: "var(--radius-xl)", borderStyle: "dashed" }}>
                    <div className="w-12 h-12 flex items-center justify-center mb-3"
                      style={{ background: "rgba(0,240,255,0.04)", border: "1px solid rgba(0,240,255,0.12)", borderRadius: "var(--radius-md)" }}>
                      <Terminal className="w-5 h-5" style={{ color: "rgba(0,240,255,0.4)" }} />
                    </div>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-display)" }}>Awaiting log ingestion</h3>
                    <p className="text-xs max-w-xs leading-relaxed mb-5" style={{ color: "var(--color-text-muted)" }}>
                      Paste logs on the left, optionally drop context files, then click <strong style={{ color: "var(--color-text-primary)" }}>Run AI Diagnosis</strong>.
                    </p>
                    <div className="w-full">
                      <AgentGraph status={graphStatus} />
                    </div>
                    <div className="flex items-center gap-1 mt-4 text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>
                      <span style={{ color: "var(--color-success)" }}>$</span>
                      <span>debugpilot analyze --logs ./server.log</span>
                      <span className="animate-blink ml-1" style={{ color: "var(--color-primary)" }}>▋</span>
                    </div>
                  </div>
                )}

                {/* Results */}
                {!loading && incident && (
                  <AnimatePresence>
                    <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">

                      {/* Domain badge */}
                      {incident.domain && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Routed to:</span>
                          <span className="badge badge-blue">{incident.domain.toUpperCase()}_Agent</span>
                          {incident.triage?.confidence && <span className="badge badge-violet">{incident.triage.confidence} confidence</span>}
                        </div>
                      )}

                      {/* Root Cause / Triage */}
                      <div className="glass p-6" style={{ borderRadius: "var(--radius-xl)", borderLeft: "3px solid var(--color-danger)", boxShadow: "0 0 30px rgba(255,0,85,0.06)" }}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
                            <AlertTriangle className="w-4 h-4" style={{ color: "var(--color-danger)" }} />Root cause diagnosis
                          </h3>
                          <span className="badge badge-danger">Critical</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                          {incident.triage?.summary || incident.diagnosis?.root_cause || JSON.stringify(incident.triage ?? incident.diagnosis)}
                        </p>
                      </div>

                      {/* Proposed Fixes */}
                      {Array.isArray(incident.fixes) && incident.fixes.length > 0 && (
                        <div className="glass p-6" style={{ borderRadius: "var(--radius-xl)", borderLeft: "3px solid var(--color-warning)" }}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
                              <RefreshCw className="w-4 h-4" style={{ color: "var(--color-warning)" }} />Proposed fixes
                            </h3>
                            <span className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Worker agent</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {incident.fixes.map((fix: Fix, idx: number) => (
                              <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                                className="p-4" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: "var(--radius-md)" }}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className="mono text-xs font-bold" style={{ color: "rgba(245,158,11,0.4)" }}>#{idx + 1}</span>
                                  <h4 className="font-semibold text-sm flex-1 leading-snug" style={{ color: "#fde68a", fontFamily: "var(--font-display)" }}>{fix.title}</h4>
                                </div>
                                <span className={getRiskClass(fix.risk_level)}>{fix.risk_level} Risk</span>
                                <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{fix.description}</p>
                                {fix.cli_command && (
                                  <pre className="mono text-[10px] mt-2 p-2 overflow-x-auto"
                                    style={{ color: "#4ADE80", background: "rgba(0,0,0,0.4)", borderRadius: "var(--radius-sm)" }}>{fix.cli_command}</pre>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Selected Fix + Report */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="glass p-6" style={{ borderRadius: "var(--radius-xl)", borderLeft: "3px solid var(--color-success)" }}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
                              <CheckCircle className="w-4 h-4" style={{ color: "var(--color-success)" }} />Selected fix
                            </h3>
                            <span className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Critic approved</span>
                          </div>
                          <div className="p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.20)", borderRadius: "var(--radius-md)" }}>
                            <h4 className="font-bold text-sm mb-2" style={{ color: "#6ee7b7", fontFamily: "var(--font-display)" }}>{incident.selectedFix?.selected_fix_title || "N/A"}</h4>
                            <p className="text-xs leading-relaxed" style={{ color: "rgba(16,185,129,0.7)" }}>{incident.selectedFix?.reason}</p>
                            {incident.selectedFix?.warnings?.length > 0 && (
                              <div className="mt-3 space-y-1">
                                {incident.selectedFix.warnings.map((w: string, i: number) => (
                                  <p key={i} className="text-[10px] flex items-start gap-1" style={{ color: "rgba(245,158,11,0.7)" }}>
                                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />{w}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="glass p-6" style={{ borderRadius: "var(--radius-xl)", borderLeft: "3px solid var(--color-primary)" }}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
                              <FileText className="w-4 h-4" style={{ color: "var(--color-primary)" }} />Incident report
                            </h3>
                            <span className="badge badge-blue">Auto-generated</span>
                          </div>
                          <div className="prose prose-invert prose-xs max-w-none overflow-y-auto max-h-[220px] p-3 text-xs leading-relaxed"
                            style={{ background: "rgba(0,240,255,0.03)", border: "1px solid rgba(0,240,255,0.08)", borderRadius: "var(--radius-md)" }}>
                            <ReactMarkdown>{reportText || incident.report || ""}</ReactMarkdown>
                            {loading && <span className="animate-blink" style={{ color: "var(--color-primary)" }}>▋</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="glass overflow-hidden" style={{ borderRadius: "var(--radius-xl)" }}>
                <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <h2 className="text-base font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                    <Clock className="w-4 h-4" style={{ color: "var(--color-primary)" }} />Incident history
                  </h2>
                  <span className="badge badge-blue">{history.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table w-full" aria-label="Incident history table">
                    <thead>
                      <tr><th>Timestamp</th><th>Domain</th><th>Triage Summary</th><th>Selected Fix</th><th>Risk</th></tr>
                    </thead>
                    <tbody>
                      {history.length > 0 ? history.map((inc: any) => (
                        <tr key={inc.id}>
                          <td><span className="mono text-xs" style={{ color: "var(--color-text-secondary)" }}>{new Date(inc.timestamp).toLocaleString()}</span></td>
                          <td><span className="badge badge-blue">{(inc.domain || "unknown").toUpperCase()}</span></td>
                          <td><span className="text-sm max-w-xs block truncate" style={{ color: "var(--color-text-secondary)" }}>{inc.triage?.summary || inc.diagnosis?.root_cause || "Unknown"}</span></td>
                          <td><span className="text-sm max-w-xs block truncate" style={{ color: "var(--color-success)" }}>{inc.selectedFix?.selected_fix_title || "Unknown"}</span></td>
                          <td><span className={`badge ${inc.selectedFix?.risk_level === "Low" ? "badge-success" : inc.selectedFix?.risk_level === "High" ? "badge-danger" : "badge-warning"}`}>{inc.selectedFix?.risk_level || "Medium"}</span></td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>
                          <div className="flex flex-col items-center gap-3">
                            <Clock className="w-8 h-8" style={{ color: "var(--color-text-muted)", opacity: 0.3 }} />
                            <p>No incidents recorded yet.</p>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="mt-auto py-5 px-6 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          DebugPilot — Enterprise multi-agent SRE copilot &nbsp;·&nbsp; Powered by <span style={{ color: "rgba(0,240,255,0.5)" }}>Oxlo API</span>
        </p>
      </footer>
    </div>
  );
}
