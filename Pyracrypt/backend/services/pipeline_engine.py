from __future__ import annotations

from agents.attack_agent import run_attack_simulation
from agents.combination_agent import run_combination_engine
from agents.hypothesis_agent import run_hypothesis_engine
from agents.mutation_engine import run_mutation_engine
from agents.remedy_agent import run_remedy_engine
from models.schemas import PipelineResponse


async def run_pipeline(system: str) -> PipelineResponse:
    hypotheses = await run_hypothesis_engine(system)
    combined = await run_combination_engine(system)
    mutated = await run_mutation_engine(combined.new_structure)
    primary = hypotheses[0].hypothesis if hypotheses else "Cross-trust lateral movement under weak authorization"
    simulated = await run_attack_simulation(primary)
    remedy = await run_remedy_engine(
        {"hypothesis": primary, "attack_steps": simulated.attack_steps, "graph": combined.new_structure}
    )
    return PipelineResponse(
        hypotheses=hypotheses,
        combined=combined,
        mutated=mutated,
        simulated=simulated,
        remedy=remedy,
    )
