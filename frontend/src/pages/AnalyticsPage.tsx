import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Database,
  FileCheck2,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const views = {
  session: {
    label: "Latest run",
    metrics: [
      ["Completed runs", "1", "Live API record"],
      ["Resolution time", "3m 20s", "Create to verified report"],
      ["Evidence items", "8", "Trusted tool outputs"],
      ["Human approvals", "1", "Release capability gap"],
    ],
    bars: [28, 46, 72, 38],
  },
  today: {
    label: "Today",
    metrics: [
      ["UI test runs", "4", "Repeated end-to-end validation"],
      ["Successful resumes", "4 / 4", "No duplicate approvals"],
      ["Specialist paths", "3–4", "Chosen by supervisor"],
      ["Runtime crashes", "0", "Across completed views"],
    ],
    bars: [38, 61, 54, 78],
  },
  scenarios: {
    label: "Scenario lab",
    metrics: [
      ["Prepared scenarios", "3", "Clearly labelled examples"],
      ["Domains represented", "4", "Payments plus 3 extensions"],
      ["Connector patterns", "8", "Database to ITSM"],
      ["Knowledge patterns", "4", "Reusable guidance"],
    ],
    bars: [56, 64, 72, 82],
  },
};

export function AnalyticsPage() {
  const [view, setView] = useState<keyof typeof views>("session");
  const [activeStage, setActiveStage] = useState(2);
  const data = views[view];

  return (
    <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-2xs font-semibold uppercase tracking-[.18em] text-enterprise">
            <Sparkles className="h-3.5 w-3.5" /> Demo telemetry
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink lg:text-[28px]">
            Analytics
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate">
            Session-scale evidence from today’s hackathon build and UI validation. These
            figures intentionally describe the demo workspace—not fictional enterprise history.
          </p>
        </div>
        <div className="flex overflow-x-auto rounded-xl border border-slate-200/60 bg-white p-1 shadow-subtle">
          {(Object.keys(views) as Array<keyof typeof views>).map((item) => (
            <button
              key={item}
              onClick={() => setView(item)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                view === item ? "bg-midnight text-white" : "text-slate hover:bg-ice",
              )}
            >
              {views[item].label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map(([label, value, note], index) => {
          const icons = [CheckCircle2, Timer, FileCheck2, Users];
          const Icon = icons[index];
          return (
            <Card key={label} className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-enterprise/8 text-enterprise">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-2xs font-semibold uppercase tracking-wider text-slate-300">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{value}</p>
              <p className="mt-1 text-xs text-slate">{note}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Latest investigation journey</h2>
              <p className="mt-1 text-xs text-slate">
                Relative stage effort from the completed payment demonstration
              </p>
            </div>
            <Badge tone="green" dot>
              Live run
            </Badge>
          </div>
          <div className="mt-7 grid h-56 grid-cols-4 items-end gap-3">
            {data.bars.map((height, index) => {
              const labels = ["Payment", "Data", "Release", "Verify"];
              return (
                <button
                  key={labels[index]}
                  onClick={() => setActiveStage(index)}
                  className="group flex h-full flex-col justify-end"
                >
                  <div className="flex flex-1 items-end">
                    <span
                      className={cn(
                        "w-full rounded-t-lg transition-all",
                        activeStage === index
                          ? "bg-electric shadow-glow"
                          : "bg-enterprise/70 group-hover:bg-enterprise",
                      )}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="mt-3 truncate text-[10px] font-medium text-slate">
                    {labels[index]}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Platform proof points</h2>
          <p className="mt-1 text-xs text-slate">
            What the implementation demonstrates today
          </p>
          <div className="mt-5 space-y-4">
            {[
              [PlugZap, "Configurable evidence fabric", "6 connection examples · 19 tool actions"],
              [Workflow, "Backend-owned orchestration", "UI reflects state; it does not invent stages"],
              [ShieldCheck, "Human-governed expansion", "One capability approval, then automatic resume"],
              [Database, "Reusable learning layer", "Patterns separated from case records"],
            ].map(([Icon, title, note]) => {
              const ItemIcon = Icon as typeof Activity;
              return (
                <div key={String(title)} className="flex gap-3 rounded-xl bg-ice/60 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-enterprise shadow-subtle">
                    <ItemIcon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-ink">{String(title)}</span>
                    <span className="mt-0.5 block text-[10px] leading-4 text-slate">
                      {String(note)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
