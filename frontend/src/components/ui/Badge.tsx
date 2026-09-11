import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { InvestigationStatus, AgentExecutionStatus, CapabilityGapStatus } from "@/types/investigation";

type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "slate" | "electric";

const tones: Record<Tone, string> = {
  neutral: "bg-ice-100 text-slate border-ice-200",
  blue: "bg-enterprise/8 text-enterprise border-enterprise/15",
  green: "bg-verified/10 text-verified-600 border-verified/20",
  amber: "bg-approval/10 text-approval border-approval/20",
  red: "bg-critical/8 text-critical border-critical/15",
  slate: "bg-slate/8 text-slate border-slate/15",
  electric: "bg-electric/10 text-enterprise border-electric/25",
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ tone = "neutral", children, className, dot, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-2xs font-medium px-2 py-0.5 rounded-full border",
        tones[tone],
        className
      )}
    >
      {dot && (
        <span
          className={cn("inline-block w-1.5 h-1.5 rounded-full bg-current", pulse && "animate-pulse")}
        />
      )}
      {children}
    </span>
  );
}

// Real backend statuses only: created | planning | investigating | verifying |
// awaiting_capability_approval | completed | failed
const statusToneMap: Record<InvestigationStatus, Tone> = {
  created: "slate",
  planning: "blue",
  investigating: "electric",
  verifying: "blue",
  awaiting_capability_approval: "amber",
  completed: "green",
  failed: "red",
};

const statusLabelMap: Record<InvestigationStatus, string> = {
  created: "Created",
  planning: "Planning",
  investigating: "Investigating",
  verifying: "Verifying",
  awaiting_capability_approval: "Awaiting Approval",
  completed: "Completed",
  failed: "Failed",
};

const ACTIVE_STATUSES: InvestigationStatus[] = ["created", "planning", "investigating", "verifying"];

export function StatusBadge({ status, pulse }: { status: InvestigationStatus; pulse?: boolean }) {
  const isActive = ACTIVE_STATUSES.includes(status);
  return (
    <Badge tone={statusToneMap[status]} dot pulse={pulse && isActive}>
      {statusLabelMap[status]}
    </Badge>
  );
}

const agentStatusTone: Record<AgentExecutionStatus, Tone> = {
  pending: "slate",
  running: "electric",
  completed: "green",
  failed: "red",
};

const agentStatusLabel: Record<AgentExecutionStatus, string> = {
  pending: "Pending",
  running: "Active",
  completed: "Completed",
  failed: "Failed",
};

export function AgentStatusBadge({ status }: { status: AgentExecutionStatus }) {
  return (
    <Badge tone={agentStatusTone[status]} dot pulse={status === "running"}>
      {agentStatusLabel[status]}
    </Badge>
  );
}

const capStatusTone: Record<CapabilityGapStatus, Tone> = {
  proposed: "amber",
  approved: "blue",
  rejected: "red",
  creating: "blue",
  ready: "green",
};

const capStatusLabel: Record<CapabilityGapStatus, string> = {
  proposed: "Proposed",
  approved: "Approved",
  rejected: "Rejected",
  creating: "Provisioning",
  ready: "Provisioned",
};

export function CapabilityStatusBadge({ status }: { status: CapabilityGapStatus }) {
  return (
    <Badge tone={capStatusTone[status]} dot>
      {capStatusLabel[status]}
    </Badge>
  );
}
