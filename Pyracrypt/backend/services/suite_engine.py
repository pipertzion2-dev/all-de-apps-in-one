from __future__ import annotations

import asyncio

from agents.suite_extras_agent import run_suite_extras
from models.schemas import SuiteResponse
from services.pipeline_engine import run_pipeline


async def run_full_suite(system: str) -> SuiteResponse:
    pipeline, extras = await asyncio.gather(run_pipeline(system), run_suite_extras(system))
    return SuiteResponse(pipeline=pipeline, extras=extras)
