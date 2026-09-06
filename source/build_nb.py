import nbformat as nbf
from nbformat.v4 import new_notebook, new_markdown_cell, new_code_cell

C = []
def md(s): C.append(new_markdown_cell(s.strip("\n")))
def code(s): C.append(new_code_cell(s.strip("\n")))

md(r"""
# SLMs in Practice. Hands-On Lab

**2-hour class · 60 minutes of this notebook · everything runs locally on your laptop**

You will:

| Lab | Minutes | What you build |
|---|---|---|
| **0** | 3 | Environment check, first tokens |
| **1** | 12 | Measure speed / memory / quality across model sizes |
| **2** | 10 | Constrained structured extraction + a scored golden set |
| **3** | 20 | A real tool-calling agent loop, and measure per-step reliability `p` |
| **4** | 10 | A router: small model first, escalate on validation failure |
| **5** | 5 | The eval harness that decides whether any of this shipped |

Nothing here calls a hosted API. No keys. No network after the model pulls.

---

## Before you start

```bash
# 1. Install Ollama  (https://ollama.com/download)
#    macOS 14+ : download the .dmg
#    Windows 10 22H2+ : OllamaSetup.exe  (no admin rights needed)
#    Linux : curl -fsSL https://ollama.com/install.sh | sh

# 2. THE MOST IMPORTANT LINE IN THIS FILE
#    Ollama defaults to a 4K context on machines with <24GB VRAM.
#    4K silently truncates your tool schemas and your history, and you
#    will blame the model. Restart the server with a real context:
OLLAMA_CONTEXT_LENGTH=32000 ollama serve

# 3. Pull the models (do this the night before, ~8 GB total)
ollama pull granite4.2:3b          # 2.2 GB  <- the workhorse for today
ollama pull granite4.2:8b          # 5.3 GB  <- the "big" model we escalate to
ollama pull lfm2.5-thinking:1.2b   # 731 MB  <- emergency floor, 4GB RAM laptops

# 4. Python deps
pip install requests
```

> **If your laptop is tight on RAM:** set `SMALL` to `lfm2.5-thinking:1.2b` and
> `BIG` to `granite4.2:3b` in the config cell. Every lab still works; the
> numbers just get worse, which is itself the lesson.
""")

md(r"""
---
# Lab 0. Environment check (3 min)

Run the next two cells. If both print green, you are ready.
""")

code(r'''
# ---------------------------------------------------------------- CONFIG
# Change these two lines if you are running different models.
SMALL = "granite4.2:3b"        # the SLM under test
BIG   = "granite4.2:8b"        # the escalation target ("the big model")
TINY  = "lfm2.5-thinking:1.2b" # optional third point on the size curve

OLLAMA = "http://localhost:11434"
NUM_CTX = 8192                 # per-request context. Raise for Lab 3 if needed.
# ------------------------------------------------------------------------

import json, time, statistics, textwrap
import requests

def chat(model, messages, tools=None, fmt=None, temperature=0.0, num_ctx=NUM_CTX,
         timeout=300, think=None, num_predict=None):
    """One non-streaming call to Ollama's native /api/chat.

    Returns (message_dict, metrics_dict). We use the native API rather than the
    OpenAI-compatible /v1 path because it exposes real timing counters, which
    is the whole point of Lab 1.
    """
    body = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": temperature, "num_ctx": num_ctx},
    }
    if tools: body["tools"] = tools
    if fmt:   body["format"] = fmt
    # Reasoning models will happily spend the whole context thinking, which turns
    # a one line arithmetic question into a multi minute call. Both switches are
    # off by default so the other labs are unaffected.
    if think is not None:       body["think"] = think
    if num_predict is not None: body["options"]["num_predict"] = num_predict
    r = requests.post(f"{OLLAMA}/api/chat", json=body, timeout=timeout)
    r.raise_for_status()
    d = r.json()
    ns = 1e9
    m = {
        "load_s":        d.get("load_duration", 0) / ns,
        "prompt_tokens": d.get("prompt_eval_count", 0),
        "prompt_s":      d.get("prompt_eval_duration", 0) / ns,
        "gen_tokens":    d.get("eval_count", 0),
        "gen_s":         d.get("eval_duration", 0) / ns,
        "total_s":       d.get("total_duration", 0) / ns,
    }
    m["tok_per_s"] = (m["gen_tokens"] / m["gen_s"]) if m["gen_s"] else 0.0
    return d["message"], m

def ask(model, prompt, **kw):
    """Convenience: single user turn in, string out."""
    msg, met = chat(model, [{"role": "user", "content": prompt}], **kw)
    return msg.get("content", ""), met

print("helpers loaded")
''')

