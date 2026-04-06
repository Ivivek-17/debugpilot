"use client";

import { useMemo, useRef } from "react";
import ReactFlow, {
  Node, Edge, Background, BackgroundVariant,
  Handle, Position, NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";

export type AgentNodeState = "idle" | "active" | "done" | "error";

export interface AgentNodeStatus {
  triage:   AgentNodeState;
  worker:   AgentNodeState;  // the worker that got selected
  workerLabel: string;       // "DB_Agent" | "Infra_Agent" | "Network_Agent"
  critic:   AgentNodeState;
  report:   AgentNodeState;
  criticRejecting: boolean;  // true during retry — shows reverse red dashed edge
}

/* ── Custom Node ─────────────────────────────────────────────── */
const STATE_STYLES: Record<AgentNodeState, { border: string; bg: string; glow: string; dot: string }> = {
  idle:   { border: "rgba(255,255,255,0.1)",  bg: "rgba(30,41,59,0.7)",  glow: "none",                              dot: "#475569" },
  active: { border: "rgba(0,212,255,0.6)",    bg: "rgba(0,212,255,0.08)", glow: "0 0 20px rgba(0,212,255,0.35)",    dot: "#00D4FF" },
  done:   { border: "rgba(16,185,129,0.5)",   bg: "rgba(16,185,129,0.08)", glow: "0 0 16px rgba(16,185,129,0.25)", dot: "#10B981" },
  error:  { border: "rgba(239,68,68,0.5)",    bg: "rgba(239,68,68,0.08)",  glow: "0 0 16px rgba(239,68,68,0.25)",  dot: "#EF4444" },
};

function AgentNode({ data }: NodeProps) {
  const { label, state, icon } = data as { label: string; state: AgentNodeState; icon: string };
  const s = STATE_STYLES[state];
  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      boxShadow: s.glow,
      borderRadius: 12,
      padding: "10px 16px",
      minWidth: 120,
      textAlign: "center",
      transition: "all 0.3s ease",
    }}>
      <Handle type="target" position={Position.Left}  style={{ background: s.dot, border: "none", width: 6, height: 6 }} />
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#CBD5E1", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 6, width: 8, height: 8, borderRadius: "50%", background: s.dot, margin: "6px auto 0", boxShadow: state === "active" ? `0 0 8px ${s.dot}` : "none" }} />
      {state === "active" && (
        <div style={{ position: "absolute", inset: -3, borderRadius: 14, border: `1px solid ${s.border}`, animation: "pulse-ring 1.5s ease-out infinite", pointerEvents: "none" }} />
      )}
      <Handle type="source" position={Position.Right} style={{ background: s.dot, border: "none", width: 6, height: 6 }} />
    </div>
  );
}

/* ── Default Node Layout ─────────────────────────────────────── */
const BASE_NODES: Node[] = [
  { id: "triage",  type: "agentNode", position: { x: 0, y: 80 },   data: { label: "Triage",    icon: "🔍", state: "idle" } },
  { id: "db",      type: "agentNode", position: { x: 220, y: 0 },  data: { label: "DB_Agent",  icon: "🗄️", state: "idle" } },
  { id: "infra",   type: "agentNode", position: { x: 220, y: 80 }, data: { label: "Infra_Agent", icon: "🔧", state: "idle" } },
  { id: "network", type: "agentNode", position: { x: 220, y: 160 },data: { label: "Net_Agent", icon: "🌐", state: "idle" } },
  { id: "critic",  type: "agentNode", position: { x: 440, y: 80 }, data: { label: "Critic",    icon: "🛡️", state: "idle" } },
  { id: "report",  type: "agentNode", position: { x: 660, y: 80 }, data: { label: "Report",    icon: "📄", state: "idle" } },
];

const BASE_EDGES: Edge[] = [
  { id: "t-db",  source: "triage", target: "db",      animated: false, style: { stroke: "#334155", strokeWidth: 1.5 } },
  { id: "t-inf", source: "triage", target: "infra",   animated: false, style: { stroke: "#334155", strokeWidth: 1.5 } },
  { id: "t-net", source: "triage", target: "network", animated: false, style: { stroke: "#334155", strokeWidth: 1.5 } },
  { id: "db-c",  source: "db",     target: "critic",  animated: false, style: { stroke: "#334155", strokeWidth: 1.5 } },
  { id: "inf-c", source: "infra",  target: "critic",  animated: false, style: { stroke: "#334155", strokeWidth: 1.5 } },
  { id: "net-c", source: "network",target: "critic",  animated: false, style: { stroke: "#334155", strokeWidth: 1.5 } },
  { id: "c-r",   source: "critic", target: "report",  animated: false, style: { stroke: "#334155", strokeWidth: 1.5 } },
];

/* ── Helpers ─────────────────────────────────────────────────── */
function workerEdgeId(workerLabel: string) {
  if (workerLabel === "DB_Agent") return "db-c";
  if (workerLabel === "NETWORK_Agent") return "net-c";
  return "inf-c"; // Infra + unknown
}

function workerNodeId(workerLabel: string) {
  if (workerLabel === "DB_Agent") return "db";
  if (workerLabel === "NETWORK_Agent") return "network";
  return "infra";
}

/* ── AgentGraph Component ────────────────────────────────────── */
interface AgentGraphProps {
  status: AgentNodeStatus;
}

export default function AgentGraph({ status }: AgentGraphProps) {
  const nodeTypes = useRef({ agentNode: AgentNode }).current;

  const nodes = useMemo(() => BASE_NODES.map(n => {
    let state: AgentNodeState = "idle";
    if (n.id === "triage")                        state = status.triage;
    else if (n.id === workerNodeId(status.workerLabel)) state = status.worker;
    else if (n.id === "critic")                   state = status.critic;
    else if (n.id === "report")                   state = status.report;
    return { ...n, data: { ...n.data, state } };
  }), [status]);

  const edges = useMemo(() => BASE_EDGES.map(e => {
    const activeWorkerEdge = workerEdgeId(status.workerLabel);

    // Triage → active worker: glowing teal
    if (e.id === `t-${workerNodeId(status.workerLabel).slice(0,3)}` && status.triage === "done") {
      return { ...e, animated: true, style: { stroke: "#00D4FF", strokeWidth: 2 } };
    }
    // Worker → Critic: active or retrying
    if (e.id === activeWorkerEdge && status.critic !== "idle") {
      if (status.criticRejecting) {
        // Reverse red dashed edge during Critic reject → Worker retry
        return { ...e, animated: true, style: { stroke: "#EF4444", strokeWidth: 2, strokeDasharray: "6 3" }, markerEnd: undefined };
      }
      return { ...e, animated: true, style: { stroke: "#F59E0B", strokeWidth: 2 } };
    }
    // Critic → Report: glowing green when report is running
    if (e.id === "c-r" && status.report !== "idle") {
      return { ...e, animated: true, style: { stroke: "#10B981", strokeWidth: 2 } };
    }
    return e;
  }), [status]);

  return (
    <div style={{ height: 240, width: "100%", borderRadius: 16, overflow: "hidden", background: "rgba(0,0,0,0.3)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#1E293B" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
