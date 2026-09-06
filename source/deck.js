const pptxgen = require('pptxgenjs');
const path = require('path');
const OUT_DIR = path.join(__dirname, '..', '01-deck');
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';           // 13.33 x 7.5
p.author = 'SLM Class';
p.title  = 'Small Language Models in Practice';

// ---------------------------------------------------------------- palette
const INK    = '16202A';   // deep slate (dominant)
const INK2   = '243244';   // lighter slate
const PAPER  = 'FFFFFF';
const TINT   = 'F1F4F7';   // card tint on light slides
const TINT2  = '1F2C3B';   // card tint on dark slides
const MUTED  = '6B7A8C';
const MUTEDD = 'A9B6C4';   // muted on dark
const SIG    = 'FF6B35';   // sharp signal accent
const GOOD   = '2E9E82';   // teal-green
const WARN   = 'D9A404';

const HF = 'Cambria';      // headers
const BF = 'Calibri';      // body
const MF = 'Courier New';  // numerics

const W = 13.33, M = 0.7;
const CW = W - 2 * M;      // content width 11.93

function slide(dark) {
  const s = p.addSlide();
  s.background = { color: dark ? INK : PAPER };
  return s;
}

function title(s, txt, dark, sub) {
  const fs = txt.length > 54 ? 29 : 34;
  s.addText(txt, { x: M, y: 0.45, w: CW, h: 0.8, isTextBox: true, margin: 0,
    fontFace: HF, fontSize: fs, bold: true, color: dark ? PAPER : INK, valign: 'top' });
  if (sub) s.addText(sub, { x: M, y: 1.3, w: CW, h: 0.45, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 15, italic: true, valign: 'top', color: dark ? MUTEDD : MUTED });
}

// a small marker dot, the deck's one repeated motif
function dot(s, x, y, color, size) {
  const d = size || 0.16;
  s.addShape(p.ShapeType.ellipse, { x: x, y: y, w: d, h: d, fill: { color: color || SIG } });
}

function card(s, x, y, w, h, dark, fill) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06,
    fill: { color: fill || (dark ? TINT2 : TINT) }, line: { color: dark ? TINT2 : 'E1E7ED', width: 1 } });
}

function stat(s, x, y, w, big, label, color, dark, sz) {
  s.addText(big, { x, y, w, h: 0.95, isTextBox: true, margin: 0, fontFace: MF,
    fontSize: sz || 40, bold: true, color: color || SIG, align: 'left' });
  s.addText(label, { x, y: y + 0.92, w, h: 0.75, isTextBox: true, margin: 0, fontFace: BF,
    fontSize: 12.5, color: dark ? MUTEDD : MUTED, align: 'left' });
}

function bullets(s, items, x, y, w, dark, sz) {
  s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
    { x, y, w, h: 0.44 * items.length + 0.6, isTextBox: true, margin: 0, fontFace: BF,
      valign: 'top', fontSize: sz || 15, color: dark ? 'DCE4EC' : '2A3746',
      paraSpaceAfter: 8, lineSpacing: 22 });
}

function tbl(s, rows, x, y, w, opts) {
  const o = Object.assign({
    x, y, w, border: { type: 'solid', color: 'E1E7ED', pt: 1 },
    fontFace: BF, fontSize: 13, color: '2A3746', valign: 'middle',
    autoPage: false, rowH: 0.36
  }, opts || {});
  s.addTable(rows, o);
}

function hdr(t) { return { text: t, options: { bold: true, color: PAPER, fill: { color: INK2 }, fontSize: 12.5 } }; }

function notes(s, t) { s.addNotes(t); }

function section(n, t, sub) {
  const s = slide(true);
  s.addText(n, { x: M, y: 2.3, w: 2, h: 0.8, isTextBox: true, margin: 0, fontFace: MF,
    fontSize: 46, bold: true, color: SIG });
  s.addText(t, { x: M, y: 3.15, w: CW, h: 1.0, isTextBox: true, margin: 0, fontFace: HF,
    fontSize: 40, bold: true, color: PAPER });
  if (sub) s.addText(sub, { x: M, y: 4.2, w: CW * 0.75, h: 0.8, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 16, color: MUTEDD, lineSpacing: 24 });
  return s;
}

function labslide(t, mins, items) {
  const s = slide(true);
  s.addText('LAB', { x: M, y: 0.75, w: 2, h: 0.5, isTextBox: true, margin: 0, fontFace: MF,
    fontSize: 20, bold: true, color: SIG, charSpacing: 4 });
  s.addText(t, { x: M, y: 1.25, w: CW, h: 0.9, isTextBox: true, margin: 0, fontFace: HF,
    fontSize: 36, bold: true, color: PAPER });
  s.addText(mins, { x: M, y: 2.2, w: CW, h: 0.4, isTextBox: true, margin: 0, fontFace: BF,
    fontSize: 16, italic: true, color: SIG });
  card(s, M, 2.85, CW, 3.4, true);
  bullets(s, items, M + 0.45, 3.15, CW - 0.9, true, 16);
  return s;
}

const CHART_BASE = {
  showLegend: false, showTitle: true, titleFontFace: HF, titleFontSize: 15, titleColor: INK,
  catAxisLabelFontFace: BF, catAxisLabelFontSize: 11, catAxisLabelColor: MUTED,
  valAxisLabelFontFace: BF, valAxisLabelFontSize: 11, valAxisLabelColor: MUTED,
  catGridLine: { style: 'none' }, valGridLine: { color: 'E6EBF0', size: 1 },
  dataLabelFontFace: MF, dataLabelFontSize: 11, dataLabelColor: INK,
  valAxisMinVal: 0,
};

/* ============================== 1. TITLE ============================== */
{
  const s = slide(true);
  s.addText('Small Language Models', { x: M, y: 2.1, w: CW, h: 0.95, isTextBox: true, margin: 0,
    fontFace: HF, fontSize: 52, bold: true, color: PAPER });
  s.addText('in Practice', { x: M, y: 3.0, w: CW, h: 0.95, isTextBox: true, margin: 0,
    fontFace: HF, fontSize: 52, bold: true, color: SIG });
  s.addText('How they are built  ·  how to use them in agents and B2B  ·  when not to',
    { x: M, y: 4.15, w: CW, h: 0.5, isTextBox: true, margin: 0, fontFace: BF, fontSize: 18, color: MUTEDD });
  dot(s, M, 5.25, SIG, 0.13);
  s.addText('2 hours  |  60 min lecture, 60 min hands-on  |  everything runs on your laptop',
    { x: M + 0.28, y: 5.13, w: CW - 0.3, h: 0.4, isTextBox: true, margin: 0, fontFace: MF,
      fontSize: 13, color: MUTEDD });
  notes(s, 'Open by getting Lab 0 running before you say anything. Triage installs while you talk.');
}

/* ====================== 2. COLD OPEN ====================== */
{
  const s = slide(false);
  title(s, 'A tool call succeeds 90% of the time.', false, 'Your agent takes 10 steps. What is your success rate?');
  card(s, M, 2.15, CW, 2.35, false);
  s.addText('0.9', { x: M + 0.6, y: 2.55, w: 3.0, h: 1.4, isTextBox: true, margin: 0,
    fontFace: MF, fontSize: 76, bold: true, color: INK });
  s.addText('10', { x: M + 2.52, y: 2.45, w: 1.0, h: 0.7, isTextBox: true, margin: 0,
    fontFace: MF, fontSize: 34, bold: true, color: INK });
  s.addText('=', { x: M + 3.62, y: 2.75, w: 0.8, h: 0.9, isTextBox: true, margin: 0,
    fontFace: MF, fontSize: 50, color: MUTED });
  s.addText('34.9%', { x: M + 4.55, y: 2.55, w: 4.6, h: 1.4, isTextBox: true, margin: 0,
    fontFace: MF, fontSize: 76, bold: true, color: SIG });
  s.addText('Not a small-model problem. A compounding problem.',
    { x: M + 0.6, y: 3.85, w: CW - 1.2, h: 0.45, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 16, italic: true, color: MUTED });
  s.addText('Today is not really a class about small models. It is a class about the fact that you have to engineer around this regardless, and once you accept that, small models get a great deal more interesting.',
    { x: M, y: 4.85, w: CW, h: 1.0, isTextBox: true, margin: 0, fontFace: BF, fontSize: 17,
      color: '2A3746', lineSpacing: 26 });
  notes(s, 'Let them answer 90% first. Write the real number on the board. Then flip it: what p do you need?');
}

