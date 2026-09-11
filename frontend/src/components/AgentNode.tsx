import { motion } from "motion/react";
import { ChevronDown, FileSearch, Wrench } from "lucide-react";
import { useState } from "react";
import type { AgentNodeView } from "@/lib/investigationView";
import { AgentStatusBadge } from "@/components/ui/Badge";
import { formatDuration, titleCase } from "@/lib/utils";
import { ToolCallChips } from "@/components/TraceDrawer";
import { cn } from "@/lib/utils";

export function AgentNode({ node, index }: { node: AgentNodeView; index: number }) {
  const { decision, evidence, tools } = node;
  const isActive = decision.status === "running";
  const isCompleted = decision.status === "completed";
  const [expanded, setExpanded] = useState(isActive);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, type: "spring", bounce: 0.2, delay: index * 0.03 }}
      className={cn(
        "relative rounded-xl2 border bg-white transition-all duration-200",
        isActive ? "border-electric/40 shadow-glow" : "border-slate-200/60 shadow-subtle"
      )}
    >
      {index > 0 && (
        <span
          className="absolute -top-3 left-6 w-px h-3 bg-slate-200"
          aria-hidden="true"
        />
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
            isActive ? "bg-electric/15 text-enterprise" : "bg-ice-100 text-slate"
          )}
        >
          <FileSearch className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink truncate">
              {titleCase(decision.agent_name)}
            </span>
            <AgentStatusBadge status={decision.status} />
          </div>
          <p className="text-xs text-slate truncate">{decision.objective}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-2xs text-slate-300 font-medium">
          {decision.started_at && (
            <span>{formatDuration(decision.started_at, decision.completed_at)}</span>
          )}
          <span>{evidence.length} evidence</span>
          <span>{tools.length} tools</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-200/50 mt-1">
          <p className="text-xs text-slate pt-3">
            <span className="font-semibold text-ink">Why this agent: </span>
            {decision.reason}
          </p>

          {tools.length > 0 && (
            <div>
              <div className="text-2xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Tool calls
              </div>
              <ToolCallChips tools={tools} />
            </div>
          )}

          {evidence.length > 0 && (
            <div>
              <div className="text-2xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Evidence gathered
              </div>
              <ul className="space-y-1.5">
                {evidence.map((e) => (
                  <li key={e.evidence_id} className="text-xs text-ink">
                    <span className="font-medium">{e.title}</span>
                    <span className="text-slate"> — {e.summary}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {node.outcome && (
            <div className="rounded-lg bg-ice-100/60 px-3 py-2 text-xs text-ink">
              {node.outcome.summary}
            </div>
          )}

          {!isCompleted && !isActive && decision.status === "failed" && (
            <p className="text-xs text-critical">This assignment failed and was not used in the conclusion.</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
