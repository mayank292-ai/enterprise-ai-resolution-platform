# Enterprise AI Resolution Platform — Frontend

React + TypeScript frontend for the Enterprise AI Resolution Platform. Renders enterprise incident investigations: the agent timeline, evidence, hypotheses, root cause, business impact, recommendations, and capability opportunities produced by the backend's multi-agent investigation engine.

---

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- ESLint

---

## Prerequisites

| Requirement | Minimum Version          | Notes                                                                                                              |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Node.js     | `20.19.0` or `22.12.0+`  | Node 22 LTS or newer recommended. Older Node 20.x versions (e.g. 20.11) will fail to install/scaffold correctly.   |
| npm         | 10.x+                    | Ships with Node.                                                                                                   |
| Python      | 3.10+ (3.11 recommended) | Required to run the **backend**, not the frontend directly — but the frontend is not usable standalone without it. |
| Git         | any recent version       | To clone the repo.                                                                                                 |

Check your versions before starting:

```bash
node -v
npm -v
python --version
```

### Windows-specific notes

- If `npm -v` fails with a "running scripts is disabled" error, run this once in PowerShell:

```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

- Node install: download the LTS installer from https://nodejs.org — no need to uninstall an older version first, a new install will supersede it on `PATH`.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mayank292-ai/enterprise-ai-resolution-platform.git
cd enterprise-ai-resolution-platform/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

`.env` should contain:
VITE_API_BASE_URL=http://localhost:8000

**Important:**

- Never commit `.env` (it's already git-ignored).
- Never add any AI-provider credentials (Gemini, OpenAI, etc.) to this file or anywhere in the frontend. The browser should only ever talk to the FastAPI backend — model calls happen server-side only.
- Vite only reads `.env` at server startup. If you edit `.env` while `npm run dev` is running, restart the dev server for changes to take effect.

### 4. Start the backend (required)

The frontend has no data of its own — it depends entirely on the FastAPI backend. In a **separate terminal**:

```bash
cd ../backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --reload-dir app
```

Confirm it's running:
http://localhost:8000/docs

See `../backend/README.md` (or the repo root `README.md`) for full backend setup details.

### 5. Start the frontend dev server

Back in the `frontend` directory:

```bash
npm run dev
```

Open:
http://localhost:5173

You should land on the **Incident Intake** screen. Click "view a completed demo investigation" (or go directly to `http://localhost:5173/investigations/demo`) to see a fully populated investigation report.

---

## Available Data While Developing

### Static mock (no backend required)

src/mocks/investigation.json

### Backend demo endpoint (recommended — always up to date)

GET http://localhost:8000/api/v1/investigations/demo
Rendered at:
http://localhost:5173/investigations/demo

### Live investigation (created via Intake form)

POST http://localhost:8000/api/v1/investigations
Note: the backend's multi-agent orchestration loop is still under development. Investigations created this way currently return in a `created` state with no evidence yet — this is expected, not a bug.

---

## Scripts

| Command           | Description                                    |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Start local dev server with hot module reload  |
| `npm run build`   | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally           |
| `npm run lint`    | Run ESLint                                     |

---

## Project Structure

frontend/
├── public/
├── src/
│ ├── api/
│ │ └── investigations.ts # Axios client, reads VITE_API_BASE_URL
│ ├── components/
│ │ ├── AgentTimeline.tsx
│ │ ├── EvidenceCard.tsx
│ │ ├── HypothesesList.tsx
│ │ ├── RootCauseSummary.tsx
│ │ ├── BusinessImpactPanel.tsx
│ │ ├── RecommendationsList.tsx
│ │ ├── CapabilityOpportunityCard.tsx
│ │ ├── ExecutiveSummary.tsx
│ │ └── TransformationReveal.tsx
│ ├── pages/
│ │ ├── IntakePage.tsx # Stage 1: incident submission
│ │ └── InvestigationPage.tsx # Stage 2/3: workspace + completed report
│ ├── types/
│ │ └── investigation.ts # TS interfaces mirroring backend Pydantic models
│ ├── mocks/
│ │ └── investigation.json
│ ├── App.tsx # Router shell
│ ├── main.tsx
│ ├── env.d.ts # Types VITE_API_BASE_URL
│ └── index.css # Tailwind entry point
├── .env.example
├── .env # Local only, git-ignored
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts

---

## Routes

| Path                               | Page                | Description                                                            |
| ---------------------------------- | ------------------- | ---------------------------------------------------------------------- |
| `/`                                | `IntakePage`        | Submit a new incident, or jump to the demo                             |
| `/investigations/demo`             | `InvestigationPage` | Fully populated demo investigation (`GET /api/v1/investigations/demo`) |
| `/investigations/:investigationId` | `InvestigationPage` | Any investigation by ID (`GET /api/v1/investigations/{id}`)            |

---

## Troubleshooting

**Blank page / `Cannot read properties of undefined`**
Usually means `.env` is missing or the dev server was started before `.env` was created. Confirm `.env` exists with the correct `VITE_API_BASE_URL`, then restart `npm run dev`.

**Network tab shows the request returning an HTML page instead of JSON**
The request went to the Vite dev server instead of the backend — same root cause as above (missing/stale `.env`).

**CORS errors**
Confirm the backend is running and that `backend/app/main.py`'s CORS `allow_origins` includes `http://localhost:5173`.

---

## Further Reading

Full product brief, required screens, and design direction:
../docs/FRONTEND_HANDOFF.md
