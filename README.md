# Small Language Models: a practical workshop

A hands-on class for working software engineers. Two hours in its short form,
half a day if you teach the foundations deck as well. Everything in the lab runs
locally through Ollama: no API keys, no cloud accounts, and no network at all
once the models are pulled.

## The thesis

Reliability comes from architecture, not from parameters. So decompose the task,
verify every step, and then buy the cheapest model that clears the bar.

The class opens on `0.9^10 = 34.9%` and on the fact that a ten step agent needs a
per-step reliability of 0.990, which nothing on any leaderboard reaches, frontier
models included. That reframes the session from "is a small model good enough"
into "you have to engineer around this regardless, and once you accept that,
small models get a lot more interesting."

Students then measure their own per-step reliability in Lab 3 and watch both a 3B
and an 8B model score identically. The argument lands because they produced the
number themselves.

## What is in here

```
01-deck/
  slm-class-deck.pptx          40 slides, timed to the two hour agenda
  slm-first-principles.pptx    59 slides, the version that assumes no background.
                               Builds up from "what is a token" through types of
                               model, how they are made, running them, reliability,
                               adapting, evaluating and deciding.

02-facilitator/
  RUN_OF_SHOW.md               minute by minute talk track, debrief prompts, prep
                               checklist, failure modes, and the measured baseline
                               you should expect from a clean run
  PRE-CLASS-EMAIL.md           copy and paste setup instructions for attendees

03-lab/
  slm_hands_on_lab.ipynb       self contained notebook, six labs, needs only
                               `requests` and a running Ollama

04-handout/
  slm-field-card.html          one page decision reference for attendees to keep
  slm-deep-dive-finetuning.html   companion deep dive on fine-tuning: when it is
  slm-deep-dive-finetuning.pdf    the right call, and a complete run end to end

source/
  deck.js                      generator for the 40 slide deck
  deck-first-principles.js     generator for the 59 slide deck
  build_nb.py                  generator for the notebook
```

Content lives in the generators, so edit those and rebuild rather than editing the
built artifacts by hand:

```bash
cd source && npm install          # once, for pptxgenjs
node source/deck.js               # rewrites the 40 slide deck
node source/deck-first-principles.js   # rewrites the 59 slide deck
pip install nbformat && python3 source/build_nb.py   # rewrites the notebook
```

PDF versions of the decks are not committed, because they go stale the moment a
deck is regenerated. Export from PowerPoint or Keynote when you need one.

## Setup

Attendees need Python with `requests`, and Ollama running locally.

```bash
# install and start Ollama, then pull the models
ollama pull granite4.2:3b
ollama pull granite4.2:8b
ollama pull lfm2.5-thinking:1.2b

# check it is up
curl http://localhost:11434/api/version
```

Then open `03-lab/slm_hands_on_lab.ipynb` and run Lab 0.

## Agenda, two hour form

| Time | Block | Mode |
|---|---|---|
| 0:00 to 0:05 | Setup check and cold open | lecture |
| 0:05 to 0:25 | How small models are actually built | lecture |
| 0:25 to 0:40 | Lab 1: measure the size curve | lab |
| 0:40 to 0:55 | Small models in agentic systems | lecture |
| 0:55 to 1:20 | Labs 2 and 3: structured output, agent loop, measure p | lab |
| 1:20 to 1:35 | When small models win and when they lose | lecture |
| 1:35 to 1:50 | Labs 4 and 5: the router and the eval harness | lab |
| 1:50 to 2:00 | Decision checklist, homework, close | lecture |

For a longer session, teach `slm-first-principles.pptx` before this agenda and
run the same labs afterwards.

## The labs

| Lab | Minutes | What they build |
|---|---|---|
| 0 | 3 | Environment check, first tokens |
| 1 | 12 | Speed, memory and quality across three model sizes |
| 2 | 10 | Constrained JSON extraction scored against a golden set |
| 3 | 20 | A real three tool agent loop, and their own per-step `p` |
| 4 | 10 | A three tier router that escalates on a validator verdict |
| 5 | 5 | The evaluation harness you would put in CI |

## Measured baseline

From a full end to end run, all 16 code cells passing, on Apple silicon.

| Lab | Measure | granite4.2:3b | granite4.2:8b |
|---|---|---|---|
| 1 | generation speed | about 130 tok/s | about 66 tok/s |
| 1b | arithmetic | 40% | 70% |
| 2 | extraction, exact match | 25% | 62% |
| 3 | per-step p | 0.944 | 0.944 |

Lab 3 is the punchline. Both models score the same 0.944 and both fail the same
task, passing `order_id: 1002` where the tool expects `ORD-1002`. More parameters
did not buy reliability. Three lines of normalisation in the tool wrapper would.
Plug 0.944 into the compounding table live: about 56% over ten steps, about 32%
over twenty.

## Two things to do before you teach

1. **Verify the model tags actually pull, on your own machine, in the week of the
   class.** Tags churn. If `granite4.2:8b` has moved, substitute `qwen3.5:9b` or
   `ministral-3:8b` and update the config cell at the top of the notebook. Do not
   discover this live.
2. **Pre-pull the models onto three or four USB sticks** (`~/.ollama/models`).
   Eight gigabytes times twenty five laptops will kill a conference room access
   point. This is the most likely failure and the cheapest one to prevent.

Model tags, API prices and leaderboard positions all move quickly. The last
section of `RUN_OF_SHOW.md` lists what to re-verify before presenting.

## A note on the reasoning models

The `granite4.2` family reasons before answering. Lab 1b therefore passes
`think=False` and a token cap, without which a single arithmetic question can run
for minutes and stall the lab. If you swap in a different reasoning family, keep
those two switches. The behaviour is covered on its own slide in the foundations
deck, because it catches people constantly.

## Licence

MIT. See [LICENSE](LICENSE).
