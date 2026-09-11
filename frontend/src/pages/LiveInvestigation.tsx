import { useState } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  CheckCircle2,
  Clock,
  FileSearch,
  ShieldCheck,
  Terminal,
  Wrench,
} from "lucide-react";

import { useInvestigationSession } from "@/hooks/useInvestigations";
import { buildAgentNodes } from "@/lib/investigationView";
import { ApprovalPanel } from "@/components/ApprovalPanel";
import { ProvisioningSequence } from "@/components/ProvisioningSequence";
import { CompletedSummary } from "@/components/CompletedSummary";
import { TraceDrawer } from "@/components/TraceDrawer";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { cn, formatDuration, titleCase } from "@/lib/utils";
import type { AgentNodeView } from "@/lib/investigationView";
import type { Investigation } from "@/types/investigation";

export function LiveInvestigation() {
  const { id } = useParams<{ id: string }>();
  const { query, approve, resume, run } = useInvestigationSession(id);
  const [traceOpen, setTraceOpen] = useState(false);

  const investigation = query.data;
  const gap = investigation?.pending_capability_gap ?? null;

  if (query.isLoading) {
    return <LoadingState label="Loading investigation" className="py-24" />;
  }

  if (query.isError || !investigation) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <ErrorState
          type="recoverable"
          message={(query.error as Error)?.message ?? "Could not load this investigation."}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  if (investigation.status === "completed" || investigation.status === "failed") {
    return <CompletedSummary investigation={investigation} />;
  }

  const nodes = buildAgentNodes(investigation);
  const currentNode =
    [...nodes].reverse().find((node) => node.decision.status === "running") ??
    nodes.at(-1) ??
    null;
  const awaitingCapability =
    investigation.status === "awaiting_capability_approval" && gap !== null;
  const showApproval = awaitingCapability && gap.status === "proposed";
  const showProvisioning = awaitingCapability && gap.status !== "proposed";

  const handleApprove = async () => {
    try {
      await approve.mutateAsync();
    } catch {
      // ApprovalPanel renders the backend error.
    }
  };

  const handleRetryResume = async () => {
    try {
      await resume.mutateAsync();
    } catch {
      // ProvisioningSequence renders the backend error.
    }
  };

  return (
    <div className="relative min-h-full bg-[#06172e] text-white xl:h-full xl:min-h-0 xl:overflow-hidden">
      <motion.div
        animate={{ filter: awaitingCapability ? "blur(3px)" : "blur(0px)" }}
        className={cn(
          "xl:flex xl:h-full xl:min-h-0 xl:flex-col",
          awaitingCapability && "pointer-events-none select-none",
        )}
      >
        <LiveHeader investigation={investigation} onTrace={() => setTraceOpen(true)} />

        <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col px-6 py-5 xl:min-h-0">
          <div className="mb-4 shrink-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.22em] text-electric">
              Live investigation
            </p>
            <h1 className="max-w-5xl text-2xl font-bold tracking-tight lg:text-3xl">
              {investigation.incident_title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">
              {investigation.classification?.summary ?? investigation.incident_description}
            </p>
          </div>

          <LifecycleProgress investigation={investigation} />

          {run.isError && (
            <div className="mb-5 rounded-xl border border-critical/30 bg-critical/10 px-4 py-3 text-xs text-red-100">
              The investigation command was interrupted: {(run.error as Error).message}. Backend
              state will continue to refresh automatically.
            </div>
          )}

          <div className="grid gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[340px_1fr_310px]">
            <Journey nodes={nodes} currentNode={currentNode} investigation={investigation} />
            <CurrentStage node={currentNode} investigation={investigation} />
            <LiveSignals investigation={investigation} currentNode={currentNode} />
          </div>
        </div>
      </motion.div>

      {showApproval && gap && (
        <ApprovalPanel
          gap={gap}
          onApprove={handleApprove}
          approving={approve.isPending}
          approveError={approve.error ? (approve.error as Error).message : null}
        />
      )}

      {showProvisioning && gap && (
        <ProvisioningSequence
          agentName={gap.proposed_agent_name}
          capabilityStatus={gap.status}
          resuming={resume.isPending || approve.isPending}
          error={
            resume.error
              ? (resume.error as Error).message
              : approve.error
                ? (approve.error as Error).message
                : null
          }
          onRetry={gap.status === "ready" ? handleRetryResume : undefined}
          onRefresh={async () => {
            await query.refetch();
          }}
        />
      )}

      <TraceDrawer
        investigation={investigation}
        open={traceOpen}
        onClose={() => setTraceOpen(false)}
      />
    </div>
  );
}

function LiveHeader({
  investigation,
  onTrace,
}: {
  investigation: Investigation;
  onTrace: () => void;
}) {
  return (
    <div className="border-b border-white/10 bg-[#071a33]/90 px-6 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={investigation.status} pulse />
          {investigation.classification && (
            <Badge tone="slate">{investigation.classification.priority}</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-white/45">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(investigation.created_at, investigation.completed_at)}
          </span>
          <button
            onClick={onTrace}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-white/65 transition hover:bg-white/10 hover:text-white"
          >
            <Terminal className="h-3.5 w-3.5" />
            Technical trace
          </button>
        </div>
      </div>
    </div>
  );
}

function LifecycleProgress({ investigation }: { investigation: Investigation }) {
  const steps = ["Planning", "Investigating", "Verification", "Complete"];
  const activeIndex =
    investigation.status === "created" || investigation.status === "planning"
      ? 0
      : investigation.status === "investigating" ||
          investigation.status === "awaiting_capability_approval"
        ? 1
        : investigation.status === "verifying"
          ? 2
          : 3;

  return (
    <div className="mb-6">
      <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase tracking-[.15em] text-white/35">
        {steps.map((step, index) => (
          <span key={step} className={index <= activeIndex ? "text-white/70" : undefined}>
            {step}
          </span>
        ))}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-enterprise to-electric"
          animate={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>
    </div>
  );
}

function Journey({
  nodes,
  currentNode,
  investigation,
}: {
  nodes: AgentNodeView[];
  currentNode: AgentNodeView | null;
  investigation: Investigation;
}) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-white/[.045] p-4 xl:min-h-0 xl:overflow-y-auto scrollbar-thin">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[.18em] text-white/40">
          Agent journey
        </span>
        <span className="text-xs text-white/45">{nodes.length} assigned</span>
      </div>

      {nodes.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[.035] p-4">
          <Activity className="h-5 w-5 animate-pulse text-electric" />
          <p className="mt-3 text-xs font-semibold">Supervisor is planning</p>
          <p className="mt-1 text-[11px] leading-5 text-white/40">
            Waiting for the first backend specialist assignment.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {nodes.map((node, index) => {
            const active = node.decision.decision_id === currentNode?.decision.decision_id;
            const complete = node.decision.status === "completed";
            return (
              <div
                key={node.decision.decision_id}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-3",
                  active ? "bg-electric/15 ring-1 ring-electric/35" : "bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                    complete
                      ? "border-verified bg-verified text-white"
                      : active
                        ? "border-electric bg-electric text-midnight"
                        : "border-white/15 text-white/35",
                  )}
                >
                  {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className={cn("block truncate text-xs font-semibold", active ? "text-white" : "text-white/62")}>
                    {node.decision.objective}
                  </span>
                  <span className="mt-1 block text-[10px] text-white/35">
                    {titleCase(node.decision.agent_name)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {investigation.status === "verifying" && (
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-verified/10 px-3 py-3 ring-1 ring-verified/25">
          <ShieldCheck className="h-5 w-5 text-verified" />
          <div>
            <p className="text-xs font-semibold">Independent verification</p>
            <p className="text-[10px] text-white/40">Challenging the conclusion</p>
          </div>
        </div>
      )}
    </aside>
  );
}

function CurrentStage({
  node,
  investigation,
}: {
  node: AgentNodeView | null;
  investigation: Investigation;
}) {
  const stageTitle =
    investigation.status === "verifying"
      ? "Verifying the proposed conclusion"
      : node?.decision.objective ?? "Preparing the investigation plan";
  const actor =
    investigation.status === "verifying"
      ? "Verification Agent"
      : node
        ? titleCase(node.decision.agent_name)
        : "Supervisor";
  const summary =
    node?.outcome?.summary ??
    node?.decision.reason ??
    "The backend supervisor is reviewing the incident and selecting the first governed specialist.";

  return (
    <main className="relative min-h-[480px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.08] to-white/[.025] p-7 shadow-2xl xl:min-h-0">
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-electric/10 blur-3xl" />
      <AnimatePresence mode="wait">
        <motion.div
          key={`${investigation.status}-${node?.decision.decision_id ?? "supervisor"}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="relative flex h-full flex-col"
        >
          <div className="flex items-center justify-between">
            <Badge tone={investigation.status === "verifying" ? "green" : "blue"} dot>
              {actor}
            </Badge>
            <span className="flex items-center gap-2 text-xs text-white/35">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-electric opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-electric" />
              </span>
              Backend active
            </span>
          </div>

          <div className="my-auto overflow-y-auto py-8 pr-1 scrollbar-thin">
            <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-electric">
              Current investigation stage
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
              {stageTitle}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/66">{summary}</p>

            <div className="mt-8 rounded-2xl border border-electric/20 bg-electric/8 p-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-electric">
                <FileSearch className="h-4 w-4" />
                Latest backend evidence
              </div>
              <p className="text-sm leading-6 text-white/72">
                {node?.evidence.at(-1)?.summary ??
                  investigation.evidence.at(-1)?.summary ??
                  "Evidence will appear here as soon as the active specialist records it."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-5 text-xs text-white/38">
            <span>Live backend state · no simulated percentages</span>
            <span>{formatDuration(investigation.updated_at)} since update</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

function LiveSignals({
  investigation,
  currentNode,
}: {
  investigation: Investigation;
  currentNode: AgentNodeView | null;
}) {
  return (
    <aside className="space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1 scrollbar-thin">
      <Card className="border-white/10 bg-white/[.06] p-5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">
          Live signals
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Signal value={investigation.evidence.length} label="Evidence" />
          <Signal value={investigation.findings.length} label="Findings" />
          <Signal value={investigation.hypotheses.length} label="Hypotheses" />
          <Signal value={investigation.tool_execution_trace.length} label="Tool calls" />
        </div>
      </Card>

      <Card className="border-white/10 bg-white/[.06] p-5 text-white">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-electric" />
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">
            Active tools
          </p>
        </div>
        {currentNode && currentNode.tools.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {currentNode.tools.map((tool) => (
              <span
                key={tool.execution_id}
                className="rounded-lg bg-white/7 px-2.5 py-1.5 font-mono text-[10px] text-white/60"
              >
                {tool.tool_name}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs leading-5 text-white/42">
            Tool executions will appear when the backend records them.
          </p>
        )}
      </Card>

      {investigation.hypotheses.length > 0 && (
        <Card className="border-white/10 bg-white/[.06] p-5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">
            Leading hypothesis
          </p>
          <p className="mt-3 text-sm font-semibold leading-6">
            {investigation.hypotheses.at(-1)?.statement}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-wider text-electric">
            {investigation.hypotheses.at(-1)?.status}
          </p>
        </Card>
      )}
    </aside>
  );
}

function Signal({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-white/[.045] px-3 py-3">
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-[10px] text-white/38">{label}</p>
    </div>
  );
}
