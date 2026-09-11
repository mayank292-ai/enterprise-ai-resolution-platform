import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Clock3,
  FileText,
  Filter,
  Landmark,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useInvestigationsList } from "@/hooks/useInvestigations";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { formatCurrency, formatDuration, formatRelativeTime } from "@/lib/utils";
import type { InvestigationStatus } from "@/types/investigation";
import { historicalInvestigations, type InvestigationPriority } from "@/data/history";
import { cn } from "@/lib/utils";

export function Archive() {
  const navigate = useNavigate();
  const investigationsQuery = useInvestigationsList();
  const { data: investigations, isLoading } = investigationsQuery;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvestigationStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<InvestigationPriority | "all">("all");

  const filtered = useMemo(() => {
    return (investigations ?? [])
      .filter((inv) => statusFilter === "all" || inv.status === statusFilter)
      .filter((inv) => inv.incident_title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [investigations, statusFilter, search]);

  const curated = historicalInvestigations.filter((item) => {
    const matchesQuery = `${item.title} ${item.businessArea} ${item.rootCause}`.toLowerCase().includes(search.toLowerCase());
    return matchesQuery && (priorityFilter === "all" || item.priority === priorityFilter);
  });
  const flagship = curated.find((item) => item.id === "hist-settlement-v2");
  const archiveCases = curated.filter((item) => item.id !== "hist-settlement-v2");
  const openInvestigation = (investigationId: string, status: InvestigationStatus) => {
    navigate(
      status === "completed"
        ? `/history/${investigationId}`
        : `/investigation/${investigationId}`,
    );
  };

  if (isLoading) return <LoadingState label="Loading investigations" className="py-24" />;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-2xs font-semibold uppercase tracking-[.18em] text-enterprise">
            <Sparkles className="h-3.5 w-3.5" /> Investigation intelligence
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink lg:text-[28px]">Investigation history</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate">
            Today’s live API records appear first. A small, clearly labelled scenario library demonstrates how the same platform extends beyond the payment incident.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(260px,1fr)_180px_130px]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search incidents, systems, root causes..." className="pl-9" />
          </label>
          <label className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as InvestigationStatus | "all")} className="pl-9">
              <option value="all">All live statuses</option>
              <option value="created">Created</option>
              <option value="planning">Planning</option>
              <option value="investigating">Investigating</option>
              <option value="verifying">Verifying</option>
              <option value="awaiting_capability_approval">Awaiting approval</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </Select>
          </label>
          <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as InvestigationPriority | "all")}>
            <option value="all">All priorities</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </Select>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={ShieldCheck} label="Workspace runs" value={String(investigations?.length ?? 0)} note="Returned by the live API" tone="green" />
        <Metric icon={Clock3} label="Latest resolution" value={filtered[0] ? formatDuration(filtered[0].created_at, filtered[0].completed_at) : "—"} note="Measured from the actual run" tone="blue" />
        <Metric icon={TrendingDown} label="Capability approvals" value="1" note="Demonstrated in today’s flow" tone="amber" />
        <Metric icon={Landmark} label="Prepared scenarios" value={String(archiveCases.length)} note="Cross-domain presentation examples" tone="slate" />
      </section>

      {flagship && (
        <section className="order-2">
          <div className="mb-3 flex items-center justify-between">
            <div><h2 className="text-sm font-semibold text-ink">Captured demonstration</h2><p className="text-xs text-slate">A stable replay of the same stages, evidence, and outcome used in the live run</p></div>
            <Badge tone="green" dot>{flagship.recordType}</Badge>
          </div>
          <Card className="group overflow-hidden">
            <div className="grid lg:grid-cols-[1.4fr_.6fr]">
              <div className="relative overflow-hidden bg-gradient-to-br from-midnight via-midnight-700 to-enterprise p-6 text-white lg:p-7">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-electric/20 blur-3xl" />
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={flagship.priority} />
                    <Badge tone="green" dot>Verified demo capture</Badge>
                    <span className="text-[10px] text-white/45">{flagship.completed}</span>
                  </div>
                  <h3 className="mt-5 max-w-3xl text-xl font-bold leading-8 tracking-tight lg:text-2xl">{flagship.title}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62">{flagship.summary}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <DarkMetric label="Business impact" value={flagship.impact} />
                    <DarkMetric label="Resolution time" value={flagship.duration} />
                    <DarkMetric label="Verified confidence" value={`${flagship.confidence}%`} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between p-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-300">Verified root cause</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-ink">{flagship.rootCause}</p>
                  <div className="mt-5 flex flex-wrap gap-2">{flagship.systems.map((system) => <span key={system} className="rounded-lg bg-ice px-2.5 py-1.5 text-[10px] font-medium text-slate">{system}</span>)}</div>
                </div>
                <div className="mt-6 flex gap-2">
                  <button onClick={() => navigate(`/history/${flagship.id}`)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-midnight px-3 py-3 text-xs font-semibold text-white transition hover:bg-midnight-600"><FileText className="h-3.5 w-3.5" /> Open report</button>
                  <button onClick={() => navigate(`/replay/${flagship.id}`)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-enterprise/20 bg-enterprise/5 px-3 py-3 text-xs font-semibold text-enterprise transition hover:bg-enterprise/10"><Play className="h-3.5 w-3.5" /> Replay</button>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {archiveCases.length > 0 && (
        <section className="order-3">
          <div className="mb-3 flex items-end justify-between">
            <div><h2 className="text-sm font-semibold text-ink">Prepared scenario library</h2><p className="text-xs text-slate">Cross-domain examples prepared today to demonstrate platform portability—not claimed as production history</p></div>
            <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-300">{archiveCases.length} demo scenarios</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {archiveCases.map((item) => (
              <Card key={item.id} hover className="group flex min-h-[300px] flex-col overflow-hidden">
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2"><PriorityBadge priority={item.priority} /><Badge tone="blue">{item.recordType}</Badge></div>
                    <span className="text-right text-[10px] leading-4 text-slate-300">{item.completed}</span>
                  </div>
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.14em] text-enterprise">{item.businessArea}</p>
                  <h3 className="mt-2 text-sm font-semibold leading-6 text-ink">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate">{item.rootCause}</p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-300"><Building2 className="h-3 w-3" />{item.owner}</div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-slate-200/50 border-y border-slate-200/50 bg-ice/45">
                  <MiniMetric label="Confidence" value={`${item.confidence}%`} />
                  <MiniMetric label="Duration" value={item.duration} />
                  <MiniMetric label="Sources" value={String(item.systems.length)} />
                </div>
                <div className="flex items-center justify-between p-4">
                  <button onClick={() => navigate(`/history/${item.id}`)} className="flex items-center gap-1.5 text-xs font-semibold text-ink transition hover:text-enterprise"><FileText className="h-3.5 w-3.5" /> Report</button>
                  <button onClick={() => navigate(`/replay/${item.id}`)} className="flex items-center gap-1.5 text-xs font-semibold text-enterprise">Replay <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="order-1">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-ink">Today’s workspace investigations</h2>
          <p className="text-xs text-slate">Authoritative records returned directly by the running investigation API</p>
        </div>
        <Card className="overflow-hidden">
          {investigationsQuery.isError ? (
            <div className="px-6 py-8">
              <ErrorState
                type="recoverable"
                message={(investigationsQuery.error as Error)?.message ?? "Live workspace records are temporarily unavailable."}
                onRetry={() => investigationsQuery.refetch()}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <ShieldCheck className="h-8 w-8 text-enterprise/40" />
              <p className="mt-3 text-sm font-semibold text-ink">No workspace investigations match these filters</p>
              <p className="mt-1 text-xs text-slate">Clear the filters or start a new investigation from the dashboard.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-200/50 bg-ice/45 text-2xs uppercase tracking-wider text-slate-300"><th className="px-4 py-3 text-left font-semibold">Status</th><th className="px-4 py-3 text-left font-semibold">Investigation</th><th className="px-4 py-3 text-left font-semibold">Impact</th><th className="px-4 py-3 text-left font-semibold">Confidence</th><th className="px-4 py-3 text-left font-semibold">Duration</th><th className="px-4 py-3 text-left font-semibold">Updated</th></tr></thead>
                  <tbody>{filtered.map((inv) => <tr key={inv.investigation_id} onClick={() => openInvestigation(inv.investigation_id, inv.status)} className="cursor-pointer border-b border-slate-200/30 transition-colors last:border-0 hover:bg-ice-100/50"><td className="px-4 py-3"><StatusBadge status={inv.status} /></td><td className="max-w-xs px-4 py-3"><p className="truncate font-medium text-ink">{inv.incident_title}</p><p className="mt-0.5 truncate text-2xs text-slate-300">{inv.classification?.business_process ?? "Enterprise operations"}</p></td><td className="px-4 py-3 text-slate">{inv.business_impact ? formatCurrency(inv.business_impact.affected_value, inv.business_impact.currency) : "—"}</td><td className="px-4 py-3 capitalize text-slate">{inv.root_cause?.confidence ?? "—"}</td><td className="px-4 py-3 text-slate"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-slate-300" />{formatDuration(inv.created_at, inv.completed_at)}</span></td><td className="px-4 py-3 text-slate-300">{formatRelativeTime(inv.updated_at)}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="divide-y divide-slate-200/40 md:hidden">
                {filtered.map((inv) => <button key={inv.investigation_id} onClick={() => openInvestigation(inv.investigation_id, inv.status)} className="w-full p-4 text-left"><div className="flex items-center justify-between gap-3"><StatusBadge status={inv.status} /><span className="text-[10px] text-slate-300">{formatRelativeTime(inv.updated_at)}</span></div><p className="mt-3 text-sm font-semibold text-ink">{inv.incident_title}</p><p className="mt-1 text-xs text-slate">{formatDuration(inv.created_at, inv.completed_at)}</p></button>)}
              </div>
            </>
          )}
        </Card>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof ShieldCheck; label: string; value: string; note: string; tone: "green" | "blue" | "amber" | "slate" }) {
  const styles = { green: "bg-verified/10 text-verified", blue: "bg-enterprise/8 text-enterprise", amber: "bg-approval/10 text-approval", slate: "bg-slate/8 text-slate" };
  return <Card className="p-5"><div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", styles[tone])}><Icon className="h-4 w-4" /></div><p className="mt-4 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-300">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-ink">{value}</p><p className="mt-1 text-xs text-slate">{note}</p></Card>;
}

function PriorityBadge({ priority }: { priority: InvestigationPriority }) {
  return <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold", priority === "P1" ? "border-critical/20 bg-critical/10 text-critical" : priority === "P2" ? "border-approval/20 bg-approval/10 text-approval" : "border-enterprise/15 bg-enterprise/8 text-enterprise")}>{priority}</span>;
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[.06] p-3"><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-white/35">{label}</p><p className="mt-1 text-xs font-semibold leading-5 text-white/85">{value}</p></div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="px-3 py-3 text-center"><p className="text-[9px] font-semibold uppercase tracking-wider text-slate-300">{label}</p><p className="mt-1 text-xs font-bold text-ink">{value}</p></div>;
}