code(r'''
# Is the server up, and do we have the models?
try:
    tags = requests.get(f"{OLLAMA}/api/tags", timeout=10).json()
except Exception as e:
    raise SystemExit(f"FAIL: cannot reach Ollama at {OLLAMA}.\n"
                     f"Start it with:  OLLAMA_CONTEXT_LENGTH=32000 ollama serve\n{e}")

have = {m["name"] for m in tags.get("models", [])}
have |= {n.split(":")[0] for n in have}          # allow bare-name matches
print("Models on this machine:")
for m in sorted(tags.get("models", []), key=lambda x: x["name"]):
    print(f"   {m['name']:<32} {m['size']/1e9:>5.1f} GB")

for want in (SMALL, BIG):
    ok = want in have or want.split(":")[0] in have
    print(("OK   " if ok else "MISSING ") + want + ("" if ok else f"   ->  ollama pull {want}"))
''')

code(r'''
# First tokens. This also pays the one-time model load cost so Lab 1 is honest.
out, met = ask(SMALL, "In one sentence: what is a small language model?")
print(out.strip())
print(f"\nload {met['load_s']:.1f}s | generated {met['gen_tokens']} tok "
      f"in {met['gen_s']:.1f}s = {met['tok_per_s']:.1f} tok/s")
''')

md(r"""
> **Read the number you just printed.** Below roughly **5 tok/s** an interactive
> agent stops being tolerable. That number, not a benchmark leaderboard, is what
> decides which model you can actually deploy on this hardware.
""")

md(r"""
---
# Lab 1. What does size actually buy you? (12 min)

Three things move when you change model size: **speed**, **memory**, and
**quality**. They do not move at the same rate, and the whole discipline of
using SLMs is knowing where the knee is.

## 1a. Speed and memory across the size curve
""")

code(r'''
PROMPT = ("Write a Python function `dedupe_preserve_order(items)` that removes "
          "duplicates from a list while preserving first-seen order. "
          "Return only the code, no explanation.")

rows = []
for name in [TINY, SMALL, BIG]:
    try:
        txt, met = ask(name, PROMPT)
    except Exception as e:
        print(f"skip {name}: {e}")
        continue
    rows.append((name, met))
    print(f"\n=== {name} ===")
    print(textwrap.indent(txt.strip()[:400], "  "))

print("\n{:<26} {:>9} {:>10} {:>10} {:>10}".format(
      "model", "gen tok", "gen s", "tok/s", "total s"))
for name, m in rows:
    print("{:<26} {:>9} {:>10.2f} {:>10.1f} {:>10.2f}".format(
          name, m["gen_tokens"], m["gen_s"], m["tok_per_s"], m["total_s"]))
''')

code(r'''
# Resident memory per loaded model, straight from the server.
ps = requests.get(f"{OLLAMA}/api/ps", timeout=10).json()
print("{:<28} {:>10} {:>12}".format("loaded model", "VRAM/RAM", "ctx"))
for m in ps.get("models", []):
    print("{:<28} {:>9.1f}G {:>12}".format(
        m["name"], m.get("size", 0)/1e9, m.get("context_length", "?")))
''')

md(r"""
**Discuss (2 min).** You should see roughly a **linear** cost in tokens/sec as
parameters grow, because generation is *memory-bandwidth bound*, not
compute bound. That is also why an M4 barely beats an M2 and loses to an M3 Pro:
bandwidth, not cores.

Rules of thumb worth writing down:

| Class | Q4_K_M weights | Practical RAM | Comfortable on |
|---|---|---|---|
| 1B | 0.7-1.3 GB | 3 GB | anything |
| 3B | 2.0-2.2 GB | 4-5 GB | an 8 GB laptop |
| 7-8B | 4.5-6.0 GB | 8 GB | a 16 GB laptop |
| 14B | ~9 GB | 12-16 GB | 16 GB minimum |

Budget **weights + ~1 GB runtime + KV cache**. KV cache is the one everybody
forgets; at 64K context it can cost more than the weights themselves.
""")

md(r"""
## 1b. Where quality actually breaks

Generic benchmarks (MMLU, GPQA) will not tell you whether a model can do *your*
job. But there is one degradation pattern worth seeing with your own eyes:
**multi-step arithmetic and chained reasoning degrade far faster than
single-shot recall** as you shrink or quantize a model.

Ten problems. Watch the small model and the big model diverge.
""")

