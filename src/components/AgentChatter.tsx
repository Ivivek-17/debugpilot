"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Terminal, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ChatterMessage {
  agent: string;
  text: string;
  type: "info" | "success" | "warn" | "error";
  ts: number;
}

const AGENT_COLORS: Record<string, string> = {
  Triage:        "#00D4FF",
  DB_Agent:      "#60A5FA",
  INFRA_Agent:   "#A78BFA",
  NETWORK_Agent: "#FCD34D",
  Critic:        "#FB923C",
  Report:        "#34D399",
  System:        "#94A3B8",
};

const TYPE_COLORS: Record<string, string> = {
  info:    "#94A3B8",
  success: "#34D399",
  warn:    "#FCD34D",
  error:   "#F87171",
};

interface AgentChatterProps {
  messages: ChatterMessage[];
}

export default function AgentChatter({ messages }: AgentChatterProps) {
  const [collapsed, setCollapsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collapsed) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, collapsed]);

  return (
    <div className="rounded-2xl overflow-hidden glass"
      style={{ border: "1px solid rgba(0,212,255,0.12)" }}>

      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-white/5 transition-colors"
        style={{ borderBottom: collapsed ? "none" : "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">Agent Chatter</span>
          {messages.length > 0 && (
            <span className="badge badge-blue">{messages.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!collapsed && messages.length > 0 && (
            <div className="flex items-center gap-1">
              <Circle className="w-2 h-2 text-green-400 fill-green-400 animate-pulse" />
              <span className="text-xs text-slate-500">Live</span>
            </div>
          )}
          {collapsed
            ? <ChevronDown className="w-4 h-4 text-slate-500" />
            : <ChevronUp   className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {/* Terminal body */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 220, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-y-auto px-4 py-3 space-y-1"
            style={{ background: "rgba(0,0,0,0.6)", height: 220 }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 mb-2 animate-float">
                  <img src="/mascot.png" alt="DebugPilot Mascot" className="w-full h-full object-contain animate-wave" />
                </div>
                <p className="mono justify-center text-slate-500 text-xs flex items-center gap-2">
                  <span className="text-green-500">$</span>
                  Waiting for agents to start
                  <span className="animate-blink text-green-400">▋</span>
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className="mono text-xs leading-5 flex gap-2">
                  <span className="shrink-0 text-slate-600 tabular-nums w-16">
                    {new Date(msg.ts).toLocaleTimeString("en", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className="shrink-0 font-semibold"
                    style={{ color: AGENT_COLORS[msg.agent] ?? "#94A3B8" }}>
                    [{msg.agent}]
                  </span>
                  <span style={{ color: TYPE_COLORS[msg.type] }}>
                    {msg.text}
                  </span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
