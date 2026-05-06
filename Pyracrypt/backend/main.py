from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from routes import admin, combine, features, hypothesis, mutate, pipeline, remedy, simulate, suite

app = FastAPI(title="Cybersecurity Wavy", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hypothesis.router, tags=["hypothesis"])
app.include_router(combine.router, tags=["combine"])
app.include_router(mutate.router, tags=["mutate"])
app.include_router(simulate.router, tags=["simulate"])
app.include_router(remedy.router, tags=["remedy"])
app.include_router(pipeline.router, tags=["pipeline"])
app.include_router(suite.router, tags=["suite"])
app.include_router(features.router, tags=["features"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/health")
async def health() -> dict[str, Any]:
    from services import llm_service

    llm = "openai" if llm_service.llm_configured() else "ollama_or_fallback"
    return {"status": "ok", "version": "1.0.0", "llm_path": llm, "admin_api": "/api/admin/bootstrap"}


# Serve the React frontend build in production (when dist exists)
_BACKEND_DIR = Path(__file__).parent
_STATIC_DIR = _BACKEND_DIR.parent / "artifacts" / "cybersec-app" / "dist" / "public"

if _STATIC_DIR.exists():
    _assets = _STATIC_DIR / "assets"
    if _assets.exists():
        app.mount("/assets", StaticFiles(directory=str(_assets)), name="assets")

    @app.get("/fonts/{path:path}")
    async def serve_fonts(path: str):
        font_file = _STATIC_DIR / "fonts" / path
        if font_file.exists():
            return FileResponse(str(font_file))
        return FileResponse(str(_STATIC_DIR / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        candidate = _STATIC_DIR / full_path
        if candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(_STATIC_DIR / "index.html"))