code(r'''
ARITH = [
    ("A server costs $2.90/hr. How much for 3 days? Answer with just the number.", "208.8"),
    ("A 4-bit quantized 8B model is ~4.9GB. How many fit in 24GB VRAM? Just the integer.", "4"),
    ("If 1.5M checks/month and 2% escalate, how many escalate? Just the integer.", "30000"),
    ("A model does 42 tok/s. How many seconds for 1260 tokens? Just the number.", "30"),
    ("Input is $2/1M and output $10/1M. Cost of 800k in + 200k out? Just the number in dollars.", "3.6"),
    ("Per-step accuracy 0.9 over 5 steps. Success probability to 3 decimals?", "0.590"),
    ("22 trillion tokens for a 3B model. Tokens per parameter? Just the integer.", "7333"),
    ("A GPU rig is $504/month. At $0.15/1M self-hosted vs $3.60/1M API, break-even tokens/month in millions? Just the integer.", "146"),
    ("384 GPUs for 24 days. Total GPU-hours? Just the integer.", "221184"),
    ("A 70B model at fp16 is 140GB. At Q4_K_M (~4.9 bits/weight), GB? One decimal.", "42.9"),
]

def grade(answer, expected):
    """Loose numeric match, the model may pad with words or units."""
    import re
    nums = re.findall(r"-?\d+\.?\d*", answer.replace(",", ""))
    try:
        e = float(expected)
    except ValueError:
        return expected.lower() in answer.lower()
    return any(abs(float(n) - e) < max(0.01, abs(e) * 0.005) for n in nums)

for model in [SMALL, BIG]:
    hits, lat = 0, []
    for q, exp in ARITH:
        txt, met = ask(model, q, think=False, num_predict=512)
        ok = grade(txt, exp)
        hits += ok
        lat.append(met["total_s"])
        print(f"  {'PASS' if ok else 'FAIL'}  {model:<18} exp={exp:<10} got={txt.strip()[:60]!r}")
    print(f"==> {model}: {hits}/{len(ARITH)} = {hits/len(ARITH):.0%}, "
          f"median {statistics.median(lat):.1f}s/question\n")
''')

md(r"""
**Discuss (2 min).** Two things to take away:

1. The gap you just measured is on **chained arithmetic**. Run the same
   comparison on classification or extraction (Lab 2) and the gap will be much
   smaller. *Task shape decides model size, not the other way round.*
2. On a 10-item set, a 1-item difference is **10%**. That is noise. This is a
   toy; Lab 5 is about doing it properly.

**Optional stretch (do at home):** `ollama pull granite4.2:3b-q8_0`, rerun this
cell against it, and compare with the Q4 default. Published numbers for
Llama-3.1-8B: perplexity moves 7.32 → 7.56 from fp16 to Q4_K_M (nothing), but
GSM8K falls **77.6 → 68.3** at Q3_K_S. Quantization error compounds through
reasoning chains. Do not go below Q4 for anything agentic.
""")

md(r"""
---
# Lab 2. Structured output (10 min)

The single highest-value thing an SLM does in a B2B pipeline is turn messy text
into a **fixed schema**. It is narrow, repetitive, high-volume, non-conversational, exactly the profile where a 3B model is not a compromise.

The trick is to stop asking politely and start **constraining the decoder**.
Ollama's `format` field takes a full JSON Schema and constrains generation so
invalid tokens cannot be emitted.
""")

code(r'''
TICKETS = [
    ("Subject: URGENT prod down\nOur checkout API has been returning 503 since 09:14 UTC. "
     "Order volume is zero. Acct #A-4471, plan Enterprise. Please escalate.",
     {"category": "outage", "severity": "critical", "account_id": "A-4471"}),
    ("Hi, could someone add Priya (priya@acme.io) as a read-only user on our workspace? "
     "No rush. Account A-2210.",
     {"category": "access_request", "severity": "low", "account_id": "A-2210"}),
    ("The invoice for July (acct A-9003) shows 3 seats but we downgraded to 2 on June 28. "
     "Can you credit the difference?",
     {"category": "billing", "severity": "medium", "account_id": "A-9003"}),
    ("Getting intermittent 429s on the /v2/events endpoint, maybe 1 in 20 calls, since "
     "yesterday afternoon. Account A-1187. Not blocking but annoying.",
     {"category": "bug", "severity": "medium", "account_id": "A-1187"}),
    ("Would love to see SAML SSO support. Any timeline? We're A-6650, evaluating renewal.",
     {"category": "feature_request", "severity": "low", "account_id": "A-6650"}),
    ("EVERYTHING IS BROKEN. dashboards blank, exports failing, cannot log in. account A-3312. "
     "we have a board demo in 40 minutes.",
     {"category": "outage", "severity": "critical", "account_id": "A-3312"}),
    ("Please delete all data for user id 88213 under GDPR Article 17. Account A-7729. "
     "Statutory deadline is 30 days.",
     {"category": "compliance", "severity": "high", "account_id": "A-7729"}),
    ("hey quick q - does the export include archived records? acct A-5004",
     {"category": "question", "severity": "low", "account_id": "A-5004"}),
]

TICKET_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "enum": [
            "outage", "bug", "billing", "access_request",
            "feature_request", "compliance", "question"]},
        "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
        "account_id": {"type": "string"},
    },
    "required": ["category", "severity", "account_id"],
}

SYS = ("You classify B2B support tickets. Return ONLY the JSON object matching "
       "the schema. severity=critical means production is fully down for the customer.")

def classify(model, text, constrained=True):
    msgs = [{"role": "system", "content": SYS}, {"role": "user", "content": text}]
    msg, met = chat(model, msgs, fmt=TICKET_SCHEMA if constrained else None)
    raw = msg.get("content", "")
    try:
        parsed = json.loads(raw)
    except Exception:
        return None, met, f"unparseable: {raw[:120]!r}"
    if not isinstance(parsed, dict):
        return None, met, f"not an object: {raw[:120]!r}"
    return parsed, met, None
''')

