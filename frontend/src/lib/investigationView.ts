import type {
  AgentDecision,
  Evidence,
  Investigation,
  SpecialistAssignmentOutcome,
  TrustedToolExecution,
} from "@/types/investigation";

/**
 * The real backend returns flat, normalized arrays (agent_decisions,
 * evidence, tool_execution_trace, specialist_outcomes) rather than a
 * pre-assembled per-agent view. This adapter groups those real fields
 * into a per-agent node the workspace UI can render — it never
 * invents data, only derives structure from what the API returns.
 */
export interface AgentNodeView {
  decision: AgentDecision;
  evidence: Evidence[];
  tools: TrustedToolExecution[];
  outcome: SpecialistAssignmentOutcome | null;
}

export function buildAgentNodes(investigation: Investigation): AgentNodeView[] {
  const evidenceById = new Map(investigation.evidence.map((e) => [e.evidence_id, e]));
  const outcomeByDecisionId = new Map(
    investigation.specialist_outcomes.map((o) => [o.decision_id, o])
  );

  return investigation.agent_decisions.map((decision) => ({
    decision,
    evidence: decision.evidence_ids
      .map((id) => evidenceById.get(id))
      .filter((e): e is Evidence => Boolean(e)),
    tools: investigation.tool_execution_trace.filter(
      (t) => t.decision_id === decision.decision_id
    ),
    outcome: outcomeByDecisionId.get(decision.decision_id) ?? null,
  }));
}

export function activeAgentNode(nodes: AgentNodeView[]): AgentNodeView | null {
  return [...nodes].reverse().find((n) => n.decision.status === "running") ?? null;
}

/**
 * The backend's RootCause model has no structured causal-chain field.
 * Rather than fabricate one, we derive a narrative chain from the real
 * evidence items the root cause cites (root_cause.evidence_ids), ordered
 * by when they were captured — the same evidence the investigation
 * actually produced.
 */
export function rootCauseEvidenceChain(investigation: Investigation): Evidence[] {
  if (!investigation.root_cause) return [];
  const ids = new Set(investigation.root_cause.evidence_ids);
  return investigation.evidence
    .filter((e) => ids.has(e.evidence_id))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/** De-duplicate evidence by title+source while preserving which agents confirmed it. */
export function dedupeEvidence(investigation: Investigation) {
  const map = new Map<string, { evidence: Evidence; confirmedBy: string[] }>();

  for (const decision of investigation.agent_decisions) {
    for (const id of decision.evidence_ids) {
      const evidence = investigation.evidence.find((e) => e.evidence_id === id);
      if (!evidence) continue;
      const key = `${evidence.source}::${evidence.title}`;
      const existing = map.get(key);
      if (existing) {
        if (!existing.confirmedBy.includes(decision.agent_name)) {
          existing.confirmedBy.push(decision.agent_name);
        }
      } else {
        map.set(key, { evidence, confirmedBy: [decision.agent_name] });
      }
    }
  }

  // Include any evidence not tied to a decision (e.g. verification-stage evidence)
  for (const evidence of investigation.evidence) {
    const key = `${evidence.source}::${evidence.title}`;
    if (!map.has(key)) {
      map.set(key, { evidence, confirmedBy: [] });
    }
  }

  return Array.from(map.values());
}

export function isVerified(investigation: Investigation): boolean {
  return investigation.status === "completed" && investigation.root_cause !== null;
}
