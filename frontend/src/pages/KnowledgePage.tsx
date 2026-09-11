import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  FileStack,
  LibraryBig,
  Repeat2,
  Search,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const patterns = [
  {
    title: "Pending settlement after producer release",
    category: "Failure pattern",
    domain: "Cross-domain pattern · change + messaging",
    source: "Today’s completed demo investigation",
    confidence: "Verified",
    updated: "Reviewed today",
    summary:
      "A diagnostic pattern for transactions that complete core processing but fail downstream publication after a producer deployment.",
    signals: ["DOWNSTREAM_ACK_TIMEOUT", "Pending state", "Version cohort divergence"],
    guidance:
      "Compare successful and failed version cohorts, then inspect the release manifest and downstream consumer readiness before declaring causation.",
  },
  {
    title: "Inactive consumer behind a healthy producer",
    category: "Failure pattern",
    domain: "Reusable pattern · event-driven operations",
    source: "Verified root-cause evidence",
    confidence: "Verified",
    updated: "Reviewed today",
    summary:
      "Recognizes rising acknowledgement timeouts when producers remain healthy but a routed destination has no active consumer.",
    signals: ["Producer healthy", "Destination changed", "Active consumers = 0"],
    guidance:
      "Use deployment evidence and destination telemetry together; neither signal alone establishes the causal mechanism.",
  },
  {
    title: "Version correlation is not release causation",
    category: "Decision rule",
    domain: "Supervisor reasoning · evidence quality",
    source: "Verification control",
    confidence: "Governed",
    updated: "Configured today",
    summary:
      "Prevents a supervisor from treating a deployment timestamp or version cohort as sufficient proof of root cause.",
    signals: ["Release proximity", "Cohort divergence", "Missing change evidence"],
    guidance:
      "Require trusted change-history evidence that identifies what changed and explains how it produced the observed failure.",
  },
  {
    title: "Capability gap approval pattern",
    category: "Control pattern",
    domain: "Governance · dynamic specialists",
    source: "Today’s human approval event",
    confidence: "High confidence",
    updated: "Demonstrated today",
    summary:
      "Turns a missing material capability into a bounded proposal, explicit approval, and auditable specialist execution.",
    signals: ["Material evidence missing", "No registered specialist", "Human approval required"],
    guidance:
      "Propose the smallest specialist and tool scope able to close the evidence gap, then pause until approval is recorded.",
  },
];

const glossary = [
  {
    title: "Trusted evidence",
    definition:
      "A tool-sourced observation with provenance, timestamp, and an approved evidence boundary.",
    use: "May support or contradict a hypothesis.",
  },
  {
    title: "Specialist outcome",
    definition:
      "A bounded interpretation returned by one domain specialist after examining trusted evidence.",
    use: "Useful context, but not evidence by itself.",
  },
  {
    title: "Verified conclusion",
    definition:
      "A causal explanation independently challenged against contradictions and impact evidence.",
    use: "Required before a case can close.",
  },
  {
    title: "Capability gap",
    definition:
      "A material evidence need that no registered specialist can currently resolve.",
    use: "Creates a scoped, human-approved extension proposal.",
  },
];

const playbooks = [
  {
    title: "Post-release operational degradation",
    sequence:
      "Scope the cohort → validate data contract → inspect change evidence → verify causality",
    gates: "4 evidence gates",
  },
  {
    title: "Data quality regression",
    sequence:
      "Compare source and canonical records → isolate variant → inspect mapping change → controlled replay",
    gates: "3 evidence gates",
  },
  {
    title: "Event-driven service timeout",
    sequence:
      "Confirm producer health → inspect route → measure consumer readiness → reconcile acknowledgements",
    gates: "4 evidence gates",
  },
];