code(r'''
def score_extraction(model, constrained=True):
    field_hits = {"category": 0, "severity": 0, "account_id": 0}
    exact, parse_fail = 0, 0
    for text, gold in TICKETS:
        got, met, err = classify(model, text, constrained)
        if got is None:
            parse_fail += 1
            print(f"  PARSE FAIL: {err}")
            continue
        for k in field_hits:
            field_hits[k] += (str(got.get(k, "")).strip() == gold[k])
        ok = all(str(got.get(k, "")).strip() == gold[k] for k in gold)
        exact += ok
        if not ok:
            print(f"  MISS  gold={gold}  got={got}")
    n = len(TICKETS)
    print(f"\n{model}  constrained={constrained}")
    print(f"  parse failures : {parse_fail}/{n}")
    for k, v in field_hits.items():
        print(f"  {k:<12} : {v}/{n} = {v/n:.0%}")
    print(f"  EXACT ROW     : {exact}/{n} = {exact/n:.0%}")
    return exact / n

print("=== constrained decoding (JSON Schema enforced) ===")
score_extraction(SMALL, constrained=True)

print("\n=== unconstrained (schema only described in the prompt) ===")
score_extraction(SMALL, constrained=False)
''')

md(r"""
**Discuss (3 min).**

- Constrained decoding should take your **parse failure rate to zero**. It cannot
  fix a wrong *answer*, only a malformed one. Those are different bugs and you
  should measure them separately.
- Look at the per-field breakdown. `account_id` is near-perfect (it is copying).
  `severity` is where the errors live (it is judging). **Score per field, never
  just the average**, an average hides exactly the field that is failing.
- 8 examples is a demo. A real golden set is **50-100** cases for one feature,
  150-300 for a maturing product, 400+ for a regulated flow, with 15-25% of them
  deliberately nasty edge cases.

**Exercise (2 min):** add one adversarial ticket of your own, ambiguous, or
two intents in one message, and see which field breaks first.
""")

md(r"""
---
# Lab 3. The agent loop, and the number that decides everything (20 min)

Now the real thing. Three tools, a loop, and, critically, **measurement**.

Everybody builds the loop. Almost nobody measures per-step reliability `p`.
That single number tells you whether your agent can survive its own horizon.
""")

code(r'''
# ---- the "backend" our agent acts against -------------------------------
ORDERS = {
    "ORD-1001": {"customer": "A-4471", "status": "shipped",   "total": 4200.00, "items": 3},
    "ORD-1002": {"customer": "A-2210", "status": "processing","total":  189.50, "items": 1},
    "ORD-1003": {"customer": "A-9003", "status": "delivered", "total": 2750.00, "items": 7},
    "ORD-1004": {"customer": "A-4471", "status": "cancelled", "total":  980.00, "items": 2},
}
INVENTORY = {"SKU-A": 0, "SKU-B": 340, "SKU-C": 12, "SKU-D": 5000}
TICKETS_DB = {}

CALL_LOG = []   # every tool call the model makes, for scoring

def lookup_order(order_id: str):
    CALL_LOG.append(("lookup_order", {"order_id": order_id}))
    return ORDERS.get(order_id, {"error": "not found"})

def check_inventory(sku: str):
    CALL_LOG.append(("check_inventory", {"sku": sku}))
    if sku not in INVENTORY:
        return {"error": "unknown sku"}
    return {"sku": sku, "on_hand": INVENTORY[sku], "in_stock": INVENTORY[sku] > 0}

def create_ticket(account_id: str, summary: str, severity: str):
    CALL_LOG.append(("create_ticket",
                     {"account_id": account_id, "summary": summary, "severity": severity}))
    tid = f"TCK-{len(TICKETS_DB)+1:04d}"
    TICKETS_DB[tid] = {"account_id": account_id, "summary": summary, "severity": severity}
    return {"ticket_id": tid, "created": True}

IMPL = {"lookup_order": lookup_order,
        "check_inventory": check_inventory,
        "create_ticket": create_ticket}

TOOLS = [
    {"type": "function", "function": {
        "name": "lookup_order",
        "description": "Look up a single order by its ID. IDs look like ORD-1001.",
        "parameters": {"type": "object",
            "properties": {"order_id": {"type": "string"}},
            "required": ["order_id"]}}},
    {"type": "function", "function": {
        "name": "check_inventory",
        "description": "Check on-hand stock for one SKU. SKUs look like SKU-A.",
        "parameters": {"type": "object",
            "properties": {"sku": {"type": "string"}},
            "required": ["sku"]}}},
    {"type": "function", "function": {
        "name": "create_ticket",
        "description": ("Open a support ticket. Only call this when the user explicitly "
                        "asks for a ticket, or when an order is cancelled and needs review."),
        "parameters": {"type": "object",
            "properties": {
                "account_id": {"type": "string"},
                "summary": {"type": "string"},
                "severity": {"type": "string", "enum": ["critical","high","medium","low"]}},
            "required": ["account_id", "summary", "severity"]}}},
]
print("3 tools registered")
''')

