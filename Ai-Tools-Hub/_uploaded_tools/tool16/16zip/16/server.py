"""
Minimal backend for Schema Tightening Assistant.
Reuse this template and swap analysis logic; keep runtime under 3 seconds.
"""
import json
import time
from flask import Flask, request, jsonify, send_from_directory
from pathlib import Path

app = Flask(__name__, static_folder=".", static_url_path="")
APP_ROOT = Path(__file__).resolve().parent


def analyze_schema(obj):
    metrics = {"required": 0, "optional": 0, "depth": 0, "strictTypes": 0, "total": 0, "fields": []}

    def count_props(o, path, depth):
        metrics["depth"] = max(metrics["depth"], depth)
        if not o or not isinstance(o, dict):
            return
        required = o.get("required", []) if isinstance(o.get("required"), list) else []
        props = o.get("properties") if isinstance(o.get("properties"), dict) else {}
        for pk, pv in props.items():
            metrics["total"] += 1
            is_required = pk in required
            if is_required:
                metrics["required"] += 1
            else:
                metrics["optional"] += 1
            type_strict = isinstance(pv, dict) and (pv.get("enum") or (pv.get("type") and pv.get("type") != "string"))
            if type_strict:
                metrics["strictTypes"] += 1
            metrics["fields"].append({"path": f"{path}.{pk}" if path else pk, "required": is_required, "strict": bool(type_strict)})
            if isinstance(pv, dict):
                count_props(pv, f"{path}.{pk}" if path else pk, depth + 1)
        for k, v in o.items():
            if k in ("properties", "required"):
                continue
            if isinstance(v, dict):
                count_props(v, path, depth + 1)
            elif isinstance(v, list):
                for i, item in enumerate(v):
                    if isinstance(item, dict):
                        count_props(item, path, depth + 1)

    if isinstance(obj, dict) and (obj.get("openapi") or obj.get("swagger")):
        schemas = obj.get("components", {}).get("schemas") or {}
        for name, s in schemas.items():
            if isinstance(s, dict):
                count_props(s, name, 0)
        for path_name, path_obj in (obj.get("paths") or {}).items():
            if isinstance(path_obj, dict):
                count_props(path_obj, path_name, 0)
    else:
        count_props(obj if isinstance(obj, dict) else {}, "", 0)

    if metrics["total"] == 0 and isinstance(obj, dict):
        metrics["total"] = 1
        metrics["optional"] = 1
        metrics["fields"] = [{"path": "(root)", "required": False, "strict": False}]
    return metrics


def analyze_prompt(text):
    words = len((text or "").split())
    has_structure = bool(text and ("{" in text or "[" in text))
    return {
        "total": 1,
        "required": 1 if has_structure else 0,
        "optional": 1,
        "depth": 0,
        "strictTypes": 1 if words > 20 else 0,
        "fields": [{"path": "prompt", "required": has_structure, "strict": words > 20}],
    }


def score_tightness(metrics):
    total = (metrics.get("required") or 0) + (metrics.get("optional") or 0) or 1
    required_ratio = (metrics.get("required") or 0) / total
    strict_ratio = (metrics.get("strictTypes") or 0) / total
    depth_penalty = min((metrics.get("depth") or 0) * 5, 25)
    raw = (required_ratio * 40) + (strict_ratio * 40) - depth_penalty + 20
    return max(0, min(100, round(raw)))


@app.route("/")
def index():
    return send_from_directory(APP_ROOT, "index.html")


@app.route("/lander")
def lander():
    return send_from_directory(APP_ROOT, "landing.html")


@app.route("/api/analyze", methods=["POST"])
def analyze():
    start = time.perf_counter()
    body = request.get_json(force=True, silent=True) or {}
    raw = (body.get("input") or body.get("text") or "").strip()
    input_type = body.get("inputType", "schema")
    if not raw:
        return jsonify({"error": "Please paste a schema, API definition, or prompt."}), 400
    if input_type == "prompt":
        metrics = analyze_prompt(raw)
    else:
        try:
            data = json.loads(raw)
            metrics = analyze_schema(data)
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON."}), 400
    score = score_tightness(metrics)
    elapsed = time.perf_counter() - start
    return jsonify({"score": score, "metrics": metrics, "elapsedMs": round(elapsed * 1000)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