export function KnowledgePage() {
  const [view, setView] = useState<"patterns" | "glossary" | "playbooks">("patterns");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openPattern, setOpenPattern] = useState(patterns[0].title);
  const filtered = patterns.filter(
    (pattern) =>
      (category === "All" || pattern.category === category) &&
      `${pattern.title} ${pattern.summary} ${pattern.signals.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="mb-7">
        <div className="mb-2 flex items-center gap-2 text-2xs font-semibold uppercase tracking-[.18em] text-enterprise">
          <LibraryBig className="h-3.5 w-3.5" /> Reusable intelligence
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink lg:text-[28px]">
          Knowledge Center
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate">
          Investigations are individual case records. The Knowledge Center promotes verified
          lessons from those cases into reusable patterns, evidence definitions, and response
          playbooks.
        </p>
      </header>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <FileStack className="h-4 w-4 text-enterprise" /> Investigations
          </div>
          <p className="mt-2 text-xs leading-5 text-slate">
            Time-bound case records: incident, decisions, specialist outputs, evidence,
            approvals, verification, and final report.
          </p>
          <div className="mt-4">
            <Badge tone="neutral">What happened once</Badge>
          </div>
        </Card>
        <div className="hidden items-center text-slate-300 lg:flex">
          <ArrowRight className="h-5 w-5" />
        </div>
        <Card className="border-verified/20 bg-verified/5 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <LibraryBig className="h-4 w-4 text-verified" /> Knowledge
          </div>
          <p className="mt-2 text-xs leading-5 text-slate">
            Reviewed intelligence that helps the supervisor recognize signals, select
            evidence, and avoid disproven reasoning in future cases.
          </p>
          <div className="mt-4">
            <Badge tone="green">What should be reused</Badge>
          </div>
        </Card>
      </div>

      <Card className="mb-5 overflow-hidden">
        <div className="grid divide-y divide-slate-200/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            ["1", "Verified case closes", "Only evidence-backed conclusions qualify"],
            ["2", "Pattern is reviewed", "Signals, limits, and provenance are retained"],
            ["3", "Supervisor can reuse it", "Guidance informs—but never replaces—new evidence"],
          ].map(([step, title, text]) => (
            <div key={step} className="p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-enterprise/8 text-[10px] font-bold text-enterprise">
                {step}
              </span>
              <p className="mt-3 text-xs font-semibold text-ink">{title}</p>
              <p className="mt-1 text-[10px] leading-4 text-slate">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex overflow-x-auto rounded-xl border border-slate-200/60 bg-ice p-1">
            {([
              ["patterns", "Patterns"],
              ["glossary", "Evidence glossary"],
              ["playbooks", "Playbooks"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition",
                  view === id ? "bg-white text-ink shadow-subtle" : "text-slate",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {view === "patterns" && (
            <>
              <label className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200/60 bg-ice px-4 py-3">
                <Search className="h-4 w-4 text-slate-300" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search signals, guidance, or source"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-300"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {["All", "Failure pattern", "Decision rule", "Control pattern"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setCategory(item)}
                      className={cn(
                        "rounded-xl px-3 py-2 text-xs font-semibold transition",
                        category === item
                          ? "bg-midnight text-white"
                          : "bg-ice text-slate hover:bg-ice-200",
                      )}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {view === "glossary" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {glossary.map((item) => (
            <Card key={item.title} className="p-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-enterprise" />
                <h2 className="text-sm font-semibold text-ink">{item.title}</h2>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate">{item.definition}</p>
              <p className="mt-3 rounded-xl bg-ice px-3 py-2 text-[10px] font-medium text-enterprise">
                {item.use}
              </p>
            </Card>
          ))}
        </div>
      ) : view === "playbooks" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {playbooks.map((playbook) => (
            <Card key={playbook.title} hover className="p-5">
              <Repeat2 className="h-5 w-5 text-enterprise" />
              <h2 className="mt-4 text-sm font-semibold text-ink">{playbook.title}</h2>
              <p className="mt-3 text-xs leading-5 text-slate">{playbook.sequence}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-200/50 pt-4">
                <Badge tone="blue">Reusable</Badge>
                <span className="text-[10px] text-slate-300">{playbook.gates}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate">
              <span className="font-semibold text-ink">{filtered.length}</span> reusable
              knowledge patterns
            </p>
            <span className="text-[10px] font-medium uppercase tracking-[.16em] text-slate-300">
              Hackathon demo workspace · today
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((pattern) => {
              const open = openPattern === pattern.title;
              return (
                <Card
                  key={pattern.title}
                  hover
                  className={cn("overflow-hidden", open && "border-enterprise/25")}
                >
                  <button
                    onClick={() => setOpenPattern(open ? "" : pattern.title)}
                    className="w-full p-5 text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric/10 text-enterprise">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          tone={pattern.confidence === "Verified" ? "green" : "blue"}
                        >
                          {pattern.confidence}
                        </Badge>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-slate-300 transition-transform",
                            open && "rotate-180",
                          )}
                        />
                      </div>
                    </div>
                    <h2 className="mt-4 text-sm font-semibold text-ink">{pattern.title}</h2>
                    <p className="mt-1 text-xs text-enterprise">{pattern.domain}</p>
                    <p className="mt-3 text-xs leading-5 text-slate">{pattern.summary}</p>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-200/50 bg-ice/50 px-5 py-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-300">
                            Recognition signals
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {pattern.signals.map((signal) => (
                              <span
                                key={signal}
                                className="rounded-lg border border-slate-200/60 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate"
                              >
                                {signal}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4 rounded-xl border border-enterprise/10 bg-white p-3">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-enterprise">
                              Reusable guidance
                            </p>
                            <p className="mt-1 text-[10px] leading-4 text-slate">
                              {pattern.guidance}
                            </p>
                          </div>
                          <div className="mt-4 flex flex-col gap-1 text-[10px] text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                            <span>Source: {pattern.source}</span>
                            <span>{pattern.updated}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
