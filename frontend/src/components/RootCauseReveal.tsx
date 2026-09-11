import { motion } from "motion/react";
import { CheckCircle2, ArrowDown, ShieldCheck } from "lucide-react";
import type { Investigation } from "@/types/investigation";
import { rootCauseEvidenceChain } from "@/lib/investigationView";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function RootCauseReveal({ investigation }: { investigation: Investigation }) {
  const rootCause = investigation.root_cause;
  if (!rootCause) return null;

  const chain = rootCauseEvidenceChain(investigation);
  const verified = investigation.status === "completed";

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200/40 flex items-center justify-between">
        <div>
          <div className="text-2xs font-semibold text-slate-300 uppercase tracking-wider mb-0.5">
            {verified ? "Verified root cause" : "Proposed root cause"}
          </div>
          <h3 className="text-base font-bold text-ink">{rootCause.title}</h3>
        </div>
        {verified ? (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.32, type: "spring" }}
            className="flex items-center gap-1.5 rounded-full bg-verified/10 text-verified-600 border border-verified/20 px-3 py-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-2xs font-semibold">Verified</span>
          </motion.div>
        ) : (
          <Badge tone="amber">Pending verification</Badge>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        <p className="text-sm text-ink leading-relaxed">{rootCause.explanation}</p>

        {chain.length > 0 && (
          <div>
            <div className="text-2xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Evidence chain
            </div>
            <div className="space-y-0">
              {chain.map((item, i) => (
                <div key={item.evidence_id}>
                  <div className="flex gap-3 items-start">
                    <div className="flex flex-col items-center pt-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-enterprise" />
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      <p className="text-xs text-slate">{item.summary}</p>
                    </div>
                  </div>
                  {i < chain.length - 1 && (
                    <div className="flex pl-[3px]">
                      <ArrowDown className="w-3 h-3 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function VerificationStage({ investigation }: { investigation: Investigation }) {
  const verificationOutcome = investigation.specialist_outcomes.find(
    (o) => o.agent_name === "verification_agent"
  );

  if (investigation.status !== "verifying" && !verificationOutcome) return null;

  return (
    <Card className="px-5 py-4">
      <div className="flex items-center gap-2.5 mb-2">
        <CheckCircle2 className="w-4 h-4 text-enterprise" />
        <h3 className="text-sm font-semibold text-ink">Verification</h3>
        {investigation.status === "verifying" && (
          <span className="ml-auto inline-block w-3.5 h-3.5 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      <p className="text-sm text-slate">
        {verificationOutcome
          ? verificationOutcome.summary
          : "The verification agent is challenging the proposed conclusion and checking for contradicting evidence."}
      </p>
    </Card>
  );
}