code(r'''
AGENT_SYS = (
    "You are a support operations agent. Use the provided tools to answer. "
    "Call one tool at a time. When you have enough information, reply with a short "
    "final answer in plain text and do not call further tools. "
    "Never invent order IDs, SKUs or stock numbers, always look them up."
)

def run_agent(model, task, max_steps=6, verbose=True):
    """Classic ReAct-style loop. Returns (final_text, trace)."""
    msgs = [{"role": "system", "content": AGENT_SYS},
            {"role": "user", "content": task}]
    trace = []
    for step in range(max_steps):
        msg, met = chat(model, msgs, tools=TOOLS)
        msgs.append(msg)
        calls = msg.get("tool_calls") or []
        if not calls:
            trace.append(("final", msg.get("content", ""), met["total_s"]))
            return msg.get("content", ""), trace
        for c in calls:
            fn   = c["function"]["name"]
            args = c["function"]["arguments"]
            if isinstance(args, str):
                try: args = json.loads(args)
                except Exception: args = {}
            if fn not in IMPL:
                result = {"error": f"no such tool: {fn}"}
                trace.append(("bad_tool", fn, met["total_s"]))
            else:
                try:
                    result = IMPL[fn](**args)
                    trace.append(("call", (fn, args), met["total_s"]))
                except TypeError as e:
                    result = {"error": f"bad arguments: {e}"}
                    trace.append(("bad_args", (fn, args), met["total_s"]))
            if verbose:
                print(f"   step {step}: {fn}({args}) -> {json.dumps(result)[:90]}")
            msgs.append({"role": "tool", "name": fn, "tool_name": fn,
                         "content": json.dumps(result)})
    trace.append(("no_stop", None, 0.0))
    return "(hit max_steps without stopping)", trace

# One task, narrated.
CALL_LOG.clear()
out, tr = run_agent(SMALL, "What is the status of order ORD-1002, and what did it cost?")
print("\nFINAL:", out.strip()[:300])
''')

md(r"""
### Now measure `p`

12 tasks. For each we know which tool *should* be called first and with what
argument. We score three separate things, because they fail for different reasons:

- **tool choice**, did it pick the right function?
- **argument construction**, did it fill the parameters correctly?
- **stopping**, did it stop instead of looping or over-calling?
""")

