/*
 * Advanced track deck for the Small Language Models workshop.
 * Builds 01-deck/slm-advanced.pptx
 *
 * For a room that already ships models. Assumes the two hour class, or at least
 * its vocabulary. Four parts: evaluation that holds up, mixture of experts,
 * memory management, and production practice.
 *
 * Run:  node source/deck-advanced.js
 */
const pptxgen = require('pptxgenjs');
const path = require('path');
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';
p.author = 'SLM Workshop';
p.title = 'Small Language Models: Advanced Track';

const INK = '16202A', INK2 = '243244', PAPER = 'FFFFFF';
const TINT = 'F1F4F7', TINT2 = '1F2C3B';
const MUTED = '6B7A8C', MUTEDD = 'A9B6C4';
const SIG = 'FF6B35', GOOD = '2E9E82', WARN = 'D9A404', BAD = 'C0442E';
const HF = 'Cambria', BF = 'Calibri', MF = 'Courier New';
const W = 13.33, M = 0.7, CW = W - 2 * M;

let n = 0;
function slide(dark) { const s = p.addSlide(); s.background = { color: dark ? INK : PAPER }; n++; return s; }
function title(s, txt, dark, sub) {
  s.addText(txt, { x: M, y: 0.42, w: CW, h: 0.85, isTextBox: true, margin: 0, fontFace: HF,
    fontSize: txt.length > 52 ? 28 : 33, bold: true, color: dark ? PAPER : INK, valign: 'top' });
  if (sub) s.addText(sub, { x: M, y: 1.28, w: CW, h: 0.5, isTextBox: true, margin: 0, fontFace: BF,
    fontSize: 15, italic: true, color: dark ? MUTEDD : MUTED, valign: 'top' });
}
function card(s, x, y, w, h, dark, fill) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06,
    fill: { color: fill || (dark ? TINT2 : TINT) }, line: { color: dark ? TINT2 : 'E1E7ED', width: 1 } });
}
function bullets(s, items, x, y, w, dark, sz) {
  s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
    { x, y, w, h: 0.42 * items.length + 0.5, isTextBox: true, margin: 0, fontFace: BF,
      valign: 'top', fontSize: sz || 15, color: dark ? 'DCE4EC' : '2A3746', paraSpaceAfter: 7, lineSpacing: 21 });
}
function body(s, txt, x, y, w, dark, sz) {
  s.addText(txt, { x, y, w, h: 1.2, isTextBox: true, margin: 0, fontFace: BF, valign: 'top',
    fontSize: sz || 15, color: dark ? 'DCE4EC' : '2A3746', lineSpacing: 22 });
}
function stat(s, x, y, w, big, label, color, dark, sz) {
  s.addText(big, { x, y, w, h: 0.9, isTextBox: true, margin: 0, fontFace: MF, fontSize: sz || 36,
    bold: true, color: color || SIG });
  s.addText(label, { x, y: y + 0.85, w, h: 0.8, isTextBox: true, margin: 0, fontFace: BF,
    fontSize: 12.5, color: dark ? MUTEDD : MUTED });
}
function hdr(t) { return { text: t, options: { bold: true, color: PAPER, fill: { color: INK2 }, fontSize: 12 } }; }
function tbl(s, rows, x, y, w, opts) {
  s.addTable(rows, Object.assign({ x, y, w, border: { type: 'solid', color: 'E1E7ED', pt: 1 },
    fontFace: BF, fontSize: 12.5, color: '2A3746', valign: 'middle', autoPage: false, rowH: 0.34 }, opts || {}));
}
function notes(s, t) { s.addNotes(t); }
function section(num, t, sub) {
  const s = slide(true);
  s.addText(num, { x: M, y: 2.25, w: 3, h: 0.8, isTextBox: true, margin: 0, fontFace: MF, fontSize: 44, bold: true, color: SIG });
  s.addText(t, { x: M, y: 3.05, w: CW, h: 1.0, isTextBox: true, margin: 0, fontFace: HF, fontSize: 38, bold: true, color: PAPER });
  if (sub) s.addText(sub, { x: M, y: 4.15, w: CW * 0.8, h: 0.9, isTextBox: true, margin: 0, fontFace: BF, fontSize: 16, color: MUTEDD, lineSpacing: 24 });
  return s;
}
function fbox(s, x, y, w, h, label, sub, color, dark) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.05,
    fill: { color: color || (dark ? TINT2 : TINT) }, line: { color: color ? color : 'D8E0E8', width: 1 } });
  s.addText(label, { x, y: y + (sub ? 0.1 : h / 2 - 0.2), w, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 13, bold: true, align: 'center', color: dark ? PAPER : INK });
  if (sub) s.addText(sub, { x, y: y + 0.46, w, h: 0.5, isTextBox: true, margin: 0, fontFace: BF,
    fontSize: 10.5, align: 'center', color: dark ? MUTEDD : MUTED });
}
function arrow(s, x, y, w) { s.addShape(p.ShapeType.rightArrow, { x, y, w, h: 0.18, fill: { color: 'B9C6D2' } }); }
function labslide(t, mins, items) {
  const s = slide(true);
  s.addText('LAB', { x: M, y: 0.75, w: 2, h: 0.5, isTextBox: true, margin: 0, fontFace: MF, fontSize: 20, bold: true, color: SIG, charSpacing: 4 });
  s.addText(t, { x: M, y: 1.25, w: CW, h: 0.9, isTextBox: true, margin: 0, fontFace: HF, fontSize: 34, bold: true, color: PAPER });
  s.addText(mins, { x: M, y: 2.2, w: CW, h: 0.4, isTextBox: true, margin: 0, fontFace: BF, fontSize: 16, italic: true, color: SIG });
  card(s, M, 2.85, CW, 3.3, true);
  bullets(s, items, M + 0.45, 3.15, CW - 0.9, true, 15.5);
  return s;
}

