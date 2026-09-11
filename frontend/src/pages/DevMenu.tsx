import { useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDemoInvestigation } from "@/api/investigations";
import { useHealth } from "@/hooks/useHealth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function DevMenu() {
  const navigate = useNavigate();
  const health = useHealth();
  const demoMode = import.meta.env.VITE_DEMO_MODE === "true";

  const demo = useQuery({
    queryKey: ["demo-investigation"],
    queryFn: getDemoInvestigation,
    enabled: false,
  });

  const handleLoadKnown = async () => {
    const result = await demo.refetch();
    if (result.data) {
      navigate(`/investigation/${result.data.investigation_id}`);
    }
  };

  return (
    <div className="px-8 py-8 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Wrench className="w-5 h-5 text-slate" />
        <h1 className="text-xl font-bold text-ink tracking-tight">Developer menu</h1>
      </div>

      <Card className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">Backend connectivity</span>
          {health.isSuccess ? (
            <Badge tone="green" dot>
              {health.data.service} v{health.data.version}
            </Badge>
          ) : health.isError ? (
            <Badge tone="red" dot>
              Unreachable
            </Badge>
          ) : (
            <Badge tone="slate">Checking…</Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">Demo mode</span>
          <Badge tone={demoMode ? "amber" : "slate"}>{demoMode ? "Enabled" : "Disabled"}</Badge>
        </div>
      </Card>

      <Card className="px-5 py-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-ink mb-1">Load known incident</h2>
          <p className="text-xs text-slate">
            Fetches <code className="font-mono text-2xs">GET /api/v1/investigations/demo</code> — a real,
            completed investigation returned by the backend for UI development, not a fabricated fixture.
          </p>
        </div>
        <Button variant="secondary" loading={demo.isFetching} onClick={handleLoadKnown}>
          Load known incident
        </Button>
      </Card>

      <p className="text-2xs text-slate-300">
        This menu is intentionally not linked from the primary navigation — access it directly at{" "}
        <code className="font-mono">/dev</code>.
      </p>
    </div>
  );
}
