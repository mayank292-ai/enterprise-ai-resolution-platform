import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.workspaces import router as workspaces_router
from app.api.investigations import (
    router as investigations_router,
)

app = FastAPI(
    title="Enterprise AI Resolution Platform",
    description=(
        "A governed multi-agent platform for enterprise investigations "
        "and capability expansion."
    ),
    version="0.1.0",
)

# -------------------------------------------------------------------------
# CORS Configuration
# -------------------------------------------------------------------------

configured_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)

allowed_origins = [
    origin.strip()
    for origin in configured_origins.split(",")
    if origin.strip()
]

print(f"Allowed CORS Origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------------
# API Routers
# -------------------------------------------------------------------------

app.include_router(workspaces_router)
app.include_router(investigations_router)

# -------------------------------------------------------------------------
# Health Endpoint
# -------------------------------------------------------------------------

@app.get("/health", tags=["System"])
def health_check() -> dict[str, str]:
    """Return the current health of the backend service."""
    return {
        "status": "healthy",
        "service": "enterprise-ai-resolution-platform",
        "version": "0.1.0",
    }