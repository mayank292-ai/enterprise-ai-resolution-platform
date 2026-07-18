# Enterprise AI Resolution Platform — Frontend

## Current Status

The backend provides a completed demo investigation that can be used
while the live multi-agent workflow is being developed.

## Product Brief

Read the complete frontend brief first:

```text
../docs/FRONTEND_HANDOFF.md
```

## Available Data

### Static mock

```text
src/mocks/investigation.json
```

### Backend demo endpoint

```text
http://localhost:8000/api/v1/investigations/demo
```

## Starting the Backend

From the `backend` directory:

```powershell
python -m uvicorn app.main:app --reload
```

Backend API documentation:

```text
http://localhost:8000/docs
```

## Frontend Environment

Copy:

```text
.env.example
```

to:

```text
.env
```

Expected value:

```text
VITE_API_BASE_URL=http://localhost:8000
```

Do not add Gemini, Vertex AI, Azure OpenAI, or other model-provider
credentials to the frontend.

The browser should communicate only with the FastAPI backend.

## Recommended Development Order

1. Build against the static mock.
2. Render the completed investigation.
3. Build the agent timeline.
4. Add evidence expansion.
5. Add the root-cause and business-impact views.
6. Add the capability-expansion experience.
7. Add the anniversary “10 hours to 10 minutes” reveal.
8. Build the incident-intake screen.
9. Replace the mock with the demo endpoint.
10. Connect the live investigation workflow when available.