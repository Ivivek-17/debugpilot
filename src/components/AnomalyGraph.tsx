"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function AnomalyGraph({ trigger }: { trigger: any }) {
  const [data, setData] = useState<number[]>(Array.from({ length: 40 }, () => Math.random() * 20 + 10));
  const [isSpiking, setIsSpiking] = useState(false);

  useEffect(() => {
    // Whenever trigger changes (e.g. logs), cause a spike
    setIsSpiking(true);
    
    // Create spike data
    const spikeData = Array.from({ length: 40 }, (_, i) => {
      // Create a massive peak in the middle-right
      if (i > 25 && i < 35) {
        return Math.random() * 30 + 70; // 70-100%
      }
      // Ramp up
      if (i >= 20 && i <= 25) {
        return Math.random() * 20 + 40; // 40-60%
      }
      return Math.random() * 20 + 10; // normal noise
    });
    
    setData(spikeData);

    // After 4 seconds, slowly return to normal
    const timer = setTimeout(() => {
      setIsSpiking(false);
      setData(Array.from({ length: 40 }, () => Math.random() * 20 + 10));
    }, 4000);

    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div className="w-full h-16 rounded-lg bg-black/40 border p-2 flex items-end gap-[2px] overflow-hidden relative"
      style={{ borderColor: isSpiking ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.05)" }}
    >
      <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-80">
        <Activity className="w-3 h-3" style={{ color: isSpiking ? "#f87171" : "#00f0ff" }} />
        <span className="text-[10px] font-mono tracking-wider" style={{ color: isSpiking ? "#f87171" : "#94a3b8" }}>
          {isSpiking ? "ANOMALY DETECTED" : "SYSTEM METRICS: NORMAL"}
        </span>
      </div>
      
      {data.map((height, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{ height: height + "%", backgroundColor: isSpiking && height > 60 ? "#ef4444" : isSpiking && height > 35 ? "#f59e0b" : "#3b82f6" }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="flex-1 rounded-t-sm opacity-80"
        />
      ))}
    </div>
  );
}