/* ============================ OPENING ============================ */
{
  const s = slide(true);
  s.addText('Small Language Models', { x: M, y: 1.95, w: CW, h: 0.95, isTextBox: true, margin: 0, fontFace: HF, fontSize: 48, bold: true, color: PAPER });
  s.addText('Advanced Track', { x: M, y: 2.85, w: CW, h: 0.95, isTextBox: true, margin: 0, fontFace: HF, fontSize: 48, bold: true, color: SIG });
  s.addText('Evaluation that holds up  ·  mixture of experts  ·  memory management  ·  production practice',
    { x: M, y: 4.0, w: CW, h: 0.5, isTextBox: true, margin: 0, fontFace: BF, fontSize: 17, color: MUTEDD });
  s.addShape(p.ShapeType.ellipse, { x: M, y: 5.2, w: 0.13, h: 0.13, fill: { color: SIG } });
  s.addText('For teams already shipping models. No foundations, no vocabulary detour.',
    { x: M + 0.28, y: 5.08, w: CW - 0.3, h: 0.4, isTextBox: true, margin: 0, fontFace: MF, fontSize: 13, color: MUTEDD });
  notes(s, 'Ask what everyone is running in production right now and on what hardware. Pitch the depth to the answers, and reference their stack throughout.');
}
{
  const s = slide(false);
  title(s, 'What this track assumes and what it adds', false, 'The two hour class answered "should we". This one answers "how well".');
  card(s, M, 2.0, CW / 2 - 0.2, 2.9, false);
  s.addText('Assumed', { x: M + 0.35, y: 2.18, w: 4, h: 0.4, isTextBox: true, margin: 0, fontFace: BF, fontSize: 14, bold: true, color: INK });
  bullets(s, [
    'Tokens, parameters, context, quantization',
    'The compounding argument and per-step p',
    'Decompose, constrain, verify, route',
    'You have shipped at least one model',
  ], M + 0.35, 2.6, CW / 2 - 0.9, false, 13.5);
  card(s, M + CW / 2 + 0.2, 2.0, CW / 2 - 0.2, 2.9, false, 'FDE3D6');
  s.addText('Added here', { x: M + CW / 2 + 0.55, y: 2.18, w: 4, h: 0.4, isTextBox: true, margin: 0, fontFace: BF, fontSize: 14, bold: true, color: '8A3A15' });
  bullets(s, [
    'Evaluation you can defend in a review',
    'Mixture of experts, and when it pays',
    'Memory management as a first class design input',
    'The operational practices that decide outcomes',
  ], M + CW / 2 + 0.55, 2.6, CW / 2 - 0.9, false, 13.5);
  body(s, 'Three new labs. Nothing to download beyond what you already have, because the mixture of experts lab works from a recorded measurement set rather than an eighteen gigabyte pull.', M, 5.1, CW - 0.4, false, 14.5);
  notes(s, 'Say the download point out loud. Experienced rooms have been burned by workshop prerequisites.');
}

