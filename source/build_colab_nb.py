"""Generate the Colab flavour of the advanced lab.

Takes 03-lab/slm_advanced_lab.ipynb and produces
03-lab/slm_advanced_lab_colab.ipynb by:

  1. prepending a setup section that installs and starts Ollama inside the
     Colab VM and pulls the models
  2. switching to a light model pairing, because Colab is usually CPU only
  3. fetching the recorded measurements from the public repository
  4. rewording Lab 8, which measures the Colab VM rather than a laptop

Run: python3 source/build_colab_nb.py
"""
import os

import nbformat as nbf

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "03-lab", "slm_advanced_lab.ipynb")
OUT = os.path.join(HERE, "..", "03-lab", "slm_advanced_lab_colab.ipynb")
RAW = ("https://raw.githubusercontent.com/kashcm/slm-workshop/main/"
       "03-lab/moe_measurements.json")

SETUP_MD = """
# Small Language Models: Advanced Lab (Colab)

Everything runs inside this Colab virtual machine. There is nothing to install on
your own computer and nothing to download to it.

Run the two setup cells below **first**. They take two to four minutes, mostly
model download. Start them now and read ahead while they finish.

Three labs:

| Lab | What you build | Needs a model |
|---|---|---|
| 6 | An evaluation harness with slices, a validated judge and error bars | yes |
| 7 | A mixture of experts analysis | no, it reads recorded measurements |
| 8 | How memory scales with context and concurrency | yes |

**One honest note about this environment.** Colab usually gives you CPU only, so
we use two small models. The numbers you see are this virtual machine's numbers,
not your laptop's. The shapes and the lessons transfer. The values do not, and
that distinction is itself one of the things this class is about.
"""

SETUP_INSTALL = '''
# Install and start Ollama inside this VM. Takes about a minute.
import shutil, subprocess, time, requests

if shutil.which("ollama") is None:
    print("installing ollama ...", flush=True)
    r = subprocess.run("curl -fsSL https://ollama.com/install.sh | sh",
                       shell=True, capture_output=True, text=True)
    if shutil.which("ollama") is None:
        raise RuntimeError(
            "ollama install failed. Last output: "
            + (r.stderr or r.stdout)[-400:]
            + " If you are not on Linux, install Ollama yourself and re-run this cell."
        )
else:
    print("ollama already present")

# Start the server in the background. Colab has no service manager.
subprocess.Popen(["ollama", "serve"],
                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

for _ in range(60):
    try:
        v = requests.get("http://localhost:11434/api/version", timeout=2).json()
        print("ollama running, version", v.get("version"))
        break
    except Exception:
        time.sleep(1)
else:
    raise RuntimeError("ollama did not start, run this cell again")
'''

SETUP_PULL = '''
# Pull the two models and fetch the recorded measurements. Two to three minutes.
import subprocess, requests, pathlib

MODELS = ["lfm2.5-thinking:1.2b", "granite4.2:3b"]   # about 3 GB in total
for m in MODELS:
    print(f"pulling {m} ...", flush=True)
    r = subprocess.run(["ollama", "pull", m], capture_output=True, text=True)
    if r.returncode != 0:
        print("  failed:", r.stderr.strip().splitlines()[-1:] or r.stdout[-200:])

have = {m["name"] for m in requests.get("http://localhost:11434/api/tags").json()["models"]}
for m in MODELS:
    print(("  ready   " if m in have else "  MISSING ") + m)

# The mixture of experts lab reads measurements recorded on real hardware.
url = "%s"
p = pathlib.Path("moe_measurements.json")
if not p.exists():
    p.write_bytes(requests.get(url, timeout=60).content)
print("measurements:", len(__import__("json").loads(p.read_text())["models"]), "models recorded")
''' % RAW

SETUP_CHECK = '''
# One real generation. This is the only check that proves the setup works.
import requests, time
t0 = time.time()
d = requests.post("http://localhost:11434/api/chat", json={
    "model": "granite4.2:3b", "stream": False, "think": False,
    "messages": [{"role": "user", "content": "Reply with one word: ready"}],
    "options": {"temperature": 0, "num_predict": 32}}, timeout=300).json()
txt = (d.get("message", {}).get("content") or "").strip()
rate = d.get("eval_count", 0) / (d.get("eval_duration", 1) / 1e9) if d.get("eval_duration") else 0
print(f"reply {txt!r} in {time.time()-t0:.1f}s, about {rate:.0f} tok/s")
print("You are ready." if txt else "Empty reply, re-run the cell.")
'''

LAB8_MD = """
# Lab 8 - How memory actually scales (15 min)

On your own hardware this lab finds the ceiling of your machine. Here it measures
this Colab virtual machine instead, so treat the values as illustrative and the
**shapes** as the lesson: cache grows linearly with context, concurrency
multiplies it, and a stable prompt prefix is nearly free to reuse.

Everything you learn here transfers to your own servers. The numbers do not.
"""


def main():
    nb = nbf.read(SRC, as_version=4)
    cells = nb["cells"]

    # 1. replace the intro markdown with the Colab one
    cells[0] = nbf.v4.new_markdown_cell(SETUP_MD.strip())

    # 2. insert setup cells right after the intro
    setup = [
        nbf.v4.new_markdown_cell("## Setup, run these three cells first"),
        nbf.v4.new_code_cell(SETUP_INSTALL.strip()),
        nbf.v4.new_code_cell(SETUP_PULL.strip()),
        nbf.v4.new_code_cell(SETUP_CHECK.strip()),
    ]
    cells[1:1] = setup

    n_cfg = n_lab8 = 0
    for c in cells:
        src = "".join(c["source"])
        # 3. light model pairing, because Colab is usually CPU only
        if c["cell_type"] == "code" and 'SMALL = "granite4.2:3b"' in src:
            src = (src.replace('SMALL = "granite4.2:3b"', 'SMALL = "lfm2.5-thinking:1.2b"')
                      .replace('BIG   = "granite4.2:8b"', 'BIG   = "granite4.2:3b"')
                      .replace('JUDGE = "granite4.2:8b"', 'JUDGE = "granite4.2:3b"')
                      .replace("# deliberately not the same as the candidate below",
                               "# small, because Colab is usually CPU only"))
            c["source"] = src
            n_cfg += 1
        # 4. reword the Lab 8 heading for a virtual machine
        if c["cell_type"] == "markdown" and src.lstrip().startswith("# Lab 8"):
            c["source"] = LAB8_MD.strip()
            n_lab8 += 1

    nb["metadata"]["colab"] = {"provenance": [], "toc_visible": True}
    nb["metadata"]["kernelspec"] = {"display_name": "Python 3", "name": "python3"}
    nbf.write(nb, OUT)
    print(f"wrote {os.path.normpath(OUT)} - {len(cells)} cells "
          f"({n_cfg} config rewritten, {n_lab8} Lab 8 heading rewritten)")


if __name__ == "__main__":
    main()
