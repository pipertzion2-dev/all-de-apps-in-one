from fastapi import APIRouter

from agents.attack_agent import run_attack_simulation
from models.schemas import SimulateRequest, SimulateResponse

router = APIRouter()


@router.post("/simulate", response_model=SimulateResponse)
async def simulate(req: SimulateRequest) -> SimulateResponse:
    return await run_attack_simulation(req.hypothesis)