/* ======================= PART A: EVALUATION ======================= */
section('A', 'Evaluation that holds up', 'Most evaluation suites are a comfort blanket. Here is how to build one that can lose.');
{
  const s = slide(false);
  title(s, 'The four ways an eval quietly lies to you', false, 'Every one of these has shipped a bad model into production');
  const rows = [
    [hdr('Failure'), hdr('How it looks'), hdr('The fix')],
    ['Leakage', 'Scores climb, production does not improve', 'Split by episode, hold out whole units, check for near duplicates'],
    ['Easy set', 'Everything passes, no signal between models', 'Stratify by difficulty, keep a deliberately nasty fifth'],
    ['Proxy drift', 'The metric improves while the product gets worse', 'State what the proxy misses, review examples by hand regularly'],
    ['Unequal conditions', 'One model handicapped by the harness', 'Fix decoding params, template, and token budget across models'],
  ];
  tbl(s, rows, M, 2.1, CW, { colW: [2.3, 4.4, CW - 6.7], rowH: 0.52, fontSize: 12.5 });
  body(s, 'The last one is the most embarrassing in a review, because it usually favours whichever model you already preferred.', M, 4.6, CW - 0.4, false, 14.5);
  notes(s, 'Ask for a show of hands on who has been bitten by leakage. Usually most of the room, once they realise what it looks like.');
}
{
  const s = slide(false);
  title(s, 'Building a golden set that can actually fail', false, 'Composition matters more than size');
  const rows = [
    [hdr('Slice'), hdr('Share'), hdr('Purpose')],
    ['Representative traffic', '50%', 'Sampled from real logs, weighted like production'],
    ['Known hard cases', '20%', 'Anything that has broken before. Every incident adds one'],
    ['Adversarial', '15%', 'Malformed input, injection attempts, contradictions, empty fields'],
    ['Boundary', '10%', 'Longest realistic input, smallest, rarest category'],
    ['Should refuse or escalate', '5%', 'Cases where the correct answer is to not answer'],
  ];
  tbl(s, rows, M, 2.05, CW, { colW: [3.4, 1.4, CW - 4.8], rowH: 0.44, fontSize: 12.5 });
  bullets(s, [
    'One hundred cases composed like this beats a thousand sampled uniformly.',
    'Record provenance per case, where it came from and why it is in the set.',
    'Every production incident becomes a permanent case. That is how the set earns its keep.',
  ], M, 4.5, CW - 0.4, false, 14.5);
  notes(s, 'The last slice is the one people forget and the one that catches the most dangerous failures.');
}
{
  const s = slide(false);
  title(s, 'Prefer mechanical checks. Judge only what you must.', false, 'A ladder, cheapest and most stable first');
  const y = 2.15, h = 0.72;
  const rungs = [
    ['1  Schema and type checks', 'free, deterministic, catches most pipeline breakage', GOOD],
    ['2  Exact or normalised match', 'free, needs a known answer', GOOD],
    ['3  Programmatic properties', 'invariants: no invented IDs, totals reconcile, citations resolve', GOOD],
    ['4  Similarity to reference', 'cheap, noisy, use as a signal not a gate', WARN],
    ['5  Model as judge', 'expensive, biased, powerful when validated', BAD],
  ];
  rungs.forEach((r, i) => {
    card(s, M, y + i * (h + 0.12), CW, h, false);
    s.addText(r[0], { x: M + 0.3, y: y + i * (h + 0.12) + 0.06, w: 4.6, h: 0.3, isTextBox: true, margin: 0, fontFace: BF, fontSize: 13.5, bold: true, color: INK });
    s.addText(r[1], { x: M + 5.0, y: y + i * (h + 0.12) + 0.06, w: CW - 5.4, h: 0.5, isTextBox: true, margin: 0, fontFace: BF, fontSize: 12, color: MUTED });
    s.addShape(p.ShapeType.rect, { x: M, y: y + i * (h + 0.12), w: 0.06, h: h, fill: { color: r[2] } });
  });
  notes(s, 'Push people down the ladder. Most teams reach for a judge when rung three would have been free and deterministic.');
}
{
  const s = slide(false);
  title(s, 'If you use a model as judge, validate the judge', false, 'An unvalidated judge is an opinion with a decimal point');
  bullets(s, [
    'Label 50 cases by hand, then measure agreement between judge and human. Below about 80 percent the judge is not usable as a gate.',
    'Known biases to control: position bias in pairwise comparison, length bias toward longer answers, and self preference when the judge shares a family with the candidate.',
    'Mitigations: randomise order and run both directions, strip identifying style, use a judge from a different family than any candidate.',
    'Pin the judge model and its version. A judge that silently upgrades invalidates every historical score you have.',
    'Report judged numbers with the judge named, the same way you would cite an instrument.',
  ], M, 2.05, CW - 0.4, false, 14.5);
  card(s, M, 4.75, CW, 0.95, false, 'FBF0E2');
  s.addText('Never let a model judge its own output in a gate. If the judge and the candidate share a family, you are measuring family agreement, not quality.',
    { x: M + 0.4, y: 4.93, w: CW - 0.8, h: 0.6, isTextBox: true, margin: 0, fontFace: BF, fontSize: 13.5, color: '5A4415', lineSpacing: 19 });
  notes(s, 'Self preference is well documented and surprises people. Spend a moment here.');
}
{
  const s = slide(false);
  title(s, 'Small sets need error bars', false, 'The difference you are about to ship may be noise');
  stat(s, M, 2.3, 3.6, '+/- 9 pts', 'roughly the 95 percent interval on 100 cases at 80 percent', SIG, false, 34);
  card(s, M + 4.4, 2.25, CW - 4.4, 2.4, false);
  bullets(s, [
    'A jump from 80 to 84 percent on a 100 case set is not evidence of anything.',
    'Rough interval: about 2 times the square root of p times 1 minus p over n.',
    'For paired comparisons, test the same cases on both models and compare per case, which is far more sensitive.',
    'Fix the seed and temperature, or you are also measuring sampling noise.',
  ], M + 4.8, 2.5, CW - 5.2, false, 13.5);
  body(s, 'This is the single easiest way to stop shipping regressions dressed as improvements, and it costs one line of arithmetic.', M, 4.95, CW - 0.4, false, 15);
  notes(s, 'Lab 7 has them compute this on their own results, so the point is earned rather than asserted.');
}
{
  const s = slide(false);
  title(s, 'The harness belongs in continuous integration', false, 'An eval you run by hand is an eval you stop running');
  const rows = [
    [hdr('Gate'), hdr('Rule'), hdr('On failure')],
    ['Schema validity', 'must not fall below the agreed floor', 'block the change'],
    ['Task success', 'must not regress beyond the error bar', 'block the change'],
    ['Latency p95', 'must stay inside the budget', 'block the change'],
    ['Cost per request', 'must stay inside the budget', 'warn and require sign off'],
    ['Refusal and safety slice', 'must not regress at all', 'block the change'],
  ];
  tbl(s, rows, M, 2.1, CW, { colW: [3.4, 5.2, CW - 8.6], rowH: 0.42, fontSize: 12.5 });
  bullets(s, [
    'Run it on every prompt change, not only on model changes. Prompts regress far more often than models do.',
    'Keep a canary slice in production and compare live outputs against the same gates weekly.',
  ], M, 4.5, CW - 0.4, false, 14.5);
  notes(s, 'Prompt changes are the most common regression source and the least gated. Emphasise that line.');
}
labslide('Lab 6: the honest eval harness', '20 minutes', [
  'Compose a golden set with the five slices, from provided raw traffic.',
  'Score with mechanical checks first, then add a judge for the one slice that needs it.',
  'Validate the judge against your own hand labels and compute agreement.',
  'Put confidence intervals on every number, then decide whether two models actually differ.',
  'Wire the whole thing behind a pass or fail gate you could put in CI.',
]);

