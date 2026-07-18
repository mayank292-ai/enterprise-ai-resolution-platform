# Enterprise AI Resolution Platform

> AI-powered multi-agent incident investigation platform that autonomously investigates enterprise operational issues, identifies verified root causes, quantifies business impact, and continuously improves by learning from every resolved incident.

---

# Vision

Enterprise incidents are rarely caused by a single system.

A payment issue may involve:

- Payment Processing
- FX Conversion
- Reference Data
- Data Quality
- Deployment History
- Infrastructure
- Monitoring
- Configuration Changes

Today, engineers manually investigate each of these systems, often requiring hours of coordination across multiple teams.

Our goal is to build an AI platform that performs this investigation automatically.

The user describes the business problem.

The platform determines:

- what happened,
- which specialists to consult,
- what evidence is needed,
- which hypotheses are correct,
- what the verified root cause is,
- how the organization can prevent similar incidents.

---

# Core Idea

Instead of using one large AI prompt, the platform behaves like an investigation team.

A Supervisor AI coordinates multiple specialist agents.

Each specialist focuses on one domain.

For example:

- Payment Investigation
- FX Investigation
- Data Quality
- Reference Data
- Change Analysis
- Verification

The Supervisor decides which specialist should investigate next based on the evidence collected so far.

---

# Example Investigation

User reports:

> "Several high-value cross-border payments are missing from the settlement dashboard."

The platform may investigate like this:

```
Incident
    │
    ▼
Supervisor
    │
    ▼
Payment Investigation
    │
    ▼
Evidence Found
    │
    ▼
FX Investigation
    │
    ▼
Reference Data
    │
    ▼
Data Quality
    │
    ▼
Deployment Analysis
    │
    ▼
Verification
    │
    ▼
Root Cause
    │
    ▼
Business Impact
    │
    ▼
Recommendations
    │
    ▼
New Preventive Capability
```

The investigation path is chosen dynamically.

---

# Architecture

```
Frontend
        │
        ▼
FastAPI
        │
        ▼
Investigation Service
        │
        ▼
Supervisor
        │
        ▼
Agent Executor
        │
        ▼
Specialist Agents
        │
        ▼
Business Tools
        │
        ▼
Enterprise Systems
```

The platform separates:

- reasoning,
- orchestration,
- business logic,
- system integrations.

---

# Repository Structure

```
enterprise-ai-resolution-platform/

├── backend/
│   ├── app/
│   │   ├── agents/
│   │   ├── api/
│   │   ├── connectors/
│   │   ├── core/
│   │   ├── knowledge/
│   │   ├── models/
│   │   ├── prompts/
│   │   ├── services/
│   │   └── tools/
│   │
│   ├── scripts/
│   └── tests/
│
├── frontend/
│
├── docs/
│
└── README.md
```

---

# Current Development Status

## Backend

Completed

- Investigation domain model
- Supervisor orchestration
- Gemini integration
- Structured AI responses
- Specialist Agent interface
- Specialist Agent Registry
- Agent Executor
- Investigation API
- Demo investigation endpoint
- Unit tests

In Progress

- Payment Investigation Agent
- Payment tools
- Enterprise connectors
- Multi-agent investigation flow

Planned

- Capability activation
- Workspace onboarding
- Real enterprise integrations

---

## Frontend

Current work:

- Investigation workspace
- Timeline visualization
- Evidence explorer
- Root cause summary
- Business impact dashboard
- Capability opportunity screen

The frontend currently uses:

- mock investigation data
- or the demo backend endpoint

until the live investigation workflow is completed.

---

# Technology Stack

Backend

- Python
- FastAPI
- Pydantic
- Gemini
- Pytest

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

---

# Running the Backend

From the backend directory:

```bash
python -m uvicorn app.main:app --reload
```

API documentation:

```
http://localhost:8000/docs
```

Demo investigation:

```
http://localhost:8000/api/v1/investigations/demo
```

---

# Running the Frontend

The frontend is being developed independently.

See:

```
docs/FRONTEND_HANDOFF.md
```

for complete frontend requirements.

---

# Long-Term Vision

The platform should not only resolve incidents.

It should become better after every investigation.

Each completed investigation contributes:

- verified evidence,
- reusable knowledge,
- investigation playbooks,
- preventive capabilities.

Future investigations become faster because the organization retains what it has learned.

---

# Hackathon Theme

This project is designed around the idea that every resolved incident permanently increases organizational intelligence.

Our theme interpretation is:

> **Resolve once. Learn permanently.**

The platform demonstrates how a recurring investigation that once required hours of manual effort can be completed in minutes by combining AI reasoning, reusable knowledge, and continuously expanding capabilities.

---

