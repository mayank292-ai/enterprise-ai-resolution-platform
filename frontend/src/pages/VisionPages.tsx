import { useState, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Database,
  FileCheck2,
  GitBranch,
  Layers3,
  LockKeyhole,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const specialists = [
  {
    name: "Payment Investigation Agent",
    domain: "Payment operations",
    icon: Activity,
    success: "96.8%",
    cases: 184,
    status: "Available",
    purpose: "Scopes affected payments, reconstructs lifecycle events, and compares successful and failed cohorts.",
    evidence: ["Payment lifecycle", "Settlement status", "Cohort comparison"],
  },
  {
    name: "Data Contract Agent",
    domain: "Data quality",
    icon: Database,
    success: "94.6%",
    cases: 127,
    status: "Available",
    purpose: "Validates source schemas, canonical contracts, field mappings, and transformed records.",
    evidence: ["Schema definitions", "Mapping rules", "Record comparison"],
  },
  {
    name: "Pipeline Reliability Agent",
    domain: "Platform reliability",
    icon: GitBranch,
    success: "92.3%",
    cases: 109,
    status: "Available",
    purpose: "Examines orchestration health, task execution, and record-count reconciliation.",
    evidence: ["Pipeline runs", "Task health", "Count reconciliation"],
  },
  {
    name: "Deployment Analysis Agent",
    domain: "Change intelligence",
    icon: Network,
    success: "91.7%",
    cases: 63,
    status: "Governed",
    purpose: "Correlates release history with code, configuration, routing, and deployment changes.",
    evidence: ["Deployment history", "Change manifest", "Commit diff"],
  },
  {
    name: "Verification Agent",
    domain: "Independent assurance",
    icon: ShieldCheck,
    success: "98.1%",
    cases: 171,
    status: "Available",
    purpose: "Challenges conclusions, searches for contradictions, and validates the final causal chain.",
    evidence: ["Contradiction search", "Impact validation", "Root-cause assurance"],
  },
];

export function SpecialistsPage() {
  const [selected, setSelected] = useState(specialists[0].name);
  return (
    <PageFrame
      eyebrow="Enterprise intelligence"
      title="AI Specialists"
      description="Governed domain specialists available to the investigation supervisor. Each specialist works only with its approved evidence catalog."
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <SummaryMetric label="Specialists online" value="5 / 5" note="All control checks passed" />
        <SummaryMetric label="Cases supported" value="654" note="Rolling 90-day volume" />
        <SummaryMetric label="Evidence acceptance" value="95.2%" note="Verified by assurance" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {specialists.map(({ name, domain, icon: Icon, success, cases, status, purpose, evidence }) => {
          const active = selected === name;
          return (
            <Card
              key={name}
              hover
              onClick={() => setSelected(name)}
              className={cn("cursor-pointer overflow-hidden p-5", active && "border-enterprise/30 shadow-glow")}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-enterprise/8 text-enterprise">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge tone={status === "Governed" ? "amber" : "green"} dot>{status}</Badge>
              </div>
              <h3 className="mt-5 text-base font-semibold text-ink">{name}</h3>
              <p className="mt-1 text-xs font-medium text-enterprise">{domain}</p>
              <p className="mt-3 text-xs leading-5 text-slate">{purpose}</p>
              <AnimatePresence initial={false}>
                {active && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 border-t border-slate-200/50 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-300">Approved evidence</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {evidence.map((item) => <span key={item} className="rounded-lg bg-ice px-2 py-1 text-[10px] text-slate">{item}</span>)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200/40 pt-4">
                <Metric label="Success rate" value={success} />
                <Metric label="Investigations" value={String(cases)} />
              </div>
            </Card>
          );
        })}
      </div>
    </PageFrame>
  );
}

const knowledgeArticles = [
  {
    title: "Pending settlement after producer release",
    category: "Payments",
    domain: "Payments · Change",
    usage: 12,
    confidence: "Verified",
    updated: "28 Jul 2026",
    summary: "A diagnostic pattern for payments that complete booking but fail downstream publication after a producer deployment.",
    signals: ["DOWNSTREAM_ACK_TIMEOUT", "Pending settlement", "Version cohort divergence"],
  },
  {
    title: "Required currency field lost during transformation",
    category: "Data",
    domain: "Payments · Data contracts",
    usage: 8,
    confidence: "Verified",
    updated: "27 Jul 2026",
    summary: "Distinguishes a source-data omission from a mapping regression using record-level comparisons.",
    signals: ["source_currency null", "Contract field required", "Variant-specific failure"],
  },
  {
    title: "Healthy producer with inactive downstream consumer",
    category: "Platform",
    domain: "Platform · Messaging",
    usage: 6,
    confidence: "High confidence",
    updated: "26 Jul 2026",
    summary: "Explains rising queue depth when producers and orchestration remain healthy but the active consumer count drops to zero.",
    signals: ["Queue depth rising", "Producer throughput normal", "No active consumers"],
  },
  {
    title: "Schema drift after payment-service deployment",
    category: "Data",
    domain: "Data contracts · Release",
    usage: 10,
    confidence: "Verified",
    updated: "25 Jul 2026",
    summary: "A comparison sequence for identifying incompatible producer changes without treating version correlation as causation.",
    signals: ["Schema version change", "Removed required field", "Consumer rejection"],
  },
  {
    title: "Duplicate notifications after consumer restart",
    category: "Platform",
    domain: "Platform · Eventing",
    usage: 5,
    confidence: "High confidence",
    updated: "24 Jul 2026",
    summary: "Connects offset replay, cache readiness, and idempotency controls in post-restart notification incidents.",
    signals: ["Offset rewind", "Cache warm-up", "Duplicate event IDs"],
  },
  {
    title: "Settlement cut-off breach with healthy processing",
    category: "Payments",
    domain: "Payments · Settlement",
    usage: 9,
    confidence: "Verified",
    updated: "23 Jul 2026",
    summary: "Separates operational cut-off configuration from payment-processing and liquidity failures.",
    signals: ["Booking complete", "Settlement deferred", "Calendar mismatch"],
  },
];

export function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openArticle, setOpenArticle] = useState(knowledgeArticles[0].title);
  const filtered = knowledgeArticles.filter((article) =>
    (category === "All" || article.category === category) &&
    `${article.title} ${article.summary} ${article.signals.join(" ")}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <PageFrame
      eyebrow="Institutional learning"
      title="Knowledge Center"
      description="Verified operational knowledge captured from completed investigations and reusable across future incidents."
    >
      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200/60 bg-ice px-4 py-3">
            <Search className="h-4 w-4 text-slate-300" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search root causes, evidence signals, systems, or recommendations"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-300"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {["All", "Payments", "Data", "Platform"].map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-xs font-semibold transition",
                  category === item ? "bg-midnight text-white" : "bg-ice text-slate hover:bg-ice-200"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate"><span className="font-semibold text-ink">{filtered.length}</span> verified knowledge patterns</p>
        <span className="text-[10px] font-medium uppercase tracking-[.16em] text-slate-300">Updated daily from closed cases</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((article) => {
          const open = openArticle === article.title;
          return (
            <Card key={article.title} hover className={cn("overflow-hidden", open && "border-enterprise/25")}>
              <button onClick={() => setOpenArticle(open ? "" : article.title)} className="w-full p-5 text-left">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric/10 text-enterprise"><BookOpen className="h-4 w-4" /></div>
                  <div className="flex items-center gap-2">
                    <Badge tone={article.confidence === "Verified" ? "green" : "blue"}>{article.confidence}</Badge>
                    <ChevronDown className={cn("h-4 w-4 text-slate-300 transition-transform", open && "rotate-180")} />
                  </div>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">{article.title}</h3>
                <p className="mt-1 text-xs text-slate">{article.domain}</p>
                <p className="mt-3 text-xs leading-5 text-slate">{article.summary}</p>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="border-t border-slate-200/50 bg-ice/50 px-5 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-300">Diagnostic signals</p>
                      <div className="mt-2 flex flex-wrap gap-2">{article.signals.map((signal) => <span key={signal} className="rounded-lg border border-slate-200/60 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate">{signal}</span>)}</div>
                      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-300"><span>Reused in {article.usage} investigations</span><span>Reviewed {article.updated}</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </PageFrame>
  );
}

const analyticsByRange = {
  "30d": { completed: "62", median: "10m 58s", verified: "97.1%", approvals: "5", bars: [38, 48, 43, 55, 62, 58, 71, 68, 77, 84, 82, 91] },
  "90d": { completed: "184", median: "11m 42s", verified: "96.4%", approvals: "14", bars: [42, 58, 51, 68, 74, 63, 82, 77, 88, 91, 86, 96] },
  "12m": { completed: "691", median: "13m 06s", verified: "95.8%", approvals: "48", bars: [48, 52, 57, 61, 65, 69, 73, 78, 82, 86, 91, 96] },
};

export function AnalyticsPage() {
  const [range, setRange] = useState<keyof typeof analyticsByRange>("90d");
  const [activeBar, setActiveBar] = useState(11);
  const data = analyticsByRange[range];
  return (
    <PageFrame
      eyebrow="Operational performance"
      title="Analytics"
      description="Investigation effectiveness, resolution velocity, and governed specialist utilization across payment operations."
      action={
        <div className="flex rounded-xl border border-slate-200/60 bg-white p-1 shadow-subtle">
          {(["30d", "90d", "12m"] as const).map((item) => (
            <button key={item} onClick={() => setRange(item)} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition", range === item ? "bg-midnight text-white" : "text-slate hover:bg-ice")}>{item.toUpperCase()}</button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={CheckCircle2} label="Completed" value={data.completed} note="+18% versus prior period" trend="up" />
        <Kpi icon={Timer} label="Median resolution" value={data.median} note="32% faster than baseline" trend="down" />
        <Kpi icon={ShieldCheck} label="Verified outcomes" value={data.verified} note="Independent assurance rate" trend="up" />
        <Kpi icon={Users} label="Human approvals" value={data.approvals} note="7.6% of investigations" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div><h3 className="text-sm font-semibold text-ink">Resolution volume</h3><p className="text-xs text-slate">Completed investigations by reporting week</p></div>
            <Badge tone="green" dot>Within target</Badge>
          </div>
          <div className="mt-7 flex h-56 items-end gap-2">
            {data.bars.map((height, index) => (
              <button
                key={index}
                onClick={() => setActiveBar(index)}
                className="group relative flex h-full flex-1 items-end"
                aria-label={`Week ${index + 1}`}
              >
                {activeBar === index && <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-lg bg-midnight px-2 py-1 text-[9px] font-semibold text-white">{Math.round(height * 0.72)} cases</span>}
                <span className={cn("w-full rounded-t-md transition-all", activeBar === index ? "bg-electric shadow-glow" : "bg-enterprise/75 group-hover:bg-enterprise")} style={{ height: `${height}%` }} />
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[9px] uppercase tracking-wider text-slate-300"><span>Week 1</span><span>Week 6</span><span>Week 12</span></div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink">Root-cause domains</h3>
          <p className="mt-1 text-xs text-slate">Share of verified conclusions</p>
          <div className="mt-5 space-y-5">
            {[["Data contracts", 34], ["Release changes", 27], ["Pipeline reliability", 23], ["Payment processing", 16]].map(([label, value]) => (
              <button key={label} className="block w-full text-left">
                <div className="mb-2 flex justify-between text-xs"><span className="text-slate">{label}</span><span className="font-semibold text-ink">{value}%</span></div>
                <div className="h-2 rounded-full bg-ice-200"><div className="h-2 rounded-full bg-gradient-to-r from-enterprise to-electric transition-all" style={{ width: `${value}%` }} /></div>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-verified/15 bg-verified/5 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-verified-600">Operational insight</p><p className="mt-1 text-xs leading-5 text-slate">Release-related cases resolve 41% faster when deployment evidence is already governed and available.</p></div>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <InsightCard icon={Workflow} title="Specialist hand-offs" value="2.8" note="Average per completed investigation" />
        <InsightCard icon={FileCheck2} title="Evidence accepted" value="95.2%" note="Without supervisor rework" />
        <InsightCard icon={Target} title="SLA attainment" value="93.7%" note="Priority 1 and 2 incidents" />
      </div>
    </PageFrame>
  );
}

const policies = [
  {
    id: "POL-AI-014",
    title: "Human approval for dynamic capabilities",
    owner: "Enterprise AI Risk",
    status: "Enforced",
    scope: "All production investigations",
    detail: "Any capability outside the permanent specialist registry requires a named human decision before execution. Approval records retain the proposal, requested tools, actor, and timestamp.",
    controls: ["Explicit approval", "Scoped tool catalog", "Immutable audit event"],
  },
  {
    id: "POL-DATA-021",
    title: "Trusted evidence boundary",
    owner: "Enterprise Data Governance",
    status: "Enforced",
    scope: "All connected evidence sources",
    detail: "Specialists may use only registered read-only tools. Model-generated text cannot be promoted to verified evidence without a trusted source reference.",
    controls: ["Approved connectors", "Evidence provenance", "Read-only execution"],
  },
  {
    id: "POL-OPS-008",
    title: "Independent root-cause verification",
    owner: "Operational Resilience",
    status: "Enforced",
    scope: "All completed investigations",
    detail: "A separate verification specialist must challenge contradictions, validate impact, and confirm the causal chain before an investigation can close.",
    controls: ["Contradiction search", "Impact validation", "Closure gate"],
  },
  {
    id: "POL-RET-004",
    title: "Investigation record retention",
    owner: "Records Management",
    status: "Monitored",
    scope: "Seven-year audit archive",
    detail: "Investigation decisions, tool traces, approvals, evidence, and reports are retained as an audit-ready record under the enterprise retention schedule.",
    controls: ["Seven-year retention", "Export control", "Legal hold ready"],
  },
];

export function GovernancePage() {
  const [expanded, setExpanded] = useState(policies[0].id);
  const [activityFilter, setActivityFilter] = useState("All");
  const activities = [
    ["Release Change Analysis capability approved", "Demo operator", "Cross-border settlement investigation", "Approved", "15:54"],
    ["Independent verification completed", "Verification Agent", "Payment publication incident", "Verified", "15:56"],
    ["Trusted evidence policy evaluated", "Resolution Supervisor", "Morning production release", "Compliant", "15:52"],
    ["Schema connector access checked", "Data Contract Agent", "Producer version comparison", "Compliant", "15:53"],
  ].filter((item) => activityFilter === "All" || item[3] === activityFilter);

  return (
    <PageFrame
      eyebrow="Trust and control"
      title="Governance"
      description="Policy enforcement, human decisions, capability activation, and end-to-end auditability for governed AI investigations."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi icon={LockKeyhole} label="Policies evaluated" value="4 / 4" note="Today’s demo run" />
        <Kpi icon={ShieldCheck} label="Active controls" value="12" note="Across four policy groups" />
        <Kpi icon={Activity} label="Human approvals" value="1" note="Capability expansion recorded" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <section>
          <div className="mb-3 flex items-end justify-between"><div><h2 className="text-sm font-semibold text-ink">Control policies</h2><p className="text-xs text-slate">Click a policy to inspect enforcement details</p></div><Badge tone="green" dot>All healthy</Badge></div>
          <div className="space-y-3">
            {policies.map((policy) => {
              const open = expanded === policy.id;
              return (
                <Card key={policy.id} className={cn("overflow-hidden", open && "border-enterprise/25")}>
                  <button onClick={() => setExpanded(open ? "" : policy.id)} className="flex w-full items-start gap-4 p-4 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-enterprise/8 text-enterprise"><LockKeyhole className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-300">{policy.id} · {policy.owner}</span><span className="mt-1 block text-sm font-semibold text-ink">{policy.title}</span><span className="mt-1 block text-xs text-slate">{policy.scope}</span></span>
                    <Badge tone={policy.status === "Enforced" ? "green" : "blue"} dot>{policy.status}</Badge>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden"><div className="border-t border-slate-200/50 bg-ice/50 p-4"><p className="text-xs leading-5 text-slate">{policy.detail}</p><div className="mt-3 flex flex-wrap gap-2">{policy.controls.map((control) => <span key={control} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-medium text-ink shadow-subtle"><CheckCircle2 className="h-3 w-3 text-verified" />{control}</span>)}</div></div></motion.div>}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </section>
        <section>
          <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-sm font-semibold text-ink">Governance activity</h2><p className="text-xs text-slate">Latest decisions and automated control checks</p></div><div className="flex items-center gap-1 rounded-lg bg-ice p-1">{["All", "Approved", "Verified"].map((item) => <button key={item} onClick={() => setActivityFilter(item)} className={cn("rounded-md px-2.5 py-1 text-[10px] font-semibold", activityFilter === item ? "bg-white text-ink shadow-subtle" : "text-slate")}>{item}</button>)}</div></div>
          <Card className="overflow-hidden">
            <div className="grid grid-cols-[1fr_auto] border-b border-slate-200/50 bg-ice/50 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-300"><span>Decision record</span><span>Status</span></div>
            <div className="divide-y divide-slate-200/40">
              {activities.map(([title, actor, context, status, time]) => (
                <div key={title} className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_.7fr_auto] md:items-center">
                  <div><p className="text-sm font-medium text-ink">{title}</p><p className="mt-1 text-[10px] text-slate-300">{context} · {time}</p></div>
                  <span className="text-xs text-slate">{actor}</span>
                  <Badge tone="green" dot>{status}</Badge>
                </div>
              ))}
            </div>
            <button className="flex w-full items-center justify-center gap-2 border-t border-slate-200/50 px-4 py-3 text-xs font-semibold text-enterprise transition hover:bg-ice">View complete audit trail <ArrowRight className="h-3.5 w-3.5" /></button>
          </Card>
        </section>
      </div>
    </PageFrame>
  );
}

const roadmap = [
  {
    phase: "Now",
    period: "Completed build",
    title: "Governed investigation foundation",
    status: "Demo complete",
    summary: "Evidence-led orchestration, human-approved capability expansion, independent verification, and deterministic replay.",
    milestones: ["Payment incident proven", "Audit-ready evidence model", "Capability approval workflow"],
  },
  {
    phase: "Next",
    period: "Q4 2026",
    title: "Institutional intelligence",
    status: "Design validated",
    summary: "Convert verified investigations into reusable knowledge and surface relevant precedent during active incidents.",
    milestones: ["Pattern recommendation", "Evidence similarity", "Cross-workspace learning"],
  },
  {
    phase: "Scale",
    period: "H1 2027",
    title: "Multi-domain resolution",
    status: "Planned",
    summary: "Apply the same governed investigation model to any operational domain through configurable connections, tools, and specialist packs.",
    milestones: ["Domain onboarding kit", "Federated policy controls", "Enterprise connector catalog"],
  },
  {
    phase: "Evolve",
    period: "H2 2027",
    title: "Predictive operational resilience",
    status: "Future horizon",
    summary: "Identify emerging failure patterns before material impact and recommend evidence-backed preventative controls.",
    milestones: ["Early-warning signals", "Control simulation", "Preventative recommendations"],
  },
];

export function FutureVisionPage() {
  const [active, setActive] = useState(0);
  const phase = roadmap[active];
  return (
    <PageFrame
      eyebrow="Platform evolution"
      title="Future Vision"
      description="A deliberate path from governed incident investigation to an institutional resolution intelligence layer."
    >
      <Card className="overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-midnight via-midnight-700 to-enterprise p-7 text-white lg:p-9">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-electric/20 blur-3xl" />
          <div className="relative max-w-3xl"><Badge tone="electric">North-star capability</Badge><h2 className="mt-4 text-2xl font-bold tracking-tight">From incident response to continuously learning operational resilience</h2><p className="mt-3 text-sm leading-6 text-white/65">Every verified investigation becomes governed institutional knowledge—improving the next response while preserving human control and evidence provenance.</p></div>
        </div>
        <div className="grid lg:grid-cols-[300px_1fr]">
          <div className="border-b border-slate-200/50 p-4 lg:border-b-0 lg:border-r">
            {roadmap.map((item, index) => (
              <button key={item.phase} onClick={() => setActive(index)} className={cn("mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition", active === index ? "bg-enterprise/8 text-enterprise" : "text-slate hover:bg-ice")}>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold", active === index ? "border-enterprise bg-enterprise text-white" : "border-slate-200 text-slate-300")}>{index + 1}</span>
                <span><span className="block text-[10px] font-semibold uppercase tracking-[.14em]">{item.period}</span><span className="mt-0.5 block text-xs font-semibold">{item.phase}</span></span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={phase.phase} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="p-6 lg:p-8">
              <div className="flex flex-wrap items-center gap-2"><Badge tone={active === 0 ? "green" : active === 1 ? "blue" : "neutral"} dot>{phase.status}</Badge><span className="text-xs text-slate-300">{phase.period}</span></div>
              <h3 className="mt-4 text-xl font-bold text-ink">{phase.title}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">{phase.summary}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {phase.milestones.map((milestone, index) => <div key={milestone} className="rounded-xl border border-slate-200/60 bg-ice/60 p-4"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-enterprise shadow-subtle">{index + 1}</span><p className="mt-3 text-xs font-semibold leading-5 text-ink">{milestone}</p></div>)}
              </div>
              <div className="mt-7 flex items-center gap-2 text-xs font-semibold text-enterprise"><CalendarDays className="h-4 w-4" /> Phase outcomes reviewed through enterprise architecture governance</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <InsightCard icon={Layers3} title="Design principle" value="Evidence first" note="No conclusion without trusted provenance" />
        <InsightCard icon={Users} title="Control model" value="Human governed" note="Material capability changes remain explicit" />
        <InsightCard icon={Sparkles} title="Learning model" value="Verified only" note="Closed investigations improve future response" />
      </div>
    </PageFrame>
  );
}

export function SettingsPage() {
  return (
    <PageFrame eyebrow="Workspace administration" title="Settings" description="Workspace identity, domain context, and investigation experience preferences.">
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5"><h3 className="text-sm font-semibold text-ink">Workspace</h3><p className="mt-1 text-xs text-slate">Operational context applied across investigations.</p><div className="mt-5 space-y-4"><SettingRow label="Workspace name" value="Enterprise Resolution Lab" /><SettingRow label="Active domain" value="Cross-border Payments" /><SettingRow label="Domain model" value="Switchable by workspace" /><SettingRow label="Environment" value="Demonstration" /></div></Card>
        <Card className="p-5"><h3 className="text-sm font-semibold text-ink">Experience</h3><p className="mt-1 text-xs text-slate">Presentation preferences for operators and reviewers.</p><div className="mt-5 space-y-4"><SettingRow label="Investigation refresh" value="Automatic" /><SettingRow label="Evidence detail" value="Business summary" /><SettingRow label="Technical trace" value="Available on demand" /></div></Card>
      </div>
    </PageFrame>
  );
}

function PageFrame({ eyebrow, title, description, action, children }: { eyebrow: string; title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8 lg:py-9">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.18em] text-enterprise"><Sparkles className="h-3.5 w-3.5" />{eyebrow}</div><h1 className="text-2xl font-bold tracking-tight text-ink lg:text-[28px]">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate">{description}</p></div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-2xs uppercase tracking-wider text-slate-300">{label}</p><p className="mt-1 text-sm font-semibold text-ink">{value}</p></div>;
}

function SummaryMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <Card className="p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-300">{label}</p><CheckCircle2 className="h-4 w-4 text-verified" /></div><p className="mt-2 text-xl font-bold text-ink">{value}</p><p className="mt-1 text-[10px] text-slate">{note}</p></Card>;
}

function Kpi({ icon: Icon, label, value, note, trend }: { icon: typeof BarChart3; label: string; value: string; note: string; trend?: "up" | "down" }) {
  return <Card className="p-5"><div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-enterprise/8 text-enterprise"><Icon className="h-4 w-4" /></div>{trend === "up" ? <TrendingUp className="h-4 w-4 text-verified" /> : trend === "down" ? <TrendingDown className="h-4 w-4 text-verified" /> : <Badge tone="neutral">Live</Badge>}</div><p className="mt-4 text-2xs font-semibold uppercase tracking-wider text-slate-300">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-ink">{value}</p><p className="mt-1 text-xs text-slate">{note}</p></Card>;
}

function InsightCard({ icon: Icon, title, value, note }: { icon: typeof Workflow; title: string; value: string; note: string }) {
  return <Card hover className="flex items-center gap-4 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-enterprise/8 text-enterprise"><Icon className="h-4 w-4" /></span><span><span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-300">{title}</span><span className="mt-0.5 block text-sm font-bold text-ink">{value}</span><span className="block text-[10px] text-slate">{note}</span></span></Card>;
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return <button className="flex w-full items-center justify-between rounded-xl border border-slate-200/50 bg-ice/70 px-4 py-3 text-left transition hover:border-enterprise/25 hover:bg-white"><span className="text-xs text-slate">{label}</span><span className="text-xs font-semibold text-ink">{value}</span></button>;
}
