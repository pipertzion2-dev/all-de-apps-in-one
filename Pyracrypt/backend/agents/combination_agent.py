from __future__ import annotations

import json
from typing import Any

from models.schemas import CombineResponse
from services import llm_service
from services.system_graph import normalize_system_input


def _combine_fallback(desc: str, graph: dict[str, Any]) -> CombineResponse:
    nodes = list(graph.get("nodes", []))
    edges = list(graph.get("edges", []))
    if len(nodes) >= 3:
        auth_like = next((n for n in nodes if "auth" in n.get("id", "").lower() or "jwt" in n.get("id", "").lower()), nodes[1])
        api_like = next((n for n in nodes if "api" in n.get("id", "").lower() or "payment" in n.get("id", "").lower()), nodes[-1])
        new_edges = edges + [
            {
                "id": "e_combo_policy",
                "from": auth_like["node_id"],
                "to": api_like["node_id"],
                "flow": "delegated_policy_enforcement",
                "trust": "cross_cutting",
            }
        ]
        explanation = (
            "Synthesized a cross-cutting policy edge: authentication logic is explicitly wired into a "
            "secondary high-value component, changing effective authorization scope when tokens are reused."
        )
    else:
        new_edges = edges + [
            {
                "id": "e_combo_shadow",
                "from": nodes[0]["node_id"] if nodes else "n_client",
                "to": nodes[-1]["node_id"] if nodes else "n0",
                "flow": "shadow_admin_channel",
                "trust": "ambiguous",
            }
        ]
        explanation = (
            "Introduced an ambiguous trust edge to model how operational shortcuts create hidden paths "
            "that bypass the intended primary control chain."
        )
    new_structure = {"nodes": nodes, "edges": new_edges, "description": desc, "variant": "combined"}
    return CombineResponse(new_structure=new_structure, explanation=explanation)


async def run_combination_engine(system: str | dict[str, Any]) -> CombineResponse:
    desc, graph = normalize_system_input(system)
    system_prompt = (
        "You combine software architecture components in novel but realistic ways to surface emergent risk. "
        "Given a graph, add or rewire edges/nodes to show a plausible combined configuration. "
        "Return JSON: {\"new_structure\":object,\"explanation\":string}. new_structure must include nodes,edges,description."
    )
    user_prompt = json.dumps({"system": desc, "graph": graph}, ensure_ascii=False)
    try:
        data = await llm_service.llm_json_completion(system_prompt, user_prompt)
        ns = data.get("new_structure")
        ex = data.get("explanation")
        if isinstance(ns, dict) and isinstance(ex, str):
            ns.setdefault("nodes", graph.get("nodes"))
            ns.setdefault("edges", graph.get("edges"))
            ns.setdefault("description", desc)
            return CombineResponse(new_structure=ns, explanation=ex)
    except Exception:
        pass
    return _combine_fallback(desc, graph)
