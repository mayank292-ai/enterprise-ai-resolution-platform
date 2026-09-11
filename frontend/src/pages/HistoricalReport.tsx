import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Play,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { getInvestigation } from "@/api/investigations";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  getHistoricalInvestigation,
  type HistoricalInvestigation,
} from "@/data/history";
import { investigationKeys } from "@/hooks/useInvestigations";
import { cn, formatCurrency, formatDuration, titleCase } from "@/lib/utils";
import type { Investigation } from "@/types/investigation";

type ReportStage = {
  title: string;
  actor: string;
  summary: string;
  evidence: string;
};

type ReportView = {
  id: string;
  title: string;
  summary: string;
  rootCauseTitle: string;
  rootCauseExplanation: string;
  impact: string;
  impactDetail: string;
  confidence: string;
  duration: string;
  completed: string;
  priority: string;
  businessArea: string;
  owner: string;
  systems: string[];
  stages: ReportStage[];
  recommendations: string[];
  evidenceCount: number;
  verification: string | null;
  source: "backend" | "curated";
  recordLabel: string;
  timestampLabel: string;
};

function fromCurated(item: HistoricalInvestigation): ReportView {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    rootCauseTitle: item.rootCauseTitle,
    rootCauseExplanation: item.rootCause,
    impact: item.impact,
    impactDetail: "Impact captured in the archived investigation record.",
    confidence: `${item.confidence}%`,
    duration: item.duration,
    completed: item.completed,
    priority: item.priority,
    businessArea: item.businessArea,
    owner: item.owner,
    systems: item.systems,
    stages: item.stages,
    recommendations: item.recommendations,
    evidenceCount: item.stages.length,
    verification: item.stages.at(-1)?.summary ?? null,
    source: "curated",
    recordLabel: item.recordType,
    timestampLabel: item.completed,
  };
}

function fromBackend(investigation: Investigation): ReportView {
  const evidenceById = new Map(
    investigation.evidence.map((evidence) => [evidence.evidence_id, evidence]),
  );
  const toolsByDecision = new Map<string, string[]>();

  for (const tool of investigation.tool_execution_trace) {
    if (!tool.decision_id) continue;
    const existing = toolsByDecision.get(tool.decision_id) ?? [];
    existing.push(`${tool.tool_name}: ${tool.purpose}`);
    toolsByDecision.set(tool.decision_id, existing);
  }

  const stages = investigation.agent_decisions.map((decision, index): ReportStage => {
    const outcome = investigation.specialist_outcomes.find(
      (item) => item.decision_id === decision.decision_id,
    );
    const evidence = decision.evidence_ids
      .map((evidenceId) => evidenceById.get(evidenceId))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    const evidenceText =
      evidence.map((item) => `${item.title}: ${item.summary}`).join(" ") ||
      (toolsByDecision.get(decision.decision_id) ?? []).join(" ") ||
      "This stage completed without a separate evidence item in the backend record.";

    return {
      title: decision.objective || `Investigation stage ${index + 1}`,
      actor: titleCase(decision.agent_name || "supervisor"),
      summary: outcome?.summary || decision.reason,
      evidence: evidenceText,
    };
  });

  const verificationDecision = [...investigation.agent_decisions]
    .reverse()
    .find((decision) => decision.agent_name === "verification_agent");
  const verificationOutcome = verificationDecision
    ? investigation.specialist_outcomes.find(
        (outcome) => outcome.decision_id === verificationDecision.decision_id,
      )
    : null;
  const impact = investigation.business_impact;
  const confidence = investigation.root_cause?.confidence
    ? titleCase(investigation.root_cause.confidence)
    : "Not recorded";

  return {
    id: investigation.investigation_id,
    title: investigation.incident_title,
    summary:
      investigation.executive_summary?.[0] ||
      investigation.classification?.summary ||
      investigation.incident_description,
    rootCauseTitle: investigation.root_cause?.title || "No root cause recorded",
    rootCauseExplanation:
      investigation.root_cause?.explanation ||
      "The backend did not record a root-cause explanation for this investigation.",
    impact: impact
      ? `${impact.affected_records.toLocaleString()} records · ${formatCurrency(
          impact.affected_value,
          impact.currency,
        )}`
      : "Impact not quantified",
    impactDetail: impact?.earliest_occurrence
      ? `Earliest recorded occurrence: ${new Date(impact.earliest_occurrence).toLocaleString()}`
      : "No earliest occurrence was recorded.",
    confidence,
    duration: formatDuration(investigation.created_at, investigation.completed_at),
    completed: investigation.completed_at
      ? new Date(investigation.completed_at).toLocaleString()
      : "Completion time not recorded",
    priority: investigation.classification?.priority || "—",
    businessArea:
      investigation.classification?.business_process || "Enterprise operations",
    owner: "Backend investigation record",
    systems: impact?.affected_systems ?? [],
    stages,
    recommendations: investigation.recommendations.map((recommendation) =>
      recommendation.description
        ? `${recommendation.title} — ${recommendation.description}`
        : recommendation.title,
    ),
    evidenceCount: investigation.evidence.length,
    verification: verificationOutcome?.summary || verificationDecision?.reason || null,
    source: "backend",
    recordLabel: "Completed live run",
    timestampLabel: investigation.completed_at
      ? new Date(investigation.completed_at).toLocaleString()
      : "Completion time not recorded",
  };
}