/* ====================== 3. WHAT p DO YOU NEED ====================== */
{
  const s = slide(false);
  title(s, 'So what per-step reliability do you actually need?', false,
    'Per-step p required for 90% end-to-end success');
  tbl(s, [
    [hdr('Steps in the task'), hdr('Required per-step p'), hdr('Reality check')],
    ['5',  { text: '0.979', options: { fontFace: MF, bold: true } }, 'reachable with a narrow task + validator'],
    ['10', { text: '0.990', options: { fontFace: MF, bold: true, color: WARN } }, 'nothing on any leaderboard is here'],
    ['20', { text: '0.995', options: { fontFace: MF, bold: true, color: SIG } }, 'requires decomposition, not a bigger model'],
    ['50', { text: '0.998', options: { fontFace: MF, bold: true, color: SIG } }, 'requires checkpoints and human confirmation'],
  ], M, 2.05, CW, { colW: [3.2, 3.0, 5.73], rowH: 0.46, fontSize: 14 });
  card(s, M, 4.55, CW, 1.55, false);
  dot(s, M + 0.42, 4.98, SIG, 0.18);
  s.addText('The best model on the Berkeley function-calling leaderboard sits at 0.750. A 9B open model sits at 0.661. Both are far below what a 10-step agent needs. The SLM-vs-frontier argument is a rounding error next to the architecture problem.',
    { x: M + 0.78, y: 4.82, w: CW - 1.3, h: 1.05, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 15.5, color: '2A3746', lineSpacing: 24 });
  notes(s, 'This is the frame for the whole class. Come back to it after Lab 3.');
}

/* ====================== 4. THESIS ====================== */
{
  const s = slide(true);
  s.addText('The thesis', { x: M, y: 1.5, w: CW, h: 0.5, isTextBox: true, margin: 0,
    fontFace: MF, fontSize: 16, bold: true, color: SIG, charSpacing: 3 });
  s.addText('Reliability comes from architecture,\nnot from parameters.',
    { x: M, y: 2.15, w: CW, h: 1.9, isTextBox: true, margin: 0, fontFace: HF, fontSize: 42,
      bold: true, color: PAPER, lineSpacing: 50 });
  s.addText('So: decompose the task, verify every step, and then buy the cheapest model that clears the bar.',
    { x: M, y: 4.3, w: CW * 0.85, h: 0.9, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 19, color: MUTEDD, lineSpacing: 28 });
  dot(s, M, 5.6, SIG, 0.13);
  s.addText('That is a better argument for small models than "they are nearly as good."',
    { x: M + 0.28, y: 5.47, w: CW - 0.3, h: 0.5, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 15, italic: true, color: MUTEDD });
}

/* ====================== 5. AGENDA ====================== */
{
  const s = slide(false);
  title(s, 'How the two hours work', false, 'Half lecture, half your laptop');
  const items = [
    ['00:05', 'How SLMs are actually built', 'the five levers, ordered by cost', INK],
    ['00:25', 'LAB 1, measure the size curve', 'tok/s, memory, where quality breaks', SIG],
    ['00:40', 'SLMs in agentic systems', 'the argument, the counterargument, four patterns', INK],
    ['00:55', 'LAB 2+3, structured output, agent loop', 'measure your own per-step p', SIG],
    ['01:20', 'The B2B case', 'economics, drivers, and when SLMs are wrong', INK],
    ['01:35', 'LAB 4+5, the router and the eval harness', 'the two things that decide whether it ships', SIG],
    ['01:50', 'Decision checklist and homework', '', INK],
  ];
  let y = 2.0;
  items.forEach(([t, h, sub, c]) => {
    s.addText(t, { x: M, y: y, w: 1.1, h: 0.42, isTextBox: true, margin: 0, fontFace: MF,
      fontSize: 14, bold: true, color: c });
    s.addText(h, { x: M + 1.25, y: y, w: 6.2, h: 0.42, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 15.5, bold: true, color: INK });
    if (sub) s.addText(sub, { x: M + 7.5, y: y + 0.02, w: 4.4, h: 0.4, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13, italic: true, color: MUTED });
    y += 0.62;
  });
}

/* ==================== SECTION 1 ==================== */
section('01', 'How SLMs are actually built',
  'Five levers, ordered by cost. Almost everyone reaches for the wrong end first.');

/* ---- five levers ---- */
{
  const s = slide(false);
  title(s, 'The five levers', false, 'Cost per unit of improvement, cheapest first');
  const rows = [
    ['Quantization',  'minutes, no training data', '~4x memory for ~1% quality', 'Yes, always', GOOD],
    ['Fine-tuning (LoRA)', 'hours, ~200 examples', 'the biggest task-specific win', 'Yes, often', GOOD],
    ['Distillation',  '1000s of GPU-hours', 'beats RL at small scale', 'Rarely', WARN],
    ['Pruning',       'a full retraining run', '40x fewer tokens per family member', 'Almost never', WARN],
    ['Pretraining',   'six figures', 'you get someone else’s for free', 'No', SIG],
  ];
  let y = 2.0;
  rows.forEach(([n, cost, why, will, c]) => {
    card(s, M, y, CW, 0.78, false);
    dot(s, M + 0.32, y + 0.31, c, 0.17);
    s.addText(n, { x: M + 0.68, y: y + 0.13, w: 2.5, h: 0.5, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 16, bold: true, color: INK, valign: 'middle' });
    s.addText(cost, { x: M + 3.3, y: y + 0.13, w: 2.9, h: 0.5, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 11.5, color: MUTED, valign: 'middle' });
    s.addText(why, { x: M + 6.55, y: y + 0.13, w: 3.6, h: 0.5, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13, color: '2A3746', valign: 'middle' });
    s.addText(will, { x: M + 10.3, y: y + 0.13, w: 1.5, h: 0.5, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13, bold: true, color: c, align: 'right', valign: 'middle' });
    y += 0.92;
  });
  notes(s, 'The ordering is the point. People reach for fine-tuning or pretraining and skip quantization and evaluation.');
}

/* ---- chinchilla ---- */
{
  const s = slide(false);
  title(s, 'Chinchilla is dead as a target', false,
    'It minimises training compute and ignores inference, the wrong objective for anything you deploy');
  tbl(s, [
    [hdr('Model'), hdr('Params'), hdr('Pretrain tokens'), hdr('Tokens per param')],
    ['Chinchilla-optimal', ', ', ', ', { text: '20 : 1', options: { fontFace: MF, color: MUTED } }],
    ['Gemma 3 4B', '4B', '4T', { text: '1,000 : 1', options: { fontFace: MF } }],
    ['SmolLM3', '3B', '11.2T', { text: '3,733 : 1', options: { fontFace: MF } }],
    ['Granite 4.0 Micro', '3B', '22T', { text: '7,333 : 1', options: { fontFace: MF } }],
    ['Qwen3-0.6B', '0.6B', '36T', { text: '60,000 : 1', options: { fontFace: MF, bold: true, color: SIG } }],
  ], M, 2.15, CW, { colW: [3.9, 2.0, 2.9, 3.13], rowH: 0.44, fontSize: 14 });
  card(s, M, 5.05, CW, 1.35, false);
  dot(s, M + 0.42, 5.44, SIG, 0.18);
  s.addText('Working band for a deployable SLM: 1,000–5,000 tokens per parameter. The small end of a model family gets trained on the whole family corpus, so it lands thousands of times past Chinchilla, for free.',
    { x: M + 0.78, y: 5.26, w: CW - 1.3, h: 0.95, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 15, color: '2A3746', lineSpacing: 23 });
}

/* ---- pretraining cost ---- */
{
  const s = slide(false);
  title(s, 'What pretraining one actually costs', false,
    'SmolLM3-3B is the only modern SLM with a fully disclosed budget');
  stat(s, M, 2.1, 3.6, '384', 'H100 GPUs', INK, false, 54);
  stat(s, M + 3.9, 2.1, 3.6, '24 days', 'wall clock', INK, false, 44);
  stat(s, M + 7.8, 2.1, 4.1, '~$500k', 'at 2026 market GPU rates\n(221,000 GPU-hours)', SIG, false, 48);
  card(s, M, 4.15, CW, 2.0, false);
  s.addText([
    { text: 'The reason SLMs are good in 2026 is that someone else spent that money, on data curation you get for free.\n', options: { bold: true, breakLine: true } },
    { text: 'A 1B model on 5T tokens is roughly one-seventh of this. Fine-tuning one is about $50. Almost nobody in this room should pretrain; the number exists so you recognise that the cheap levers are 10,000x cheaper.', options: {} },
  ], { x: M + 0.5, y: 4.45, w: CW - 1.0, h: 1.5, isTextBox: true, margin: 0, fontFace: BF,
       fontSize: 15.5, color: '2A3746', lineSpacing: 25 });
}

