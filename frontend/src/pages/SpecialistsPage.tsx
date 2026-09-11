import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  GitBranch,
  Network,
  Plus,
  PlugZap,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Specialist = {
  name: string;
  domain: string;
  icon: LucideIcon;
  validation: string;
  cases: number;
  status: "Available" | "Governed" | "Draft";
  purpose: string;
  evidence: string[];
  tools: string[];
};

const baseSpecialists: Specialist[] = [
  {
    name: "Payment Investigation Agent",
    domain: "Payment operations",
    icon: Activity,
    validation: "Validated today",
    cases: 4,
    status: "Available",
    purpose:
      "Scopes affected payments, reconstructs lifecycle events, and compares successful and failed cohorts.",
    evidence: ["Payment lifecycle", "Settlement status", "Cohort comparison"],
    tools: ["search_payments", "get_payment_lifecycle", "compare_payment_cohorts"],
  },
  {
    name: "Data Contract Agent",
    domain: "Data quality",
    icon: Database,
    validation: "Validated today",
    cases: 3,
    status: "Available",
    purpose:
      "Validates source schemas, canonical contracts, field mappings, and transformed records.",
    evidence: ["Schema definitions", "Mapping rules", "Record comparison"],
    tools: ["get_schema_version", "compare_contracts", "inspect_mapping_rules"],
  },
  {
    name: "Pipeline Reliability Agent",
    domain: "Platform reliability",
    icon: GitBranch,
    validation: "Validated today",
    cases: 2,
    status: "Available",
    purpose:
      "Examines orchestration health, task execution, and record-count reconciliation.",
    evidence: ["Pipeline runs", "Task health", "Count reconciliation"],
    tools: ["get_pipeline_runs", "inspect_task_health", "reconcile_record_counts"],
  },
  {
    name: "Release Change Analysis Agent",
    domain: "Change intelligence",
    icon: Network,
    validation: "Approved on demand",
    cases: 1,
    status: "Governed",
    purpose:
      "Correlates release history with code, configuration, routing, and deployment changes.",
    evidence: ["Deployment history", "Change manifest", "Configuration diff"],
    tools: ["get_release_manifest", "compare_deployments", "inspect_configuration_diff"],
  },
  {
    name: "Verification Agent",
    domain: "Independent assurance",
    icon: ShieldCheck,
    validation: "Validated today",
    cases: 4,
    status: "Available",
    purpose:
      "Challenges conclusions, searches for contradictions, and validates the final causal chain.",
    evidence: ["Contradiction search", "Impact validation", "Root-cause assurance"],
    tools: ["read_investigation_evidence", "challenge_hypothesis", "verify_causal_chain"],
  },
];

const toolOptions = [
  { id: "sql.readonly_query", label: "Governed SQL query", source: "SQL / warehouse" },
  { id: "events.inspect_stream", label: "Inspect event stream", source: "Kafka / Pub/Sub" },
  { id: "telemetry.query_logs", label: "Query logs & metrics", source: "Observability" },
  { id: "contracts.compare_schema", label: "Compare data contracts", source: "Schema registry" },
  { id: "change.read_diff", label: "Read release diff", source: "Source & deployment" },
  { id: "itsm.search_records", label: "Search incident & change", source: "Service management" },
  { id: "documents.retrieve", label: "Retrieve approved document", source: "Knowledge store" },
  { id: "api.read_resource", label: "Call read-only API", source: "REST / GraphQL" },
];