/* ==================== PART B: MIXTURE OF EXPERTS ==================== */
section('B', 'Mixture of experts', 'The architecture that decouples memory from speed, and the trap that comes with it.');
{
  const s = slide(false);
  title(s, 'What actually happens per token', false, 'A router picks a few experts, the rest sit idle but resident');
  fbox(s, M, 2.2, 2.5, 1.0, 'TOKEN', null, TINT, false);
  arrow(s, M + 2.7, 2.6, 0.5);
  fbox(s, M + 3.4, 2.2, 2.3, 1.0, 'ROUTER', 'picks top k of N', 'FDE3D6', false);
  arrow(s, M + 5.9, 2.6, 0.5);
  fbox(s, M + 6.6, 2.05, 1.5, 0.62, 'Expert 3', null, 'E7F2EE', false);
  fbox(s, M + 6.6, 2.75, 1.5, 0.62, 'Expert 9', null, 'E7F2EE', false);
  fbox(s, M + 8.3, 2.05, 1.5, 0.62, 'Expert 1', null, TINT, false);
  fbox(s, M + 8.3, 2.75, 1.5, 0.62, 'Expert N', null, TINT, false);
  s.addText('active, compute paid', { x: M + 6.6, y: 3.45, w: 1.5, h: 0.3, isTextBox: true, margin: 0, fontFace: BF, fontSize: 10, align: 'center', color: GOOD });
  s.addText('idle, memory still paid', { x: M + 8.3, y: 3.45, w: 1.6, h: 0.3, isTextBox: true, margin: 0, fontFace: BF, fontSize: 10, align: 'center', color: MUTED });
  bullets(s, [
    'Compute scales with the active experts. Memory scales with all of them.',
    'That single asymmetry explains every practical consequence on the next three slides.',
    'Routing is learned and per token, so different tokens in one sentence take different paths.',
  ], M, 3.95, CW - 0.4, false, 15);
  notes(s, 'Draw the asymmetry explicitly: compute follows active, memory follows total. Everything else derives from it.');
}
{
  const s = slide(false);
  title(s, 'Reading a mixture of experts model card', false, 'Two numbers, and people quote whichever flatters them');
  const rows = [
    [hdr('Model shape'), hdr('Memory behaves like'), hdr('Speed behaves like')],
    ['8B dense', '8B', '8B'],
    ['30B total, 3B active', '30B', 'roughly 3B'],
    ['20B total, 4B active', '20B', 'roughly 4B'],
  ];
  tbl(s, rows, M, 2.15, CW * 0.82, { colW: [3.6, 3.4, CW * 0.82 - 7.0], rowH: 0.44, fontSize: 13 });
  card(s, M, 4.0, CW, 1.5, false, 'FBF0E2');
  s.addText('The buying question is therefore not "is it 30B". It is "do I have the memory of a 30B and the latency budget of a 3B". If you have the memory, mixture of experts is a very good deal. If memory is your binding constraint, it is the worst of both worlds.',
    { x: M + 0.4, y: 4.2, w: CW - 0.8, h: 1.1, isTextBox: true, margin: 0, fontFace: BF, fontSize: 14, color: '5A4415', lineSpacing: 20 });
  notes(s, 'This is the slide people photograph. Give them a second.');
}
{
  const s = slide(false);
  title(s, 'Where mixture of experts wins and loses', false, 'Be specific, because the answer flips on your constraint');
  card(s, M, 2.05, CW / 2 - 0.2, 3.0, false, 'E7F2EE');
  s.addText('Wins', { x: M + 0.35, y: 2.22, w: 3, h: 0.4, isTextBox: true, margin: 0, fontFace: BF, fontSize: 14, bold: true, color: '17513F' });
  bullets(s, [
    'You own the memory already',
    'Throughput per unit of latency matters',
    'Broad task mix, where specialised experts help',
    'One deployment serving varied work',
  ], M + 0.35, 2.66, CW / 2 - 0.9, false, 13.5);
  card(s, M + CW / 2 + 0.2, 2.05, CW / 2 - 0.2, 3.0, false, 'F7E7E2');
  s.addText('Loses', { x: M + CW / 2 + 0.55, y: 2.22, w: 3, h: 0.4, isTextBox: true, margin: 0, fontFace: BF, fontSize: 14, bold: true, color: '7A2E1C' });
  bullets(s, [
    'Memory constrained edge or laptop',
    'Many concurrent models on one host',
    'Fine-tuning, where tooling is thinner',
    'Very narrow single task, a small dense model is simpler',
  ], M + CW / 2 + 0.55, 2.66, CW / 2 - 0.9, false, 13.5);
  body(s, 'For a narrow extraction task, a 3B dense model you can run four copies of usually beats one mixture of experts model you can barely fit.', M, 5.2, CW - 0.4, false, 14.5);
  notes(s, 'Tie back to the field card: task shape decides, and here memory decides too.');
}
{
  const s = slide(false);
  title(s, 'Operational notes people learn the hard way', false, 'Four things that only show up once you serve one');
  bullets(s, [
    'Load time is set by total size, so a mixture of experts model is slow to start and slow to swap. Keep it resident.',
    'Expert offloading to host memory works but the transfer cost lands on your tail latency, not your average.',
    'Batching interacts badly when a batch activates many different experts at once, so throughput curves are less predictable than dense.',
    'Quantization quality varies by component. Routers and shared layers are more sensitive than expert weights.',
  ], M, 2.05, CW - 0.4, false, 15);
  card(s, M, 4.55, CW, 1.1, false);
  s.addText('Practical rule: benchmark a mixture of experts model at your real concurrency, not at batch size one. The single stream number flatters it and hides the memory ceiling you will hit in production.',
    { x: M + 0.4, y: 4.75, w: CW - 0.8, h: 0.8, isTextBox: true, margin: 0, fontFace: BF, fontSize: 13.5, color: '2A3746', lineSpacing: 19 });
  notes(s, 'If anyone in the room serves one today, hand them the floor for two minutes. War stories land better than slides.');
}
labslide('Lab 7: analyse a mixture of experts', '15 minutes', [
  'Work from a recorded measurement set: a real mixture of experts model against dense models on identical prompts.',
  'Separate load time, prompt processing and generation, and see which one total size actually governs.',
  'Compute memory per token of throughput, the number that decides your hardware.',
  'Decide, with numbers, which model you would deploy under a fixed memory budget.',
  'No download required. The measurements are in the repository.',
]);

