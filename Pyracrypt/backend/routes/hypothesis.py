from fastapi import APIRouter

from agents.hypothesis_agent import run_hypothesis_engine
from models.schemas import HypothesisItem, HypothesisRequest

router = APIRouter()


@router.post("/hypothesis", response_model=list[HypothesisItem])
async def hypothesis(req: HypothesisRequest) -> list[HypothesisItem]:
    return await run_hypothesis_engine(req.system)
