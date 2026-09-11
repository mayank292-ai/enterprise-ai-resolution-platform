import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ListChecks,
  Play,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Investigation } from "@/types/investigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  RootCauseReveal,
  VerificationStage,
} from "@/components/RootCauseReveal";
import { formatCurrency } from "@/lib/utils";
import { dedupeEvidence } from "@/lib/investigationView";

export function CompletedSummary({
  investigation,
}: {
  investigation: Investigation;
}) {
  // ✅ SAFE VARIABLES
  const impact = investigation.business_impact ?? null;
  const recommendations = investigation.recommendations ?? [];
  const summary = investigation.executive_summary ?? [];

  const navigate = useNavigate();
  const evidence = dedupeEvidence(investigation);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge tone="green" dot>
              Completed
            </Badge>
            {investigation.completed_at && (
              <span className="text-2xs text-slate-300">
                Resolved{" "}
                {new Date(
                  investigation.completed_at
                ).toLocaleString()}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            {investigation.incident_title}
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/investigations")}
            className="flex items-center gap-2 rounded-xl border border-slate-200/70 px-4 py-2.5 text-xs font-semibold text-ink hover:bg-ice"
          >
            <ArrowLeft className="h-4 w-4" /> History
          </button>

          {investigation.status === "completed" && (
            <button
              onClick={() =>
                navigate(`/replay/${investigation.investigation_id}`)
              }
              className="flex items-center gap-2 rounded-xl bg-midnight px-4 py-2.5 text-xs font-semibold text-white hover:bg-midnight-600"
            >
              <Play className="h-4 w-4" /> Replay investigation
            </button>
          )}
        </div>
      </div>

      {/* ✅ Executive Summary */}
      {summary.length > 0 && (
        <Card className="px-5 py-4">
          <h2 className="text-sm font-semibold text-ink mb-2">
            Executive summary
          </h2>
          <ul className="space-y-1.5">
            {summary.map((line, i) => (
              <li key={i} className="text-sm text-slate flex gap-2">
                <span className="text-enterprise mt-1.5 w-1 h-1 rounded-full bg-enterprise shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Root Cause */}
      <RootCauseReveal investigation={investigation} />

      {/* Independent verification */}
      <VerificationStage investigation={investigation} />

      {/* ✅ Business Impact */}
      {impact && (
        <Card className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-approval" />
            <h2 className="text-sm font-semibold text-ink">
              Business impact
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-2xs text-slate-300 uppercase tracking-wider">
                Affected records
              </div>
              <div className="text-lg font-bold text-ink">
                {impact.affected_records}
              </div>
            </div>

            <div>
              <div className="text-2xs text-slate-300 uppercase tracking-wider">
                Aggregate value
              </div>
              <div className="text-lg font-bold text-ink">
                {formatCurrency(
                  impact.affected_value,
                  impact.currency
                )}
              </div>
            </div>

            {(impact.affected_systems ?? []).length > 0 && (
              <div>
                <div className="text-2xs text-slate-300 uppercase tracking-wider">
                  Affected systems
                </div>
                <div className="text-sm font-medium text-ink">
                  {(impact.affected_systems ?? []).join(", ")}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ✅ Recommendations */}
      {recommendations.length > 0 && (
        <Card className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-4 h-4 text-enterprise" />
            <h2 className="text-sm font-semibold text-ink">
              Prioritized actions
            </h2>
          </div>

          <ul className="space-y-2.5">
            {recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-3">
                <Badge
                  tone={
                    r.priority === "high"
                      ? "red"
                      : r.priority === "medium"
                      ? "amber"
                      : "slate"
                  }
                >
                  {r.priority}
                </Badge>

                <div>
                  <p className="text-sm font-medium text-ink">
                    {r.title}
                  </p>
                  <p className="text-xs text-slate">
                    {r.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Open Questions */}
      {(investigation.open_questions ?? []).length > 0 && (
        <Card className="px-5 py-4">
          <h2 className="text-sm font-semibold text-ink mb-2">
            Operational follow-ups
          </h2>
          <ul className="space-y-1.5">
            {(investigation.open_questions ?? []).map((q, i) => (
              <li
                key={i}
                className="text-sm text-slate flex gap-2 items-start"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                {q}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Evidence */}
      {evidence.length > 0 && (
        <Card className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-verified" />
            <h2 className="text-sm font-semibold text-ink">
              Evidence
            </h2>
          </div>

          <ul className="space-y-2.5">
            {evidence.map(({ evidence: e, confirmedBy }) => (
              <li key={e.evidence_id} className="text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-ink">
                    {e.title}
                  </span>
                  <Badge
                    tone={
                      e.confidence === "verified"
                        ? "green"
                        : "neutral"
                    }
                  >
                    {e.confidence}
                  </Badge>
                </div>

                <p className="text-xs text-slate">
                  {e.summary}
                </p>

                {confirmedBy.length > 0 && (
                  <p className="text-2xs text-slate-300 mt-0.5">
                    Confirmed by {confirmedBy.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Failed */}
      {investigation.status === "failed" && (
        <Card className="px-5 py-4 border-critical/20 bg-critical/5">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-critical" />
            <h2 className="text-sm font-semibold text-critical">
              Investigation failed
            </h2>
          </div>
          <p className="text-sm text-slate">
            {investigation.error_message ??
              "No error detail was provided."}
          </p>
        </Card>
      )}
    </div>
  );
}
