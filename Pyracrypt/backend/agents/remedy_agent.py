from __future__ import annotations

import json
from typing import Any

from models.schemas import RemedyResponse
from services import llm_service


def _as_attack(attack: str | dict[str, Any]) -> str:
    if isinstance(attack, dict):
        parts = []
        if attack.get("attack_steps"):
            parts.append("\n".join(str(s) for s in attack["attack_steps"]))
        if attack.get("hypothesis"):
            parts.append(str(attack["hypothesis"]))
        if attack.get("text"):
            parts.append(str(attack["text"]))
        return "\n".join(parts) if parts else json.dumps(attack, ensure_ascii=False)
    return str(attack)


def _remedy_fallback(attack_text: str) -> RemedyResponse:
    return RemedyResponse(
        fix=(
            "Introduce strict token scoping (audience/issuer), per-endpoint authorization checks on object ownership, "
            "and centralized policy enforcement with deny-by-default defaults."
        ),
        explanation=(
            "The attack chain succeeds when trust is inherited implicitly across components. "
            "Explicit, minimal scopes and object-level authorization remove confused-deputy windows."
        ),
        improved_architecture=(
            "Split read/write surfaces, add an internal policy service for decisions, enforce mTLS between services, "
            "and ship tamper-evident audit logs for all high-value mutations."
        ),
    )


async def run_remedy_engine(attack: str | dict[str, Any]) -> RemedyResponse:
    attack_text = _as_attack(attack)
    system_prompt = (
        "You are a staff engineer designing remediations. Given an attack description, propose concrete fixes, "
        "explain why the vulnerability class exists, and describe an improved architecture. "
        "Return JSON: {\"fix\":string,\"explanation\":string,\"improved_architecture\":string}"
    )
    user_prompt = json.dumps({"attack": attack_text}, ensure_ascii=False)
    try:
        data = await llm_service.llm_json_completion(system_prompt, user_prompt)
        if all(k in data for k in ("fix", "explanation", "improved_architecture")):
            return RemedyResponse(
                fix=str(data["fix"]),
                explanation=str(data["explanation"]),
                improved_architecture=str(data["improved_architecture"]),
            )
    except Exception:
        pass
    return _remedy_fallback(attack_text)
