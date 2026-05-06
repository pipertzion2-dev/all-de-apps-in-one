from fastapi import APIRouter

from agents.mutation_engine import run_mutation_engine
from models.schemas import MutateRequest, MutateResponse

router = APIRouter()


@router.post("/mutate", response_model=MutateResponse)
async def mutate(req: MutateRequest) -> MutateResponse:
    return await run_mutation_engine(req.system)