code(r'''
AGENT_TASKS = [
    ("What is the status of order ORD-1001?",                 "lookup_order",   {"order_id":"ORD-1001"}),
    ("How much was order ORD-1003 in total?",                 "lookup_order",   {"order_id":"ORD-1003"}),
    ("Do we have any SKU-A left?",                            "check_inventory",{"sku":"SKU-A"}),
    ("Check stock on SKU-C please.",                          "check_inventory",{"sku":"SKU-C"}),
    ("Is SKU-B in stock?",                                    "check_inventory",{"sku":"SKU-B"}),
    ("Look up ORD-1004 and tell me if it shipped.",           "lookup_order",   {"order_id":"ORD-1004"}),
    ("Customer A-4471 wants a ticket opened: their dashboard is blank and it's urgent.",
                                                              "create_ticket",  {"account_id":"A-4471"}),
    ("Open a low priority ticket for A-2210 about missing docs.",
                                                              "create_ticket",  {"account_id":"A-2210"}),
    ("Order ORD-1002 - how many items?",                      "lookup_order",   {"order_id":"ORD-1002"}),
    ("We need stock numbers for SKU-D.",                      "check_inventory",{"sku":"SKU-D"}),
    ("Which customer placed ORD-1003?",                       "lookup_order",   {"order_id":"ORD-1003"}),
    ("Was ORD-1004 cancelled?",                               "lookup_order",   {"order_id":"ORD-1004"}),
    # Harder set. These are still unambiguous to a careful reader, but they punish
    # the failure modes small models actually have: grabbing the first identifier
    # they see, ignoring ordering words, and acting on a negated instruction.
    ("A-9003 is unhappy about their invoice. Please raise a ticket.",
                                                              "create_ticket",  {"account_id":"A-9003"}),
    ("Status of order 1002 please.",                           "lookup_order",   {"order_id":"ORD-1002"}),
    ("Before I open a ticket for A-1187, check whether SKU-C is in stock.",
                                                              "check_inventory",{"sku":"SKU-C"}),
    ("The customer mentioned ORD-1003 but actually wants to know if SKU-A is available.",
                                                              "check_inventory",{"sku":"SKU-A"}),
    ("Do not create anything yet. Just tell me the total for ORD-1004.",
                                                              "lookup_order",   {"order_id":"ORD-1004"}),
    ("Complaint from A-2210 about ORD-1002 arriving late. Open a ticket for them.",
                                                              "create_ticket",  {"account_id":"A-2210"}),
]

def measure_p(model, tasks=AGENT_TASKS, max_steps=6):
    right_tool = right_args = stopped = 0
    latencies = []
    for task, exp_tool, exp_args in tasks:
        CALL_LOG.clear()
        t0 = time.time()
        out, tr = run_agent(model, task, max_steps=max_steps, verbose=False)
        latencies.append(time.time() - t0)
        first = CALL_LOG[0] if CALL_LOG else (None, {})
        tool_ok = (first[0] == exp_tool)
        args_ok = tool_ok and all(
            str(first[1].get(k, "")).strip().upper() == str(v).upper()
            for k, v in exp_args.items())
        stop_ok = not any(s[0] == "no_stop" for s in tr)
        right_tool += tool_ok; right_args += args_ok; stopped += stop_ok
        flag = "ok " if (tool_ok and args_ok and stop_ok) else "BAD"
        print(f"  {flag} tool={str(first[0]):<16} args={str(first[1])[:44]:<46} | {task[:38]}")
    n = len(tasks)
    p_tool, p_args, p_stop = right_tool/n, right_args/n, stopped/n
    p = right_args / n * p_stop      # a step is "good" only if all of it is good
    print(f"\n  {model}")
    print(f"    correct tool     : {right_tool}/{n} = {p_tool:.0%}")
    print(f"    correct arguments: {right_args}/{n} = {p_args:.0%}")
    print(f"    stopped cleanly  : {stopped}/{n} = {p_stop:.0%}")
    print(f"    ==> per-step p   ~ {p:.3f}")
    print(f"    median latency   : {statistics.median(latencies):.1f}s/task")
    return p

p_small = measure_p(SMALL)
''')

code(r'''
# Same 12 tasks, bigger model. Slower, expect this cell to take a few minutes.
p_big = measure_p(BIG)
''')

md(r"""
### The p^N table, the most important slide in the class

If each step succeeds independently with probability `p`, an `N`-step task
succeeds with `p^N`. Plug in the numbers you just measured.
""")

code(r'''
def horizon_table(named_ps, Ns=(1, 3, 5, 10, 20)):
    print("{:<28}".format("per-step p") + "".join(f"{'N='+str(n):>10}" for n in Ns))
    for name, p in named_ps:
        print("{:<28}".format(f"{name}  p={p:.3f}") +
              "".join(f"{p**n:>9.1%}" for n in Ns))

horizon_table([(SMALL, p_small), (BIG, p_big),
               ("hypothetical p=0.95", 0.95), ("hypothetical p=0.99", 0.99)])

print("\nPer-step reliability required for 90% end-to-end success:")
print("  N=5  -> p = 0.979")
print("  N=10 -> p = 0.990")
print("  N=20 -> p = 0.995")
print("  N=50 -> p = 0.998")
''')

md(r"""
**Discuss (5 min), this is the heart of the class.**

Taken literally, that table says nothing works: even a frontier model at
p≈0.75 on BFCL would succeed 5.6% of the time over 10 steps. Obviously false in
production. **The gap between the table and reality is exactly the engineering
you have to do:** retries, validators, checkpoints, constrained decoding, and
short verified segments instead of long unverified ones.

Three conclusions:

1. **No model, small or frontier, is close to the `p` a 10-step agent needs.**
   The SLM-vs-LLM argument is a rounding error next to the architecture problem.
2. **Cut `N` before you buy parameters.** Four verified 5-step segments need
   p=0.979 each; one unverified 20-step run needs p=0.995. Decomposition is
   cheaper than a bigger GPU.
3. **This is the real case for SLMs.** If you must build verification anyway,
   the marginal value of frontier parameters drops, and a cheap fast model you
   can call three times behind a validator wins on cost *and* latency.

Independent evidence for the same point: models can all hit **100% on step one**
and still differ in achievable horizon by orders of magnitude. GPT-5 >1000
steps, Claude-4-Sonnet ~400, Qwen3-32B below 50% within 15 turns
([arXiv 2509.09677](https://arxiv.org/abs/2509.09677)). Single-step benchmarks
cannot predict agent performance.
""")

