"""Record a mixture of experts model against dense models on identical prompts.

Produces 02-lab/moe_measurements.json, which Lab 7 analyses. Re-run this on your
own hardware if you want the lab to reflect your machine rather than the recorded
one. Every number in the output is measured, none are estimated.

Run: python3 source/measure_moe.py
"""
import json
import os
import platform
import statistics
import time
from datetime import date

import requests

OLLAMA = "http://localhost:11434"

MODELS = [
    ("lfm2.5-thinking:1.2b", "dense", "1.2B", "1.2B"),
    ("granite4.2:3b", "dense", "3B", "3B"),
    ("granite4.2:8b", "dense", "8B", "8B"),
    ("gpt-oss:20b", "moe", "20B", "3.6B"),
]

PROMPTS = [
    "Summarise in one sentence why memory bandwidth limits token generation.",
    "List three reasons a service might return HTTP 503.",
    "Explain the difference between a cache hit and a cache miss in one sentence.",
]

# A small measured capability probe, so capacity planning can trade throughput
# against quality instead of optimising throughput alone and always choosing the
# smallest model. Structured classification, scored by exact match.
CATEGORIES = ["billing", "access", "bug", "outage", "other"]
QUALITY_SET = [
    ("Card was charged twice for invoice INV-3021.", "billing"),
    ("Cannot log in since the SSO change this morning.", "access"),
    ("The export button returns a 500 on the reports page.", "bug"),
    ("Dashboard graphs are blank since 09:00 UTC.", "outage"),
    ("Please add Priya to the account as a read only user.", "access"),
    ("Renewal quote for next year, 40 seats.", "billing"),
    ("We were charged for 40 seats but cannot add the 40th user.", "billing"),
    ("Login works but every page 500s after the redirect.", "bug"),
    ("Everything is down for our whole team since 08:00.", "outage"),
    ("", "other"),
]
QSCHEMA = {"type": "object",
           "properties": {"category": {"type": "string", "enum": CATEGORIES}},
           "required": ["category"]}


def _classify_once(name, text, think):
    body = {"model": name, "stream": False, "format": QSCHEMA,
            "messages": [{"role": "user", "content":
                          "Classify into exactly one of: " + ", ".join(CATEGORIES) +
                          '. Reply as JSON {"category": "..."}. Message: ' + repr(text)}],
            # Reasoning native models spend part of this budget thinking. Too small a
            # cap returns empty content and would be scored as a capability failure.
            "options": {"temperature": 0.0, "num_ctx": 8192, "num_predict": 256}}
    if think is not None:
        body["think"] = think
    d = requests.post(f"{OLLAMA}/api/chat", json=body, timeout=300).json()
    return (d.get("message", {}).get("content") or "")


def quality(name):
    """Exact match accuracy on a small structured classification set.

    Some reasoning native models return empty content when thinking is disabled.
    Scoring that as zero would report a harness artifact as a capability result,
    so detect it and fall back, recording which mode the model needed.
    """
    think = False
    probe = ""
    try:
        probe = _classify_once(name, QUALITY_SET[0][0], think=False)
    except Exception:
        pass
    if not probe.strip():
        think = None                      # let the model think, it needs to
    hits = 0
    for text, gold in QUALITY_SET:
        try:
            out = _classify_once(name, text, think)
            hits += (json.loads(out or "{}").get("category") == gold)
        except Exception:
            pass
    return round(hits / len(QUALITY_SET), 2), ("thinking disabled" if think is False
                                               else "thinking required")


def unload(name):
    try:
        requests.post(f"{OLLAMA}/api/chat",
                      json={"model": name, "messages": [], "keep_alive": 0}, timeout=60)
    except Exception:
        pass
    time.sleep(3)


def resident_gb(name):
    try:
        ps = requests.get(f"{OLLAMA}/api/ps", timeout=15).json().get("models", [])
        for m in ps:
            if m.get("name", "").split(":")[0] == name.split(":")[0]:
                return m.get("size", 0) / 1e9
    except Exception:
        pass
    return 0.0


def disk_gb(name):
    try:
        tags = requests.get(f"{OLLAMA}/api/tags", timeout=15).json().get("models", [])
        for m in tags:
            if m.get("name") == name:
                return m.get("size", 0) / 1e9
    except Exception:
        pass
    return 0.0


def call(name, prompt, num_predict=120):
    body = {"model": name, "messages": [{"role": "user", "content": prompt}],
            "stream": False, "think": False,
            "options": {"temperature": 0.0, "num_ctx": 8192, "num_predict": num_predict}}
    t0 = time.time()
    d = requests.post(f"{OLLAMA}/api/chat", json=body, timeout=600).json()
    ns = 1e9
    return {
        "load_s": d.get("load_duration", 0) / ns,
        "prompt_tokens": d.get("prompt_eval_count", 0),
        "prompt_s": d.get("prompt_eval_duration", 0) / ns,
        "gen_tokens": d.get("eval_count", 0),
        "gen_s": d.get("eval_duration", 0) / ns,
        "wall_s": time.time() - t0,
    }


def measure(name, kind, total, active):
    print(f"  {name} ...", flush=True)
    unload(name)
    cold = call(name, PROMPTS[0])          # cold: includes load
    if cold.get("gen_tokens", 0) == 0:
        # A missing model returns an error body rather than raising. Writing the
        # resulting zeros would silently publish fabricated measurements.
        raise RuntimeError(f"{name} produced no tokens, is it pulled?")
    warm = [call(name, p) for p in PROMPTS]  # warm: model resident
    res = resident_gb(name)
    q_score, q_mode = quality(name)
    gen_rates = [w["gen_tokens"] / w["gen_s"] for w in warm if w["gen_s"] > 0]
    prm_rates = [w["prompt_tokens"] / w["prompt_s"] for w in warm if w["prompt_s"] > 0]
    return {
        "name": name,
        "kind": kind,
        "total_params": total,
        "active_params": active,
        "disk_gb": round(disk_gb(name), 2),
        "resident_gb": round(res, 2),
        "load_s": round(cold["load_s"], 2),
        "gen_tok_s": round(statistics.median(gen_rates), 1) if gen_rates else 0.0,
        "prompt_tok_s": round(statistics.median(prm_rates), 1) if prm_rates else 0.0,
        "quality": q_score,
        "quality_mode": q_mode,
        "quality_metric": "exact match on 10 structured classification cases",
        "samples": len(warm),
    }


def main():
    out = {
        "recorded_on": date.today().isoformat(),
        "host": f"{platform.system()} {platform.machine()}",
        "runtime": "ollama",
        "note": ("All values measured, none estimated. Cold load time measured after "
                 "an explicit unload. Generation and prompt rates are medians over "
                 "three prompts with the model resident."),
        "prompts": PROMPTS,
        "models": [],
    }
    for name, kind, total, active in MODELS:
        try:
            out["models"].append(measure(name, kind, total, active))
        except Exception as e:
            print(f"    SKIPPED {name}: {e}")
            out.setdefault("missing", []).append(name)
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "02-lab",
                        "moe_measurements.json")
    with open(path, "w") as f:
        json.dump(out, f, indent=2)
    print("wrote", os.path.normpath(path))
    for m in out["models"]:
        print(f"  {m['name']:<22} {m['kind']:<6} resident {m['resident_gb']:>6.2f} GB  "
              f"gen {m['gen_tok_s']:>6.1f} tok/s  load {m['load_s']:>5.1f}s")


if __name__ == "__main__":
    main()
