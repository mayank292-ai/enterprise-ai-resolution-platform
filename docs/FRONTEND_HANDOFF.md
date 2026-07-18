# Frontend Handoff

## Enterprise AI Resolution Platform

## 1. Product Overview

The Enterprise AI Resolution Platform investigates complex enterprise
incidents by coordinating multiple specialist AI agents.

The user provides a business problem in ordinary language.

The platform then:

1. Understands the incident.
2. Creates initial hypotheses.
3. Selects the most appropriate specialist agent.
4. Collects factual evidence from enterprise systems.
5. Revises or rejects hypotheses.
6. Selects additional specialists when needed.
7. Verifies the likely root cause.
8. Quantifies the business impact.
9. Recommends remediation and prevention actions.
10. Proposes a new reusable capability based on what it learned.

The product must not feel like a chatbot.

It should feel like a premium enterprise investigation workspace.

---

## 2. Demo Incident

The initial demonstration uses this incident:

> Treasury reports that several high-value cross-border payments are
> absent from the downstream settlement dashboard, even though core
> payment processing completed successfully.

The platform eventually discovers:

1. Core payment processing completed.
2. FX enrichment did not complete.
3. Required FX reference rates were available.
4. A data-quality rule blocked downstream publication.
5. A producer deployment renamed a required field.
6. The downstream mapping was not updated.
7. Thirty-seven payments worth USD 182.45 million were affected.
8. The platform proposes a preventive schema-compatibility capability.

The incident ticket itself must not reveal the answer.

---

## 3. Core User Journey

### Stage 1: Incident Intake

The user enters:

- incident title;
- incident description;
- workspace or business domain.

Primary action:

- Start Investigation.

The intake page should be calm and simple.

Avoid displaying many controls before the investigation begins.

### Stage 2: Investigation in Progress

The platform displays:

- current status;
- active specialist;
- Supervisor selection reason;
- current objective;
- open hypotheses;
- evidence requested;
- evidence discovered;
- elapsed investigation time.

The investigation timeline is the visual centerpiece.

### Stage 3: Investigation Completed

The completed view displays:

- executive summary;
- verified root cause;
- business-impact metrics;
- affected systems;
- supporting evidence;
- remediation recommendations;
- prevention recommendations;
- capability opportunity.

### Stage 4: Capability Expansion

After resolving the incident, the platform identifies a missing
preventive capability.

For this incident, the proposed capability is:

**Schema Compatibility Guardian**

The UI should show:

- the problem detected;
- the proposed capability;
- required systems or tools;
- expected benefit;
- review action;
- activation action.

This should communicate that the platform learned from the incident.

---

## 4. Required Screens

## A. Incident Intake Screen

Include:

- product name;
- short product description;
- workspace indicator;
- incident-title input;
- large incident-description input;
- Start Investigation button;
- optional recent-investigations section.

Suggested primary message:

> Describe the business problem. The platform will determine how to
> investigate it.

Do not use chatbot bubbles.

---

## B. Investigation Workspace

Recommended desktop structure:

### Top area

Display:

- incident title;
- investigation status;
- priority;
- elapsed time;
- affected business process, when available.

### Main investigation timeline

Each agent step should display:

- agent display name;
- state: pending, running, completed, or failed;
- objective;
- reason the Supervisor selected it;
- confidence;
- start and completion times;
- evidence count.

Clicking a completed step should reveal its evidence.

### Evidence area

Evidence cards should display:

- title;
- source system;
- concise summary;
- confidence;
- timestamp;
- expandable structured data.

The evidence `data` field may contain different keys depending on
the source. Render it dynamically rather than expecting one fixed
schema.

### Hypotheses area

Each hypothesis should show one of:

- open;
- confirmed;
- rejected.

Confirmed and rejected hypotheses should link visually to supporting
or contradicting evidence.

---

## C. Completed Investigation Screen

Include:

### Executive Summary

Three to five concise findings.

### Root Cause

Display:

- root-cause title;
- explanation;
- confidence;
- linked supporting evidence.

### Business Impact

Prominent metrics:

- affected payment count;
- affected financial value;
- currency;
- earliest occurrence;
- affected systems.

### Recommendations

Separate:

- immediate remediation;
- preventive action.

### Capability Opportunity

Show the proposed future capability with actions such as:

- Review Configuration
- Activate Capability

The activation action may initially be a frontend demonstration until
the backend activation workflow is connected.

---

## 5. Investigation Statuses

The backend supports these investigation states:

- `created`
- `planning`
- `investigating`
- `verifying`
- `completed`
- `failed`

The frontend must provide a clear visual state for each.

Suggested behavior:

- `created`: incident accepted;
- `planning`: Supervisor is understanding the incident;
- `investigating`: specialist agents are collecting evidence;
- `verifying`: proposed root cause is being challenged;
- `completed`: verified result available;
- `failed`: investigation could not continue.

---

## 6. API Information

Local backend:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

### Demo Investigation

```http
GET /api/v1/investigations/demo
```

