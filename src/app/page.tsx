"use client";

import { useState } from "react";
import { Play, Activity, Cpu, CheckCircle, FileText, AlertTriangle, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_LOGS = `[ERROR] 2026-03-27T17:02:56Z - Service 'payment-gateway' failed to start.
[FATAL] Error: Redis Connection Timeout after 5000ms.
[INFO] Attempting to reconnect (1/3)...
[ERROR] Reconnection failed. 
[WARN] Request to /api/checkout from IP 192.168.1.5 aborted - 503 Service Unavailable`;

export default function Dashboard() {
  const [logs, setLogs] = useState(DEFAULT_LOGS);
  const [loading, setLoading] = useState(false);
  const [incident, setIncident] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("run");

  const runPipeline = async () => {
    setLoading(true);
    setIncident(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs })
      });
      const data = await res.json();
      if (data.success) {
        setIncident(data.incident);
        loadHistory();
      } else {
        alert("Pipeline failed: " + data.error);
      }
    } catch (err) {
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
    } catch (err) { }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
            <Cpu className="text-blue-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              DebugPilot
            </h1>
            <p className="text-slate-400 text-sm">AI Copilot for Backend Resolution</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab("run")}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === "run" ? "bg-white/10 border border-white/20 text-white" : "text-slate-400 hover:text-white"}`}
          >
            New Analysis
          </button>
          <button 
            onClick={() => { setActiveTab("history"); loadHistory(); }}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === "history" ? "bg-white/10 border border-white/20 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Incident History
          </button>
        </div>
      </header>

      {activeTab === "run" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT SIDE: INPUT */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass rounded-2xl p-6">
               <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                 <Activity className="w-5 h-5 text-purple-400" />
                 Raw Logs Ingestion
               </h2>
               <p className="text-sm text-slate-400 mb-4">Paste failing server logs below or use the simulated default.</p>
               
               <textarea 
                  value={logs}
                  onChange={(e) => setLogs(e.target.value)}
                  className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm text-green-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Paste your logs here..."
               />
               
               <button 
                 onClick={runPipeline}
                 disabled={loading || !logs}
                 className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                 {loading ? "Multi-Agent Pipeline Active..." : "Run AI Diagnosis"}
               </button>
            </div>
          </div>

          {/* RIGHT SIDE: PIPELINE VISUALIZER */}
          <div className="lg:col-span-8 flex flex-col gap-6">
             {loading && (
               <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center min-h-[500px] text-center">
                 <motion.div 
                   animate={{ rotate: 360 }} 
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   className="relative"
                 >
                   <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full blur-sm" />
                   <Cpu className="w-16 h-16 text-blue-400" />
                 </motion.div>
                 <h3 className="mt-8 text-xl font-medium animate-pulse">Agents Analyzing Logs via Oxlo API...</h3>
                 <p className="text-slate-400 mt-2 max-w-md mx-auto">Diagnosis ➔ Fix Generation ➔ Fix Evaluation ➔ Final Report</p>
               </div>
             )}

             {!loading && incident && (
               <AnimatePresence>
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                   
                   {/* Diagnosis */}
                   <div className="glass rounded-2xl p-6 border-l-4 border-l-red-500">
                     <h3 className="text-lg font-semibold flex items-center gap-2 text-white"><AlertTriangle className="text-red-400 w-5 h-5"/> Root Cause Diagnosis</h3>
                     <div className="mt-4 grid grid-cols-2 gap-4 text-sm font-mono">
                       <div className="bg-black/30 p-3 rounded-lg"><span className="text-slate-500">Service:</span> <span className="text-red-300">{incident.diagnosis?.failing_service || "Unknown"}</span></div>
                       <div className="bg-black/30 p-3 rounded-lg"><span className="text-slate-500">Time:</span> <span className="text-slate-300">{incident.diagnosis?.timestamp || "Unknown"}</span></div>
                       <div className="col-span-2 bg-black/30 p-4 rounded-lg border border-red-500/20">
                         <span className="text-slate-500 block mb-1">Root Cause & Details:</span>
                         <span className="text-white text-base font-sans">{incident.diagnosis?.root_cause || JSON.stringify(incident.diagnosis)}</span>
                         {incident.diagnosis?.details && <p className="text-slate-400 mt-2 font-sans">{incident.diagnosis.details}</p>}
                       </div>
                     </div>
                   </div>

                   {/* Generated Fixes */}
                   <div className="glass rounded-2xl p-6 border-l-4 border-l-amber-500">
                     <h3 className="text-lg font-semibold flex items-center gap-2 text-white"><RefreshCw className="text-amber-400 w-5 h-5"/> Proposed Fixes (Generation Agent)</h3>
                     <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                       {Array.isArray(incident.fixes) ? incident.fixes.map((fix: any, idx: number) => (
                         <div key={idx} className="bg-black/30 p-4 rounded-xl border border-amber-500/20">
                           <div className="flex justify-between items-start mb-2">
                             <h4 className="font-semibold text-amber-100">{fix.title}</h4>
                             <span className="text-xs px-2 py-1 bg-white/5 rounded-full text-slate-300 border border-white/10">{fix.risk_level || 'Medium'} Risk</span>
                           </div>
                           <p className="text-sm text-slate-400">{fix.description}</p>
                         </div>
                       )) : (
                         <div className="bg-black/30 p-4 rounded-xl"><pre className="text-xs text-amber-200 overflow-x-auto">{JSON.stringify(incident.fixes, null, 2)}</pre></div>
                       )}
                     </div>
                   </div>

                   {/* Selected Fix & Report */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="glass rounded-2xl p-6 border-l-4 border-l-emerald-500">
                       <h3 className="text-lg font-semibold flex items-center gap-2 text-white"><CheckCircle className="text-emerald-400 w-5 h-5"/> Selected Fix (Evaluation Agent)</h3>
                       <div className="mt-4 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
                         <h4 className="font-bold text-emerald-300 text-lg">{incident.selectedFix?.selected_fix_title || "Unknown"}</h4>
                         <p className="text-sm text-emerald-100/70 mt-2">{incident.selectedFix?.reason || JSON.stringify(incident.selectedFix)}</p>
                       </div>
                     </div>

                     <div className="glass rounded-2xl p-6 border-l-4 border-l-blue-500">
                       <h3 className="text-lg font-semibold flex items-center gap-2 text-white"><FileText className="text-blue-400 w-5 h-5"/> Incident Report</h3>
                       <div className="mt-4 prose prose-invert prose-sm max-w-none">
                         <pre className="whitespace-pre-wrap font-sans text-slate-300 bg-black/30 p-4 rounded-xl border border-blue-500/20 max-h-[200px] overflow-y-auto">
                           {incident.report}
                         </pre>
                       </div>
                     </div>
                   </div>

                 </motion.div>
               </AnimatePresence>
             )}

             {!loading && !incident && (
               <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center min-h-[500px] text-center border-dashed border-2 border-white/10 bg-transparent">
                  <Activity className="w-16 h-16 text-slate-600 mb-4" />
                  <h3 className="text-xl font-medium text-slate-400">Awaiting Log Ingestion</h3>
                  <p className="text-slate-500 mt-2">Paste logs and run the analysis to view the multi-agent reasoning trace.</p>
               </div>
             )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">Incident History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-sm">
                  <th className="p-4 font-medium">Timestamp</th>
                  <th className="p-4 font-medium">Failing Service</th>
                  <th className="p-4 font-medium">Root Cause</th>
                  <th className="p-4 font-medium">Selected Fix</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? history.map((inc) => (
                  <tr key={inc.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-slate-300 font-mono text-sm">{new Date(inc.timestamp).toLocaleString()}</td>
                    <td className="p-4 text-red-400 font-medium">{inc.diagnosis?.failing_service || "Unknown"}</td>
                    <td className="p-4 text-slate-300 text-sm max-w-xs truncate">{inc.diagnosis?.root_cause || "Unknown"}</td>
                    <td className="p-4 text-emerald-400 text-sm max-w-xs truncate">{inc.selectedFix?.selected_fix_title || "Unknown"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No incidents recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
