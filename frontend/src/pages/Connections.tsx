import { useMemo, useState } from "react";
import {
  Activity,
  Braces,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  GitBranch,
  HardDrive,
  Network,
  Plus,
  RadioTower,
  Search,
  ServerCog,
  ShieldCheck,
  TicketCheck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

type ConnectionStatus = "Connected" | "Ready" | "Draft";

type Connection = {
  id: string;
  name: string;
  provider: string;
  category: string;
  environment: string;
  status: ConnectionStatus;
  icon: LucideIcon;
  purpose: string;
  tools: string[];
  boundary: string;
};

const initialConnections: Connection[] = [
  {
    id: "payment-events",
    name: "Payment Event Store",
    provider: "PostgreSQL",
    category: "Operational data",
    environment: "Demo production",
    status: "Connected",
    icon: Database,
    purpose: "Payment lifecycle, settlement status, and cohort evidence.",
    tools: ["search_payments", "get_payment_lifecycle", "compare_payment_cohorts"],
    boundary: "Read-only views · row-level filtering",
  },
  {
    id: "settlement-stream",
    name: "Settlement Event Stream",
    provider: "Kafka",
    category: "Event streaming",
    environment: "Demo production",
    status: "Connected",
    icon: RadioTower,
    purpose: "Publication outcomes, acknowledgement timing, and consumer readiness.",
    tools: ["inspect_topic_health", "read_event_headers", "compare_consumer_lag"],
    boundary: "Read-only consumer · payload masking",
  },
  {
    id: "schema-registry",
    name: "Canonical Schema Registry",
    provider: "Confluent Schema Registry",
    category: "Data contracts",
    environment: "Demo shared",
    status: "Connected",
    icon: Braces,
    purpose: "Versioned contracts, compatibility rules, and field mappings.",
    tools: ["get_schema_version", "compare_contracts", "inspect_mapping_rules"],
    boundary: "Metadata only · no schema mutation",
  },
  {
    id: "change-intelligence",
    name: "Change Intelligence",
    provider: "Git + Deployment API",
    category: "Engineering systems",
    environment: "Demo production",
    status: "Ready",
    icon: GitBranch,
    purpose: "Release manifests, configuration diffs, and deployment history.",
    tools: ["get_release_manifest", "compare_deployments", "inspect_configuration_diff"],
    boundary: "Human-approved capability · read-only",
  },
  {
    id: "observability",
    name: "Service Observability",
    provider: "OpenTelemetry",
    category: "Telemetry",
    environment: "Demo production",
    status: "Ready",
    icon: Activity,
    purpose: "Logs, metrics, traces, and service dependency evidence.",
    tools: ["query_logs", "read_service_metrics", "trace_request_path"],
    boundary: "Time-scoped queries · secret redaction",
  },
  {
    id: "service-management",
    name: "Service Management",
    provider: "ITSM API",
    category: "Operations",
    environment: "Configuration draft",
    status: "Draft",
    icon: TicketCheck,
    purpose: "Incident, problem, change, and remediation records.",
    tools: ["read_incident", "search_changes", "link_problem_record"],
    boundary: "Read-only draft · activation approval required",
  },
];

const templates = [
  {
    id: "sql",
    name: "SQL database",
    description: "PostgreSQL, MySQL, SQL Server, Oracle",
    icon: Database,
    tools: ["Run governed query", "Inspect schema", "Compare cohorts"],
  },
  {
    id: "warehouse",
    name: "Data warehouse",
    description: "BigQuery, Snowflake, Databricks",
    icon: Cloud,
    tools: ["Query dataset", "Inspect lineage", "Profile records"],
  },
  {
    id: "event",
    name: "Event stream",
    description: "Kafka, Pub/Sub, Event Hubs",
    icon: RadioTower,
    tools: ["Inspect topic", "Read event headers", "Measure consumer lag"],
  },
  {
    id: "api",
    name: "REST or GraphQL API",
    description: "Internal services and vendor platforms",
    icon: Network,
    tools: ["Call approved endpoint", "Read resource", "Compare responses"],
  },
  {
    id: "observability-template",
    name: "Observability",
    description: "OpenTelemetry, Splunk, Datadog",
    icon: Activity,
    tools: ["Query logs", "Read metrics", "Trace request"],
  },
  {
    id: "source",
    name: "Source & deployment",
    description: "GitHub, GitLab, CI/CD and configuration",
    icon: Code2,
    tools: ["Read commit diff", "Inspect release", "Compare configuration"],
  },
  {
    id: "itsm",
    name: "Service management",
    description: "Incident, change, problem and CMDB APIs",
    icon: TicketCheck,
    tools: ["Read ticket", "Search change", "Inspect dependency"],
  },
  {
    id: "object",
    name: "Documents & object storage",
    description: "S3, GCS, SharePoint and knowledge stores",
    icon: HardDrive,
    tools: ["Find document", "Read approved object", "Extract metadata"],
  },
];

export function ConnectionsPage() {
  const [connections, setConnections] = useState(initialConnections);
  const [activeConnection, setActiveConnection] = useState(initialConnections[0].id);
  const [tab, setTab] = useState<"workspace" | "catalog">("workspace");
  const [query, setQuery] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
  const [draftName, setDraftName] = useState("");
  const [draftEnvironment, setDraftEnvironment] = useState("Development");

  const filteredConnections = useMemo(
    () =>
      connections.filter((connection) =>
        `${connection.name} ${connection.provider} ${connection.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [connections, query],
  );
  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) =>
        `${template.name} ${template.description}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const saveDraft = () => {
    const template = templates.find((item) => item.id === selectedTemplate) ?? templates[0];
    const name = draftName.trim() || `${template.name} connection`;
    const draft: Connection = {
      id: `draft-${Date.now()}`,
      name,
      provider: template.description.split(",")[0],
      category: template.name,
      environment: draftEnvironment,
      status: "Draft",
      icon: template.icon,
      purpose: "Workspace configuration draft awaiting credentials and governance review.",
      tools: template.tools.map((tool) => tool.toLowerCase().replaceAll(" ", "_")),
      boundary: "No runtime access · activation approval required",
    };
    setConnections((current) => [draft, ...current]);
    setActiveConnection(draft.id);
    setTab("workspace");
    setSetupOpen(false);
    setDraftName("");
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-2xs font-semibold uppercase tracking-[.18em] text-enterprise">
            <Network className="h-3.5 w-3.5" /> Evidence fabric
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink lg:text-[28px]">
            Connections & tools
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate">
            Connect any governed operational source, then expose narrowly scoped read tools
            that specialists can use as trusted evidence.
          </p>
        </div>
        <button
          onClick={() => setSetupOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-midnight px-4 py-3 text-xs font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-midnight-600"
        >
          <Plus className="h-4 w-4" /> Add connection
        </button>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Workspace connections" value={String(connections.length)} note="Across 6 connector types" />
        <Summary label="Approved tools" value="19" note="Read-only evidence actions" />
        <Summary label="Runtime writes" value="0" note="Evidence boundary enforced" />
        <Summary label="Activation model" value="Governed" note="Human approval for new access" />
      </div>

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex rounded-xl border border-slate-200/60 bg-ice p-1">
            <button
              onClick={() => setTab("workspace")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition lg:flex-none",
                tab === "workspace" ? "bg-white text-ink shadow-subtle" : "text-slate",
              )}
            >
              Workspace
            </button>
            <button
              onClick={() => setTab("catalog")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition lg:flex-none",
                tab === "catalog" ? "bg-white text-ink shadow-subtle" : "text-slate",
              )}
            >
              Connector catalog
            </button>
          </div>
          <label className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200/60 bg-white px-4 py-2.5">
            <Search className="h-4 w-4 text-slate-300" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search connections, providers, or capabilities"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-300"
            />
          </label>
        </div>
      </Card>

      {tab === "workspace" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredConnections.map((connection) => {
            const Icon = connection.icon;
            const active = connection.id === activeConnection;
            return (
              <Card
                key={connection.id}
                hover
                onClick={() => setActiveConnection(connection.id)}
                className={cn(
                  "cursor-pointer overflow-hidden p-5",
                  active && "border-enterprise/30 shadow-glow",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-enterprise/8 text-enterprise">
                    <Icon className="h-5 w-5" />
                  </span>
                  <Badge
                    tone={
                      connection.status === "Connected"
                        ? "green"
                        : connection.status === "Ready"
                          ? "blue"
                          : "amber"
                    }
                    dot
                  >
                    {connection.status}
                  </Badge>
                </div>
                <h2 className="mt-4 text-sm font-semibold text-ink">{connection.name}</h2>
                <p className="mt-1 text-xs font-medium text-enterprise">
                  {connection.provider} · {connection.category}
                </p>
                <p className="mt-3 text-xs leading-5 text-slate">{connection.purpose}</p>
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
                          Specialist tools
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {connection.tools.map((tool) => (
                            <span
                              key={tool}
                              className="rounded-lg bg-ice px-2 py-1 font-mono text-[9px] text-slate"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-[10px] text-verified-600">
                          <ShieldCheck className="h-3.5 w-3.5" /> {connection.boundary}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="mt-4 flex items-center justify-between border-t border-slate-200/40 pt-4 text-[10px] text-slate-300">
                  <span>{connection.environment}</span>
                  <span className="flex items-center gap-1 font-semibold text-enterprise">
                    Inspect <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-slate">
              Templates create a configuration draft; credentials and activation remain governed.
            </p>
            <Badge tone="neutral">{filteredTemplates.length} templates</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.id} hover className="flex min-h-52 flex-col p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric/10 text-enterprise">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-sm font-semibold text-ink">{template.name}</h2>
                  <p className="mt-1 text-xs leading-5 text-slate">{template.description}</p>
                  <div className="mt-auto pt-4">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setSetupOpen(true);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-enterprise"
                    >
                      Configure template <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <AnimatePresence>
        {setupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-midnight/45 backdrop-blur-sm"
            onClick={() => setSetupOpen(false)}
          >
            <motion.div
              initial={{ x: 36 }}
              animate={{ x: 0 }}
              exit={{ x: 36 }}
              className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl scrollbar-thin"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/60 bg-white/95 px-5 py-4 backdrop-blur">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-enterprise">
                    Configuration draft
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-ink">Add a data connection</h2>
                </div>
                <button
                  onClick={() => setSetupOpen(false)}
                  className="rounded-xl p-2 text-slate hover:bg-ice hover:text-ink"
                  aria-label="Close connection setup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-6 p-5 sm:p-6">
                <section>
                  <p className="text-xs font-semibold text-ink">1. Connector type</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {templates.map((template) => {
                      const Icon = template.icon;
                      const selected = selectedTemplate === template.id;
                      return (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                            selected
                              ? "border-enterprise/40 bg-enterprise/5 shadow-subtle"
                              : "border-slate-200/60 hover:bg-ice",
                          )}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-enterprise shadow-subtle">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-xs font-semibold text-ink">
                              {template.name}
                            </span>
                            <span className="mt-0.5 block text-[9px] text-slate">
                              {template.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
                <section>
                  <p className="text-xs font-semibold text-ink">2. Workspace context</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label>Connection name</Label>
                      <Input
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        placeholder="e.g. Customer servicing warehouse"
                      />
                    </div>
                    <div>
                      <Label>Environment</Label>
                      <Select
                        value={draftEnvironment}
                        onChange={(event) => setDraftEnvironment(event.target.value)}
                      >
                        <option>Development</option>
                        <option>Test</option>
                        <option>Production</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Access mode</Label>
                      <Select value="Read only" disabled>
                        <option>Read only</option>
                      </Select>
                    </div>
                  </div>
                </section>
                <section className="rounded-2xl border border-verified/20 bg-verified/5 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-verified" />
                    <div>
                      <p className="text-xs font-semibold text-ink">Governed by default</p>
                      <p className="mt-1 text-xs leading-5 text-slate">
                        Saving creates a local configuration draft only. Runtime credentials,
                        tool scopes, and production activation require workspace approval.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
              <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200/60 bg-white/95 p-5 backdrop-blur sm:flex-row sm:justify-end">
                <button
                  onClick={() => setSetupOpen(false)}
                  className="rounded-xl border border-slate-200/70 px-4 py-2.5 text-xs font-semibold text-slate"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDraft}
                  className="flex items-center justify-center gap-2 rounded-xl bg-midnight px-4 py-2.5 text-xs font-semibold text-white"
                >
                  <ServerCog className="h-4 w-4" /> Save configuration draft
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