/* ==================== PART C: MEMORY MANAGEMENT ==================== */
section('C', 'Memory management', 'The constraint that decides your architecture, and the one people size last.');
{
  const s = slide(false);
  title(s, 'Where the memory actually goes', false, 'Weights are only the part you budgeted for');
  const y = 2.2, h = 1.1;
  fbox(s, M, y, 2.7, h, 'WEIGHTS', 'params x bytes', TINT, false);
  fbox(s, M + 2.95, y, 2.7, h, 'KV CACHE', 'grows with ctx x batch', 'FDE3D6', false);
  fbox(s, M + 5.9, y, 2.7, h, 'ACTIVATIONS', 'transient, per forward', TINT, false);
  fbox(s, M + 8.85, y, 3.05, h, 'RUNTIME OVERHEAD', 'allocator, fragmentation', TINT, false);
  bullets(s, [
    'Weights are fixed once you pick a model and a precision. Everything else is a choice you keep making at runtime.',
    'The KV cache is the one that ends sessions unexpectedly, because it grows with every turn of a conversation.',
    'Fragmentation is real. A server that fits the arithmetic can still fail to allocate after hours of mixed traffic.',
  ], M, 3.65, CW - 0.4, false, 15);
  notes(s, 'Ask who has hit an out of memory error mid conversation rather than at load. That is the KV cache.');
}
{
  const s = slide(false);
  title(s, 'The KV cache, in arithmetic you can do in a meeting', false, 'Two bytes per element, twice per layer, for every token you keep');
  card(s, M, 2.0, CW, 0.9, false);
  s.addText('kv bytes  ~=  2  x  layers  x  kv_heads  x  head_dim  x  context  x  batch  x  bytes_per_element',
    { x: M + 0.3, y: 2.22, w: CW - 0.6, h: 0.5, isTextBox: true, margin: 0, fontFace: MF, fontSize: 15, bold: true, color: INK, align: 'center' });
  const rows = [
    [hdr('Setting'), hdr('KV cache'), hdr('Note')],
    ['3B model, 4k context, batch 1', 'a few hundred MB', 'Comfortable'],
    ['3B model, 32k context, batch 1', 'a few GB', 'Now comparable to the weights'],
    ['3B model, 4k context, batch 16', 'several GB', 'Concurrency multiplies it linearly'],
  ];
  tbl(s, rows, M, 3.1, CW, { colW: [4.6, 3.0, CW - 7.6], rowH: 0.42, fontSize: 12.5 });
  bullets(s, [
    'Grouped query attention cuts this substantially, which is why kv_heads and not heads appears in the formula.',
    'Long context and high concurrency are the same problem wearing different hats. Budget them together.',
  ], M, 4.85, CW - 0.4, false, 14);
  notes(s, 'Do this arithmetic live for the model the room actually runs. It is the most immediately useful slide in the track.');
}
{
  const s = slide(false);
  title(s, 'Seven levers, in the order to reach for them', false, 'Cheapest and least damaging first');
  const rows = [
    [hdr('Lever'), hdr('Effect'), hdr('Cost')],
    ['Cut the context you actually send', 'linear reduction in cache', 'none, usually improves quality'],
    ['Lower the context limit', 'caps worst case allocation', 'long inputs now truncate, so guard them'],
    ['Quantize the KV cache to 8 bit', 'roughly halves cache', 'small quality effect, usually acceptable'],
    ['Reduce concurrency', 'linear reduction', 'throughput falls'],
    ['Quantize the weights further', 'reduces weight memory', 'quality falls, measure it'],
    ['Offload layers to host memory', 'fits a bigger model', 'tail latency gets much worse'],
    ['Smaller model', 'reduces everything', 'the honest answer more often than people admit'],
  ];
  tbl(s, rows, M, 2.05, CW, { colW: [4.2, 3.3, CW - 7.5], rowH: 0.4, fontSize: 12 });
  body(s, 'Note the order. Teams reach for the last two first, when trimming the prompt and capping the context would have been free.', M, 5.0, CW - 0.4, false, 14.5);
  notes(s, 'The first lever is a prompt engineering task disguised as an infrastructure task. That reframe is the point.');
}
{
  const s = slide(false);
  title(s, 'Reuse the prefix you already paid for', false, 'The cheapest speedup available, and it is mostly free');
  fbox(s, M, 2.25, 4.5, 1.0, 'STABLE PREFIX', 'system, tools, conventions', 'E7F2EE', false);
  fbox(s, M + 4.7, 2.25, 3.0, 1.0, 'RETRIEVED', 'stable within a session', TINT, false);
  fbox(s, M + 7.9, 2.25, 4.0, 1.0, 'TURN SPECIFIC', 'the only part that changes', 'FDE3D6', false);
  bullets(s, [
    'Order the prompt so everything stable comes first and the volatile part comes last.',
    'Then a served prefix cache can skip prompt processing entirely for the shared portion.',
    'Keep the prefix byte stable. One changing timestamp at the top invalidates the whole cache.',
    'Pin a conceptual session to the same worker, or the cache you built is on the wrong machine.',
  ], M, 3.6, CW - 0.4, false, 15);
  body(s, 'On long stable prefixes this routinely turns seconds of prompt processing into milliseconds. It is worth more than most model upgrades.', M, 5.15, CW - 0.4, false, 14.5);
  notes(s, 'The timestamp mistake is extremely common. Mention it twice.');
}
labslide('Lab 8: memory under pressure', '15 minutes', [
  'Measure KV cache growth against context length on a model you already have.',
  'Turn on cache quantization and measure both the memory saving and any quality change.',
  'Push concurrency until allocation fails, and find the real ceiling of your machine.',
  'Reorder a prompt for prefix reuse and measure the prompt processing time you get back.',
  'Produce a sizing recommendation for a stated workload, with numbers behind it.',
]);

