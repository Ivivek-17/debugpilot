"use client";

import { useState } from "react";
import {
  Play, Activity, Cpu, CheckCircle, FileText, AlertTriangle,
  ArrowRight, Loader2, RefreshCw, Clock, Zap, Shield,
  ChevronRight, Terminal, Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_LOGS = `[ERROR] 2026-03-27T17:02:56Z - Service 'payment-gateway' failed to start.
[FATAL] Error: Redis Connection Timeout after 5000ms.
[INFO] Attempting to reconnect (1/3)...
[ERROR] Reconnection failed. 
[WARN] Request to /api/checkout from IP 192.168.1.5 aborted - 503 Service Unavailable`;

/* ───── Pipeline Steps ───── */
const PIPELINE_STAGES = [
  { id: "diagnose", label: "Diagnosis",    icon: AlertTriangle },
  { id: "generate", label: "Fix Gen",      icon: RefreshCw     },
  { id: "evaluate", label: "Evaluation",   icon: Shield        },
  { id: "report",   label: "Report",       icon: FileText      },
];

function getRiskClass(risk?: string) {
  const r = (risk || "medium").toLowerCase();
  if (r === "low")  return "badge badge-success";
  if (r === "high") return "badge badge-danger";
  return "badge badge-warning";
}

/* ───── Stat Badge in Header ───── */
function HeaderStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const [logs,      setLogs     ] = useState(DEFAULT_LOGS);
  const [loading,   setLoading  ] = useState(false);
  const [incident,  setIncident ] = useState<any>(null);
  const [history,   setHistory  ] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("run");
  const [stage,     setStage    ] = useState(-1);   // 0-3 while loading

  const runPipeline = async () => {
    setLoading(true);
    setIncident(null);
    setStage(0);

    // Simulate pipeline progress ticks
    const tick = setInterval(() => {
      setStage(prev => (prev < 3 ? prev + 1 : prev));
    }, 900);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs }),
      });
      const data = await res.json();
      clearInterval(tick);
      setStage(-1);
      if (data.success) {
        setIncident(data.incident);
        loadHistory();
      } else {
        alert("Pipeline failed: " + data.error);
      }
    } catch {
      clearInterval(tick);
      setStage(-1);
      alert("Network Error");
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

  return (
    <div className="min-h-screen flex flex-col">

      {/* ──────── NAVBAR ──────── */}
      <header className="sticky top-0 z-50 w-full"
        style={{
          background: "rgba(2,6,23,0.85)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 1px 30px rgba(0,0,0,0.5)",
        }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))",
                border: "1px solid rgba(0,212,255,0.35)",
                boxShadow: "0 0 16px rgba(0,212,255,0.2)",
              }}>
              <Cpu className="w-4.5 h-4.5 text-cyan-400" style={{ width: 18, height: 18 }} />
              <span className="status-dot live absolute -top-1 -right-1" style={{ width: 7, height: 7 }} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight gradient-text leading-none">DebugPilot</h1>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-none">AI Copilot for Backend Resolution</p>
            </div>
          </div>

          {/* Center stats */}
          <div className="flex items-center gap-2">
            <HeaderStat icon={Zap}      label="Agents"  value="4 Active"    color="#00D4FF" />
            <HeaderStat icon={Database} label="Model"   value="Oxlo API"    color="#7C3AED" />
            <HeaderStat icon={Shield}   label="Status"  value="Operational" color="#10B981" />
          </div>

          {/* Tab switcher */}
          <nav className="flex items-center gap-1 p-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { id: "run",     label: "New Analysis",     icon: Terminal },
              { id: "history", label: "Incident History", icon: Clock    },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => { setActiveTab(id); if (id === "history") loadHistory(); }}
                className={`seg-pill flex items-center gap-1.5 ${activeTab === id ? "seg-pill-active" : "seg-pill-inactive"}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ──────── MAIN ──────── */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        <AnimatePresence mode="wait">

          {/* ── NEW ANALYSIS TAB ── */}
          {activeTab === "run" && (
            <motion.div key="run"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT: INPUT */}
              <div className="lg:col-span-4 flex flex-col gap-4">

                {/* Log Input Card */}
                <div className="glass rounded-2xl p-6 flex flex-col gap-4 flex-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4 text-violet-400" />
                      <h2 className="font-semibold text-sm text-slate-100">Raw Log Ingestion</h2>
                    </div>
                    <div className="h-px w-full mt-2 mb-3" style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.5), transparent)" }} />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Paste your failing server logs below. The multi-agent pipeline will diagnose, generate, and evaluate fixes automatically.
                    </p>
                  </div>

                  <textarea
                    id="log-input"
                    value={logs}
                    onChange={e => setLogs(e.target.value)}
                    className="log-textarea w-full flex-1 p-4 text-sm leading-6"
                    style={{ minHeight: 240 }}
                    placeholder="[ERROR] paste your logs here..."
                    aria-label="Server logs input"
                  />

                  <button
                    id="run-btn"
                    onClick={runPipeline}
                    disabled={loading || !logs.trim()}
                    className="btn-shimmer w-full text-slate-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-transform active:scale-95 hover:scale-[1.01]"
                    style={{ borderRadius: "0.75rem" }}
                  >
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Play className="w-4 h-4" />}
                    {loading ? "Pipeline Processing…" : "Run AI Diagnosis"}
                  </button>
                </div>

                {/* Info Card */}
                <div className="glass rounded-2xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pipeline Stages</p>
                  <div className="space-y-2">
                    {PIPELINE_STAGES.map((s, i) => {
                      const isDone   = !loading && incident && true;
                      const isActive = loading && stage === i;
                      const wasDone  = loading && stage > i;
                      const Icon = s.icon;
                      return (
                        <div key={s.id}
                          className={`pipeline-step ${isActive ? "active" : ""} ${wasDone || isDone ? "done" : ""}`}>
                          {wasDone || isDone
                            ? <CheckCircle className="w-3.5 h-3.5" />
                            : isActive
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Icon className="w-3.5 h-3.5" />}
                          <span>{s.label}</span>
                          <span className="ml-auto text-[10px]">
                            {wasDone || isDone ? "Done" : isActive ? "Running" : `Step ${i + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT: OUTPUT */}
              <div className="lg:col-span-8 flex flex-col gap-5">

                {/* ── Loading ── */}
                {loading && (
                  <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center min-h-[520px] text-center">
                    <div className="relative mb-8 animate-float">
                      <div className="w-20 h-20 rounded-full border border-cyan-500/30 flex items-center justify-center"
                        style={{ boxShadow: "0 0 40px rgba(0,212,255,0.2)" }}>
                        <div className="w-16 h-16 rounded-full border-t-2 border-cyan-400 animate-spin-slow absolute" />
                        <Cpu className="w-8 h-8 text-cyan-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">
                      {PIPELINE_STAGES[stage]?.label ?? "Completing"} Agent Active
                    </h3>
                    <p className="text-sm text-slate-400 max-w-xs">
                      Agents analyzing logs via <span className="text-cyan-400 font-medium">Oxlo API</span> — this takes a few seconds.
                    </p>
                    <div className="flex items-center gap-2 mt-6 flex-wrap justify-center">
                      {PIPELINE_STAGES.map((s, i) => (
                        <span key={s.id}
                          className={`pipeline-step ${stage === i ? "active" : stage > i ? "done" : ""}`}
                          style={{ fontSize: "0.7rem" }}>
                          {stage > i ? <CheckCircle className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Empty State ── */}
                {!loading && !incident && (
                  <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center min-h-[520px] text-center"
                    style={{ borderStyle: "dashed" }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}>
                      <Terminal className="w-7 h-7 text-cyan-800" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-400 mb-2">Awaiting Log Ingestion</h3>
                    <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                      Paste server logs in the panel on the left and click <strong className="text-slate-300">Run AI Diagnosis</strong> to see the multi-agent reasoning trace.
                    </p>
                    <div className="flex items-center gap-1 mt-5 text-xs text-slate-600 font-mono">
                      <span className="text-green-500">$</span>
                      <span>debugpilot analyze --logs ./server.log</span>
                      <span className="animate-blink text-green-400">▋</span>
                    </div>
                  </div>
                )}

                {/* ── Results ── */}
                {!loading && incident && (
                  <AnimatePresence>
                    <motion.div key="results"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="space-y-5">

                      {/* Root Cause */}
                      <div className="glass rounded-2xl p-6"
                        style={{ borderLeft: "3px solid var(--color-danger)", boxShadow: "0 0 30px rgba(239,68,68,0.08)" }}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold flex items-center gap-2 text-slate-100">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Root Cause Diagnosis
                          </h3>
                          <span className="badge badge-danger">Critical</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(239,68,68,0.15)" }}>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Failing Service</p>
                            <p className="mono text-red-300 text-sm font-medium">{incident.diagnosis?.failing_service || "Unknown"}</p>
                          </div>
                          <div className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Timestamp</p>
                            <p className="mono text-slate-300 text-sm">{incident.diagnosis?.timestamp || "Unknown"}</p>
                          </div>
                        </div>
                        <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                          <p className="text-[10px] text-red-400 uppercase tracking-wider mb-2 font-semibold">Root Cause</p>
                          <p className="text-slate-200 text-sm leading-relaxed">{incident.diagnosis?.root_cause || JSON.stringify(incident.diagnosis)}</p>
                          {incident.diagnosis?.details && (
                            <p className="text-slate-400 text-sm mt-2 leading-relaxed">{incident.diagnosis.details}</p>
                          )}
                        </div>
                      </div>

                      {/* Proposed Fixes */}
                      <div className="glass rounded-2xl p-6"
                        style={{ borderLeft: "3px solid var(--color-warning)", boxShadow: "0 0 30px rgba(245,158,11,0.06)" }}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold flex items-center gap-2 text-slate-100">
                            <RefreshCw className="w-4 h-4 text-amber-400" />
                            Proposed Fixes
                          </h3>
                          <span className="text-xs text-slate-500">Generation Agent</span>
                        </div>
                        {Array.isArray(incident.fixes) ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {incident.fixes.map((fix: any, idx: number) => (
                              <motion.div key={idx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08 }}
                                className="rounded-xl p-4 cursor-default"
                                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(245,158,11,0.15)" }}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-amber-400/50 font-mono">#{idx + 1}</span>
                                    <h4 className="font-semibold text-amber-100 text-sm leading-snug">{fix.title}</h4>
                                  </div>
                                </div>
                                <span className={getRiskClass(fix.risk_level)}>
                                  {fix.risk_level || "Medium"} Risk
                                </span>
                                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{fix.description}</p>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <pre className="mono text-xs text-amber-200 overflow-x-auto p-4 rounded-xl"
                            style={{ background: "rgba(0,0,0,0.3)" }}>
                            {JSON.stringify(incident.fixes, null, 2)}
                          </pre>
                        )}
                      </div>

                      {/* Selected Fix + Report */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Selected Fix */}
                        <div className="glass rounded-2xl p-6"
                          style={{ borderLeft: "3px solid var(--color-success)", boxShadow: "0 0 30px rgba(16,185,129,0.08)" }}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2 text-slate-100">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              Selected Fix
                            </h3>
                            <span className="text-xs text-slate-500">Evaluation Agent</span>
                          </div>
                          <div className="rounded-xl p-4"
                            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)" }}>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              </div>
                              <h4 className="font-bold text-emerald-300 text-sm leading-snug">
                                {incident.selectedFix?.selected_fix_title || "Unknown"}
                              </h4>
                            </div>
                            <p className="text-xs text-emerald-100/70 leading-relaxed">
                              {incident.selectedFix?.reason || JSON.stringify(incident.selectedFix)}
                            </p>
                          </div>
                        </div>

                        {/* Incident Report */}
                        <div className="glass rounded-2xl p-6"
                          style={{ borderLeft: "3px solid var(--color-primary)", boxShadow: "0 0 30px rgba(0,212,255,0.06)" }}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2 text-slate-100">
                              <FileText className="w-4 h-4 text-cyan-400" />
                              Incident Report
                            </h3>
                            <span className="badge badge-blue">Auto-generated</span>
                          </div>
                          <pre className="mono text-xs text-slate-300 leading-5 whitespace-pre-wrap overflow-y-auto max-h-[180px] p-3 rounded-xl"
                            style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)" }}>
                            {incident.report}
                          </pre>
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
            <motion.div key="history"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}>
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Incident History
                  </h2>
                  <span className="badge badge-blue">{history.length} records</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="data-table w-full" aria-label="Incident history table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Failing Service</th>
                        <th>Root Cause</th>
                        <th>Selected Fix</th>
                        <th>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length > 0 ? history.map((inc) => (
                        <tr key={inc.id}>
                          <td>
                            <span className="mono text-slate-400 text-xs">
                              {new Date(inc.timestamp).toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span className="font-medium text-red-400 mono text-sm">
                              {inc.diagnosis?.failing_service || "Unknown"}
                            </span>
                          </td>
                          <td>
                            <span className="text-slate-300 text-sm max-w-xs block truncate">
                              {inc.diagnosis?.root_cause || "Unknown"}
                            </span>
                          </td>
                          <td>
                            <span className="text-emerald-400 text-sm max-w-xs block truncate">
                              {inc.selectedFix?.selected_fix_title || "Unknown"}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-danger">Critical</span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="text-center py-16 text-slate-500">
                            <div className="flex flex-col items-center gap-3">
                              <Clock className="w-8 h-8 text-slate-700" />
                              <p>No incidents recorded yet.</p>
                              <p className="text-xs text-slate-600">Run an analysis to generate your first incident report.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ──────── FOOTER ──────── */}
      <footer className="mt-auto py-5 px-6 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p className="text-xs text-slate-600">
          DebugPilot — Multi-Agent AI Debugging &nbsp;·&nbsp;
          Powered by <span className="text-cyan-700">Oxlo API</span>
        </p>
      </footer>
    </div>
  );
}
