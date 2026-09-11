import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Rocket, Activity, ShieldAlert, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { useInvestigationsList } from "@/hooks/useInvestigations";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/States";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { OrbitMotif } from "@/components/ui/OrbitMotif";

export function CommandCenter() {
  const navigate = useNavigate();
  const { data: investigations, isLoading } = useInvestigationsList();

  const stats = useMemo(() => {
    const list = investigations ?? [];
    const active = list.filter((i) =>
      ["created", "planning", "investigating", "verifying"].includes(i.status)
    );
    const awaitingApproval = list.filter((i) => i.status === "awaiting_capability_approval");
    const today = new Date().toDateString();
    const completedToday = list.filter(
      (i) => i.status === "completed" && i.completed_at && new Date(i.completed_at).toDateString() === today
    );
    const resolutionTimes = list
      .filter((i) => i.status === "completed" && i.completed_at)
      .map((i) => new Date(i.completed_at as string).getTime() - new Date(i.created_at).getTime());
    const median = resolutionTimes.length
      ? resolutionTimes.sort((a, b) => a - b)[Math.floor(resolutionTimes.length / 2)]
      : null;

    return {
      active,
      awaitingApproval,
      completedToday,
      medianMs: median,
    };
  }, [investigations]);

  const featured = stats.active[0];
  const recent = (investigations ?? []).slice(0, 6);

  if (isLoading) {
    return <LoadingState label="Loading command center" className="py-24" />;
  }

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="relative overflow-hidden rounded-xl2 bg-midnight text-white px-8 py-10"
      >
        <div className="absolute -right-10 -top-10 opacity-20">
          <OrbitMotif size={220} progress={1} className="text-electric" />
        </div>
        <div className="relative max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Resolve operational incidents with governed AI.
          </h1>
          <p className="text-slate-300 text-sm mb-6">
            Coordinate specialist agents, gather trusted evidence, and converge on a verified root cause —
            with a human in the loop whenever new capability is required.
          </p>
          <Button
            variant="primary"
            size="lg"
            icon={<Rocket className="w-4 h-4" />}
            onClick={() => navigate("/new")}
          >
            Start investigation
          </Button>
        </div>
      </motion.div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Active investigations" value={stats.active.length} tone="electric" />
        <StatCard
          icon={ShieldAlert}
          label="Awaiting approval"
          value={stats.awaitingApproval.length}
          tone="amber"
        />
        <StatCard icon={CheckCircle2} label="Completed today" value={stats.completedToday.length} tone="green" />
        <StatCard
          icon={Clock}
          label="Median resolution"
          value={stats.medianMs !== null ? formatMs(stats.medianMs) : "—"}
          tone="slate"
        />
      </div>

      {/* Featured active investigation */}
      {featured && (
        <Card
          hover
          className="px-5 py-4 cursor-pointer"
          onClick={() => navigate(`/investigation/${featured.investigation_id}`)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs font-semibold text-slate-300 uppercase tracking-wider">
              Active investigation
            </div>
            <StatusBadge status={featured.status} pulse />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1">{featured.incident_title}</h3>
          <div className="flex items-center gap-3 text-xs text-slate">
            {featured.agent_decisions.length > 0 && (
              <span>Current specialist: {featured.agent_decisions[featured.agent_decisions.length - 1].agent_name}</span>
            )}
            <span>· Elapsed {formatDuration(featured.created_at)}</span>
          </div>
        </Card>
      )}

      {/* Recent investigations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Recent investigations</h2>
          <button
            onClick={() => navigate("/archive")}
            className="flex items-center gap-1 text-xs font-medium text-enterprise hover:text-enterprise-700"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="No investigations yet"
            description="Start your first investigation to see it appear here."
            action={
              <Button variant="secondary" onClick={() => navigate("/new")}>
                Start investigation
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {recent.map((inv) => (
              <Card
                key={inv.investigation_id}
                hover
                className="px-4 py-3 flex items-center gap-4 cursor-pointer"
                onClick={() => navigate(`/investigation/${inv.investigation_id}`)}
              >
                <StatusBadge status={inv.status} />
                <span className="text-sm text-ink font-medium truncate flex-1">{inv.incident_title}</span>
                <span className="text-2xs text-slate-300 shrink-0">{formatRelativeTime(inv.updated_at)}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  tone: "electric" | "amber" | "green" | "slate";
}) {
  const toneClass = {
    electric: "text-enterprise bg-electric/10",
    amber: "text-approval bg-approval/10",
    green: "text-verified-600 bg-verified/10",
    slate: "text-slate bg-slate/10",
  }[tone];

  return (
    <Card className="px-4 py-4">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 ${toneClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl font-bold text-ink">{value}</div>
      <div className="text-2xs text-slate-300">{label}</div>
    </Card>
  );
}

function formatMs(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min}m`;
  return `${Math.round(min / 60)}h`;
}
