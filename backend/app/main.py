from fastapi import FastAPI

from app.api.workspaces import router as workspaces_router
from app.api.investigations import (
    router as investigations_router,
)
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Enterprise AI Resolution Platform",
    description=(
        "A governed multi-agent platform for enterprise investigations "
        "and capability expansion."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workspaces_router)
app.include_router(investigations_router)


@app.get("/health", tags=["System"])
def health_check() -> dict[str, str]:
    """Return the current health of the backend service."""
    return {
        "status": "healthy",
        "service": "enterprise-ai-resolution-platform",
        "version": "0.1.0",
    }