/* =================== PART D: PRODUCTION PRACTICE =================== */
section('D', 'Production practice', 'The habits that separate a demo from a service.');
{
  const s = slide(false);
  title(s, 'Treat prompts as versioned artifacts', false, 'They are code, they regress, and they are usually ungoverned');
  bullets(s, [
    'Store prompts in the repository, not in a database row someone edits at midnight.',
    'Version them, review them, and run the eval gate on every change.',
    'Record which prompt version produced every logged output, or you cannot debug anything later.',
    'Keep the model identifier and decoding parameters alongside the prompt version. All three together define behaviour.',
  ], M, 2.05, CW - 0.4, false, 15);
  card(s, M, 4.4, CW, 1.15, false, 'FBF0E2');
  s.addText('If you cannot answer "what exactly produced this output six weeks ago", you do not have a service, you have a demo that has been running for a while.',
    { x: M + 0.4, y: 4.6, w: CW - 0.8, h: 0.8, isTextBox: true, margin: 0, fontFace: BF, fontSize: 14, color: '5A4415', lineSpacing: 20 });
  notes(s, 'This lands hard with experienced teams because most of them have exactly this gap.');
}
{
  const s = slide(false);
  title(s, 'What to log, and what never to log', false, 'You will be debugging behaviour you cannot reproduce');
  card(s, M, 2.05, CW / 2 - 0.2, 3.1, false, 'E7F2EE');
  s.addText('Always log', { x: M + 0.35, y: 2.22, w: 3, h: 0.4, isTextBox: true, margin: 0, fontFace: BF, fontSize: 14, bold: true, color: '17513F' });
  bullets(s, [
    'Model id, prompt version, decoding params',
    'Token counts in and out, and latency split',
    'Validator verdict and any retry',
    'Which tier served the request',
    'A stable request id across the whole chain',
  ], M + 0.35, 2.66, CW / 2 - 0.9, false, 13);
  card(s, M + CW / 2 + 0.2, 2.05, CW / 2 - 0.2, 3.1, false, 'F7E7E2');
  s.addText('Never log unguarded', { x: M + CW / 2 + 0.55, y: 2.22, w: 4, h: 0.4, isTextBox: true, margin: 0, fontFace: BF, fontSize: 14, bold: true, color: '7A2E1C' });
  bullets(s, [
    'Raw prompts containing customer data',
    'Secrets pasted by users into a chat box',
    'Anything you would not put in a support ticket',
    'Full outputs, if they may echo the above',
  ], M + CW / 2 + 0.55, 2.66, CW / 2 - 0.9, false, 13);
  body(s, 'Sample and redact rather than choosing between blind and reckless. A one percent redacted sample debugs most issues.', M, 5.25, CW - 0.4, false, 14.5);
  notes(s, 'Redacted sampling is the compromise most teams land on eventually. Save them the detour.');
}
{
  const s = slide(false);
  title(s, 'Failure handling that does not amplify failure', false, 'The model is a flaky dependency. Treat it like one.');
  bullets(s, [
    'Set an explicit token cap on every call. An unbounded generation is an unbounded outage, as a reasoning model will demonstrate for you.',
    'Timeouts must be shorter than your caller patience, and retries must be bounded and jittered.',
    'Retry on malformed output, but change something. A second identical call at temperature zero returns the identical failure.',
    'Circuit break to the deterministic path. Degraded and predictable beats clever and stalled.',
    'Make the escalation tier a budget, not an unbounded fallback, or one bad day becomes an invoice.',
  ], M, 2.05, CW - 0.4, false, 14.5);
  card(s, M, 4.9, CW, 0.85, false);
  s.addText('The retry rule is the one people get wrong: vary the temperature, the prompt, or the model, otherwise you have built a slower way to fail.',
    { x: M + 0.4, y: 5.05, w: CW - 0.8, h: 0.6, isTextBox: true, margin: 0, fontFace: BF, fontSize: 13.5, color: '2A3746', lineSpacing: 19 });
  notes(s, 'The unbounded generation point ties directly to the lab fix in the two hour class. Call that back if they were there.');
}
{
  const s = slide(false);
  title(s, 'Model upgrades are migrations', false, 'Plan them like a database change, not a version bump');
  const rows = [
    [hdr('Step'), hdr('What you do')],
    ['1', 'Run the new model against the frozen golden set, same harness, same conditions'],
    ['2', 'Compare per case rather than in aggregate. Find what broke, not whether the mean moved'],
    ['3', 'Shadow the new model on live traffic without serving it, and diff the outputs'],
    ['4', 'Canary a small share behind the same gates, watching the validator failure rate'],
    ['5', 'Keep the old model deployable until the canary has been clean for a full traffic cycle'],
  ];
  tbl(s, rows, M, 2.1, CW, { colW: [0.9, CW - 0.9], rowH: 0.48, fontSize: 13 });
  body(s, 'Prompts are usually tuned to a specific model. An upgrade that keeps the prompt unchanged is not a controlled experiment, it is a hope.', M, 4.85, CW - 0.4, false, 14.5);
  notes(s, 'Step two is where the value is. Aggregate comparison hides exactly the regressions that hurt.');
}
{
  const s = slide(false);
  title(s, 'Security surfaces specific to this stack', false, 'Short version, because each of these deserves its own session');
  const rows = [
    [hdr('Surface'), hdr('The risk'), hdr('Minimum control')],
    ['Prompt injection', 'Retrieved or user content issues instructions', 'Never let model output authorise an action. Validate outside the model'],
    ['Tool authority', 'The model triggers something it should not', 'Tools carry their own authorisation, checked independently of the request'],
    ['Data retention', 'Customer data ends up in logs or weights', 'Redact before logging, scrub before training'],
    ['Model provenance', 'Weights of unclear origin or licence', 'Pin versions and digests, record licence per model'],
  ];
  tbl(s, rows, M, 2.1, CW, { colW: [2.6, 4.6, CW - 7.2], rowH: 0.52, fontSize: 12 });
  body(s, 'The first row is the one that matters most: treat every model output as untrusted input to the next stage, always.', M, 4.7, CW - 0.4, false, 14.5);
  notes(s, 'Be blunt that this is a summary, not a security curriculum, and point them at a real threat modelling session.');
}
{
  const s = slide(true);
  title(s, 'The advanced checklist', true);
  bullets(s, [
    'Golden set composed by slice, with provenance, and every incident added to it permanently.',
    'Mechanical checks before judged ones, and any judge validated against human labels and pinned.',
    'Every reported number carries an interval, and paired comparisons are done per case.',
    'Memory sized for weights plus cache plus concurrency, not weights alone.',
    'Prompts ordered for prefix reuse and kept byte stable.',
    'Prompt, model id and decoding parameters versioned together and logged per request.',
    'Every call has a token cap, a timeout, a bounded retry that varies something, and a deterministic fallback.',
    'Model upgrades run as shadow then canary against a frozen set.',
  ], M, 2.0, CW - 0.6, true, 15);
  notes(s, 'Hand out the practices card here. It is the same list in a form they can pin up.');
}
{
  const s = slide(true);
  s.addText('Measure, then decide', { x: M, y: 2.7, w: CW, h: 1.0, isTextBox: true, margin: 0, fontFace: HF, fontSize: 42, bold: true, color: PAPER });
  s.addText('Everything in this track reduces to one habit: know the number before you argue about the model. The teams that ship well are not the ones with the best models, they are the ones who can tell you what changed and by how much.',
    { x: M, y: 3.8, w: CW * 0.82, h: 1.2, isTextBox: true, margin: 0, fontFace: BF, fontSize: 17, color: MUTEDD, lineSpacing: 26 });
  notes(s, 'Close here, then straight into whichever lab the room most needs.');
}

p.writeFile({ fileName: path.join(__dirname, '..', '01-deck', 'slm-advanced.pptx') })
  .then(f => console.log('wrote ' + f + '  (' + n + ' slides)'));