export function SpecialistsPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(baseSpecialists[0].name);
  const [draftSpecialists, setDraftSpecialists] = useState<Specialist[]>([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [specialistName, setSpecialistName] = useState("");
  const [specialistDomain, setSpecialistDomain] = useState("Customer operations");
  const [specialistPurpose, setSpecialistPurpose] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([
    "sql.readonly_query",
    "telemetry.query_logs",
  ]);
  const specialists = [...draftSpecialists, ...baseSpecialists];

  const toggleTool = (toolId: string) => {
    setSelectedTools((current) =>
      current.includes(toolId)
        ? current.filter((item) => item !== toolId)
        : [...current, toolId],
    );
  };

  const saveDraft = () => {
    const tools = toolOptions.filter((tool) => selectedTools.includes(tool.id));
    const name = specialistName.trim() || "New Domain Specialist";
    setDraftSpecialists((current) => [
      {
        name,
        domain: specialistDomain,
        icon: WandSparkles,
        validation: "Configuration draft",
        cases: 0,
        status: "Draft",
        purpose:
          specialistPurpose.trim() ||
          "A workspace specialist draft awaiting tool-scope and governance approval.",
        evidence: tools.map((tool) => tool.source),
        tools: tools.map((tool) => tool.id),
      },
      ...current,
    ]);
    setSelected(name);
    setBuilderOpen(false);
    setSpecialistName("");
    setSpecialistPurpose("");
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-2xs font-semibold uppercase tracking-[.18em] text-enterprise">
            <Bot className="h-3.5 w-3.5" /> Extensible intelligence
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink lg:text-[28px]">
            AI Specialists
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate">
            Specialists combine domain instructions with approved connection tools. The
            payment agents prove the pattern; the same registry can support any operational
            domain.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => navigate("/connections")}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-subtle"
          >
            <PlugZap className="h-4 w-4 text-enterprise" /> Manage connections
          </button>
          <button
            onClick={() => setBuilderOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-midnight px-4 py-2.5 text-xs font-semibold text-white shadow-card"
          >
            <Plus className="h-4 w-4" /> Add specialist
          </button>
        </div>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Summary
          label="Registered specialists"
          value={String(specialists.length)}
          note="Permanent registry plus local drafts"
        />
        <Summary label="Connected tool actions" value="19" note="Across governed evidence sources" />
        <Summary label="Dynamic capabilities" value="1" note="Approved during today’s demo run" />
      </div>

      <Card className="mb-5 overflow-hidden border-approval/20">
        <div className="grid lg:grid-cols-[1fr_auto_1fr]">
          <div className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Wrench className="h-4 w-4 text-enterprise" /> Preconfigured specialist
            </div>
            <p className="mt-2 text-xs leading-5 text-slate">
              Teams register specialists in advance by combining instructions, evidence
              outputs, and least-privilege tools exposed by Connections.
            </p>
          </div>
          <div className="hidden items-center px-2 text-slate-300 lg:flex">
            <ArrowRight className="h-5 w-5" />
          </div>
          <div className="border-t border-approval/15 bg-approval/5 p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Sparkles className="h-4 w-4 text-approval" /> Runtime capability gap
            </div>
            <p className="mt-2 text-xs leading-5 text-slate">
              If a material capability is absent, the supervisor proposes a scoped specialist
              and pauses for human approval before continuing.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {specialists.map((specialist) => {
          const Icon = specialist.icon;
          const active = selected === specialist.name;
          return (
            <Card
              key={specialist.name}
              hover
              onClick={() => setSelected(specialist.name)}
              className={cn(
                "cursor-pointer overflow-hidden p-5",
                active && "border-enterprise/30 shadow-glow",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-enterprise/8 text-enterprise">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge
                  tone={
                    specialist.status === "Draft" || specialist.status === "Governed"
                      ? "amber"
                      : "green"
                  }
                  dot
                >
                  {specialist.status}
                </Badge>
              </div>
              <h2 className="mt-5 text-base font-semibold text-ink">{specialist.name}</h2>
              <p className="mt-1 text-xs font-medium text-enterprise">{specialist.domain}</p>
              <p className="mt-3 text-xs leading-5 text-slate">{specialist.purpose}</p>
              <AnimatePresence initial={false}>
                {active && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 border-t border-slate-200/50 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-300">
                        Evidence outputs
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {specialist.evidence.map((item) => (
                          <span
                            key={item}
                            className="rounded-lg bg-ice px-2 py-1 text-[10px] text-slate"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-300">
                        Tool scope
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {specialist.tools.map((tool) => (
                          <span
                            key={tool}
                            className="rounded-lg border border-slate-200/60 bg-white px-2 py-1 font-mono text-[9px] text-slate"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200/40 pt-4">
                <Metric label="Control status" value={specialist.validation} />
                <Metric label="Demo runs" value={String(specialist.cases)} />
              </div>
            </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {builderOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-midnight/45 backdrop-blur-sm"
            onClick={() => setBuilderOpen(false)}
          >
            <motion.div
              initial={{ x: 36 }}
              animate={{ x: 0 }}
              exit={{ x: 36 }}
              className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl scrollbar-thin"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/60 bg-white/95 px-5 py-4 backdrop-blur">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-enterprise">
                    Specialist builder
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-ink">
                    Create a specialist draft
                  </h2>
                </div>
                <button
                  onClick={() => setBuilderOpen(false)}
                  aria-label="Close specialist builder"
                  className="rounded-xl p-2 text-slate hover:bg-ice hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-6 p-5 sm:p-6">
                <section>
                  <p className="text-xs font-semibold text-ink">1. Domain instruction</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-medium text-slate">
                        Specialist name
                      </span>
                      <input
                        value={specialistName}
                        onChange={(event) => setSpecialistName(event.target.value)}
                        placeholder="e.g. Customer Complaint Resolution Agent"
                        className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-electric"
                      />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-medium text-slate">
                        Domain
                      </span>
                      <select
                        value={specialistDomain}
                        onChange={(event) => setSpecialistDomain(event.target.value)}
                        className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm text-ink outline-none"
                      >
                        <option>Customer operations</option>
                        <option>Technology operations</option>
                        <option>Financial crime operations</option>
                        <option>Data operations</option>
                        <option>Supply chain operations</option>
                        <option>Custom domain</option>
                      </select>
                    </label>
                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-medium text-slate">
                        Investigation responsibility
                      </span>
                      <textarea
                        value={specialistPurpose}
                        onChange={(event) => setSpecialistPurpose(event.target.value)}
                        rows={4}
                        placeholder="Describe the questions this specialist answers and the evidence it must return."
                        className="w-full resize-none rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-electric"
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-ink">2. Approved tool scope</p>
                      <p className="mt-1 text-[10px] text-slate">
                        Tools come from workspace Connections; no free-form system access.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/connections")}
                      className="text-[10px] font-semibold text-enterprise"
                    >
                      Open Connections
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {toolOptions.map((tool) => {
                      const checked = selectedTools.includes(tool.id);
                      return (
                        <button
                          key={tool.id}
                          onClick={() => toggleTool(tool.id)}
                          className={cn(
                            "rounded-xl border p-3 text-left transition",
                            checked
                              ? "border-enterprise/35 bg-enterprise/5"
                              : "border-slate-200/60 hover:bg-ice",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                checked
                                  ? "border-enterprise bg-enterprise text-white"
                                  : "border-slate-200",
                              )}
                            >
                              {checked && <CheckCircle2 className="h-3 w-3" />}
                            </span>
                            <span>
                              <span className="block text-xs font-semibold text-ink">
                                {tool.label}
                              </span>
                              <span className="mt-1 block text-[9px] text-slate">
                                {tool.source}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-2xl border border-verified/20 bg-verified/5 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-verified" />
                    <div>
                      <p className="text-xs font-semibold text-ink">Activation gates</p>
                      <p className="mt-1 text-xs leading-5 text-slate">
                        Draft specialists remain inactive until instructions, evidence
                        outputs, tool scopes, and the human-approval policy are reviewed.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
              <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200/60 bg-white/95 p-5 backdrop-blur sm:flex-row sm:justify-end">
                <button
                  onClick={() => setBuilderOpen(false)}
                  className="rounded-xl border border-slate-200/70 px-4 py-2.5 text-xs font-semibold text-slate"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDraft}
                  className="flex items-center justify-center gap-2 rounded-xl bg-midnight px-4 py-2.5 text-xs font-semibold text-white"
                >
                  <WandSparkles className="h-4 w-4" /> Save specialist draft
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Summary({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-300">
          {label}
        </p>
        <CheckCircle2 className="h-4 w-4 text-verified" />
      </div>
      <p className="mt-2 text-xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-[10px] text-slate">{note}</p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs uppercase tracking-wider text-slate-300">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-ink">{value}</p>
    </div>
  );
}