md(r"""
---
# Lab 4. The router: small first, escalate on failure (10 min)

The pattern that actually ships. Checkr does exactly this in production for 1.5M
background checks/month: **98% handled by a logistic regression**, the hard 2%
by a fine-tuned Llama-3-8B. Result: 15s → 0.15s latency, $12k/mo → under $800/mo,
*and* accuracy went **up** (GPT-4 80-82% → fine-tuned 8B 90%).

Note the tier the room always forgets: the cheapest tier is not a model at all.

We build three tiers:
1. **Rules**, free, instant, handles the unambiguous cases.
2. **SLM**, cheap, local, handles most of the rest.
3. **Escalation**, the big model, only when a validator rejects tier 2.

The critical design choice: **escalate on a validator's verdict, not on the
model's self-reported confidence.** Small models are badly calibrated. Checkr
routed on a domain heuristic, not on logprobs.
""")

code(r'''
import re

def tier1_rules(text):
    """Free. Only fires when it is certain."""
    t = text.lower()
    acct = re.search(r"\bA-\d{4}\b", text, re.I)
    if not acct:
        return None
    if re.search(r"\b(gdpr|article 17|right to erasure|dpa)\b", t):
        return {"category":"compliance","severity":"high","account_id":acct.group().upper()}
    if re.search(r"\b(everything is broken|completely down|total outage|503|cannot log in)\b", t) \
       and re.search(r"\b(urgent|asap|now|minutes)\b", t):
        return {"category":"outage","severity":"critical","account_id":acct.group().upper()}
    return None

def validator(obj, source_text):
    """Cheap, deterministic checks. This is what decides escalation."""
    problems = []
    if not obj:
        return ["no output"]
    if obj.get("category") not in {"outage","bug","billing","access_request",
                                   "feature_request","compliance","question"}:
        problems.append("category not in enum")
    if obj.get("severity") not in {"critical","high","medium","low"}:
        problems.append("severity not in enum")
    acct = obj.get("account_id","")
    if not re.fullmatch(r"A-\d{4}", str(acct)):
        problems.append(f"account_id malformed: {acct!r}")
    elif acct.upper() not in source_text.upper():
        problems.append("account_id not grounded in the source text")   # hallucination check
    # domain rule: critical severity must be justified by outage language
    if obj.get("severity") == "critical" and not re.search(
            r"down|503|outage|cannot log in|blank|failing", source_text, re.I):
        problems.append("critical severity not supported by the text")
    return problems

def cascade(text):
    r = tier1_rules(text)
    if r: return r, "tier1_rules", 0.0
    t0 = time.time()
    got, met, err = classify(SMALL, text, constrained=True)
    probs = validator(got, text)
    if not probs:
        return got, "tier2_slm", time.time()-t0
    got2, met2, err2 = classify(BIG, text, constrained=True)
    return got2, f"tier3_escalated({';'.join(probs)[:60]})", time.time()-t0
''')

code(r'''
tiers, correct, times = {}, 0, []
for text, gold in TICKETS:
    got, tier, dt = cascade(text)
    key = tier.split("(")[0]
    tiers[key] = tiers.get(key, 0) + 1
    times.append(dt)
    ok = got and all(str(got.get(k,"")).strip() == v for k, v in gold.items())
    correct += bool(ok)
    print(f"  {'ok ' if ok else 'BAD'} {tier:<30} {text[:52]!r}")

n = len(TICKETS)
print(f"\naccuracy   : {correct}/{n} = {correct/n:.0%}")
print(f"mean latency: {statistics.mean(times):.2f}s")
print("routing    :", tiers)
print(f"\nEscalation rate: "
      f"{tiers.get('tier3_escalated',0)/n:.0%}  <- this is your cost knob")
''')

md(r"""
**Discuss (4 min).**

- The escalation rate is the number your finance team cares about. If tier 2
  handles 90% of traffic, your blended cost is roughly `0.9 x cheap + 0.1 x expensive`.
- Every rule you add to tier 1 is free accuracy, and free latency. Push work
  *down* the stack, not up.
- The validator is where your domain knowledge lives. Grounding checks
  ("did this account ID actually appear in the input?") catch hallucinations
  that no amount of model scale reliably fixes.
- **Engineering debt is real.** You now maintain a router, a validator, fallback
  logic, and monitoring for two models instead of one. Budget for it: published
  TCO breakdowns put staffing at **6-30x the hardware cost**.
""")

md(r"""
---
# Lab 5. The eval harness (5 min)

This is where SLM projects actually die: not because the model was too small,
but because nobody could tell whether the swap was safe.

The harness below is deliberately boring. Boring is the point, you want to run
it in CI on every model bump, every quantization change, every prompt edit.
""")

