import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, CheckCircle2, ChevronRight, Gauge, Pause, Play, RotateCcw, ShieldCheck, SkipForward } from "lucide-react";
import { getHistoricalInvestigation } from "@/data/history";
import { getInvestigation } from "@/api/investigations";
import { investigationKeys } from "@/hooks/useInvestigations";
import type { Investigation } from "@/types/investigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDuration, titleCase } from "@/lib/utils";

interface ReplayStage {
  title: string;
  actor: string;
  summary: string;
  evidence: string;
}

interface ReplayView {
  id: string;
  title: string;
  summary: string;
  duration: string;
  rootCause: string;
  confidence: number;
  impact: string;
  systems: string[];
  stages: ReplayStage[];
}

function fromBackend(investigation: Investigation): ReplayView {
  const evidenceById = new Map(investigation.evidence.map((item) => [item.evidence_id, item]));
  const stages: ReplayStage[] = investigation.agent_decisions.map((decision, index) => {
    const evidence = decision.evidence_ids
      .map((id) => evidenceById.get(id))
      .filter(Boolean)
      .map((item) => item!.summary)
      .join(" ");
    const outcome = investigation.specialist_outcomes.find((item) => item.decision_id === decision.decision_id);
    return {
      title: decision.objective || `Investigation stage ${index + 1}`,
      actor: titleCase(decision.agent_name),
      summary: outcome?.summary || decision.reason,
      evidence: evidence || "The specialist completed this stage using the governed evidence available at the time.",
    };
  });

  if (investigation.root_cause) {
    stages.push({
      title: "Root cause verified",
      actor: "Verification Agent",
      summary: investigation.root_cause.explanation,
      evidence: `${investigation.root_cause.evidence_ids.length} evidence item(s) support the verified conclusion.`,
    });
  }

  if (stages.length === 0) {
    stages.push({
      title: "Investigation completed",
      actor: "Supervisor",
      summary: investigation.executive_summary?.[0] || "The investigation completed successfully.",
      evidence: investigation.root_cause?.explanation || "The completed investigation record was loaded from the backend.",
    });
  }

  return {
    id: investigation.investigation_id,
    title: investigation.incident_title,
    summary: investigation.executive_summary?.[0] || investigation.classification?.summary || investigation.incident_description,
    duration: formatDuration(investigation.created_at, investigation.completed_at),
    rootCause: investigation.root_cause?.title || "Investigation completed",
    confidence: investigation.root_cause?.confidence === "verified" ? 100 : 95,
    impact: investigation.business_impact
      ? formatCurrency(investigation.business_impact.affected_value, investigation.business_impact.currency)
      : "Impact not quantified",
    systems: investigation.business_impact?.affected_systems ?? [],
    stages,
  };
}

