from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json

from app.config import APP_VERSION
from app.database import init_db, get_db
from app.services.ingestion_service import process_envelope
from app.routers import (
    dashboard,
    conversations,
    imports,
    routing,
    deals,
    findings,
    exports,
    settings
)

app = FastAPI(
    title="Revenue Intelligence Inbox API",
    description="SpendNest Revenue Intelligence Inbox with deterministic replay, routing and evidence citations",
    version=APP_VERSION
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware: Automatically route requests without '/api' prefix to '/api'
@app.middleware("http")
async def api_prefix_fallback(request: Request, call_next):
    path = request.url.path
    # If the request does not start with /api, /docs, /openapi.json, or /redoc, redirect scope internally to /api
    if not (path.startswith("/api") or path.startswith("/docs") or path.startswith("/openapi.json") or path.startswith("/redoc") or path == "/"):
        request.scope["path"] = f"/api{path}"
    response = await call_next(request)
    return response

# Include Routers
app.include_router(dashboard.router)
app.include_router(conversations.router)
app.include_router(imports.router)
app.include_router(routing.router)
app.include_router(deals.router)
app.include_router(findings.router)
app.include_router(exports.router)
app.include_router(settings.router)

@app.on_event("startup")
def startup_event():
    init_db()
    # Check if empty; if so, seed both 01_initial and 02_update
    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) as c FROM source_records").fetchone()["c"]
    
    if count == 0:
        sample_dir = Path(__file__).resolve().parent.parent / "data" / "sample"
        f1_path = sample_dir / "01_initial.json"
        f2_path = sample_dir / "02_update.json"
        if f1_path.exists():
            with open(f1_path, "r", encoding="utf-8") as f:
                process_envelope(json.load(f), filename="01_initial.json")
        if f2_path.exists():
            with open(f2_path, "r", encoding="utf-8") as f:
                process_envelope(json.load(f), filename="02_update.json")

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    with get_db() as conn:
        records = conn.execute("SELECT COUNT(*) as c FROM source_records").fetchone()["c"]
        usable = conn.execute("SELECT COUNT(*) as c FROM source_records WHERE has_usable_text = 1").fetchone()["c"]
    return {
        "status": "healthy",
        "service": "Revenue Intelligence Inbox",
        "version": APP_VERSION,
        "database": "sqlite_connected",
        "total_source_records": records,
        "usable_supplied_texts": usable
    }