code(r'''
def eval_suite(model):
    """One function, one number per capability. Run it on every model change."""
    results = {}
    # extraction
    hits = 0
    for text, gold in TICKETS:
        got, _, _ = classify(model, text, constrained=True)
        hits += bool(got and all(str(got.get(k,"")).strip()==v for k,v in gold.items()))
    results["extraction_exact"] = hits/len(TICKETS)
    # arithmetic / chained reasoning
    hits = sum(grade(ask(model, q, think=False, num_predict=512)[0], e) for q, e in ARITH)
    results["arithmetic"] = hits/len(ARITH)
    return results

report = {}
for m in [SMALL, BIG]:
    report[m] = eval_suite(m)

caps = sorted({k for r in report.values() for k in r})
print("{:<26}".format("model") + "".join(f"{c:>20}" for c in caps))
for m, r in report.items():
    print("{:<26}".format(m) + "".join(f"{r.get(c,0):>19.0%} " for c in caps))
print(f"\nagent per-step p:  {SMALL} = {p_small:.3f}   {BIG} = {p_big:.3f}")
''')

md(r"""
**The rules that make an eval worth having:**

1. **Score per tag, never just the average.** If 90% of your cases are happy-path,
   your average looks great while every hard case quietly fails.
2. **Source cases from production failures, not imagination.** Instrument for
   thumbs-down, abandonment, escalation. Triage weekly. Add the real failures.
3. **Size it honestly.** 50-100 cases for one feature. 150-300 for a maturing
   product. 400+ for a regulated flow. 15-25% deliberately nasty.
4. **If you use a bigger model as judge, validate the judge.** Across 21 judge
   models and ~541k judgments, chance-corrected agreement runs **34-41 points
   below** raw agreement; the best judge scored 84.9% raw but only 51.1% Cohen's
   kappa. Give the judge a specific rubric, randomize A/B order, and check it
   against ~50 human-labeled cases before you trust it
   ([arXiv 2606.19544](https://arxiv.org/html/2606.19544v1)).
5. **±1 point on a 200-item set is noise.** Quantized models sometimes "beat"
   fp16 on a benchmark. That is variance, not a discovery.

**Tooling for real projects:** `promptfoo` (run one test set across many models
side by side, the right first tool for an SLM bake-off), `deepeval`
(pytest-style CI gates), `lm-evaluation-harness` (academic benchmarks only,
not app-layer), `ragas` (RAG-specific).
""")

md(r"""
---
# Take-home: the conversion recipe

NVIDIA's six-step LLM→SLM conversion algorithm ([arXiv 2506.02153](https://arxiv.org/abs/2506.02153)),
which is the most actionable part of that paper:

1. **Log everything.** Every non-user-facing model call: prompt, response, tool
   calls, latency. Encrypted. *This is the gate, without traces you cannot do
   any of the rest.*
2. **Curate.** Strip PII/PHI. Target 10k-100k examples.
3. **Cluster.** Unsupervised clustering over prompts and operations to find the
   recurring patterns. Those clusters are your specialization candidates.
4. **Pick a model.** Capability, license, deployment footprint.
5. **Fine-tune.** LoRA/QLoRA, or distill from the LLM you are replacing.
   A 3B fine-tunes in **3.5 GB** of VRAM; an 8B in **6 GB**, both fit a free
   Colab T4. Start at r=32, alpha=64, lr=2e-4, target all seven projections
   (q,k,v,o,gate,up,down), 1-3 epochs. 150 well-chosen examples got 92% on a
   5-way classification task.
6. **Iterate.** Retrain as usage drifts.

## Your homework

Pick one call in a system you actually own. Then:

- [ ] Write down the task shape: classification / extraction / routing / generation / planning
- [ ] Build a 50-case golden set from **real production traffic**, 20% edge cases
- [ ] Run it against `granite4.2:3b` and against whatever you use today
- [ ] Measure per-step `p`, not just accuracy
- [ ] Compute your break-even volume before you buy a GPU
- [ ] Decide the two questions **separately**: small-vs-large, and self-host-vs-API

## Further reading

- [Small Language Models are the Future of Agentic AI](https://arxiv.org/abs/2506.02153), the thesis (note: NVIDIA sells the GPUs)
- [The Illusion of Diminishing Returns](https://arxiv.org/abs/2509.09677), the strongest counterargument
- [Context Rot](https://www.trychroma.com/research/context-rot), why long context degrades everywhere
- [Checkr case study](https://www.zenml.io/llmops-database/streamlining-background-check-classification-with-fine-tuned-small-language-models), the complete worked cascade
- [Zed Zeta2](https://zed.dev/blog/how-we-developed-zeta2), frontier model as offline teacher, SLM in the hot path
- [Ollama docs](https://docs.ollama.com/), tool calling, structured outputs, context length
""")

nb = new_notebook(cells=C, metadata={
    "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
    "language_info": {"name": "python", "version": "3.11"},
})
import os
_out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "03-lab", "slm_hands_on_lab.ipynb")
nbf.write(nb, _out)
print("wrote", os.path.normpath(_out))
print("wrote notebook,", len(C), "cells")