export function HistoricalReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const curated = getHistoricalInvestigation(id);
  const investigationQuery = useQuery({
    queryKey: investigationKeys.detail(id ?? ""),
    queryFn: () => getInvestigation(id as string),
    enabled: Boolean(id) && !curated,
    retry: false,
  });

  const item = useMemo<ReportView | null>(() => {
    if (curated) return fromCurated(curated);
    if (investigationQuery.data) return fromBackend(investigationQuery.data);
    return null;
  }, [curated, investigationQuery.data]);

  if (investigationQuery.isLoading && !curated) {
    return <div className="p-10 text-sm text-slate">Loading archived report…</div>;
  }

  if (!item) {
    return (
      <div className="p-10 text-sm text-slate">
        This archived investigation could not be loaded.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            onClick={() => navigate("/investigations")}
            className="mb-5 flex items-center gap-2 text-xs text-slate transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Investigation history
          </button>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                item.priority === "P1"
                  ? "bg-critical/10 text-critical"
                  : item.priority === "P2"
                    ? "bg-approval/10 text-approval"
                    : "bg-enterprise/8 text-enterprise",
              )}
            >
              {item.priority}
            </span>
            <Badge tone={item.recordLabel === "Prepared scenario" ? "blue" : "green"} dot>
              {item.recordLabel}
            </Badge>
            <span className="text-xs text-slate-300">{item.timestampLabel}</span>
          </div>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-ink">
            {item.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">{item.summary}</p>
          <p className="mt-3 text-xs font-medium text-enterprise">
            {item.businessArea} · {item.owner}
          </p>
        </div>
        <button
          onClick={() => navigate(`/replay/${item.id}`)}
          className="flex items-center justify-center gap-2 rounded-xl bg-midnight px-5 py-3 text-xs font-semibold text-white shadow-card transition hover:-translate-y-0.5"
        >
          <Play className="h-4 w-4" /> Replay investigation
        </button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_.75fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="relative overflow-hidden bg-gradient-to-br from-midnight to-midnight-600 p-6 text-white">
              <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-electric/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-semibold text-verified">
                  <ShieldCheck className="h-4 w-4" /> Root-cause conclusion
                </div>
                <h2 className="mt-4 text-xl font-bold leading-8">{item.rootCauseTitle}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62">
                  {item.rootCauseExplanation}
                </p>
                <div className="mt-6 flex items-end justify-between gap-5 border-t border-white/10 pt-5">
                  <span className="max-w-md text-xs leading-5 text-white/45">
                    {item.verification || "No separate verification summary was recorded."}
                  </span>
                  <span className="shrink-0 text-xl font-bold text-verified">
                    {item.confidence}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-verified" />
                <h2 className="text-sm font-semibold text-ink">Recorded journey</h2>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[.14em] text-slate-300">
                {item.stages.length} {item.source === "backend" ? "backend" : "recorded"} stage{item.stages.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-0">
              {item.stages.map((stage, index) => (
                <div
                  key={`${stage.title}-${index}`}
                  className="relative flex gap-4 pb-5 last:pb-0"
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold",
                        index === item.stages.length - 1
                          ? "bg-verified text-white"
                          : "bg-enterprise/10 text-enterprise",
                      )}
                    >
                      {index === item.stages.length - 1 ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    {index < item.stages.length - 1 && (
                      <span className="mt-1 h-full w-px bg-slate-200/70" />
                    )}
                  </div>
                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{stage.title}</p>
                      <Badge
                        tone={
                          stage.actor === "Governance"
                            ? "amber"
                            : stage.actor.includes("Verification")
                              ? "green"
                              : "blue"
                        }
                      >
                        {stage.actor}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate">{stage.summary}</p>
                    <p className="mt-2 text-[10px] font-medium leading-4 text-enterprise">
                      {stage.evidence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {item.recommendations.length > 0 && (
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-ink">
                Prioritized recommendations
              </h2>
              <p className="mt-1 text-xs text-slate">
                Actions recorded in this investigation’s completed report.
              </p>
              <div className="mt-4 space-y-3">
                {item.recommendations.map((recommendation, index) => (
                  <div
                    key={`${recommendation}-${index}`}
                    className="flex gap-3 rounded-xl border border-slate-200/50 bg-ice/60 p-4"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-enterprise text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-medium leading-5 text-ink">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-approval" />
              <h3 className="text-sm font-semibold text-ink">Business impact</h3>
            </div>
            <p className="mt-4 text-xl font-bold leading-8 text-ink">{item.impact}</p>
            <p className="mt-2 text-xs leading-5 text-slate">{item.impactDetail}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-enterprise" />
              <h3 className="text-sm font-semibold text-ink">Resolution profile</h3>
            </div>
            <dl className="mt-4 space-y-3 text-xs">
              <ReportRow label="Investigation duration" value={item.duration} />
              <ReportRow label="Evidence items" value={String(item.evidenceCount)} />
              <ReportRow label="Record source" value={item.source === "backend" ? "Live API" : "Curated archive"} />
              <ReportRow label="Record status" value="Audit ready" />
            </dl>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-enterprise" />
              <h3 className="text-sm font-semibold text-ink">Systems examined</h3>
            </div>
            {item.systems.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.systems.map((system) => (
                  <span
                    key={system}
                    className="rounded-lg bg-ice px-2.5 py-1.5 text-[10px] font-medium text-slate"
                  >
                    {system}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate">
                No affected systems were recorded.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
