"""Run this before the workshop. It tells you in about a minute whether your
machine is ready, and exactly what to fix if it is not.

    python3 check_setup.py

Exit code 0 means you are ready. Anything else prints what to do.
"""
import json
import shutil
import subprocess
import sys
import time

OLLAMA = "http://localhost:11434"
REQUIRED = ["granite4.2:3b", "granite4.2:8b"]
OK, BAD, WARN = "  OK  ", " FAIL ", " WARN "
problems = []


def line(status, label, detail=""):
    print(f"[{status}] {label}" + (f"  {detail}" if detail else ""))


def main():
    print("Workshop setup check\n" + "=" * 60)

    # 1. python version
    v = sys.version_info
    if v >= (3, 9):
        line(OK, f"Python {v.major}.{v.minor}")
    else:
        line(BAD, f"Python {v.major}.{v.minor} is too old")
        problems.append("Install Python 3.9 or newer.")

    # 2. requests
    try:
        import requests  # noqa: F401
        line(OK, "requests installed")
    except ImportError:
        line(BAD, "requests not installed")
        problems.append("Run: pip install requests")
        print("\nCannot continue without requests.")
        return 1
    import requests

    # 3. ollama binary
    if shutil.which("ollama"):
        line(OK, "ollama on PATH")
    else:
        line(WARN, "ollama not on PATH", "fine if the app is running")

    # 4. server reachable
    try:
        ver = requests.get(f"{OLLAMA}/api/version", timeout=5).json().get("version")
        line(OK, "Ollama server reachable", f"version {ver}")
    except Exception:
        line(BAD, "Ollama server not reachable at " + OLLAMA)
        problems.append("Start Ollama, then re-run this script. "
                        "From a terminal: ollama serve")
        print_problems()
        return 1

    # 5. models present
    try:
        tags = requests.get(f"{OLLAMA}/api/tags", timeout=10).json().get("models", [])
    except Exception:
        tags = []
    have = {m.get("name") for m in tags}
    for want in REQUIRED:
        if want in have:
            size = next((m.get("size", 0) / 1e9 for m in tags if m.get("name") == want), 0)
            line(OK, f"model {want}", f"{size:.1f} GB")
        else:
            line(BAD, f"model {want} missing")
            problems.append(f"Run: ollama pull {want}")

    # 6. the lab data file that needs no model
    try:
        import pathlib
        p = pathlib.Path(__file__).with_name("moe_measurements.json")
        n = len(json.loads(p.read_text())["models"])
        line(OK, "moe_measurements.json", f"{n} recorded models")
    except Exception:
        line(WARN, "moe_measurements.json not found next to this script",
             "Lab 7 needs it")

    # 7. a real generation, which is the only check that proves it works
    if all(m in have for m in REQUIRED):
        try:
            t0 = time.time()
            d = requests.post(f"{OLLAMA}/api/chat", json={
                "model": REQUIRED[0], "stream": False, "think": False,
                "messages": [{"role": "user", "content": "Reply with one word: ready"}],
                "options": {"temperature": 0, "num_predict": 32}}, timeout=180).json()
            txt = (d.get("message", {}).get("content") or "").strip()
            dt = time.time() - t0
            tok_s = (d.get("eval_count", 0) / (d.get("eval_duration", 1) / 1e9)) \
                if d.get("eval_duration") else 0
            if txt:
                line(OK, "generation works", f"{dt:.1f}s, about {tok_s:.0f} tok/s")
                if tok_s and tok_s < 15:
                    line(WARN, "this machine is slow", "labs will work but run long")
            else:
                line(WARN, "empty response", "usually a reasoning model with too small a budget")
        except Exception as e:
            line(BAD, "generation failed", type(e).__name__)
            problems.append("The server is up but generation failed. Restart Ollama.")

    print("=" * 60)
    if problems:
        print_problems()
        return 1
    print("Ready. Nothing else to do before the workshop.")
    return 0


def print_problems():
    print("\nFix these:")
    for i, p in enumerate(problems, 1):
        print(f"  {i}. {p}")
    print("\nThen run this script again.")


if __name__ == "__main__":
    sys.exit(main())
