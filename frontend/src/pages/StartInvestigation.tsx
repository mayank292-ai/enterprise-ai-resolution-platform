import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Rocket, Building2, Sparkles, Plus } from "lucide-react";
import { useWorkspacesList, useCreateWorkspace } from "@/hooks/useWorkspaces";
import { useCreateInvestigation } from "@/hooks/useInvestigations";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const KNOWN_INCIDENT_TITLE =
  "Increase in pending cross-border corporate payments after morning production deployment";
const KNOWN_INCIDENT_DESCRIPTION =
  "Operations has reported that an increasing number of cross-border corporate payments are " +
  "completing validation and booking successfully but remain in a pending settlement state. " +
  "No infrastructure outages have been reported, scheduled pipelines appear healthy, and " +
  "monitoring dashboards show normal system availability. The issue began shortly after this " +
  "morning's production release. The underlying cause is currently unknown.";

export function StartInvestigation() {
  const navigate = useNavigate();
  const workspaces = useWorkspacesList();
  const createWorkspace = useCreateWorkspace();
  const createInvestigation = useCreateInvestigation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const canLaunch = title.trim().length > 3 && description.trim().length > 10 && workspaceId;

  const handleLoadKnown = () => {
    setTitle(KNOWN_INCIDENT_TITLE);
    setDescription(KNOWN_INCIDENT_DESCRIPTION);
  };

  const handleCreateWorkspace = async () => {
    if (newWorkspaceName.trim().length < 3) return;
    const ws = await createWorkspace.mutateAsync({
      name: newWorkspaceName,
      team_name: "Operations",
      purpose: "Investigate operational incidents reported by this team.",
      domains: [],
    });
    setWorkspaceId(ws.id);
    setCreatingWorkspace(false);
    setNewWorkspaceName("");
  };

  const handleLaunch = async () => {
    if (!canLaunch) return;
    const investigation = await createInvestigation.mutateAsync({
      workspace_id: workspaceId,
      incident_title: title,
      incident_description: description,
    });
    navigate(`/investigation/${investigation.investigation_id}`);
  };

  return (
    <div className="px-8 py-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-sm text-slate hover:text-ink transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Command Center
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
        <h1 className="text-xl font-bold text-ink tracking-tight mb-1">Start a new investigation</h1>
        <p className="text-sm text-slate mb-6">
          Describe the operational incident. A supervisor will assign specialists, gather evidence, and
          converge on a verified root cause.
        </p>
      </motion.div>

      <Card>
        <div className="p-6 space-y-5">
          <div>
            <Label>Incident title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Increase in pending cross-border corporate payments"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the incident — what is happening, when it started, what has been ruled out..."
              rows={6}
            />
          </div>

          <div>
            <Label>Workspace</Label>
            {workspaces.isLoading ? (
              <p className="text-xs text-slate-300">Loading workspaces…</p>
            ) : creatingWorkspace ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Workspace name, e.g. Payments Operations"
                />
                <Button
                  size="md"
                  variant="secondary"
                  loading={createWorkspace.isPending}
                  onClick={handleCreateWorkspace}
                >
                  Create
                </Button>
                <Button size="md" variant="ghost" onClick={() => setCreatingWorkspace(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} className="flex-1">
                  <option value="" disabled>
                    Select a workspace
                  </option>
                  {(workspaces.data ?? []).map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </Select>
                <Button
                  size="md"
                  variant="outline"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setCreatingWorkspace(true)}
                >
                  New
                </Button>
              </div>
            )}
            {workspaces.data?.length === 0 && !creatingWorkspace && (
              <p className="text-2xs text-slate-300 mt-1.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> No workspaces yet — create one to continue.
              </p>
            )}
          </div>

          {createInvestigation.isError && (
            <p className="text-xs text-critical">
              {(createInvestigation.error as Error)?.message ?? "Could not start the investigation."}
            </p>
          )}
        </div>

        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <button
            onClick={handleLoadKnown}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium text-slate hover:text-enterprise transition-colors"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load known incident
          </button>
          <Button
            variant="primary"
            size="lg"
            icon={<Rocket className="w-4 h-4" />}
            disabled={!canLaunch}
            loading={createInvestigation.isPending}
            onClick={handleLaunch}
          >
            Start investigation
          </Button>
        </div>
      </Card>
    </div>
  );
}
