from fastapi import APIRouter

from models.schemas import PipelineRequest, PipelineResponse
from services.pipeline_engine import run_pipeline

router = APIRouter()


@router.post("/pipeline", response_model=PipelineResponse)
async def pipeline(req: PipelineRequest) -> PipelineResponse:
    return await run_pipeline(req.system)
