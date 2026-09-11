export type InvestigationPriority = "P1" | "P2" | "P3";

export type HistoricalInvestigation = {
  id: string;
  title: string;
  summary: string;
  rootCauseTitle: string;
  rootCause: string;
  impact: string;
  confidence: number;
  duration: string;
  completed: string;
  priority: InvestigationPriority;
  businessArea: string;
  owner: string;
  systems: string[];
  recordType: "Captured demo run" | "Prepared scenario";
  stages: Array<{ title: string; actor: string; summary: string; evidence: string }>;
  recommendations: string[];
};

export const historicalInvestigations: HistoricalInvestigation[] = [
  {
    id: "hist-settlement-v2",
    title:
      "Increase in pending cross-border corporate payments after morning production deployment",
    summary:
      "Cross-border corporate payments completed validation, booking, and FX enrichment but remained pending after publication acknowledgements timed out.",
    rootCauseTitle: "Routing change targeted an inactive settlement consumer",
    rootCause:
      "Payment producer version 4.8.0 enabled use_new_settlement_route and sent cross-border events to settlement-next-v2, where no production consumer was active.",
    impact: "3 payments · 182.45M across GBP, EUR and CHF",
    confidence: 98,
    duration: "3m 20s",
    completed: "Today, 15:56",
    priority: "P1",
    businessArea: "Cross-border Payments",
    owner: "Payments Operations",
    systems: ["Payment Producer", "Settlement Queue", "Deployment Registry"],
    recordType: "Captured demo run",
    stages: [
      {
        title: "Identify the affected payment population",
        actor: "Payment Investigation Agent",
        summary:
          "Scoped three cross-border corporate payments that passed validation, booking, and FX enrichment before stalling at publication.",
        evidence:
          "The failed GBP, EUR, and CHF cohort totalled 182.45M, used producer version 4.8.0, and ended with DOWNSTREAM_ACK_TIMEOUT. A 4.7.2 comparison payment settled normally.",
      },
      {
        title: "Compare source and canonical schema versions",
        actor: "Data Contract Agent",
        summary:
          "Compared source records, canonical contracts, and required mappings to test whether a data-shape regression explained publication failure.",
        evidence:
          "Required payment attributes were preserved across the affected cohort, contradicting schema loss or transformation failure as the material cause.",
      },
      {
        title: "Analyze release and deployment changes",
        actor: "Release Change Analysis Agent",
        summary:
          "The capability was proposed at runtime, approved by a human, and executed with read-only release and configuration tools.",
        evidence:
          "Change CHG-4821 enabled use_new_settlement_route in version 4.8.0. The manifest targeted settlement-next-v2 while consumer telemetry showed zero active production members.",
      },
      {
        title: "Validate the proposed root cause",
        actor: "Verification Agent",
        summary:
          "Challenged the causal chain against data-contract, processing-health, and version-correlation alternatives.",
        evidence:
          "The release flag, destination change, inactive consumer, timeout signature, and successful comparison cohort formed a consistent causal chain with no material contradiction.",
      },
    ],
    recommendations: [
      "Activate the settlement-next-v2 production consumer or roll back producer version 4.8.0",
      "Re-publish the three pending payment events after destination readiness is confirmed",
      "Add a deployment gate that verifies active consumers for every newly configured destination",
    ],
  },
  {
    id: "scenario-customer-backlog",
    title: "Customer complaint backlog increased after case-routing policy update",
    summary:
      "A prepared cross-domain scenario showing how the same investigation model applies to customer operations rather than payments.",
    rootCauseTitle: "Routing policy targeted an unstaffed specialist queue",
    rootCause:
      "A routing rule assigned high-priority complaints to a specialist queue whose regional roster was empty outside UK business hours.",
    impact: "146 priority complaints · 7.4h oldest wait",
    confidence: 96,
    duration: "4m 12s",
    completed: "Prepared today, 13:10",
    priority: "P2",
    businessArea: "Customer Operations",
    owner: "Client Service Transformation",
    systems: ["Case Management", "Routing Policy", "Workforce Roster"],
    recordType: "Prepared scenario",
    stages: [
      {
        title: "Scope the delayed customer cohort",
        actor: "Case Investigation Agent",
        summary:
          "Isolated priority complaints created after the policy update and compared them with normally routed cases.",
        evidence:
          "All delayed cases shared the new regional-specialist route; standard cases continued to meet service targets.",
      },
      {
        title: "Validate routing and workforce context",
        actor: "Customer Workflow Agent",
        summary:
          "Compared policy conditions, queue ownership, and the active regional roster.",
        evidence:
          "The route was valid, but the target queue had no active assignee during the affected window.",
      },
      {
        title: "Verify the queue-to-backlog causal chain",
        actor: "Verification Agent",
        summary:
          "Confirmed the empty roster explained the full delayed cohort without a platform outage.",
        evidence:
          "Re-routing a controlled sample immediately assigned an owner and resumed SLA processing.",
      },
    ],
    recommendations: [
      "Add a staffed-queue condition to routing policy activation",
      "Re-route the affected priority complaint cohort",
      "Alert when a priority queue has eligible work but no active roster",
    ],
  },
  {
    id: "scenario-inventory-sync",
    title: "Warehouse inventory updates stopped reaching the replenishment planner",
    summary:
      "A prepared supply-chain scenario demonstrating connector and specialist portability.",
    rootCauseTitle: "Producer contract advanced before consumer compatibility",
    rootCause:
      "A warehouse integration deployed an event-contract version that the replenishment consumer had not yet approved.",
    impact: "8,240 inventory events · 3 distribution centres",
    confidence: 97,
    duration: "5m 06s",
    completed: "Prepared today, 12:25",
    priority: "P1",
    businessArea: "Supply Chain Operations",
    owner: "Inventory Reliability",
    systems: ["Warehouse Events", "Schema Registry", "Replenishment Planner"],
    recordType: "Prepared scenario",
    stages: [
      {
        title: "Identify the missing inventory population",
        actor: "Inventory Investigation Agent",
        summary:
          "Scoped the first missing sequence and isolated the affected warehouse producers.",
        evidence:
          "Three distribution centres moved to event version 6 while version 5 producers remained healthy.",
      },
      {
        title: "Compare event contracts",
        actor: "Data Contract Agent",
        summary:
          "Checked producer and consumer compatibility against the governed schema registry.",
        evidence:
          "The new required location_precision field had no compatible consumer registration.",
      },
      {
        title: "Verify controlled replay",
        actor: "Verification Agent",
        summary:
          "Validated contract causality using a version-5 replay and a version-6 rejection sample.",
        evidence:
          "Only compatible events reached planning, reproducing the exact production boundary.",
      },
    ],
    recommendations: [
      "Complete consumer compatibility before re-enabling version 6",
      "Replay quarantined inventory events in original order",
      "Make schema compatibility a deployment prerequisite",
    ],
  },
  {
    id: "scenario-access-provisioning",
    title: "New starters remained without application access after HR approval",
    summary:
      "A prepared employee-operations scenario using workflow, directory, and service-management evidence.",
    rootCauseTitle: "Identity workflow referenced a retired organisation attribute",
    rootCause:
      "The identity workflow looked up a retired cost-centre attribute and silently skipped the entitlement-mapping step.",
    impact: "38 new starters · 11 applications",
    confidence: 95,
    duration: "4m 48s",
    completed: "Prepared today, 11:40",
    priority: "P2",
    businessArea: "Employee Operations",
    owner: "Identity Service Management",
    systems: ["HR Workflow", "Identity Directory", "Entitlement Catalog"],
    recordType: "Prepared scenario",
    stages: [
      {
        title: "Scope failed access requests",
        actor: "Access Investigation Agent",
        summary:
          "Compared completed HR approvals with identity requests that generated no entitlements.",
        evidence:
          "All 38 failures used the newly introduced organisation record while existing staff updates succeeded.",
      },
      {
        title: "Inspect workflow and directory mappings",
        actor: "Workflow Reliability Agent",
        summary:
          "Traced the approved request through attribute resolution and entitlement selection.",
        evidence:
          "The lookup expected legacy cost_centre_code; new records supplied organisation_unit_id.",
      },
      {
        title: "Verify the corrected mapping",
        actor: "Verification Agent",
        summary:
          "Ran a read-only mapping simulation across affected and successful cohorts.",
        evidence:
          "The corrected attribute produced the expected entitlement set for every affected starter.",
      },
    ],
    recommendations: [
      "Update the entitlement mapping to organisation_unit_id",
      "Replay the 38 approved access requests",
      "Alert when an approved starter workflow produces zero entitlements",
    ],
  },
];

export const getHistoricalInvestigation = (id?: string) =>
  historicalInvestigations.find((item) => item.id === id);