/* ---- data is the model ---- */
{
  const s = slide(false);
  title(s, 'Data is the model', false, 'The 2024→2026 shift: model-based quality classifiers plus synthetic rewriting');
  const cards = [
    ['FineWeb-Edu', '92%', 'of FineWeb discarded', 'Llama-3-70B scores 500k samples → distil the labels into a BERT-sized classifier → run the cheap one over the whole internet. Steal this two-stage pattern.'],
    ['Nemotron-CC', '1.9T', 'synthetic tokens minted', 'They rewrite high-quality data too, not just junk, that is how you get past "we ran out of good web data."'],
    ['phi-1', '8xA100', 'for 4 days → 50.6% HumanEval', '1.3B params on 7B tokens beat models 10x its size on code. Purely data quality. The whole thesis in one run.'],
  ];
  let x = M;
  const cw = (CW - 0.6) / 3;
  cards.forEach(([n, big, lbl, body]) => {
    card(s, x, 2.05, cw, 4.05, false);
    s.addText(n, { x: x + 0.32, y: 2.25, w: cw - 0.64, h: 0.4, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13, bold: true, color: MUTED, charSpacing: 1 });
    s.addText(big, { x: x + 0.32, y: 2.68, w: cw - 0.64, h: 0.85, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 40, bold: true, color: SIG });
    s.addText(lbl, { x: x + 0.32, y: 3.55, w: cw - 0.64, h: 0.6, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13, color: INK, bold: true });
    s.addText(body, { x: x + 0.32, y: 4.2, w: cw - 0.64, h: 1.7, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13, color: '43525F', lineSpacing: 20 });
    x += cw + 0.3;
  });
}

/* ---- distillation: three meanings ---- */
{
  const s = slide(false);
  title(s, 'Distillation: three different things share the name', false, 'Separate them before you argue about them');
  const rows = [
    ['1', 'Logit distillation', 'Student matches the teacher’s output distribution, token by token. Gemma 3 does this during pretraining, sampling 256 logits per token. Its 1B never learns from raw text alone.'],
    ['2', 'Sequence-level (SFT on teacher outputs)', 'What most people mean. DeepSeek-R1-Distill: 800k R1-generated samples onto off-the-shelf bases. SFT only, no RL stage at all.'],
    ['3', 'On-policy distillation', 'The 2025–26 development. Student generates its own rollouts; the teacher grades every token. Dense supervision on your own distribution, via reverse KL.'],
  ];
  let y = 2.05;
  rows.forEach(([n, h, b]) => {
    card(s, M, y, CW, 1.3, false);
    s.addShape(p.ShapeType.ellipse, { x: M + 0.32, y: y + 0.4, w: 0.5, h: 0.5, fill: { color: SIG } });
    s.addText(n, { x: M + 0.32, y: y + 0.42, w: 0.5, h: 0.46, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 18, bold: true, color: PAPER, align: 'center' });
    s.addText(h, { x: M + 1.02, y: y + 0.2, w: CW - 1.4, h: 0.38, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 16, bold: true, color: INK });
    s.addText(b, { x: M + 1.02, y: y + 0.58, w: CW - 1.4, h: 0.66, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13.5, color: '43525F', lineSpacing: 19 });
    y += 1.45;
  });
  s.addText('Framing that lands: SFT is dense supervision on someone else’s trajectory. RL is sparse supervision on your own. On-policy distillation is dense supervision on your own.',
    { x: M, y: 6.5, w: CW, h: 0.5, isTextBox: true, margin: 0, fontFace: BF, fontSize: 13.5,
      italic: true, color: MUTED });
}

/* ---- distillation: the numbers (chart) ---- */
{
  const s = slide(false);
  title(s, 'Two numbers that settle the distillation argument', false,
    'Both independently reproduced. DeepSeek, Thinking Machines, and the Qwen3 team');
  s.addChart(p.ChartType.bar, [{
    name: 'AIME 2024 pass@1 (%)',
    labels: ['Large-scale RL\non Qwen-32B base', 'Distillation\nfrom R1, same base'],
    values: [47.0, 72.6],
  }], Object.assign({}, CHART_BASE, {
    x: M, y: 1.95, w: 5.75, h: 3.1, barDir: 'col',
    title: 'Same 32B base model, two methods', chartColors: [MUTED, SIG],
    showValue: true, dataLabelPosition: 'outEnd', valAxisMaxVal: 90, barGapWidthPct: 90,
  }));
  s.addChart(p.ChartType.bar, [{
    name: 'GPU-hours to reach 74.4 AIME',
    labels: ['Reinforcement\nlearning', 'On-policy\ndistillation'],
    values: [17920, 1800],
  }], Object.assign({}, CHART_BASE, {
    x: M + 6.2, y: 1.95, w: 5.73, h: 3.1, barDir: 'col',
    title: 'Same endpoint, 10x less compute', chartColors: [MUTED, GOOD],
    showValue: true, dataLabelPosition: 'outEnd', valAxisMaxVal: 22000, barGapWidthPct: 90,
  }));
  card(s, M, 5.25, CW, 1.15, false);
  dot(s, M + 0.42, 5.6, SIG, 0.18);
  s.addText('DeepSeek’s own conclusion: small models cannot reinforcement-learn their way to what distillation gives them. Qwen3’s entire small series was distilled rather than fully trained, at one tenth of the GPU hours.',
    { x: M + 0.78, y: 5.42, w: CW - 1.3, h: 0.85, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 14.5, color: '2A3746', lineSpacing: 22 });
}

/* ---- pruning ---- */
{
  const s = slide(false);
  title(s, 'Pruning: one trap and one recipe', false, 'Keep this short, you will almost certainly never do it');
  card(s, M, 2.05, CW / 2 - 0.15, 3.9, false, 'FDEEE8');
  s.addText('THE TRAP', { x: M + 0.4, y: 2.3, w: 3, h: 0.35, isTextBox: true, margin: 0,
    fontFace: MF, fontSize: 12, bold: true, color: SIG, charSpacing: 2 });
  s.addText('Unstructured sparsity', { x: M + 0.4, y: 2.68, w: CW / 2 - 0.9, h: 0.45, isTextBox: true,
    margin: 0, fontFace: HF, fontSize: 22, bold: true, color: INK });
  s.addText('zero speedup', { x: M + 0.4, y: 3.2, w: CW / 2 - 0.9, h: 0.7, isTextBox: true, margin: 0,
    fontFace: MF, fontSize: 34, bold: true, color: SIG });
  s.addText('Zeroing individual weights changes the storage format and nothing else. The GPU still loads every element and multiplies by zero. Same VRAM, same latency.\n\nOnly semi-structured 2:4 sparsity is accelerated, and that is 1.3–1.5x end to end, not the theoretical 2x.',
    { x: M + 0.4, y: 3.95, w: CW / 2 - 0.9, h: 1.9, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '43525F', lineSpacing: 20 });

  card(s, M + CW / 2 + 0.15, 2.05, CW / 2 - 0.15, 3.9, false, 'E9F5F1');
  const x2 = M + CW / 2 + 0.55;
  s.addText('THE RECIPE', { x: x2, y: 2.3, w: 3, h: 0.35, isTextBox: true, margin: 0,
    fontFace: MF, fontSize: 12, bold: true, color: GOOD, charSpacing: 2 });
  s.addText('Structured prune + distil', { x: x2, y: 2.68, w: CW / 2 - 0.9, h: 0.45, isTextBox: true,
    margin: 0, fontFace: HF, fontSize: 22, bold: true, color: INK });
  s.addText('40x fewer tokens', { x: x2, y: 3.2, w: CW / 2 - 0.9, h: 0.7, isTextBox: true, margin: 0,
    fontFace: MF, fontSize: 30, bold: true, color: GOOD });
  bullets(s, [
    'Correct the teacher on your corpus first, most-skipped step',
    'Activation-based importance, forward passes only, single shot',
    'Prefer width pruning over depth below 15B params',
    'Retrain with distillation loss only, never plain LM loss',
    'Minitron: +16% MMLU vs training that size from scratch',
  ], x2, 3.9, CW / 2 - 0.9, false, 11.5);
}

/* ---- quantization: what Q4_K_M means ---- */
{
  const s = slide(false);
  title(s, 'What "Q4_K_M" actually means', false, 'You have all used it. Almost nobody knows what the letters do.');
  const parts = [
    ['Q4', 'four-bit weights, nominally'],
    ['_K', 'k-quants: super-blocks of 256 weights, sub-blocks of 32, each with its own quantised scale and min'],
    ['_M', 'medium mixed precision: the sensitive tensors (attention wv, FFN w2) are stored at Q6_K instead'],
  ];
  let y = 2.05;
  parts.forEach(([k, v]) => {
    card(s, M, y, CW, 0.85, false);
    s.addText(k, { x: M + 0.35, y: y + 0.16, w: 1.1, h: 0.55, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 24, bold: true, color: SIG, valign: 'middle' });
    s.addText(v, { x: M + 1.6, y: y + 0.16, w: CW - 2.0, h: 0.55, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 14.5, color: '2A3746', valign: 'middle' });
    y += 1.0;
  });
  card(s, M, 5.15, CW, 1.35, false, 'FDEEE8');
  s.addText('Net: ~4.89 bits per weight. "4-bit" is never four bits, and that overhead is exactly what buys the quality. Llama-3.1-8B goes 32.1 GB → 4.9 GB, and perplexity moves 7.32 → 7.56.',
    { x: M + 0.45, y: 5.42, w: CW - 0.9, h: 0.9, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 15.5, color: '2A3746', lineSpacing: 24 });
}

