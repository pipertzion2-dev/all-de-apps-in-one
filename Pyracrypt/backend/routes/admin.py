from __future__ import annotations

import os
import secrets as py_secrets
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException

from services.admin_overview import bootstrap_payload, build_overview, replit_env_template

router = APIRouter()


def _expected_admin_secret() -> str:
    return (os.getenv("ADMIN_SECRET") or "").strip()


async def require_admin(x_admin_secret: Optional[str] = Header(default=None, alias="X-Admin-Secret")) -> None:
    expected = _expected_admin_secret()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="ADMIN_SECRET is not set. In Replit: Project Secrets → add ADMIN_SECRET (long random string) → restart.",
        )
    if not x_admin_secret:
        raise HTTPException(status_code=401, detail="Missing X-Admin-Secret header")
    if not py_secrets.compare_digest(x_admin_secret.encode("utf-8"), expected.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid admin secret")


@router.get("/bootstrap", response_model=dict[str, Any])
async def admin_bootstrap() -> dict[str, Any]:
    """Public: safe deployment hints (no secrets)."""
    return bootstrap_payload()


@router.get("/overview", response_model=dict[str, Any])
async def admin_overview(_: None = Depends(require_admin)) -> dict[str, Any]:
    """Full integration matrix + masked status (requires ADMIN_SECRET)."""
    return await build_overview()


@router.get("/replit-env-template", response_model=dict[str, str])
async def admin_replit_template(_: None = Depends(require_admin)) -> dict[str, str]:
    return {"content": replit_env_template()}
