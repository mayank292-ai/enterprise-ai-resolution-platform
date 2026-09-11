// Mirrors backend/app/models/investigation.py, investigation_outputs.py,
// and workspace.py exactly. Do not add fields the backend does not return.

export type InvestigationStatus =
  | "created"
  | "planning"
  | "investigating"
  | "verifying"
  | "awaiting_capability_approval"
  | "completed"
  | "failed";

export type EvidenceConfidence = "low" | "moderate" | "high" | "verified";

export type AgentExecutionStatus = "pending" | "running" | "completed" | "failed";

export type SupervisorConfidence = "low" | "moderate" | "high";

export type SupervisorActionType = "delegate" | "verify" | "capability_gap" | "complete";

export type CapabilityGapStatus = "proposed" | "approved" | "rejected" | "creating" | "ready";

export type HypothesisUpdateStatus = "proposed" | "supported" | "contradicted" | "confirmed";

export interface InvestigationRequest {
  workspace_id: string;
  incident_title: string;
  incident_description: string;
}

export interface InvestigationClassification {
  category: string;
  priority: string;
  business_process: string;
  summary: string;
}

export interface Hypothesis {
  hypothesis_id: string;
  statement: string;
  status: string;
  supporting_evidence_ids: string[];
  contradicting_evidence_ids: string[];
}

export interface Evidence {
  evidence_id: string;
  source: string;
  title: string;
  summary: string;
  confidence: EvidenceConfidence;
  data: Record<string, unknown>;
  created_at: string;
}

export interface AgentDecision {
  decision_id: string;
  agent_name: string;
  objective: string;
  reason: string;
  status: AgentExecutionStatus;
  evidence_ids: string[];
  tool_execution_ids: string[];
  started_at: string | null;
  completed_at: string | null;
}

export interface CapabilityGapProposal {
  title: string;
  missing_capability: string;
  reason: string;
  proposed_agent_name: string;
  proposed_agent_description: string;
  required_tools: string[];
  resume_objective: string;
}

export interface CapabilityGap extends CapabilityGapProposal {
  capability_gap_id: string;
  status: CapabilityGapStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface RootCause {
  title: string;
  explanation: string;
  confidence: EvidenceConfidence;
  evidence_ids: string[];
}

export interface BusinessImpact {
  affected_records: number;
  affected_value: number;
  currency: string;
  affected_systems: string[];
  earliest_occurrence: string | null;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: string;
  recommendation_type: string;
}

export interface CapabilityOpportunity {
  title: string;
  problem_detected: string;
  proposed_capability: string;
  expected_benefit: string;
}

export interface HypothesisUpdate {
  statement: string;
  status: HypothesisUpdateStatus;
  confidence: number;
  reasoning: string;
}

export interface InvestigationFinding {
  title: string;
  explanation: string;
}

export interface TrustedToolExecution {
  execution_id: string;
  step_number: number;
  agent_name: string | null;
  decision_id: string | null;
  tool_name: string;
  purpose: string;
  reasoning: string;
  arguments: Record<string, unknown>;
  result: unknown;
  executed_at: string;
}

export interface SpecialistAssignmentOutcome {
  decision_id: string;
  agent_name: string;
  summary: string;
  confidence: number;
}

export interface Investigation {
  investigation_id: string;
  workspace_id: string;
  incident_title: string;
  incident_description: string;
  status: InvestigationStatus;
  classification: InvestigationClassification | null;
  hypotheses: Hypothesis[];
  agent_decisions: AgentDecision[];
  evidence: Evidence[];
  findings: InvestigationFinding[];
  hypothesis_updates: HypothesisUpdate[];
  open_questions: string[];
  specialist_recommendations: string[];
  tool_execution_trace: TrustedToolExecution[];
  specialist_outcomes: SpecialistAssignmentOutcome[];
  pending_capability_gap: CapabilityGap | null;
  root_cause: RootCause | null;
  business_impact: BusinessImpact | null;
  recommendations: Recommendation[];
  executive_summary: string[];
  capability_opportunity: CapabilityOpportunity | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

// workspace.py

export interface DomainCreate {
  name: string;
  description: string;
}

export interface Domain {
  id: string;
  name: string;
  description: string;
  status: "draft" | "ready";
}

export interface WorkspaceCreate {
  name: string;
  team_name: string;
  purpose: string;
  domains: DomainCreate[];
}

export interface Workspace {
  id: string;
  name: string;
  team_name: string;
  purpose: string;
  status: "draft" | "configuring" | "ready";
  onboarding_progress: number;
  domains: Domain[];
  created_at: string;
}
