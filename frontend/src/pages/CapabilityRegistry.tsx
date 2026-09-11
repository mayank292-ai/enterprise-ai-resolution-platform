import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowUpRight, Info } from "lucide-react";
import { useInvestigationsList } from "@/hooks/useInvestigations";
import { Card } from "@/components/ui/Card";
import { Badge, CapabilityStatusBadge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/States";
import { titleCase } from "@/lib/utils";

interface RegistryRow {
  agentName: string;
  status: "core" | "provisioned";
  description?: string;
  approvedTools: string[];
  originInvestigationId?: string;
  originInvestigationTitle?: string;
  usedInInvestigations: number;
}

/**
 * The real backend has no capability-registry endpoint — the specialist
 * registry lives in-process and is not exposed over HTTP, and
 * pending_capability_gap is cleared once an investigation resumes. This
 * view is therefore derived, best-effort, from the capability gaps and
 * agent activity visible across investigations rather than from an
 * authoritative source. See the "remaining limitations" note.
 */
export function CapabilityRegistry() {
  const { data: investigations, isLoading } = useInvestigationsList();
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const map = new Map<string, RegistryRow>();
    for (const inv of investigations ?? []) {
      for (const decision of inv.agent_decisions) {
        const existing = map.get(decision.agent_name);
        if (existing) {
          existing.usedInInvestigations += 1;
        } else {
          map.set(decision.agent_name, {
            agentName: decision.agent_name,
            status: "core",
            approvedTools: [],
            usedInInvestigations: 1,
          });
        }
      }

      const gap = inv.pending_capability_gap;
      if (gap) {
        map.set(gap.proposed_agent_name, {
          agentName: gap.proposed_agent_name,
          status: "provisioned",
          description: gap.proposed_agent_description,
          approvedTools: gap.required_tools,
          originInvestigationId: inv.investigation_id,
          originInvestigationTitle: inv.incident_title,
          usedInInvestigations: map.get(gap.proposed_agent_name)?.usedInInvestigations ?? 0,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.agentName.localeCompare(b.agentName));
  }, [investigations]);

  if (isLoading) {
    return <LoadingState label="Loading capability registry" className="py-24" />;
  }

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Shield className="w-5 h-5 text-enterprise" />
        <h1 className="text-xl font-bold text-ink tracking-tight">Capability registry</h1>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-electric/20 bg-electric/5 px-3.5 py-2.5 text-xs text-slate">
        <Info className="w-3.5 h-3.5 text-enterprise mt-0.5 shrink-0" />
        <p>
          This registry is derived from specialist activity observed across investigations — the platform's
          in-process specialist registry is not exposed via a dedicated API, so this view cannot claim to be
          exhaustive.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No capabilities observed yet"
          description="Capabilities appear here once investigations have run."
        />
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => (
            <Card key={row.agentName} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-ink">{titleCase(row.agentName)}</span>
                    {row.status === "provisioned" ? (
                      <CapabilityStatusBadge status="ready" />
                    ) : (
                      <Badge tone="slate">Core capability</Badge>
                    )}
                  </div>
                  {row.description && <p className="text-xs text-slate mb-1.5">{row.description}</p>}
                  {row.approvedTools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {row.approvedTools.map((tool) => (
                        <span
                          key={tool}
                          className="text-2xs font-mono px-2 py-0.5 rounded-md bg-ice-100 text-slate border border-slate-200/50"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-2xs text-slate-300">
                    Used in {row.usedInInvestigations} investigation{row.usedInInvestigations === 1 ? "" : "s"}
                  </p>
                </div>
                {row.originInvestigationId && (
                  <button
                    onClick={() => navigate(`/investigation/${row.originInvestigationId}`)}
                    className="flex items-center gap-1 text-2xs font-medium text-enterprise hover:text-enterprise-700 shrink-0"
                  >
                    Originating investigation <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
