"use client";

import { useReducer, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

// Pre-generated stable data arrays
const NORMAL_DATA = [15, 22, 18, 12, 25, 20, 14, 28, 16, 23, 19, 11, 27, 21, 13, 26, 17, 24, 15, 22, 18, 29, 12, 20, 14, 25, 16, 23, 19, 27, 11, 21, 28, 13, 26, 17, 24, 15, 22, 18];
const SPIKE_DATA = [15, 18, 12, 16, 20, 14, 22, 18, 15, 19, 13, 17, 21, 16, 14, 20, 25, 18, 22, 16, 42, 48, 44, 50, 46, 52, 72, 85, 78, 92, 88, 96, 82, 74, 70, 13, 17, 15, 20, 18];

interface GraphState {
  data: number[];
  isSpiking: boolean;
  lastTrigger: string;
}

type GraphAction =
  | { type: "spike"; trigger: string }
  | { type: "normalize" };

function graphReducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case "spike":
      if (action.trigger === state.lastTrigger) return state;
      return { data: SPIKE_DATA, isSpiking: true, lastTrigger: action.trigger };
    case "normalize":
      return { ...state, data: NORMAL_DATA, isSpiking: false };
    default:
      return state;
  }
}

export default function AnomalyGraph({ trigger }: { trigger: string }) {
  const [state, dispatch] = useReducer(graphReducer, {
    data: NORMAL_DATA,
    isSpiking: false,
    lastTrigger: trigger,
  });

  // Dispatch spike when trigger changes
  useEffect(() => {
    dispatch({ type: "spike", trigger });
  }, [trigger]);

  // Auto-normalize after spike
  useEffect(() => {
    if (!state.isSpiking) return;
    const timer = setTimeout(() => dispatch({ type: "normalize" }), 4000);
    return () => clearTimeout(timer);
  }, [state.isSpiking]);

  return (
    <div className="w-full h-16 rounded-lg bg-black/40 border p-2 flex items-end gap-[2px] overflow-hidden relative"
      style={{ borderColor: state.isSpiking ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.05)" }}
    >
      <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-80">
        <Activity className="w-3 h-3" style={{ color: state.isSpiking ? "#f87171" : "#00f0ff" }} />
        <span className="text-[10px] font-mono tracking-wider" style={{ color: state.isSpiking ? "#f87171" : "#94a3b8" }}>
          {state.isSpiking ? "ANOMALY DETECTED" : "SYSTEM METRICS: NORMAL"}
        </span>
      </div>
      
      {state.data.map((height, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{ height: height + "%", backgroundColor: state.isSpiking && height > 60 ? "#ef4444" : state.isSpiking && height > 35 ? "#f59e0b" : "#3b82f6" }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="flex-1 rounded-t-sm opacity-80"
        />
      ))}
    </div>
  );
}
