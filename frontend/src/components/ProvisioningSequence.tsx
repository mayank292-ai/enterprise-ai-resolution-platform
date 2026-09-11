import { motion } from "motion/react";
import { AlertTriangle, Check, Loader2, RefreshCw } from "lucide-react";

import { OrbitMotif } from "@/components/ui/OrbitMotif";
import { Button } from "@/components/ui/Button";
import type { CapabilityGapStatus } from "@/types/investigation";

const STEPS = [
  "Defining capability",
  "Applying workspace policy",
  "Registering specialist",
  "Capability ready",
];

interface ProvisioningSequenceProps {
  agentName: string;
  capabilityStatus: CapabilityGapStatus;
  resuming?: boolean;
  error?: string | null;
  onRetry?: () => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
}

/**
 * A projection of backend state, not a workflow timer. The approval endpoint
 * returns only after provisioning is READY; resume progress comes from the
 * actual resume mutation.
 */
export function ProvisioningSequence({
  agentName,
  capabilityStatus,
  resuming = false,
  error = null,
  onRetry,
  onRefresh,
}: ProvisioningSequenceProps) {
  const ready = capabilityStatus === "ready";
  const provisioning = capabilityStatus === "approved" || capabilityStatus === "creating";
  const blocked = provisioning && !resuming;
  const title = ready
    ? error
      ? "Specialist ready"
      : `Provisioned ${agentName}`
    : blocked
      ? "Provisioning incomplete"
      : `Provisioning ${agentName}`;
  const description = ready
    ? error
      ? "The capability is ready, but the investigation could not resume."
      : resuming
        ? "The backend is continuing the investigation..."
        : "The backend reports that the capability is ready."
    : blocked
      ? `The backend still reports this capability as ${capabilityStatus}. Resume is unavailable until it reports ready.`
      : "The backend is registering the approved capability.";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-midnight/85 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 px-4 text-center">
        <motion.div
          animate={error || blocked ? undefined : { rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className={error || blocked ? "text-critical" : "text-electric"}
        >
          {error || blocked ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-critical/30 bg-critical/10">
              <AlertTriangle className="h-7 w-7" />
            </div>
          ) : (
            <OrbitMotif size={64} progress={1} active />
          )}
        </motion.div>

        <div>
          <h2 className="mb-1 text-lg font-semibold text-white">
            {title}
          </h2>
          <p className="max-w-sm text-sm leading-6 text-slate-300">{description}</p>
        </div>

        {!error && !blocked && (
          <ul className="w-64 space-y-2 text-left">
            {STEPS.map((step) => (
              <li key={step} className="flex items-center gap-2.5 text-sm text-white">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  {step === "Capability ready" && resuming ? (
                    <Loader2 className="h-4 w-4 animate-spin text-electric" />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-verified text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        )}

        {(error || blocked || (ready && !resuming && onRetry)) && (
          <div className="w-72 rounded-xl border border-critical/20 bg-white/5 p-4 text-left">
            {error && <p className="text-xs leading-5 text-slate-200">{error}</p>}
            {blocked && !error && (
              <p className="text-xs leading-5 text-slate-200">
                The approval did not reach the backend READY state. No resume request will be sent.
              </p>
            )}
            <Button
              className={error || blocked ? "mt-4 w-full" : "w-full"}
              loading={resuming}
              disabled={ready ? !onRetry : !onRefresh}
              onClick={() => void (ready ? onRetry?.() : onRefresh?.())}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {ready ? (error ? "Retry resume" : "Continue investigation") : "Refresh backend state"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