Full local URL:

```text
http://localhost:8000/api/v1/investigations/demo
```

This endpoint returns a completed investigation for frontend
development.

A static copy is also available at:

```text
frontend/src/mocks/investigation.json
```

### Create Investigation

```http
POST /api/v1/investigations
```

Request example:

```json
{
  "workspace_id": "11111111-1111-1111-1111-111111111111",
  "incident_title": "Cross-border settlement dashboard mismatch",
  "incident_description": "Treasury reports that several high-value cross-border payments are absent from downstream settlement reporting."
}
```

### Get Investigation

```http
GET /api/v1/investigations/{investigation_id}
```

The live multi-agent execution endpoint is still being completed.
Build the interface against the demo response first.

---

## 7. Important Response Fields

### `investigation_id`

Unique identifier for the investigation.

### `status`

Current lifecycle state.

### `incident_title`

Short incident heading.

### `incident_description`

Original business problem submitted by the user.

### `agent_decisions`

The investigation timeline.

Each decision contains:

- `decision_id`
- `agent_name`
- `objective`
- `reason`
- `status`
- `evidence_ids`
- `started_at`
- `completed_at`

The `reason` field explains why the Supervisor selected that agent.

### `evidence`

Factual results returned by specialist agents.

Each item contains:

- `evidence_id`
- `source`
- `title`
- `summary`
- `confidence`
- `data`
- `created_at`

The `data` object is flexible and should support expandable
key-value rendering.

### `hypotheses`

Possible explanations evaluated during the investigation.

Each hypothesis contains:

- statement;
- status;
- supporting evidence IDs;
- contradicting evidence IDs.

### `root_cause`

Verified final explanation.

### `business_impact`

Includes:

- `affected_records`
- `affected_value`
- `currency`
- `affected_systems`
- `earliest_occurrence`

### `recommendations`

Immediate and preventive actions.

### `capability_opportunity`

A new organizational capability proposed from the incident.

---

## 8. Visual Direction

The interface should feel:

- premium;
- clean;
- modern;
- calm;
- trustworthy;
- enterprise-focused;
- intelligent;
- evidence-driven.

Use:

- strong spacing;
- restrained visual hierarchy;
- clear typography;
- progressive disclosure;
- subtle motion;
- polished timeline transitions;
- meaningful status indicators.

Avoid:

- chatbot message bubbles;
- excessive gradients;
- neon AI styling;
- generic admin-dashboard layouts;
- walls of text;
- excessive card grids;
- playful consumer-app styling;
- large decorative animations that distract from evidence.

The UI should make a complex investigation easy to understand in
seconds.

---

## 9. Anniversary Theme: The Power of 10

This hackathon has a 10th-anniversary theme.

The number 10 should not appear as an arbitrary decoration or as ten
forced features.

The product story should connect 10 to organizational learning:

> Every resolved incident makes the next investigation dramatically
> faster.

The recommended anniversary moment is a final outcome comparing:

```text
Previous investigation time: 10 hours
Expected repeat investigation time: 10 minutes
```

This transformation is enabled because the platform retains:

- verified knowledge;
- reusable evidence patterns;
- investigation playbooks;
- preventive capabilities.

Suggested final message:

> From 10 hours to 10 minutes.

Supporting message:

> Resolve once. Learn permanently.

The capability-expansion section can visually reveal this improvement
after the incident is completed.

This should be presented as a meaningful outcome, not a permanent
large “10” on every screen.

A subtle X motif may be explored because X represents 10, but it
should not replace the main product name unless the team agrees on
the branding.

---

## 10. Suggested Technology

Recommended frontend stack:

- React;
- TypeScript;
- Vite;
- Tailwind CSS;
- a consistent component library;
- lightweight animation for investigation progress.

The frontend should call only the FastAPI backend.

The Gemini API key must never be added to frontend code or frontend
environment variables.

Frontend environment variable:

```text
VITE_API_BASE_URL=http://localhost:8000
```

---

## 11. Recommended Frontend Build Order

1. Load `src/mocks/investigation.json`.
2. Build the completed-investigation screen.
3. Build the agent timeline from `agent_decisions`.
4. Build expandable evidence cards.
5. Build hypotheses and evidence linking.
6. Build root-cause and business-impact sections.
7. Build the capability-opportunity section.
8. Add the “10 hours to 10 minutes” reveal.
9. Build the incident-intake screen.
10. Add planning, investigating, verifying, and failure states.
11. Replace the static mock with the demo API endpoint.
12. Connect the live investigation API when it becomes available.

---

## 12. Initial Definition of Done

The first frontend version is ready for integration when:

- the completed demo investigation renders correctly;
- the timeline is visually clear;
- agent steps are expandable;
- evidence is easy to inspect;
- business impact is prominent;
- root cause is immediately understandable;
- the capability opportunity feels like a meaningful conclusion;
- the interface works at common laptop widths;
- API base URL is configurable;
- no AI-provider credentials exist in the frontend.