/* ---- quantization: the reasoning cliff (chart) ---- */
{
  const s = slide(false);
  title(s, 'Quantisation damage is task-dependent, not uniform', false,
    'Llama-3.1-8B-Instruct, same weights, two very different tasks');
  s.addChart(p.ChartType.bar, [
    { name: 'HellaSwag (single-shot recall)', labels: ['fp16', 'Q4_K_M', 'Q3_K_S'], values: [80.0, 79.4, 79.4] },
    { name: 'GSM8K (multi-step arithmetic)',  labels: ['fp16', 'Q4_K_M', 'Q3_K_S'], values: [77.6, 77.3, 68.3] },
  ], Object.assign({}, CHART_BASE, {
    x: M, y: 2.0, w: 7.3, h: 3.5, barDir: 'col', showLegend: true, legendPos: 'b',
    legendFontFace: BF, legendFontSize: 11, legendColor: MUTED,
    title: 'Accuracy (%) by quantisation level', chartColors: [MUTED, SIG],
    showValue: true, dataLabelPosition: 'outEnd', valAxisMinVal: 0, valAxisMaxVal: 100,
  }));
  card(s, M + 7.7, 2.0, CW - 7.7, 3.5, false);
  s.addText('Read the orange bars.', { x: M + 8.05, y: 2.25, w: 3.5, h: 0.4, isTextBox: true,
    margin: 0, fontFace: BF, fontSize: 15, bold: true, valign: 'top', color: INK });
  s.addText('Recall barely moves. Chained reasoning falls off a cliff, 9.3 points at Q3.\n\nQuantisation error compounds through a reasoning chain, and tool-argument construction is exactly that.\n\nQ8 is effectively lossless. Q5_K_M is near-lossless. Q4_K_M is the default. Below Q4, not for anything agentic.',
    { x: M + 8.05, y: 2.7, w: 3.5, h: 2.7, isTextBox: true, margin: 0, fontFace: BF,
      valign: 'top', fontSize: 12.5, color: '43525F', lineSpacing: 19 });
  s.addText('And note: some quantised configs "beat" fp16 on a benchmark. That is variance, not a discovery. Hold that thought until the evaluation section.',
    { x: M, y: 5.75, w: CW, h: 0.55, isTextBox: true, margin: 0, fontFace: BF, fontSize: 13.5,
      italic: true, color: MUTED });
}

/* ---- QAT ---- */
{
  const s = slide(false);
  title(s, 'Quantisation-aware training is free quality', false,
    'If a QAT checkpoint exists for your model, always take it');
  tbl(s, [
    [hdr('Gemma 3'), hdr('bf16'), hdr('int4 QAT'), hdr('Now runs on')],
    ['27B', '54 GB', { text: '14.1 GB', options: { fontFace: MF, bold: true, color: SIG } }, 'an RTX 3090'],
    ['12B', '24 GB', { text: '6.6 GB', options: { fontFace: MF, bold: true } }, 'an 8 GB laptop GPU'],
    ['4B',  '8 GB',  { text: '2.6 GB', options: { fontFace: MF, bold: true } }, 'a phone'],
    ['1B',  '2 GB',  { text: '0.5 GB', options: { fontFace: MF, bold: true } }, 'anything'],
  ], M, 2.15, CW, { colW: [2.6, 2.6, 3.0, 3.73], rowH: 0.46, fontSize: 14 });
  card(s, M, 4.6, CW, 1.6, false, 'E9F5F1');
  dot(s, M + 0.42, 5.05, GOOD, 0.18);
  s.addText('~5,000 extra training steps, using the unquantised checkpoint’s own probabilities as targets, cut the perplexity drop by 54% versus post-training quantisation. QAT is the vendor’s job. Post-training quantisation is yours.',
    { x: M + 0.78, y: 4.88, w: CW - 1.3, h: 1.1, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 15.5, color: '2A3746', lineSpacing: 24 });
}

/* ---- fine-tuning ---- */
{
  const s = slide(false);
  title(s, 'Fine-tuning: the numbers that matter', false, 'This is the lever most of you will actually pull');
  card(s, M, 2.0, 3.75, 4.1, false);
  s.addText('VRAM to QLoRA-tune', { x: M + 0.3, y: 2.2, w: 3.2, h: 0.35, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 13, bold: true, color: MUTED });
  [['3B', '3.5 GB'], ['7B', '5 GB'], ['8B', '6 GB'], ['14B', '8.5 GB']].forEach(([a, b], i) => {
    s.addText(a, { x: M + 0.3, y: 2.68 + i * 0.55, w: 1.0, h: 0.42, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 15, bold: true, color: INK });
    s.addText(b, { x: M + 1.4, y: 2.68 + i * 0.55, w: 2.0, h: 0.42, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 17, bold: true, color: i === 2 ? SIG : INK });
  });
  s.addText('A 3B fine-tunes in 3.5 GB and an 8B in 6 GB. Both fit a free Colab T4. Full fine-tuning an 8B needs roughly ten times that.',
    { x: M + 0.3, y: 5.0, w: 3.2, h: 1.0, isTextBox: true, margin: 0, fontFace: BF, fontSize: 12.5,
      color: '43525F', lineSpacing: 19 });

  card(s, M + 4.0, 2.0, 3.75, 4.1, false);
  s.addText('LoRA settings that work', { x: M + 4.3, y: 2.2, w: 3.2, h: 0.35, isTextBox: true,
    margin: 0, fontFace: BF, fontSize: 13, bold: true, color: MUTED });
  s.addText([
    { text: 'r = 32', options: { fontFace: MF, bold: true, breakLine: true } },
    { text: 'lora_alpha = 64', options: { fontFace: MF, bold: true, breakLine: true } },
    { text: 'lr = 2e-4', options: { fontFace: MF, bold: true, breakLine: true } },
    { text: 'epochs = 1–3', options: { fontFace: MF, bold: true, breakLine: true } },
    { text: 'lora_dropout = 0', options: { fontFace: MF, bold: true, breakLine: true } },
    { text: 'target: q,k,v,o,gate,up,down', options: { fontFace: MF, bold: true, color: SIG } },
  ], { x: M + 4.3, y: 2.68, w: 3.3, h: 2.3, isTextBox: true, margin: 0, fontSize: 13.5,
       color: INK, lineSpacing: 26 });
  s.addText('Target attention AND the MLP. Attention-only underperforms, hitting all seven projections is what closes the gap to full fine-tuning.',
    { x: M + 4.3, y: 5.0, w: 3.2, h: 1.0, isTextBox: true, margin: 0, fontFace: BF, fontSize: 12.5,
      color: '43525F', lineSpacing: 19 });

  card(s, M + 8.0, 2.0, CW - 8.0, 4.1, false);
  s.addText('How much data', { x: M + 8.3, y: 2.2, w: 3.2, h: 0.35, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 13, bold: true, color: MUTED });
  [['Classification / routing', '100–300 per class'],
   ['Structured extraction', '200–500'],
   ['Generation, summarisation', '500–2,000'],
   ['Regulated domain', '1,000–5,000']].forEach(([a, b], i) => {
    s.addText(a, { x: M + 8.3, y: 2.68 + i * 0.62, w: 3.3, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13, bold: true, color: INK });
    s.addText(b, { x: M + 8.3, y: 2.96 + i * 0.62, w: 3.3, h: 0.3, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 13, color: SIG });
  });
  s.addText('One published result: 150 examples across 5 categories → 92% accuracy. 200 curated examples beat 2,000 hasty ones.',
    { x: M + 8.3, y: 5.25, w: 3.3, h: 0.8, isTextBox: true, margin: 0, fontFace: BF, fontSize: 12.5,
      color: '43525F', lineSpacing: 19 });
}

