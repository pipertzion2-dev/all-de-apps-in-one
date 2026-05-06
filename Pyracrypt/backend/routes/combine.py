from fastapi import APIRouter

from agents.combination_agent import run_combination_engine
from models.schemas import CombineRequest, CombineResponse

router = APIRouter()


@router.post("/combine", response_model=CombineResponse)
async def combine(req: CombineRequest) -> CombineResponse:
    return await run_combination_engine(req.system)
