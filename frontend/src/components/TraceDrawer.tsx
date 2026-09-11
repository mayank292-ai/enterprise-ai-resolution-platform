import { motion, AnimatePresence } from "motion/react";
import { X, Terminal } from "lucide-react";
import type { Investigation } from "@/types/investigation";
import { cn } from "@/lib/utils";

interface TraceDrawerProps {
  investigation: Investigation;
  open: boolean;
  onClose: () => void;
}

/**
 * The one place raw JSON is allowed to appear — a technical drawer, not
 * the primary product surface. Renders the real tool_execution_trace.
 */
export function TraceDrawer({ investigation, open, onClose }: TraceDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="fixed top-0 right-0 h-screen w-full max-w-xl bg-midnight text-ice z-50 flex flex-col shadow-lift"
          >
            <div className="flex items-center gap-2.5 px-5 h-14 border-b border-white/10 shrink-0">
              <Terminal className="w-4 h-4 text-electric" />
              <div>
                <div className="text-sm font-semibold">Technical Trace</div>
                <div className="text-2xs text-slate-300">
                  {investigation.tool_execution_trace.length} tool execution
                  {investigation.tool_execution_trace.length === 1 ? "" : "s"}
                </div>
              </div>
              <button
                onClick={onClose}
                className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close trace drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 font-mono text-2xs">
              {investigation.tool_execution_trace.length === 0 && (
                <p className="text-slate-300 font-sans text-sm">No tool executions recorded yet.</p>
              )}
              {investigation.tool_execution_trace.map((exec) => (
                <div key={exec.execution_id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between mb-1.5 font-sans">
                    <span className="text-electric-300 font-semibold text-xs">{exec.tool_name}</span>
                    <span className="text-slate-300">step {exec.step_number}</span>
                  </div>
                  <div className="font-sans text-xs text-ice/90 mb-2">{exec.purpose}</div>
                  {exec.agent_name && (
                    <div className="font-sans text-2xs text-slate-300 mb-2">agent: {exec.agent_name}</div>
                  )}
                  <pre className="whitespace-pre-wrap break-words text-slate-200">
                    {JSON.stringify({ arguments: exec.arguments, result: exec.result }, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function ToolCallChips({ tools }: { tools: { execution_id: string; tool_name: string }[] }) {
  if (tools.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tools.map((t) => (
        <span
          key={t.execution_id}
          className={cn(
            "inline-flex items-center gap-1 text-2xs font-mono px-2 py-0.5 rounded-md",
            "bg-midnight/5 text-slate border border-midnight/10"
          )}
        >
          {t.tool_name}
        </span>
      ))}
    </div>
  );
}