/* ---- architecture tricks ---- */
{
  const s = slide(false);
  title(s, 'Why small models punch above their weight', false, 'Six architecture tricks, one line each');
  const rows = [
    ['GQA', 'Query heads share KV heads. Qwen3-8B: 32 query / 8 KV = 4x less KV cache. Saves cache, not parameters.'],
    ['Sliding-window attention', 'Gemma 3 interleaves 5 local layers per 1 global. KV overhead at 32K context: 60% → under 15%.'],
    ['Hybrid Mamba / SSM', 'Granite 4 runs 9 Mamba-2 blocks per transformer block. Attention cache grows with sequence length; SSM state is constant-size. >70% RAM cut on long inputs.'],
    ['MoE at small scale', 'Buys compute, not memory. You still hold all 30B in VRAM to get 3B-of-compute latency. A win on a spare GPU, a loss on a phone.'],
    ['Matryoshka / MatFormer', 'One training run yields a continuum of deployable sizes; Gemma 3n pushes embeddings to CPU so E2B runs in 2 GB.'],
    ['Speculative decoding', 'Output distribution is mathematically unchanged, free latency. But 2.03x at one user decays to 1.66x at sixteen. Local wins, busy servers do not.'],
  ];
  let y = 1.95;
  rows.forEach(([k, v]) => {
    dot(s, M + 0.05, y + 0.14, SIG, 0.13);
    s.addText(k, { x: M + 0.35, y: y, w: 3.0, h: 0.42, isTextBox: true, margin: 0, fontFace: BF,
      valign: 'top', fontSize: 14.5, bold: true, color: INK });
    s.addText(v, { x: M + 3.45, y: y, w: CW - 3.5, h: 0.72, isTextBox: true, margin: 0,
      fontFace: BF, valign: 'top', fontSize: 13, color: '43525F', lineSpacing: 19 });
    y += 0.78;
  });
}

labslide('Measure the size curve', '15 minutes  ·  notebook Lab 1', [
  'Run the same prompt on a 1.2B, a 3B and an 8B. Record tokens/sec and resident memory.',
  'Then run ten chained-arithmetic problems on the 3B and the 8B and score them.',
  'Two numbers I want from every one of you: your tok/s on the 3B, and your arithmetic score.',
  'Below roughly 5 tok/s an interactive agent stops being tolerable. That number, not a leaderboard, decides what you can deploy on your hardware.',
]);

/* ==================== SECTION 2 ==================== */
section('02', 'SLMs in agentic systems',
  'The argument, the counterargument, and the four patterns that actually ship.');

/* ---- the NVIDIA argument ---- */
{
  const s = slide(false);
  title(s, 'The argument', false, 'NVIDIA, "Small Language Models are the Future of Agentic AI" (arXiv 2506.02153)');
  card(s, M, 2.0, CW, 1.0, false, 'F1F4F7');
  s.addText('Their definition is functional, not a parameter count: a model that fits on a consumer device and serves one user at practical latency. As of now, "most models below 10B."',
    { x: M + 0.45, y: 2.22, w: CW - 0.9, h: 0.6, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 14.5, color: '2A3746', valign: 'middle' });
  const three = [
    ['Capable enough', 'Agent subtasks are narrow. A 7B already clears the bar for most of them.'],
    ['More suitable', 'Agent calls are repetitive, schema-shaped, and non-conversational, the exact profile a specialised small model is best at.'],
    ['More economical', 'They claim 10–30x on latency, energy and FLOPs versus a 70B–175B model.'],
  ];
  let x = M;
  const cw = (CW - 0.6) / 3;
  three.forEach(([h, b], i) => {
    card(s, x, 3.2, cw, 1.7, false);
    s.addText(`0${i + 1}`, { x: x + 0.3, y: 3.35, w: 1, h: 0.35, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 14, bold: true, color: SIG });
    s.addText(h, { x: x + 0.3, y: 3.68, w: cw - 0.6, h: 0.35, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 15.5, bold: true, color: INK });
    s.addText(b, { x: x + 0.3, y: 4.03, w: cw - 0.6, h: 0.8, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12.5, color: '43525F', lineSpacing: 18 });
    x += cw + 0.3;
  });
  s.addText('Their estimates of how many LLM calls in real agent frameworks are replaceable: MetaGPT ~60%, Open Operator ~40%, Cradle ~70%.',
    { x: M, y: 5.15, w: CW, h: 0.4, isTextBox: true, margin: 0, fontFace: BF, fontSize: 14, color: '2A3746' });
  card(s, M, 5.65, CW, 0.85, false, 'FDEEE8');
  s.addText('Say the quiet part: NVIDIA sells the GPUs that self-hosted SLM fleets run on. Those percentages are the authors’ inspection, not measured A/B swaps. Good paper, demand independent replication of the economics.',
    { x: M + 0.45, y: 5.82, w: CW - 0.9, h: 0.55, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, italic: true, color: '2A3746' });
}

/* ---- the counterargument ---- */
{
  const s = slide(false);
  title(s, 'The counterargument, and it is a good one', false,
    '"The Illusion of Diminishing Returns" (arXiv 2509.09677), model size buys horizon');
  stat(s, M, 2.05, 3.6, '>1,000', 'steps at 50% success\na leading frontier model', INK, false, 44);
  stat(s, M + 3.9, 2.05, 3.6, '~400', 'steps at 50% success\na frontier mid tier model', INK, false, 44);
  stat(s, M + 7.8, 2.05, 4.1, '<15', 'turns before a 32B open model\nfalls below 50%', SIG, false, 44);
  card(s, M, 4.05, CW, 2.15, false, 'FDEEE8');
  s.addText([
    { text: 'Every model except the 4B ones scored 100% on step one.', options: { bold: true, breakLine: true } },
    { text: 'And their achievable horizons still differ by orders of magnitude. Single-step benchmarks cannot predict agent performance, which means every number on every function-calling leaderboard is a first-step measurement.\n', options: { breakLine: true } },
    { text: 'Worse: models degrade further once their own errors are in context, and scaling parameters does not fix that self-conditioning.', options: {} },
  ], { x: M + 0.5, y: 4.32, w: CW - 1.0, h: 1.65, isTextBox: true, margin: 0, fontFace: BF,
       fontSize: 15, color: '2A3746', lineSpacing: 24 });
}

/* ---- where the cliff is (chart) ---- */
{
  const s = slide(false);
  title(s, 'Where the cliff actually is', false,
    'Berkeley function-calling leaderboard v4, within one model family');
  s.addChart(p.ChartType.bar, [{
    name: 'BFCL v4 score',
    labels: ['0.8B', '2B', '4B', '9B', '27B', '397B-A17B', 'frontier'],
    values: [0.253, 0.436, 0.503, 0.661, 0.685, 0.729, 0.750],
  }], Object.assign({}, CHART_BASE, {
    x: M, y: 1.95, w: 7.5, h: 3.7, barDir: 'col',
    title: 'Function-calling accuracy by model size', chartColors: [SIG],
    showValue: true, dataLabelPosition: 'outEnd', valAxisMaxVal: 0.9, barGapWidthPct: 45,
    dataLabelFormatCode: '0.00', valAxisLabelFormatCode: '0.0',
  }));
  card(s, M + 7.9, 1.95, CW - 7.9, 3.7, false);
  s.addText('Read the two gaps.', { x: M + 8.25, y: 2.2, w: 3.4, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 15, bold: true, color: INK });
  s.addText('9B → 397B is 6.8 points.\n\n4B → 9B is 15.8 points.\n\nThe cliff is not between a small model and a frontier model. It is inside the small range.',
    { x: M + 8.25, y: 2.62, w: 3.35, h: 1.7, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '43525F', lineSpacing: 21 });
  s.addText('7–9B is the floor for agentic tool use.\nSub-4B is for classification and extraction only.',
    { x: M + 8.25, y: 4.4, w: 3.35, h: 1.0, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, bold: true, color: SIG, lineSpacing: 21 });
  card(s, M, 5.8, CW, 0.85, false, 'F1F4F7');
  s.addText('And the corollary nobody expects: tool support is a property of the chat template, not the parameter count. A 70B with no tool template loses to a 1.7B that has one.',
    { x: M + 0.45, y: 5.98, w: CW - 0.9, h: 0.55, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 14, color: '2A3746' });
}