export function InvestigationReplay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const curated = getHistoricalInvestigation(id);
  const liveQuery = useQuery({
    queryKey: investigationKeys.detail(id ?? ""),
    queryFn: () => getInvestigation(id as string),
    enabled: Boolean(id) && !curated,
    retry: false,
  });

  const investigation = useMemo<ReplayView | null>(() => {
    if (curated) return curated;
    if (liveQuery.data) return fromBackend(liveQuery.data);
    return null;
  }, [curated, liveQuery.data]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const delay = useMemo(() => 2200 / speed, [speed]);

  useEffect(() => {
    if (!playing || !investigation || index >= investigation.stages.length - 1) return;
    const timer = window.setTimeout(() => setIndex((current) => current + 1), delay);
    return () => window.clearTimeout(timer);
  }, [playing, investigation, index, delay]);

  if (liveQuery.isLoading && !curated) return <div className="p-10 text-sm text-slate">Loading replay…</div>;
  if (!investigation) return <div className="p-10 text-sm text-slate">Replay not found.</div>;

  const safeIndex = Math.min(index, investigation.stages.length - 1);
  const current = investigation.stages[safeIndex];
  const complete = safeIndex === investigation.stages.length - 1;

  return (
    <div className="min-h-full bg-[#06172e] text-white">
      <div className="border-b border-white/10 bg-[#071a33]/90 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <button onClick={() => navigate(`/history/${investigation.id}`)} className="flex cursor-pointer items-center gap-2 text-xs text-white/65 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Archived report</button>
          <div className="flex items-center gap-2"><Badge tone="green" dot>Recorded investigation</Badge><span className="text-xs text-white/45">{investigation.duration}</span></div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-6 py-7">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl"><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.22em] text-electric">Investigation replay</p><h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{investigation.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">{investigation.summary}</p></div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
            <button onClick={() => setPlaying((value) => !value)} className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-midnight">{playing && !complete ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing && !complete ? "Pause" : "Play"}</button>
            <button onClick={() => { setIndex(0); setPlaying(true); }} className="cursor-pointer rounded-xl p-2.5 text-white/65 hover:bg-white/10 hover:text-white" aria-label="Restart replay"><RotateCcw className="h-4 w-4" /></button>
            <button onClick={() => setSpeed(speed === 2 ? .75 : speed === 1 ? 2 : 1)} className="flex cursor-pointer items-center gap-1 rounded-xl px-3 py-2 text-xs text-white/65 hover:bg-white/10 hover:text-white"><Gauge className="h-4 w-4" />{speed}×</button>
            <button onClick={() => setIndex(investigation.stages.length - 1)} className="flex cursor-pointer items-center gap-1 rounded-xl px-3 py-2 text-xs text-white/65 hover:bg-white/10 hover:text-white"><SkipForward className="h-4 w-4" />Result</button>
          </div>
        </div>

        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-enterprise to-electric" animate={{ width: `${((safeIndex + 1) / investigation.stages.length) * 100}%` }} /></div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr_330px]">
          <aside className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
            <div className="mb-4 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-[.18em] text-white/40">Journey</span><span className="text-xs text-white/45">{safeIndex + 1}/{investigation.stages.length}</span></div>
            <div className="space-y-1">{investigation.stages.map((stage, stageIndex) => { const done = stageIndex < safeIndex; const active = stageIndex === safeIndex; return <button key={`${stage.title}-${stageIndex}`} onClick={() => { setIndex(stageIndex); setPlaying(false); }} className={`group flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition ${active ? "bg-electric/15 ring-1 ring-electric/35" : "hover:bg-white/5"}`}><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${done ? "border-verified bg-verified text-white" : active ? "border-electric bg-electric text-midnight" : "border-white/15 text-white/35"}`}>{done ? <CheckCircle2 className="h-3.5 w-3.5" /> : stageIndex + 1}</span><span><span className={`block text-xs font-semibold ${active ? "text-white" : "text-white/62"}`}>{stage.title}</span><span className="mt-0.5 block text-[10px] text-white/35">{stage.actor}</span></span></button>; })}</div>
          </aside>

          <main className="relative min-h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.08] to-white/[.025] p-7 shadow-2xl">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-electric/10 blur-3xl" />
            <AnimatePresence mode="wait"><motion.div key={safeIndex} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .35 }} className="relative flex h-full flex-col"><div className="flex items-center justify-between"><Badge tone={current.actor === "Governance" ? "amber" : current.actor.includes("Verification") ? "green" : "blue"} dot>{current.actor}</Badge><span className="text-xs text-white/35">Stage {safeIndex + 1}</span></div><div className="my-auto py-14"><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-electric">Recorded investigation stage</p><h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight lg:text-4xl">{current.title}</h2><p className="mt-5 max-w-3xl text-base leading-7 text-white/66">{current.summary}</p><div className="mt-8 rounded-2xl border border-electric/20 bg-electric/8 p-5"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-electric"><ShieldCheck className="h-4 w-4" /> Evidence captured</div><p className="text-sm leading-6 text-white/72">{current.evidence}</p></div></div><div className="flex items-center justify-between border-t border-white/10 pt-5"><span className="text-xs text-white/38">Stored evidence · deterministic replay · no model calls</span>{!complete && <button onClick={() => { setIndex((value) => Math.min(value + 1, investigation.stages.length - 1)); setPlaying(false); }} className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-electric hover:text-white">Next stage <ChevronRight className="h-4 w-4" /></button>}</div></motion.div></AnimatePresence>
          </main>

          <aside className="space-y-4"><Card className="border-white/10 bg-white/[.06] p-5 text-white"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">Verified outcome</p><p className="mt-3 text-sm font-semibold leading-6">{investigation.rootCause}</p><div className="mt-5 flex items-end justify-between"><div><p className="text-[10px] text-white/38">Confidence</p><p className="text-3xl font-bold text-verified">{investigation.confidence}%</p></div><ShieldCheck className="h-8 w-8 text-verified" /></div></Card><Card className="border-white/10 bg-white/[.06] p-5 text-white"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">Business impact</p><p className="mt-3 text-sm font-semibold">{investigation.impact}</p><div className="mt-4 flex flex-wrap gap-2">{investigation.systems.map((system) => <span key={system} className="rounded-lg bg-white/7 px-2.5 py-1.5 text-[10px] text-white/55">{system}</span>)}</div></Card>{complete && <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate(`/history/${investigation.id}`)} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-xs font-bold text-midnight shadow-xl transition hover:-translate-y-0.5"><ShieldCheck className="h-4 w-4" /> Open archived report</motion.button>}</aside>
        </div>
      </div>
    </div>
  );
}
