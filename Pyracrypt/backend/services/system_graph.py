from __future__ import annotations

import json
import re
from typing import Any


def _tokens(text: str) -> list[str]:
    t = re.sub(r"[^\w\s]", " ", text.lower())
    return [w for w in t.split() if len(w) > 2]


def _detect_components(text: str) -> list[dict[str, Any]]:
    lower = text.lower()
    catalog = [
        ("payment", "Payment API", "processes_card_and_settlement"),
        ("api", "Public API", "exposes_http_endpoints"),
        ("jwt", "JWT Auth", "bearer_token_validation"),
        ("oauth", "OAuth", "delegated_authorization"),
        ("auth", "Authentication", "identity_verification"),
        ("profile", "User Profiles", "pii_storage"),
        ("database", "Database", "persistent_storage"),
        ("db", "Database", "persistent_storage"),
        ("cache", "Cache", "session_and_token_cache"),
        ("redis", "Cache", "session_and_token_cache"),
        ("admin", "Admin Console", "privileged_operations"),
        ("webhook", "Webhooks", "external_callbacks"),
        ("upload", "File Upload", "untrusted_binary_input"),
        ("graphql", "GraphQL", "complex_query_surface"),
        ("grpc", "gRPC", "binary_rpc_surface"),
        ("queue", "Message Queue", "async_processing"),
        ("s3", "Object Storage", "blob_access"),
        ("kms", "KMS", "key_management"),
        ("iam", "IAM", "policy_enforcement"),
    ]
    found: dict[str, dict[str, Any]] = {}
    for key, label, role in catalog:
        if key in lower or key in " ".join(_tokens(text)):
            found[label] = {"id": label, "type": "component", "role": role}
    if not found:
        found["Core Service"] = {"id": "Core Service", "type": "component", "role": "generic_processing"}
    nodes = list(found.values())
    for i, n in enumerate(nodes):
        n["node_id"] = f"n{i}"
    return nodes


def build_graph(system: str) -> dict[str, Any]:
    internal = _detect_components(system)
    client = {"id": "Client", "type": "actor", "role": "untrusted_origin", "node_id": "n_client"}
    nodes = [client] + internal
    id_map = {n["id"]: n["node_id"] for n in nodes}

    edges: list[dict[str, Any]] = []
    if len(internal) == 0:
        edges.append(
            {
                "id": "e0",
                "from": id_map["Client"],
                "to": id_map["Core Service"],
                "flow": "ingress",
                "trust": "external",
            }
        )
    else:
        first = internal[0]["node_id"]
        edges.append(
            {
                "id": "e_ingress",
                "from": id_map["Client"],
                "to": first,
                "flow": "ingress",
                "trust": "external",
            }
        )
        for i in range(len(internal) - 1):
            a, b = internal[i]["node_id"], internal[i + 1]["node_id"]
            edges.append(
                {
                    "id": f"e{i}",
                    "from": a,
                    "to": b,
                    "flow": "request_data",
                    "trust": "application",
                }
            )
    return {"nodes": nodes, "edges": edges, "description": system.strip(), "node_index": id_map}


def normalize_system_input(system: str | dict[str, Any]) -> tuple[str, dict[str, Any]]:
    if isinstance(system, dict):
        desc = str(system.get("description") or system.get("text") or json.dumps(system, ensure_ascii=False))
        graph = system.get("graph") or build_graph(desc)
        return desc, graph
    s = str(system).strip()
    return s, build_graph(s)