/* ---- pattern 1: cascade ---- */
{
  const s = slide(false);
  title(s, 'Pattern 1, the cascade', false,
    'Checkr: 1.5M background checks a month, 230 categories, in production');
  const tiers = [
    ['98%', 'Logistic regression', 'The cheapest tier is not a model at all. Push work down the stack, not up.', GOOD],
    ['2%',  'Fine-tuned Llama-3-8B', 'LoRA on 150k examples. The hard cases only.', SIG],
    ['0%',  'GPT-4', 'Removed entirely. It was slower and less accurate than the tuned 8B.', MUTED],
  ];
  let y = 2.0;
  tiers.forEach(([pct, name, why, c]) => {
    card(s, M, y, CW, 0.95, false);
    s.addText(pct, { x: M + 0.35, y: y + 0.2, w: 1.3, h: 0.55, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 26, bold: true, color: c, valign: 'middle' });
    s.addText(name, { x: M + 1.85, y: y + 0.2, w: 3.4, h: 0.55, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 16, bold: true, color: INK, valign: 'middle' });
    s.addText(why, { x: M + 5.4, y: y + 0.2, w: CW - 5.75, h: 0.55, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13.5, color: '43525F', valign: 'middle' });
    y += 1.08;
  });
  const res = [['Accuracy', '80–82%  →  90%', GOOD],
               ['Latency',  '15 s  →  0.15 s', GOOD],
               ['Cost',     '$12k/mo  →  <$800', GOOD]];
  let x = M;
  const cw = (CW - 0.6) / 3;
  res.forEach(([k, v, c]) => {
    card(s, x, 5.35, cw, 1.1, false, 'E9F5F1');
    s.addText(k, { x: x + 0.3, y: 5.5, w: cw - 0.6, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12, bold: true, color: MUTED });
    s.addText(v, { x: x + 0.3, y: 5.82, w: cw - 0.6, h: 0.45, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 13.5, bold: true, color: c });
    x += cw + 0.3;
  });
  notes(s, 'Route on a domain heuristic or a validator, never on the model self-reporting confidence. Small models are badly calibrated.');
}

/* ---- patterns 2,3,4 ---- */
{
  const s = slide(false);
  title(s, 'Three more patterns that ship', false, '');
  const rows = [
    ['02', 'Heterogeneous agents',
     'SLM for the mechanical, high-frequency work: classification, extraction, format conversion, tool-argument construction, summarising bounded inputs. Frontier model for planning, novel reasoning and error recovery.'],
    ['03', 'Frontier model as offline teacher',
     'Zed’s Zeta2 edit-prediction model is an 8B open model distilled with a frontier model as teacher. The big model manufactures training data offline and never appears in the hot path. +30% acceptance rate. The most underused pattern here.'],
    ['04', 'Guardrails as SLMs',
     'Across 14 open guard models from 110M to 20B, the correlation between parameter count and detection was r = 0.21, p = 0.48, indistinguishable from zero. A 4B model had 3.4x the recall of a 20B. Larger is not safer.'],
  ];
  let y = 2.0;
  rows.forEach(([n, h, b]) => {
    card(s, M, y, CW, 1.45, false);
    s.addText(n, { x: M + 0.35, y: y + 0.22, w: 0.8, h: 0.5, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 22, bold: true, color: SIG });
    s.addText(h, { x: M + 1.3, y: y + 0.2, w: CW - 1.7, h: 0.4, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 17, bold: true, color: INK });
    s.addText(b, { x: M + 1.3, y: y + 0.62, w: CW - 1.7, h: 0.75, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13.5, color: '43525F', lineSpacing: 19 });
    y += 1.6;
  });
  s.addText('The guardrail result is the cleanest "small is genuinely sufficient" evidence in the whole field, and it is a safety result, not a cost one.',
    { x: M, y: 6.75, w: CW, h: 0.45, isTextBox: true, margin: 0, fontFace: BF, fontSize: 13.5,
      italic: true, color: MUTED });
}

/* ---- p^N chart ---- */
{
  const s = slide(false);
  title(s, 'The compounding table', false,
    'End-to-end success = p to the power of N, and reality is worse because errors correlate');
  const Ns = [1, 2, 3, 5, 8, 10, 15, 20];
  const series = [
    { name: '4B model  p=0.50', p: 0.503, c: SIG },
    { name: '9B model  p=0.66', p: 0.661, c: WARN },
    { name: 'frontier  p=0.75', p: 0.750, c: MUTED },
    { name: 'engineered  p=0.99', p: 0.99, c: GOOD },
  ];
  s.addChart(p.ChartType.line, series.map(o => ({
    name: o.name, labels: Ns.map(String), values: Ns.map(n => +(Math.pow(o.p, n) * 100).toFixed(1)),
  })), Object.assign({}, CHART_BASE, {
    x: M, y: 1.95, w: 7.6, h: 3.9, showLegend: true, legendPos: 'b',
    legendFontFace: BF, legendFontSize: 11, legendColor: MUTED,
    title: 'End-to-end success (%) vs number of steps',
    chartColors: series.map(o => o.c), lineDataSymbolSize: 6, lineSize: 2.5,
    valAxisMaxVal: 100, showValue: false,
  }));
  card(s, M + 8.0, 1.95, CW - 8.0, 3.9, false, 'FDEEE8');
  s.addText('Three conclusions', { x: M + 8.35, y: 2.2, w: 3.3, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 15, bold: true, color: INK });
  bullets(s, [
    'No model, small or frontier, is close to what a 10-step agent needs.',
    'Cut N before you buy parameters. Four verified 5-step segments need p=0.979 each; one unverified 20-step run needs 0.995.',
    'If you must build verification anyway, the marginal value of frontier parameters drops, and the cheap fast model wins on cost and latency.',
  ], M + 8.35, 2.68, 3.3, false, 11.5);
}

labslide('Structured output, then a real agent loop', '25 minutes  ·  notebook Labs 2 and 3', [
  'Lab 2, constrain the decoder with a JSON schema, score a golden set field by field.',
  'Lab 3, three tools, twelve tasks, and measure three things separately: tool choice, argument construction, and stopping.',
  'The measure_p cell takes a few minutes. Start it, then read the markdown while it runs.',
  'What I want from you: your per-step p, and what you think it implies for the agent you actually work on.',
]);

/* ==================== SECTION 3 ==================== */
section('03', 'The B2B case',
  'What it costs, what actually justifies it, and when a small model is the wrong answer.');

/* ---- two decisions ---- */
{
  const s = slide(false);
  title(s, 'These are two independent decisions', false,
    'Conflating them is the most common mistake in the room');
  card(s, M, 2.05, CW / 2 - 0.15, 3.5, false, 'E9F5F1');
  s.addText('Decision A', { x: M + 0.4, y: 2.28, w: 3, h: 0.35, isTextBox: true, margin: 0,
    fontFace: MF, fontSize: 12, bold: true, color: GOOD, charSpacing: 2 });
  s.addText('Small model vs large model', { x: M + 0.4, y: 2.66, w: CW / 2 - 0.9, h: 0.5,
    isTextBox: true, margin: 0, fontFace: HF, fontSize: 22, bold: true, color: INK });
  s.addText('Nearly always a real win when the task is narrow. Extraction, classification, routing, format conversion.\n\nAnd you can capture most of it by calling a cheap hosted small model. No GPU. No ops. No fleet.',
    { x: M + 0.4, y: 3.25, w: CW / 2 - 0.9, h: 2.0, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 14.5, color: '2A3746', lineSpacing: 23 });

  card(s, M + CW / 2 + 0.15, 2.05, CW / 2 - 0.15, 3.5, false);
  const x2 = M + CW / 2 + 0.55;
  s.addText('Decision B', { x: x2, y: 2.28, w: 3, h: 0.35, isTextBox: true, margin: 0,
    fontFace: MF, fontSize: 12, bold: true, color: SIG, charSpacing: 2 });
  s.addText('Self-host vs API', { x: x2, y: 2.66, w: CW / 2 - 0.9, h: 0.5, isTextBox: true,
    margin: 0, fontFace: HF, fontSize: 22, bold: true, color: INK });
  s.addText('A separate decision, driven by sovereignty, latency SLA, per-tenant weights and deprecation risk.\n\nUsually not by token cost. Self-hosting a 4–8B essentially never beats a cheap hosted small model on price alone, the same open weights are served by providers who bought GPUs at volume.',
    { x: x2, y: 3.25, w: CW / 2 - 0.9, h: 2.0, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 14.5, color: '2A3746', lineSpacing: 23 });
  s.addText('Answer them in that order, and separately.',
    { x: M, y: 5.8, w: CW, h: 0.5, isTextBox: true, margin: 0, fontFace: BF, fontSize: 16,
      bold: true, color: SIG });
}

/* ---- the cost formula + utilization ---- */
{
  const s = slide(false);
  title(s, 'The formula, and the term everybody forgets', false, '');
  card(s, M, 1.95, CW, 1.0, false, 'F1F4F7');
  s.addText('$ / 1M tokens  =  (GPU $/hr ÷ tok/s) × 1e6 ÷ 3600 ÷ utilisation',
    { x: M + 0.4, y: 2.16, w: CW - 0.8, h: 0.6, isTextBox: true, margin: 0, fontFace: MF,
      fontSize: 17, bold: true, color: INK, valign: 'middle' });
  s.addText('Same H100, same model, same throughput, only the utilisation changes:',
    { x: M, y: 3.15, w: CW, h: 0.4, isTextBox: true, margin: 0, fontFace: BF, fontSize: 15, color: '2A3746' });
  const u = [['100%', '$0.20', GOOD], ['50%', '$0.40', WARN], ['20%', '$1.01', SIG], ['5%', '$4.03', SIG]];
  let x = M;
  const cw = (CW - 0.9) / 4;
  u.forEach(([k, v, c]) => {
    card(s, x, 3.65, cw, 1.5, false);
    s.addText(k, { x: x + 0.25, y: 3.85, w: cw - 0.5, h: 0.35, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13, bold: true, color: MUTED });
    s.addText(v, { x: x + 0.25, y: 4.2, w: cw - 0.5, h: 0.7, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 30, bold: true, color: c });
    x += cw + 0.3;
  });
  card(s, M, 5.35, CW, 1.15, false, 'FDEEE8');
  dot(s, M + 0.42, 5.72, SIG, 0.18);
  s.addText('A 5x swing from utilisation alone. Your idle GPU is the single biggest line item in a self-hosted quote, and it never appears in the vendor’s comparison table.',
    { x: M + 0.78, y: 5.52, w: CW - 1.3, h: 0.85, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 15.5, color: '2A3746', lineSpacing: 24 });
}

