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
# Small Language Models: Advanced Lab

Three labs. Everything runs in this Colab machine, nothing on your laptop.

| Lab | You build | Needs a model |
|---|---|---|
| 6 | An eval harness that can actually fail | yes |
| 7 | A mixture of experts analysis | no |
| 8 | A memory budget | yes |

**Run the setup cells below now.** They take a few minutes. Keep reading while
they work.

Your numbers will not match the instructor's. You are on smaller models in a
shared VM. The shapes will match, the values will not.
"""

SETUP_INSTALL = """
# Install and start Ollama inside this VM.
#
# Two things this works around, both discovered the hard way:
#   1. Recent Ollama releases ship as .tar.zst and Colab has no zstd, so the
#      official install script fails in about a second with no visible error.
#   2. subprocess output goes to the kernel log rather than the cell, so every
#      command below prints its own output where you can actually see it.
import os, shutil, subprocess, time, requests

OLLAMA_BIN = shutil.which("ollama") or "/usr/local/bin/ollama"
URL = ("https://github.com/ollama/ollama/releases/download/"
       "v0.33.3/ollama-linux-amd64.tar.zst")

if not os.path.exists(OLLAMA_BIN):
    if not os.path.exists("/tmp/ollama.tar.zst"):
        print("downloading ollama, about 1.4 GB ...", flush=True)
        os.system(f"curl -fL --retry 3 -o /tmp/ollama.tar.zst {URL}")
    print(os.popen("apt-get -qq install -y zstd 2>&1 | tail -2").read())
    print(os.popen("tar --use-compress-program=unzstd -xf /tmp/ollama.tar.zst "
                   "-C /usr/local 2>&1 | tail -3").read())

if not os.path.exists(OLLAMA_BIN):
    raise RuntimeError("No binary at " + OLLAMA_BIN + ". Re-run this cell.")

subprocess.Popen([OLLAMA_BIN, "serve"],
                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

for _ in range(90):
    try:
        print("ollama running, version",
              requests.get("http://localhost:11434/api/version", timeout=2).json()["version"])
        break
    except Exception:
        time.sleep(1)
else:
    raise RuntimeError("Server did not come up. Re-run this cell.")
"""

SETUP_PULL = '''
# Pull the two models and fetch the recorded measurements. Two to three minutes.
import subprocess, requests, pathlib
# OLLAMA_BIN comes from the cell above.

# Two small models, about 3 GB, chosen so this works on a free CPU only VM.
# On Colab Pro with a GPU you can use ["granite4.2:3b", "granite4.2:8b"] instead
# and set SMALL/BIG/JUDGE to match, which lines your numbers up with the deck.
MODELS = ["lfm2.5-thinking:1.2b", "granite4.2:3b"]
for m in MODELS:
    print(f"pulling {m} ...", flush=True)
    r = subprocess.run([OLLAMA_BIN, "pull", m], capture_output=True, text=True)
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
# Lab 8 - How memory scales (15 min)

On your own servers this lab finds your ceiling. Here it measures this Colab VM,
so read the shapes rather than the values:

- cache grows with context
- concurrency multiplies it
- a stable prompt prefix is nearly free to reuse
"""



REWRITES = {'# Lab 6 - An evaluation harness that can fail (20 min)': '# Lab 6 - An eval harness that can fail (20 min)\n\nYou are not scoring a model here. You are building a harness whose numbers you\ncould defend when someone senior disagrees.\n\nFour things separate a real harness from a comfort blanket:\n\n1. the set is **composed by slice**, not sampled\n2. **mechanical checks first**, a judge only where nothing else works\n3. the judge is **checked against human labels** before you trust it\n4. every number carries an **interval**', '### 6a. Compose the set by slice': '### 6a. Compose the set by slice\n\nBelow is traffic with gold labels. Half ordinary, then hard cases, adversarial\ninput, boundaries, and cases where the right answer is to refuse.\n\nA uniform sample of production traffic contains almost none of the last three.\nThat is why uniform samples always pass.', '### 6b. Mechanical scoring first': '### 6b. Mechanical scoring first\n\nSchema and exact match cost nothing and never drift. Score **per slice**, because\nthe aggregate hides the failures you care about.', '### 6c. Error bars, before you conclude anything': '### 6c. Error bars, before you conclude anything\n\nIf two intervals overlap, you have not measured a difference. Run both models and\ncompare.', '### 6d. Paired comparison is far more sensitive': '### 6d. Paired comparison is far more sensitive\n\nComparing two aggregates throws away the pairing. Compare **per case** instead and\ncount only where the models disagree.', '### 6e. Validate the judge before you trust it': '### 6e. Validate the judge before you trust it\n\nSome things cannot be checked mechanically. A model can judge those, but only\nafter you measure its agreement with your own labels.\n\nBelow 80 percent agreement, it is not a gate. The `HUMAN` labels here stand in for\nthe fifty you would label yourself.', '### 6f. Turn it into a gate': '### 6f. Turn it into a gate\n\nA harness that prints numbers is a report. A harness that returns pass or fail is\na gate, and only a gate protects you on a Friday.', '### 7a. Separate what total size governs from what active size governs': '### 7a. What total size governs, and what active size governs\n\nLoad time and memory follow **total** parameters. Generation speed follows\n**active** parameters.', '### 7b. The metric that decides hardware': '### 7b. The metric that decides hardware\n\nThroughput per gigabyte. Your constraint is almost always memory, not compute.', '### 7c. Decide under a budget': '### 7c. Decide under a budget\n\nGiven a memory budget, a latency floor and a quality floor, which model would you\ndeploy, and how many copies?', '### 8a. Watch the KV cache grow': '### 8a. Watch the KV cache grow\n\nLoad the same model at different context settings. The weights never change, so\nevery extra gigabyte is cache.', '### 8b. Find the concurrency ceiling': '### 8b. Find the concurrency ceiling\n\nFire parallel requests and watch latency degrade. The knee in this curve is your\nreal capacity, not the single stream number.', '### 8c. Get the prefix back': '### 8c. Get the prefix back\n\nPut the stable part of a prompt first and send it twice. Then break it with a\nchanging value at the top and watch the saving vanish.', '### 8d. Write the sizing recommendation': '### 8d. Write the sizing recommendation\n\nPut the three measurements together into something you would send to whoever owns\nthe hardware budget.'}


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
            continue
        # 5. tighter, student facing prose for the Colab flavour
        if c["cell_type"] == "markdown":
            for head, replacement in REWRITES.items():
                if src.lstrip().startswith(head):
                    c["source"] = replacement.strip()
                    break

    nb["metadata"]["colab"] = {"provenance": [], "toc_visible": True}
    nb["metadata"]["kernelspec"] = {"display_name": "Python 3", "name": "python3"}
    nbf.write(nb, OUT)
    print(f"wrote {os.path.normpath(OUT)} - {len(cells)} cells "
          f"({n_cfg} config rewritten, {n_lab8} Lab 8 heading rewritten)")


if __name__ == "__main__":
    main()
