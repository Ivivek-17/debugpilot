"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Terminal, Copy, Check, X } from "lucide-react";
import { Fix } from "@/lib/agents/types";

interface HitlModalProps {
  fixes: Fix[];
  onForceApply: (fix: Fix) => void;
  onRetryWithHint: (hint: string) => void;
  onClose: () => void;
}

export default function HitlModal({ fixes, onForceApply, onRetryWithHint, onClose }: HitlModalProps) {
  const [selectedFix, setSelectedFix] = useState<Fix | null>(null);
  const [hint, setHint] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyToClipboard = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="hitl-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(2,6,23,0.9)", backdropFilter: "blur(12px)" }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-3xl glass-elevated rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 0 60px rgba(239,68,68,0.1)" }}
        >
          {/* Header */}
          <div className="px-6 py-5 flex items-start justify-between"
            style={{ background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="font-bold text-red-300">Human Intervention Required</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Critic Agent rejected all fixes after 3 attempts. Your engineering judgment is needed.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Fix list */}
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Select a Fix to Force Apply</p>
            {fixes.map((fix, idx) => (
              <div key={idx}
                onClick={() => setSelectedFix(fix)}
                className="rounded-xl p-4 cursor-pointer transition-all"
                style={{
                  background: selectedFix?.title === fix.title ? "rgba(0,212,255,0.06)" : "rgba(0,0,0,0.3)",
                  border: selectedFix?.title === fix.title ? "1px solid rgba(0,212,255,0.35)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="mono text-xs text-slate-600 font-bold">#{idx + 1}</span>
                    <h4 className="font-semibold text-slate-100 text-sm">{fix.title}</h4>
                  </div>
                  <span className={`badge ${fix.risk_level === "Low" ? "badge-success" : fix.risk_level === "High" ? "badge-danger" : "badge-warning"}`}>
                    {fix.risk_level} Risk
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{fix.description}</p>

                {/* CLI Command */}
                {fix.cli_command && (
                  <div className="rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between px-3 py-1.5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">CLI Command</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(fix.cli_command!, idx * 10); }}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {copiedIdx === idx * 10 ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {copiedIdx === idx * 10 ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="mono text-xs text-green-400 px-3 py-2 overflow-x-auto">{fix.cli_command}</pre>
                  </div>
                )}

                {/* Git Patch */}
                {fix.patch && (
                  <div className="rounded-lg overflow-hidden mt-2" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between px-3 py-1.5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Git Patch</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(fix.patch!, idx * 10 + 1); }}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {copiedIdx === idx * 10 + 1 ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {copiedIdx === idx * 10 + 1 ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="mono text-xs text-amber-300 px-3 py-2 overflow-x-auto whitespace-pre-wrap">{fix.patch}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 flex flex-col sm:flex-row gap-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
            {/* Hint input + retry */}
            <div className="flex-1 flex gap-2">
              <input
                value={hint}
                onChange={e => setHint(e.target.value)}
                placeholder="Give agents a hint... (e.g. 'focus on Redis timeout config')"
                className="flex-1 text-sm px-3 py-2 rounded-lg log-textarea"
                style={{ fontFamily: "Inter, sans-serif", minHeight: "auto", color: "#CBD5E1", fontSize: "0.8rem" }}
              />
              <button
                onClick={() => hint.trim() && onRetryWithHint(hint)}
                className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02]"
                style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#A78BFA" }}
              >
                Retry with Hint
              </button>
            </div>

            {/* Force apply */}
            <button
              onClick={() => selectedFix && onForceApply(selectedFix)}
              disabled={!selectedFix}
              className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
              style={{ background: selectedFix ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.4)", color: "#FCA5A5" }}
            >
              ⚡ Force Apply Selected Fix
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