/* ---- break-even ---- */
{
  const s = slide(false);
  title(s, 'Break-even volume for one GPU', false,
    'One RTX 4090 rig at ~$504/month, agent traffic at 80% input / 20% output');
  tbl(s, [
    [hdr('If you are displacing'), hdr('Blended $/1M'), hdr('Break-even'), hdr('Per day')],
    ['a frontier premium model  ($5 / $25)', '$9.00', { text: '~57M tok/mo', options: { fontFace: MF, bold: true, color: GOOD } }, '1.9M'],
    ['a frontier mid tier model  ($2 / $10)', '$3.60', { text: '~146M tok/mo', options: { fontFace: MF, bold: true, color: GOOD } }, '4.9M'],
    ['a frontier small model  ($1 / $5)', '$1.80', { text: '~305M tok/mo', options: { fontFace: MF, bold: true, color: WARN } }, '10M'],
    ['a cheap hosted small model', '$0.40', { text: '~2,000M tok/mo', options: { fontFace: MF, bold: true, color: SIG } }, '67M'],
  ], M, 2.1, CW, { colW: [4.4, 2.3, 3.0, 2.23], rowH: 0.42, fontSize: 13.5 });
  s.addText('Then the honest total cost of ownership', { x: M, y: 4.5, w: CW, h: 0.4,
    isTextBox: true, margin: 0, fontFace: BF, fontSize: 16, bold: true, color: INK });
  const tco = [['$1,000', 'hardware amortised'], ['$831', 'power + colocation'],
               ['$4,000', '25% of one engineer'], ['$5,931', 'per month, all in']];
  let x = M;
  const cw = (CW - 0.9) / 4;
  tco.forEach(([v, k], i) => {
    card(s, x, 5.0, cw, 1.2, false, i === 3 ? 'FDEEE8' : TINT);
    s.addText(v, { x: x + 0.25, y: 5.14, w: cw - 0.5, h: 0.6, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 24, bold: true, color: i === 2 || i === 3 ? SIG : INK });
    s.addText(k, { x: x + 0.25, y: 5.72, w: cw - 0.5, h: 0.42, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12, color: MUTED });
    x += cw + 0.3;
  });
  s.addText('Staffing is 6–30x the hardware, and that total lands at roughly the price of the hosted API it was meant to beat.',
    { x: M, y: 6.4, w: CW, h: 0.45, isTextBox: true, margin: 0, fontFace: BF, fontSize: 14,
      bold: true, valign: 'top', color: SIG });
}

/* ---- real drivers ---- */
{
  const s = slide(false);
  title(s, 'What actually justifies self-hosting', false, 'None of these are token cost');
  const rows = [
    ['Regulation', 'EU AI Act high-risk obligations took effect 2 August 2026. Penalties to €35M or 7% of global turnover.'],
    ['Sovereignty', '77% of enterprise leaders factor the AI vendor’s country of origin into selection; around 60% build primarily with local vendors.'],
    ['Latency as product', 'Checkr’s 15s → 0.15s is not a cost saving, it is a different product. In one survey more repatriations cited latency (55%) than compliance (52%).'],
    ['Per-tenant weights', 'Multi-LoRA: one base model in VRAM, cheap per-customer adapters swapped per request. Five customers each using 10% of a GPU fit on one GPU.'],
    ['No deprecation risk', 'Weights you hold cannot be sunset on someone else’s schedule. In a validated system a silent model update is a compliance event, not an annoyance.'],
  ];
  let y = 2.0;
  rows.forEach(([k, v]) => {
    dot(s, M + 0.05, y + 0.16, GOOD, 0.14);
    s.addText(k, { x: M + 0.38, y: y, w: 2.9, h: 0.42, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 15, bold: true, color: INK });
    s.addText(v, { x: M + 3.4, y: y - 0.02, w: CW - 3.45, h: 0.75, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13.5, color: '43525F', lineSpacing: 19 });
    y += 0.83;
  });
  card(s, M, 6.15, CW, 0.75, false, 'FDEEE8');
  s.addText('If someone quotes "55% of enterprise inference runs on-prem, up from 12% in 2023", that number has no traceable primary source. Ask where any statistic came from.',
    { x: M + 0.45, y: 6.28, w: CW - 0.9, h: 0.5, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13, italic: true, color: '2A3746' });
}

/* ---- when SLMs are wrong ---- */
{
  const s = slide(true);
  title(s, 'When a small model is the wrong answer', true, 'Be able to say all nine of these out loud');
  const left = [
    'Horizon beyond ~10 tool calls with no checkpoints. The compounding math is unforgiving.',
    'Broad world knowledge is required. You cannot fine-tune in facts you do not have.',
    'Code generation across a large repository. Needs long context and long horizon at once.',
    'Ambiguous or novel reasoning. Fine-tuning specialises; it does not generalise to the case you did not anticipate.',
    'Very long context. Degradation hits everyone, but small models start lower and hit the wall sooner.',
  ];
  const right = [
    'Low volume. Below ~2M tokens a day the engineering cost swamps the token savings.',
    'A single failure is expensive. On τ-bench even GPT-4o roughly halves from pass@1 to pass^8.',
    'Multilingual breadth. Capability concentrates in high-resource languages as parameters shrink.',
    'Safety-critical generation. Note the asymmetry: small models are excellent at safety classification, weaker at safety alignment under adversarial pressure.',
  ];
  bullets(s, left, M, 2.1, CW / 2 - 0.35, true, 13.5);
  bullets(s, right, M + CW / 2 + 0.1, 2.1, CW / 2 - 0.35, true, 13.5);
  s.addText('And the cost nobody budgets: you now maintain a router, a validator, fallback logic and monitoring for two models instead of one.',
    { x: M, y: 6.35, w: CW, h: 0.5, isTextBox: true, margin: 0, fontFace: BF, fontSize: 14,
      italic: true, color: SIG });
}

/* ---- conversion recipe ---- */
{
  const s = slide(false);
  title(s, 'The conversion recipe', false, 'Six steps, and the first one is the gate');
  const steps = [
    ['1', 'Log everything', 'Every non-user-facing call: prompt, response, tool calls, latency. Encrypted.'],
    ['2', 'Curate', 'Strip PII and PHI. Target 10k–100k examples.'],
    ['3', 'Cluster', 'Unsupervised clustering over prompts and operations. The clusters are your specialisation candidates.'],
    ['4', 'Select a model', 'Capability, licence, deployment footprint.'],
    ['5', 'Fine-tune', 'LoRA or QLoRA, or distil from the model you are replacing.'],
    ['6', 'Iterate', 'Retrain as usage drifts.'],
  ];
  let y = 1.88;
  steps.forEach(([n, h, b], i) => {
    card(s, M, y, CW, 0.64, false, i === 0 ? 'FDEEE8' : TINT);
    s.addShape(p.ShapeType.ellipse, { x: M + 0.3, y: y + 0.13, w: 0.4, h: 0.4,
      fill: { color: i === 0 ? SIG : INK2 } });
    s.addText(n, { x: M + 0.3, y: y + 0.16, w: 0.4, h: 0.35, isTextBox: true, margin: 0,
      fontFace: MF, fontSize: 14, bold: true, color: PAPER, align: 'center' });
    s.addText(h, { x: M + 0.9, y: y + 0.11, w: 2.6, h: 0.45, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 15, bold: true, color: INK, valign: 'middle' });
    s.addText(b, { x: M + 3.6, y: y + 0.11, w: CW - 3.95, h: 0.45, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12.5, color: '43525F', valign: 'middle' });
    y += 0.72;
  });
  card(s, M, 6.3, CW, 0.78, false, 'E9F5F1');
  s.addText('One action item from today: turn on structured trace logging this week. Everything else is downstream of it.',
    { x: M + 0.45, y: 6.47, w: CW - 0.9, h: 0.5, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 15, bold: true, valign: 'top', color: '1F5A4A' });
}

