from fastapi import APIRouter

from models.schemas import SuiteRequest, SuiteResponse
from services.suite_engine import run_full_suite

router = APIRouter()


@router.post("/suite", response_model=SuiteResponse)
async def suite(req: SuiteRequest) -> SuiteResponse:
    return await run_full_suite(req.system)
