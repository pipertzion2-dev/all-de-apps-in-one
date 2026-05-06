from fastapi import APIRouter

from agents.remedy_agent import run_remedy_engine
from models.schemas import RemedyRequest, RemedyResponse

router = APIRouter()


@router.post("/remedy", response_model=RemedyResponse)
async def remedy(req: RemedyRequest) -> RemedyResponse:
    return await run_remedy_engine(req.attack)