labslide('The router, and the eval harness', '15 minutes  ·  notebook Labs 4 and 5', [
  'Lab 4, three tiers: rules, then the SLM, then escalation. Escalate on a validator’s verdict, never on the model’s self-reported confidence.',
  'Report your escalation rate. That is the cost knob: blended cost ≈ (1−r)·cheap + r·expensive.',
  'Lab 5, the boring harness you run in CI on every model bump, quantisation change and prompt edit.',
  'This is where SLM projects actually die: not because the model was too small, but because nobody could tell whether the swap was safe.',
]);

/* ---- eval rules ---- */
{
  const s = slide(false);
  title(s, 'Five rules that make an evaluation worth having', false, '');
  const rules = [
    ['Score per tag, never just the average', 'If 90% of your cases are happy-path, your average looks great while every hard case quietly fails.'],
    ['Source cases from production failures', 'Not from imagination. Instrument for thumbs-down, abandonment and escalation. Triage weekly.'],
    ['Size it honestly', '50–100 cases for one feature. 150–300 for a maturing product. 400+ for a regulated flow. 15–25% deliberately nasty.'],
    ['Validate the judge before you trust it', 'Across 21 judges, chance-corrected agreement ran 34–41 points below raw agreement. The best scored 84.9% raw but only 51.1% kappa. Reproducibility is not validity.'],
    ['±1 point on a 200-item set is noise', 'Quantised models sometimes "beat" fp16. That is variance, not a discovery.'],
  ];
  let y = 1.95;
  rules.forEach(([h, b], i) => {
    s.addText(String(i + 1).padStart(2, '0'), { x: M, y: y, w: 0.7, h: 0.4, isTextBox: true,
      margin: 0, fontFace: MF, fontSize: 15, bold: true, color: SIG });
    s.addText(h, { x: M + 0.8, y: y - 0.02, w: 4.6, h: 0.5, isTextBox: true, margin: 0,
      fontFace: BF, valign: 'top', fontSize: 14.5, bold: true, color: INK });
    s.addText(b, { x: M + 5.5, y: y - 0.02, w: CW - 5.55, h: 0.9, isTextBox: true, margin: 0,
      fontFace: BF, valign: 'top', fontSize: 13, color: '43525F', lineSpacing: 19 });
    y += 0.95;
  });
  card(s, M, 6.5, CW, 0.65, false, 'F1F4F7');
  s.addText('Tooling:  promptfoo for a model bake-off  ·  deepeval for CI gates  ·  lm-evaluation-harness for academic benchmarks only  ·  ragas for RAG',
    { x: M + 0.45, y: 6.62, w: CW - 0.9, h: 0.42, isTextBox: true, margin: 0, fontFace: MF,
      fontSize: 12.5, color: '2A3746' });
}

/* ---- decision checklist ---- */
{
  const s = slide(false);
  title(s, 'The decision checklist', false, 'Five questions, in this order');
  const qs = [
    ['What is the task shape?', 'Classification, extraction, routing → sub-4B is fine. Tool-calling agent → 7–9B floor. Planning or novel reasoning → frontier.'],
    ['What is N?', 'Above roughly ten unverified steps, decompose before you do anything else.'],
    ['What is your volume?', 'Below ~2M tokens a day, do not self-host. The engineering cost dominates everything.'],
    ['Do you have a non-cost reason to self-host?', 'Sovereignty, latency SLA, per-tenant weights, deprecation risk. If not, a cheap hosted small model captures most of the win.'],
    ['Do you have a golden set?', 'If not, you cannot make any of the decisions above. Build it first.'],
  ];
  let y = 1.95;
  qs.forEach(([h, b], i) => {
    card(s, M, y, CW, 0.92, false, i === 4 ? 'FDEEE8' : TINT);
    s.addText(h, { x: M + 0.45, y: y + 0.14, w: 5.0, h: 0.65, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 15.5, bold: true, color: INK, valign: 'middle' });
    s.addText(b, { x: M + 5.6, y: y + 0.14, w: CW - 6.0, h: 0.65, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 13, color: '43525F', valign: 'middle' });
    y += 1.05;
  });
}

/* ---- homework ---- */
{
  const s = slide(false);
  title(s, 'Homework', false, 'Pick one model call in a system you actually own');
  const items = [
    'Write down its task shape: classification, extraction, routing, generation, or planning.',
    'Build a 50-case golden set from real production traffic. 20% edge cases.',
    'Run it against granite4.2:3b and against whatever you use today.',
    'Measure per-step p, not just accuracy.',
    'Compute your break-even volume before you buy a GPU.',
    'Answer the two questions separately: small vs large, and self-host vs API.',
  ];
  let y = 2.1;
  items.forEach(t => {
    s.addShape(p.ShapeType.roundRect, { x: M, y: y, w: 0.3, h: 0.3, rectRadius: 0.03,
      fill: { color: PAPER }, line: { color: SIG, width: 1.5 } });
    s.addText(t, { x: M + 0.55, y: y - 0.05, w: CW - 0.6, h: 0.45, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 16, color: '2A3746', valign: 'middle' });
    y += 0.68;
  });
  card(s, M, 6.3, CW, 0.8, false, 'F1F4F7');
  s.addText('The notebook, the run-of-show and the one-page cheat sheet all go home with you. The labs run offline, no keys, no cloud.',
    { x: M + 0.45, y: 6.48, w: CW - 0.9, h: 0.45, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 14, color: '2A3746' });
}

/* ---- closing ---- */
{
  const s = slide(true);
  s.addText('Reliability comes from architecture,\nnot from parameters.',
    { x: M, y: 2.0, w: CW, h: 1.9, isTextBox: true, margin: 0, fontFace: HF, fontSize: 40,
      bold: true, color: PAPER, lineSpacing: 50 });
  s.addText('Once you have built the verification you were always going to need, the cheap model gets to be the right answer, and that is a far better argument for small models than "they are nearly as good."',
    { x: M, y: 4.15, w: CW * 0.88, h: 1.2, isTextBox: true, margin: 0, fontFace: BF, fontSize: 19,
      color: MUTEDD, lineSpacing: 30 });
  dot(s, M, 5.85, SIG, 0.13);
  s.addText('Turn on structured trace logging this week. Everything else is downstream of it.',
    { x: M + 0.28, y: 5.72, w: CW - 0.3, h: 0.5, isTextBox: true, margin: 0, fontFace: MF,
      fontSize: 14, color: PAPER });
}

/* ---- sources ---- */
{
  const s = slide(false);
  title(s, 'Sources', false, 'Everything with a number on it in this deck');
  const src = [
    'Small Language Models are the Future of Agentic AI, arXiv 2506.02153',
    'The Illusion of Diminishing Returns: Measuring Long Horizon Execution, arXiv 2509.09677',
    'τ-bench, arXiv 2406.12045   ·   Benchmarking Open-Source Safety Guard Models, arXiv 2605.28830',
    'DeepSeek-R1, arXiv 2501.12948   ·   Qwen3 technical report, arXiv 2505.09388',
    'Gemma 3 technical report, arXiv 2503.19786   ·   Nemotron-CC, arXiv 2412.02595',
    'On-policy distillation, thinkingmachines.ai/blog/on-policy-distillation',
    'NVIDIA Minitron prune-and-distil, developer.nvidia.com   ·   Gemma 3 QAT, developers.googleblog.com',
    'FineWeb-Edu, huggingface.co/datasets/HuggingFaceFW/fineweb-edu   ·   SmolLM3, huggingface.co/blog/smollm3',
    'Unsloth LoRA hyperparameter guide, unsloth.ai/docs   ·   Ollama docs, docs.ollama.com',
    'Checkr case study, zenml.io/llmops-database   ·   Zed Zeta2, zed.dev/blog/how-we-developed-zeta2',
    'vLLM multi-LoRA, vllm.ai/blog/2026-02-26-multi-lora   ·   Context Rot, trychroma.com/research/context-rot',
    'Berkeley function-calling leaderboard, gorilla.cs.berkeley.edu/leaderboard.html',
  ];
  let y = 2.0;
  src.forEach(t => {
    dot(s, M + 0.02, y + 0.11, SIG, 0.09);
    s.addText(t, { x: M + 0.3, y: y, w: CW - 0.35, h: 0.36, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12.5, color: '43525F' });
    y += 0.39;
  });
  s.addText('Model tags, prices and leaderboards move fast, re-verify the week you teach.',
    { x: M, y: 6.85, w: CW, h: 0.4, isTextBox: true, margin: 0, fontFace: BF, fontSize: 12.5,
      italic: true, color: MUTED });
}

p.writeFile({ fileName: path.join(OUT_DIR, 'slm-class-deck.pptx') })
  .then(f => console.log('wrote', f));
