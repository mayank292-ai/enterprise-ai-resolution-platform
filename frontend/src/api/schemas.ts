import { z } from "zod";

// Lightweight runtime guards for the real backend response shapes.
// These validate structural integrity (so a broken API contract fails
// loudly instead of rendering `undefined` deep in a component tree)
// without re-encoding every business rule already enforced server-side.

export const investigationStatusSchema = z.enum([
  "created",
  "planning",
  "investigating",
  "verifying",
  "awaiting_capability_approval",
  "completed",
  "failed",
]);

export const capabilityGapSchema = z.object({
  capability_gap_id: z.string(),
  title: z.string(),
  missing_capability: z.string(),
  reason: z.string(),
  proposed_agent_name: z.string(),
  proposed_agent_description: z.string(),
  required_tools: z.array(z.string()),
  resume_objective: z.string(),
  status: z.enum(["proposed", "approved", "rejected", "creating", "ready"]),
  created_at: z.string(),
  resolved_at: z.string().nullable(),
});

export const investigationSchema = z
  .object({
    investigation_id: z.string(),
    workspace_id: z.string(),
    incident_title: z.string(),
    incident_description: z.string(),
    status: investigationStatusSchema,
    classification: z.unknown().nullable(),
    hypotheses: z.array(z.unknown()),
    agent_decisions: z.array(z.unknown()),
    evidence: z.array(z.unknown()),
    findings: z.array(z.unknown()),
    hypothesis_updates: z.array(z.unknown()),
    open_questions: z.array(z.string()),
    specialist_recommendations: z.array(z.string()),
    tool_execution_trace: z.array(z.unknown()),
    specialist_outcomes: z.array(z.unknown()),
    pending_capability_gap: capabilityGapSchema.nullable(),
    root_cause: z.unknown().nullable(),
    business_impact: z.unknown().nullable(),
    recommendations: z.array(z.unknown()),
    executive_summary: z.array(z.string()),
    capability_opportunity: z.unknown().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    completed_at: z.string().nullable(),
    error_message: z.string().nullable(),
  })
  .passthrough();

export const workspaceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    team_name: z.string(),
    purpose: z.string(),
    status: z.enum(["draft", "configuring", "ready"]),
    onboarding_progress: z.number(),
    domains: z.array(z.unknown()),
    created_at: z.string(),
  })
  .passthrough();
