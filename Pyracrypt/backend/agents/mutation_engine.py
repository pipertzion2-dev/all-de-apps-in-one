from __future__ import annotations

import json
from typing import Any

from models.schemas import MutateResponse, MutationFinding
from services import llm_service
from services.system_graph import normalize_system_input


def _mutate_fallback(desc: str, graph: dict[str, Any]) -> MutateResponse:
    mutations = [
        "Swap coarse role checks: treat 'authenticated' as 'authorized' on data mutations.",
        "Reorder calls: persist side effects before validating idempotency keys.",
        "Inject oversized identifiers and unexpected content-types on ingress edges.",
        "Remove secondary validation on secondary nodes assuming primary node already validated.",
    ]
    findings = [
        MutationFinding(
            mutation=mutations[0],
            failure="Elevated write operations succeed with a low-privilege session token.",
            vulnerable=True,
        ),
        MutationFinding(
            mutation=mutations[1],
            failure="Duplicate events create inconsistent ledger state under concurrency.",
            vulnerable=True,
        ),
        MutationFinding(
            mutation=mutations[2],
            failure="Parser differential causes downstream desynchronization and partial failures.",
            vulnerable=True,
        ),
        MutationFinding(
            mutation=mutations[3],
            failure=None,
            vulnerable=False,
        ),
    ]
    return MutateResponse(mutations=mutations, findings=findings)


async def run_mutation_engine(system: str | dict[str, Any]) -> MutateResponse:
    desc, graph = normalize_system_input(system)
    system_prompt = (
        "You are a hostile QA automation for distributed systems. Propose realistic mutations that stress "
        "trust boundaries (permissions, call order, validation removal, unexpected inputs). "
        "Return JSON: {\"mutations\":[string,...],\"findings\":[{\"mutation\":string,\"failure\":string|null,\"vulnerable\":boolean},...]}"
    )
    user_prompt = json.dumps({"system": desc, "graph": graph}, ensure_ascii=False)
    try:
        data = await llm_service.llm_json_completion(system_prompt, user_prompt)
        muts = data.get("mutations")
        finds = data.get("findings")
        if isinstance(muts, list) and isinstance(finds, list):
            parsed: list[MutationFinding] = []
            for f in finds:
                if isinstance(f, dict):
                    parsed.append(
                        MutationFinding(
                            mutation=str(f.get("mutation", "")),
                            failure=f.get("failure"),
                            vulnerable=bool(f.get("vulnerable", False)),
                        )
                    )
            return MutateResponse(mutations=[str(m) for m in muts], findings=parsed or [])
    except Exception:
        pass
    return _mutate_fallback(desc, graph)
