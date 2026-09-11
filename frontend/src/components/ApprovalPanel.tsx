import { motion } from "motion/react";
import { ShieldAlert, Wrench, ArrowRight, Code2 } from "lucide-react";
import { useState } from "react";
import type { CapabilityGap } from "@/types/investigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ApprovalPanelProps {
  gap: CapabilityGap;
  onApprove: () => void;
  approving: boolean;
  approveError?: string | null;
}

/**
 * There is no reject endpoint on the real backend
 * (POST /investigations/{id}/capability-gap/approve is the only mutation),
 * so "Reject" is presented honestly as unavailable in this build rather
 * than wired to a fabricated call.
 */
export function ApprovalPanel({ gap, onApprove, approving, approveError }: ApprovalPanelProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-midnight/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, type: "spring", bounce: 0.15 }}
        className="w-full max-w-xl"
      >
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-approval/10 to-transparent px-6 pt-6 pb-4 border-b border-slate-200/40">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-approval/15 text-approval">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xs font-semibold text-approval uppercase tracking-wider">
                  Capability approval required
                </div>
                <h2 className="text-lg font-bold text-ink leading-tight">{gap.title}</h2>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div>
              <div className="text-2xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Unresolved question
              </div>
              <p className="text-sm text-ink">{gap.resume_objective}</p>
            </div>

            <div>
              <div className="text-2xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Why existing capabilities are insufficient
              </div>
              <p className="text-sm text-slate">{gap.reason}</p>
            </div>

            <div className="rounded-lg border border-slate-200/60 bg-ice-100/40 p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-ink">Proposed specialist</span>
                <ArrowRight className="w-3 h-3 text-slate-300" />
                <span className="text-xs font-mono text-enterprise">{gap.proposed_agent_name}</span>
              </div>
              <p className="text-xs text-slate mb-3">{gap.proposed_agent_description}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Wrench className="w-3.5 h-3.5 text-slate-300" />
                {gap.required_tools.map((tool) => (
                  <span
                    key={tool}
                    className="text-2xs font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200/60 text-slate"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowTechnical((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-enterprise hover:text-enterprise-700"
            >
              <Code2 className="w-3.5 h-3.5" />
              {showTechnical ? "Hide" : "View"} technical proposal
            </button>
            {showTechnical && (
              <pre className="text-2xs font-mono bg-midnight text-ice/90 rounded-lg p-3 overflow-x-auto scrollbar-thin">
                {JSON.stringify(gap, null, 2)}
              </pre>
            )}

            {approveError && <p className="text-xs text-critical">{approveError}</p>}
          </div>

          <div className="px-6 pb-6 flex items-center gap-2">
            <Button variant="primary" size="lg" className="flex-1" loading={approving} onClick={onApprove}>
              Approve &amp; Continue
            </Button>
            <Button
              variant="outline"
              size="lg"
              disabled
              title="This backend does not currently expose a reject endpoint"
            >
              Reject
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
