/*
 * Foundations deck for the Small Language Models class.
 * Builds 01-deck/slm-first-principles.pptx
 *
 * Assumes nothing. Starts at "what is a token" and finishes at
 * "here is the decision sequence and the checklist".
 * Run:  node source/deck-first-principles.js
 */
const pptxgen = require('pptxgenjs');
const path = require('path');
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';
p.author = 'SLM Class';
p.title = 'Small Language Models: From First Principles';

/* palette matched to the existing class deck */
const INK = '16202A', INK2 = '243244', PAPER = 'FFFFFF';
const TINT = 'F1F4F7', TINT2 = '1F2C3B';
const MUTED = '6B7A8C', MUTEDD = 'A9B6C4';
const SIG = 'FF6B35', GOOD = '2E9E82', WARN = 'D9A404', BAD = 'C0442E';
const HF = 'Cambria', BF = 'Calibri', MF = 'Courier New';
const W = 13.33, M = 0.7, CW = W - 2 * M;

let n = 0;
function slide(dark) {
  const s = p.addSlide();
  s.background = { color: dark ? INK : PAPER };
  n++;
  return s;
}
function title(s, txt, dark, sub) {
  s.addText(txt, { x: M, y: 0.42, w: CW, h: 0.85, isTextBox: true, margin: 0, fontFace: HF,
    fontSize: txt.length > 52 ? 28 : 33, bold: true, color: dark ? PAPER : INK, valign: 'top' });
  if (sub) s.addText(sub, { x: M, y: 1.28, w: CW, h: 0.5, isTextBox: true, margin: 0, fontFace: BF,
    fontSize: 15, italic: true, color: dark ? MUTEDD : MUTED, valign: 'top' });
}
function card(s, x, y, w, h, dark, fill) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06,
    fill: { color: fill || (dark ? TINT2 : TINT) },
    line: { color: dark ? TINT2 : 'E1E7ED', width: 1 } });
}
function bullets(s, items, x, y, w, dark, sz) {
  s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
    { x, y, w, h: 0.42 * items.length + 0.5, isTextBox: true, margin: 0, fontFace: BF,
      valign: 'top', fontSize: sz || 15, color: dark ? 'DCE4EC' : '2A3746',
      paraSpaceAfter: 7, lineSpacing: 21 });
}
function body(s, txt, x, y, w, dark, sz) {
  s.addText(txt, { x, y, w, h: 1.2, isTextBox: true, margin: 0, fontFace: BF, valign: 'top',
    fontSize: sz || 15, color: dark ? 'DCE4EC' : '2A3746', lineSpacing: 22 });
}
function stat(s, x, y, w, big, label, color, dark, sz) {
  s.addText(big, { x, y, w, h: 0.9, isTextBox: true, margin: 0, fontFace: MF,
    fontSize: sz || 36, bold: true, color: color || SIG });
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
  s.addText(num, { x: M, y: 2.25, w: 3, h: 0.8, isTextBox: true, margin: 0, fontFace: MF,
    fontSize: 44, bold: true, color: SIG });
  s.addText(t, { x: M, y: 3.05, w: CW, h: 1.0, isTextBox: true, margin: 0, fontFace: HF,
    fontSize: 38, bold: true, color: PAPER });
  if (sub) s.addText(sub, { x: M, y: 4.15, w: CW * 0.8, h: 0.9, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 16, color: MUTEDD, lineSpacing: 24 });
  return s;
}
/* a labelled box used to draw simple flows */
function fbox(s, x, y, w, h, label, sub, color, dark) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.05,
    fill: { color: color || (dark ? TINT2 : TINT) }, line: { color: color ? color : 'D8E0E8', width: 1 } });
  s.addText(label, { x, y: y + (sub ? 0.1 : h / 2 - 0.2), w, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 13, bold: true, align: 'center', color: dark ? PAPER : INK });
  if (sub) s.addText(sub, { x, y: y + 0.46, w, h: 0.5, isTextBox: true, margin: 0, fontFace: BF,
    fontSize: 10.5, align: 'center', color: dark ? MUTEDD : MUTED });
}
function arrow(s, x, y, w) {
  s.addShape(p.ShapeType.rightArrow, { x, y, w, h: 0.18, fill: { color: 'B9C6D2' } });
}

/* ===================== PART 0: OPENING ===================== */
{
  const s = slide(true);
  s.addText('Small Language Models', { x: M, y: 1.95, w: CW, h: 0.95, isTextBox: true, margin: 0,
    fontFace: HF, fontSize: 50, bold: true, color: PAPER });
  s.addText('From First Principles', { x: M, y: 2.85, w: CW, h: 0.95, isTextBox: true, margin: 0,
    fontFace: HF, fontSize: 50, bold: true, color: SIG });
  s.addText('What they are  ·  how they are built  ·  how to make them reliable  ·  when to walk away',
    { x: M, y: 4.0, w: CW, h: 0.5, isTextBox: true, margin: 0, fontFace: BF, fontSize: 17, color: MUTEDD });
  s.addShape(p.ShapeType.ellipse, { x: M, y: 5.2, w: 0.13, h: 0.13, fill: { color: SIG } });
  s.addText('No prior background assumed. We start at "what is a token".',
    { x: M + 0.28, y: 5.08, w: CW - 0.3, h: 0.4, isTextBox: true, margin: 0, fontFace: MF,
      fontSize: 13, color: MUTEDD });
  notes(s, 'Set expectations: nobody needs ML background. Ask for a show of hands on who has run a model locally, and pitch the pace accordingly.');
}
{
  const s = slide(false);
  title(s, 'By the end you will be able to', false, 'Six concrete capabilities, not a vibe');
  bullets(s, [
    'Read any model card and say what the model is, how big it really is, and what it will cost you to run.',
    'Explain the difference between a dense model, a mixture of experts, and a hybrid, and why it changes your tooling.',
    'Choose a quantization level on purpose instead of copying a tutorial.',
    'Design a task so that a small model can actually hit your reliability bar.',
    'Decide correctly between prompting, constraining, routing, and fine-tuning.',
    'Run and evaluate a fine-tune end to end, and know when not to.',
  ], M, 2.0, CW - 0.5, false, 15.5);
  notes(s, 'Read these out. They are the promise of the session and you will call back to them at the close.');
}
{
  const s = slide(false);
  title(s, 'The route', false, 'Nine parts, foundations first');
  const rows = [
    [hdr('Part'), hdr('Topic'), hdr('What you get')],
    ['1', 'Foundations', 'Tokens, parameters, context, memory'],
    ['2', 'What "small" means', 'The size bands and what each can do'],
    ['3', 'Types of SLM', 'Architecture, role, lineage, precision'],
    ['4', 'How they are made', 'Pretraining, distillation, pruning, quantization, tuning'],
    ['5', 'Running them', 'Formats, runtimes, hardware, cost'],
    ['6', 'Making them reliable', 'The compounding problem and the four fixes'],
    ['7', 'Adapting them', 'A complete fine-tuning run'],
    ['8', 'Evaluating', 'Golden sets and honest numbers'],
    ['9', 'Deciding', 'The sequence and the checklist'],
  ];
  tbl(s, rows, M, 2.0, CW, { colW: [0.8, 3.4, CW - 4.2], rowH: 0.33 });
  notes(s, 'Point out that parts 1 to 3 are vocabulary, 4 to 5 are mechanics, 6 to 9 are judgement. The judgement half is where the value is.');
}
{
  const s = slide(true);
  title(s, 'If you remember one thing', true);
  card(s, M, 2.2, CW, 2.5, true);
  s.addText('Reliability comes from architecture, not from parameters.',
    { x: M + 0.5, y: 2.65, w: CW - 1, h: 0.8, isTextBox: true, margin: 0, fontFace: HF,
      fontSize: 30, bold: true, color: PAPER });
  s.addText('Decompose the task, verify every step, then buy the cheapest model that clears the bar.',
    { x: M + 0.5, y: 3.55, w: CW - 1, h: 0.8, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 17, color: MUTEDD });
  notes(s, 'This is the spine of the class. Everything technical afterwards is in service of it.');
}

/* ===================== PART 1: FOUNDATIONS ===================== */
section('01', 'Foundations', 'What a language model is, in the four numbers that actually describe one.');
{
  const s = slide(false);
  title(s, 'A language model predicts the next token', false, 'That is the whole mechanism. Everything else is scaffolding.');
  body(s, 'Given a sequence of tokens, the model outputs a probability for every token in its vocabulary. Sampling picks one, appends it, and the loop runs again. There is no database lookup, no reasoning engine, no memory between calls.', M, 2.0, CW - 0.4, false, 16);
  card(s, M, 3.1, CW, 1.5, false);
  s.addText('Two consequences you will feel all day', { x: M + 0.4, y: 3.28, w: CW - 0.8, h: 0.35,
    isTextBox: true, margin: 0, fontFace: BF, fontSize: 13, bold: true, color: INK });
  bullets(s, [
    'The model has no state. Anything it should know must be in the prompt, every single call.',
    'Output is sampled, so identical inputs can give different outputs unless temperature is zero.',
  ], M + 0.4, 3.62, CW - 0.9, false, 13.5);
  notes(s, 'Statelessness explains why context windows and prompt cost dominate every design conversation later.');
}
{
  const s = slide(false);
  title(s, 'Tokens are the unit of everything', false, 'Cost, speed, limits and truncation are all counted in tokens');
  bullets(s, [
    'A token is a chunk of text, roughly three to four characters of English. Not a word and not a character.',
    'Common words are one token. Rare words, code identifiers, and non-English text split into several.',
    'Every model has its own tokenizer, so the same text is a different number of tokens on different models.',
    'Useful rule of thumb: 100 tokens is about 75 English words. One page of prose is roughly 500 tokens.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  card(s, M, 4.4, CW, 1.15, false);
  s.addText('Why you care: you are billed per token, you are rate limited per token, your context window is measured in tokens, and truncation silently deletes tokens from one end of your prompt.',
    { x: M + 0.4, y: 4.6, w: CW - 0.8, h: 0.8, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '2A3746', lineSpacing: 19 });
  notes(s, 'The truncation point comes back hard in part 7. Flag it now so the callback lands.');
}
{
  const s = slide(false);
  title(s, 'Parameters are the learned weights', false, 'The headline number in every model name');
  bullets(s, [
    'A 3B model has roughly three billion numbers learned during training. That is the "3B" in the name.',
    'Parameters are frozen at inference. Running a model does not change it.',
    'More parameters generally means more capability and always means more memory and less speed.',
    'Parameter count alone does not tell you the memory cost. Precision does that, and we get to it shortly.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  card(s, M, 4.35, CW, 1.2, false);
  s.addText('Careful with mixture of experts models. A model advertised as 30B may activate only 3B per token. Total parameters set your memory bill, active parameters set your speed.',
    { x: M + 0.4, y: 4.55, w: CW - 0.8, h: 0.8, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '2A3746', lineSpacing: 19 });
  notes(s, 'This distinction trips up almost everyone reading a model card for the first time.');
}
{
  const s = slide(false);
  title(s, 'The context window is the working memory', false, 'Prompt plus generated output must fit inside it');
  bullets(s, [
    'Context is the total token budget for one call: system prompt, history, retrieved documents, and the answer.',
    'Advertised windows are often far larger than the window in which the model is actually good.',
    'Long context is not free. Attention cost and the KV cache both grow with sequence length.',
    'When the input exceeds the window, something gets dropped. Know which end your runtime cuts.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  card(s, M, 4.35, CW, 1.2, false, 'FBF0E2');
  s.addText('Most trainers and many servers truncate from the end. The end is where your answer lives. This single fact causes a training failure we will meet in part 7.',
    { x: M + 0.4, y: 4.55, w: CW - 0.8, h: 0.8, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '5A4415', lineSpacing: 19 });
  notes(s, 'Plant this firmly. It is the single most expensive gotcha in the whole deck.');
}
{
  const s = slide(false);
  title(s, 'Four numbers describe any model', false, 'Ask for these before you ask anything else');
  const rows = [
    [hdr('Number'), hdr('Example'), hdr('What it governs')],
    ['Total parameters', '3B', 'Memory footprint and rough capability ceiling'],
    ['Active parameters', '3B of 30B', 'Generation speed on mixture of experts models'],
    ['Context window', '128k tokens', 'How much you can put in one call'],
    ['Precision', 'Q4_K_M, 4 bit', 'Bytes per parameter, so the real memory bill'],
  ];
  tbl(s, rows, M, 2.1, CW, { colW: [3.0, 2.6, CW - 5.6], rowH: 0.44 });
  body(s, 'A "3B model" can need 6 GB or 2 GB depending only on the fourth row. Precision is the number people forget and it is the one that decides whether the model fits your laptop.', M, 4.55, CW - 0.4, false, 15);
  notes(s, 'Have them write these four down. It is the single most reusable artifact of part 1.');
}
{
  const s = slide(false);
  title(s, 'Inference has two phases with different speeds', false, 'Prefill reads your prompt, decode writes the answer');
  fbox(s, M, 2.2, 3.6, 1.0, 'PREFILL', 'reads the whole prompt in parallel', TINT, false);
  arrow(s, M + 3.8, 2.6, 0.7);
  fbox(s, M + 4.7, 2.2, 3.6, 1.0, 'DECODE', 'writes one token at a time', TINT, false);
  bullets(s, [
    'Prefill is parallel and fast per token. Decode is sequential and slow per token.',
    'Benchmarks quote both. Prompt processing speed and generation speed are different numbers.',
    'A long prompt with a short answer is prefill bound. A short prompt with a long answer is decode bound.',
    'Caching the prefill of a stable prompt prefix is one of the cheapest speedups available.',
  ], M, 3.5, CW - 0.4, false, 15);
  notes(s, 'If someone says "the model is slow", the first question is which phase. The fixes are completely different.');
}
{
  const s = slide(false);
  title(s, 'The memory bill, in one formula', false, 'Weights plus the KV cache, and people forget the second one');
  card(s, M, 2.0, CW, 0.95, false);
  s.addText('memory  ~=  parameters x bytes per parameter   +   KV cache',
    { x: M + 0.4, y: 2.22, w: CW - 0.8, h: 0.5, isTextBox: true, margin: 0, fontFace: MF,
      fontSize: 18, bold: true, color: INK, align: 'center' });
  const rows = [
    [hdr('Precision'), hdr('Bytes per parameter'), hdr('A 3B model needs')],
    ['FP16 or BF16', '2', 'about 6 GB'],
    ['8 bit', '1', 'about 3 GB'],
    ['4 bit', '0.5', 'about 1.7 GB'],
  ];
  tbl(s, rows, M, 3.2, CW * 0.62, { colW: [2.6, 2.6, CW * 0.62 - 5.2], rowH: 0.38 });
  card(s, M + CW * 0.66, 3.2, CW * 0.34, 1.9, false);
  s.addText('The KV cache grows with context length and batch size. At long context it can rival the weights. Budget for it or you will hit an out of memory error mid conversation.',
    { x: M + CW * 0.66 + 0.3, y: 3.42, w: CW * 0.34 - 0.6, h: 1.5, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12.5, color: '2A3746', lineSpacing: 18 });
  notes(s, 'Do the arithmetic live for the model you are demoing. Making it concrete beats the table.');
}

/* ===================== PART 2: WHAT SMALL MEANS ===================== */
section('02', 'What "small" actually means', 'There is no official line. There are practical bands, and they matter more.');
{
  const s = slide(false);
  title(s, 'Nobody agrees on the definition', false, 'Use a working one and move on');
  body(s, 'Small is relative to the frontier of the moment, and the frontier moves every few months. A useful working definition for engineers:', M, 2.0, CW - 0.4, false, 16);
  card(s, M, 2.85, CW, 1.0, false, 'E7F2EE');
  s.addText('A small language model is one you can run yourself, on hardware you already own, without a cluster.',
    { x: M + 0.4, y: 3.05, w: CW - 0.8, h: 0.6, isTextBox: true, margin: 0, fontFace: HF,
      fontSize: 20, bold: true, color: '17513F', align: 'center' });
  bullets(s, [
    'That lands somewhere under about 30B parameters today, and the line will move.',
    'It is a deployment definition rather than a research one, which is what you need for decisions.',
    'The interesting question is never "is it small" but "is it sufficient for this narrow task".',
  ], M, 4.15, CW - 0.4, false, 15);
  notes(s, 'Resist definition debates in the room. Redirect to sufficiency for a task.');
}
{
  const s = slide(false);
  title(s, 'The bands, and what each one can carry', false, 'Task shape decides size, not the other way round');
  const rows = [
    [hdr('Band'), hdr('Runs on'), hdr('Reliable for'), hdr('Not reliable for')],
    ['Under 1B', 'Anything, phones', 'Classification, tagging', 'Anything generative you ship'],
    ['1B to 4B', 'Any laptop', 'Extraction, routing, format conversion, short summaries', 'Multi step tool use'],
    ['7B to 9B', 'Good laptop or one GPU', 'Tool calling agents, solid summarisation, simple code', 'Novel reasoning, long planning'],
    ['12B to 30B', 'Workstation or server GPU', 'Harder reasoning, better code', 'Frontier level planning'],
    ['Frontier', 'Someone else’s data centre', 'Novel reasoning, long horizon planning', 'Your budget, at volume'],
  ];
  tbl(s, rows, M, 2.05, CW, { colW: [1.9, 2.6, CW - 8.2, 3.7], rowH: 0.5, fontSize: 12 });
  notes(s, 'The two floors to remember: sub 4B for extraction and classification, 7B to 9B before you attempt agentic tool use.');
}
{
  const s = slide(false);
  title(s, 'What small models are genuinely good at', false, 'Narrow, bounded, verifiable work');
  card(s, M, 2.05, CW / 2 - 0.2, 3.1, false, 'E7F2EE');
  s.addText('Strong', { x: M + 0.35, y: 2.22, w: 3, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 14, bold: true, color: '17513F' });
  bullets(s, [
    'Extraction into a fixed schema',
    'Classification and routing',
    'Format and style conversion',
    'Short grounded summarisation',
    'Single tool calls with a validator',
    'High volume repetitive work',
  ], M + 0.35, 2.66, CW / 2 - 0.9, false, 13.5);
  card(s, M + CW / 2 + 0.2, 2.05, CW / 2 - 0.2, 3.1, false, 'F7E7E2');
  s.addText('Weak', { x: M + CW / 2 + 0.55, y: 2.22, w: 3, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 14, bold: true, color: '7A2E1C' });
  bullets(s, [
    'Long multi step plans without checks',
    'Novel reasoning it has not seen',
    'Holding many constraints at once',
    'Knowing what it does not know',
    'Long context recall in the middle',
    'Anything unbounded and open ended',
  ], M + CW / 2 + 0.55, 2.66, CW / 2 - 0.9, false, 13.5);
  notes(s, 'The right hand column is not a list of things to fix with a bigger prompt. It is a list of things to design around.');
}

/* ===================== PART 3: TYPES ===================== */
section('03', 'Types of small language model', 'Four independent axes. A model is a point in all four at once.');
{
  const s = slide(false);
  title(s, 'Four axes, not one taxonomy', false, 'Every model you meet sits somewhere on each of these');
  const y = 2.1, h = 1.35;
  fbox(s, M, y, CW / 2 - 0.2, h, 'AXIS 1  ARCHITECTURE', 'dense, mixture of experts, hybrid, nested', TINT, false);
  fbox(s, M + CW / 2 + 0.2, y, CW / 2 - 0.2, h, 'AXIS 2  ROLE', 'base, instruct, reasoning, embedding, multimodal', TINT, false);
  fbox(s, M, y + h + 0.3, CW / 2 - 0.2, h, 'AXIS 3  LINEAGE', 'trained from scratch, distilled, pruned', TINT, false);
  fbox(s, M + CW / 2 + 0.2, y + h + 0.3, CW / 2 - 0.2, h, 'AXIS 4  PRECISION', 'full, 8 bit, 4 bit, and lower', TINT, false);
  body(s, 'Confusing these axes is the most common source of bad model decisions. A 4 bit distilled instruct dense model is four separate facts.', M, 5.15, CW - 0.4, false, 14.5);
  notes(s, 'Write the four axis names on a whiteboard and keep them visible for the rest of the block.');
}
{
  const s = slide(false);
  title(s, 'Architecture 1: the dense transformer', false, 'The default, and what most tooling assumes');
  bullets(s, [
    'Every parameter is used for every token. Simple, predictable, and well supported everywhere.',
    'Memory and compute scale straightforwardly with parameter count.',
    'Adapters and fine-tuning recipes work out of the box because the layers are conventional.',
    'If you are unsure what you are dealing with, assume dense and verify on the model card.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  card(s, M, 4.3, CW, 1.15, false, 'E7F2EE');
  s.addText('Practical upshot: dense is the safe default for a first fine-tune. Standard recipes apply and nothing surprises you.',
    { x: M + 0.4, y: 4.52, w: CW - 0.8, h: 0.7, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '17513F', lineSpacing: 19 });
  notes(s, 'Keep this short. It is the baseline against which the next three slides are contrasts.');
}
{
  const s = slide(false);
  title(s, 'Architecture 2: mixture of experts', false, 'Many experts, only a few used per token');
  fbox(s, M, 2.15, 2.7, 1.0, 'ROUTER', 'picks 2 of N experts', TINT, false);
  arrow(s, M + 2.9, 2.55, 0.6);
  fbox(s, M + 3.7, 2.15, 1.5, 1.0, 'Expert 1', 'active', 'E7F2EE', false);
  fbox(s, M + 5.35, 2.15, 1.5, 1.0, 'Expert 2', 'active', 'E7F2EE', false);
  fbox(s, M + 7.0, 2.15, 1.5, 1.0, 'Expert 3', 'idle', TINT, false);
  fbox(s, M + 8.65, 2.15, 1.5, 1.0, 'Expert N', 'idle', TINT, false);
  bullets(s, [
    'Speed of a small model, memory footprint of a large one. You must hold every expert in memory.',
    'A 26B model with 4B active generates about as fast as a 4B dense model and needs the RAM of a 26B.',
    'Excellent when you have memory but want throughput. Poor when memory is the binding constraint.',
    'Read model cards carefully: "active" and "total" parameters are both quoted and mean different things.',
  ], M, 3.5, CW - 0.4, false, 15);
  notes(s, 'This is the architecture people most often misjudge when sizing hardware.');
}
{
  const s = slide(false);
  title(s, 'Architecture 3: hybrid and state space models', false, 'Attention replaced or interleaved with a recurrent mechanism');
  bullets(s, [
    'State space layers, such as Mamba, process sequences with cost that grows linearly rather than quadratically.',
    'The practical benefit is long context at much lower memory, because there is a smaller cache to keep.',
    'Many recent families interleave a few attention layers with many state space layers.',
    'Tooling support lags. Some trainers, quantizers and servers handle them poorly or not at all.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  card(s, M, 4.3, CW, 1.25, false, 'FBF0E2');
  s.addText('The trap: a standard adapter configuration targets attention projections only. On a mostly state space model that attaches to a handful of layers and quietly under trains. Check the architecture before you copy a recipe.',
    { x: M + 0.4, y: 4.5, w: CW - 0.8, h: 0.9, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '5A4415', lineSpacing: 19 });
  notes(s, 'Real world example: a family changed from hybrid to dense between two generations. The same recipe behaved completely differently.');
}
{
  const s = slide(false);
  title(s, 'Architecture 4: nested and elastic models', false, 'One download, several sizes');
  bullets(s, [
    'Nested designs embed a smaller model inside a larger one, so one artifact serves several capability points.',
    'You can trade quality for speed at load time or at run time without shipping a second model.',
    'Advertised sizes may be "effective" rather than total, so memory can surprise you.',
    'Support is uneven. Conversion tools sometimes fail on the nested weight layout even when inference works.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  body(s, 'When you meet one of these, verify two things before committing: that your training stack can load it, and which parameter number the vendor is quoting.', M, 4.4, CW - 0.4, false, 15);
  notes(s, 'A real project hit exactly this: official weights would not convert, and a community conversion had to be used instead.');
}
{
  const s = slide(false);
  title(s, 'Role: what the model was finished for', false, 'Same base weights, very different products');
  const rows = [
    [hdr('Role'), hdr('What it is'), hdr('Use it for')],
    ['Base', 'Raw pretrained model, no instruction tuning', 'Further training. Not for direct use'],
    ['Instruct or chat', 'Tuned to follow instructions', 'Almost everything you will build'],
    ['Reasoning', 'Trained to emit a chain of thought first', 'Hard problems, if you can afford the tokens'],
    ['Code', 'Weighted toward code corpora', 'Completion, transformation, review'],
    ['Embedding', 'Emits vectors, not text', 'Search, retrieval, clustering, deduplication'],
    ['Multimodal', 'Accepts images or audio too', 'Documents, screenshots, diagrams'],
  ];
  tbl(s, rows, M, 2.05, CW, { colW: [2.4, 4.6, CW - 7.0], rowH: 0.42, fontSize: 12 });
  notes(s, 'Embedding models are the most forgotten row and often the cheapest win in a retrieval system.');
}
{
  const s = slide(false);
  title(s, 'Reasoning models need care in a pipeline', false, 'The feature that helps on hard problems hurts on structured output');
  bullets(s, [
    'A reasoning model spends tokens thinking before it answers, and that thinking is often returned in a separate field.',
    'With a small token budget the thinking consumes everything and your visible answer comes back empty.',
    'For schema constrained output, turn thinking off explicitly and confirm the server honours the switch.',
    'Budget for the extra tokens. Reasoning modes can multiply cost and latency several times over.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  card(s, M, 4.35, CW, 1.2, false, 'F7E7E2');
  s.addText('Seen in practice: a base model scored zero on a structured task purely because it returned reasoning and no parseable content. That is a harness artifact, not a capability result. Never report it as one.',
    { x: M + 0.4, y: 4.55, w: CW - 0.8, h: 0.85, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '7A2E1C', lineSpacing: 19 });
  notes(s, 'This is both a technical warning and an evaluation ethics point. It lands twice.');
}
{
  const s = slide(false);
  title(s, 'Lineage: where the small model came from', false, 'Three routes, and you will only ever use one of them');
  fbox(s, M, 2.2, 3.7, 1.5, 'FROM SCRATCH', 'pretrained on trillions of tokens', TINT, false);
  fbox(s, M + 4.1, 2.2, 3.7, 1.5, 'DISTILLED', 'trained to imitate a larger teacher', TINT, false);
  fbox(s, M + 8.2, 2.2, 3.7, 1.5, 'PRUNED', 'a larger model with parts removed', TINT, false);
  bullets(s, [
    'From scratch costs millions and needs a data pipeline. You will consume these, never produce them.',
    'Distillation transfers behaviour from a big teacher into a small student and is why modern small models are so good.',
    'Pruning removes weights or layers then repairs the damage with a little training. Cheapest, and quality is uneven.',
    'For your purposes all three arrive as a download. The lineage mainly tells you what to expect on quality.',
  ], M, 4.0, CW - 0.4, false, 15);
  notes(s, 'The honest message: you will not pretrain. Knowing the lineage still helps you predict behaviour.');
}
{
  const s = slide(false);
  title(s, 'Licences are a real constraint', false, 'Check before you build, not after');
  bullets(s, [
    'Permissive licences such as Apache 2.0 or MIT let you use, modify and ship commercially.',
    'Some models use a custom licence with usage restrictions, revenue thresholds, or naming requirements.',
    'A permissive licence can still carry a separate acceptable use policy layered on top. Read both documents.',
    'Licences change between generations. The terms you checked last year may not apply to this release.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  body(s, 'Where legal review is slow, this is the single item worth raising on day one rather than day thirty.', M, 4.4, CW - 0.4, false, 15);
  notes(s, 'Encourage them to capture licence and provenance per model in whatever registry they keep.');
}

/* ===================== PART 4: HOW MADE ===================== */
section('04', 'How small models are made', 'Five techniques. You will use two of them, but you should recognise all five.');
{
  const s = slide(false);
  title(s, 'The production pipeline, end to end', false, 'Where each technique sits');
  const y = 2.3, h = 1.0, bw = 2.05, gap = 0.36;
  const steps = [['PRETRAIN', 'trillions of tokens'], ['DISTIL', 'teacher to student'],
                 ['PRUNE', 'cut and repair'], ['ALIGN', 'instruction tune'],
                 ['QUANTIZE', 'shrink to fit'], ['FINE TUNE', 'your task']];
  steps.forEach((st, i) => {
    const x = M + i * (bw + gap);
    const mine = i >= 4;
    fbox(s, x, y, bw, h, st[0], st[1], mine ? 'FDE3D6' : TINT, false);
    if (i < steps.length - 1) arrow(s, x + bw + 0.06, y + 0.41, gap - 0.12);
  });
  body(s, 'The two shaded boxes are yours. Everything to the left of them happens at organisations with large training budgets, and arrives to you as a file you download.', M, 3.65, CW - 0.4, false, 15);
  bullets(s, [
    'You will quantize almost every model you deploy locally.',
    'You will fine-tune a minority of them, and only for the right reasons.',
  ], M, 4.4, CW - 0.4, false, 15);
  notes(s, 'Ownership framing keeps the next few slides from feeling academic.');
}
{
  const s = slide(false);
  title(s, 'Pretraining, and why you will not do it', false, 'Useful to understand, impossible to justify');
  bullets(s, [
    'The model learns language by predicting the next token across trillions of tokens of text.',
    'Cost runs from hundreds of thousands to many millions of dollars, plus a serious data engineering effort.',
    'The output is a base model that completes text but does not follow instructions.',
    'What you should take from it: the model knows only what was in that corpus, up to its cutoff date.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  card(s, M, 4.3, CW, 1.2, false);
  s.addText('This is why retrieval exists. If your facts are newer than the cutoff or private to you, they must arrive in the prompt. No amount of fine-tuning is a reliable way to add facts.',
    { x: M + 0.4, y: 4.5, w: CW - 0.8, h: 0.85, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '2A3746', lineSpacing: 19 });
  notes(s, 'The last line pre empts the most common bad fine-tuning proposal you will receive.');
}
{
  const s = slide(false);
  title(s, 'Distillation is why small models got good', false, 'A large teacher supervises a small student');
  fbox(s, M + 1.2, 2.2, 3.4, 1.2, 'TEACHER', 'large, expensive, capable', TINT, false);
  arrow(s, M + 4.8, 2.7, 1.2);
  fbox(s, M + 6.2, 2.2, 3.4, 1.2, 'STUDENT', 'small, cheap, nearly as good', 'E7F2EE', false);
  bullets(s, [
    'The student trains on the teacher’s outputs, and often on its full probability distribution, which carries more signal than text alone.',
    'The result routinely beats a model of the same size trained from scratch on raw text.',
    'This is the main reason a modern 3B model outperforms a much larger model from a few years ago.',
    'Check the licence of the teacher. Some forbid using their outputs to train competing models.',
  ], M, 3.7, CW - 0.4, false, 14.5);
  notes(s, 'The licence point is a genuine legal risk in commercial settings, worth stating plainly.');
}
{
  const s = slide(false);
  title(s, 'Quantization is the lever you will actually pull', false, 'Fewer bits per weight, dramatically less memory');
  bullets(s, [
    'Weights are stored at reduced precision, most commonly 4 bit, instead of 16 bit floating point.',
    'Memory falls by roughly four times and speed improves, because memory bandwidth is usually the bottleneck.',
    'Quality loss at 4 bit is small for most tasks and is very often the correct trade.',
    'Below 4 bit, degradation becomes visible quickly, and it shows up first on structured output and long reasoning.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  const rows = [
    [hdr('Level'), hdr('Size of a 3B model'), hdr('Guidance')],
    ['16 bit', 'about 6 GB', 'Training and conversion. Rarely for serving'],
    ['8 bit', 'about 3 GB', 'Safe. Use when you have the memory'],
    ['4 bit', 'about 1.7 GB', 'The workhorse. Start here'],
    ['3 bit and below', 'about 1.2 GB', 'Only with an eval that proves it holds'],
  ];
  tbl(s, rows, M, 4.25, CW, { colW: [2.8, 3.2, CW - 6.0], rowH: 0.34, fontSize: 12 });
  notes(s, 'Tell them the honest default: take the 4 bit build, measure, and only move if your eval says so.');
}
{
  const s = slide(false);
  title(s, 'Fine-tuning: three ways, one you will use', false, 'Full, LoRA, and QLoRA');
  const rows = [
    [hdr('Method'), hdr('What it updates'), hdr('Memory'), hdr('When')],
    ['Full fine-tune', 'Every parameter', 'Very high', 'Rarely. You need a cluster and a reason'],
    ['LoRA', 'Small adapter matrices added to some layers', 'Moderate', 'You have a GPU and full precision weights'],
    ['QLoRA', 'Same adapter, over a quantized base', 'Low', 'The default. Runs on a laptop'],
  ];
  tbl(s, rows, M, 2.1, CW, { colW: [2.6, 4.3, 1.6, CW - 8.5], rowH: 0.55, fontSize: 12.5 });
  bullets(s, [
    'An adapter is a small set of extra weights. The base model is untouched and can be shared across adapters.',
    'Adapters are megabytes, not gigabytes, so you can keep one per task or per tenant.',
    'At the end you either merge the adapter into the base or load it alongside at serving time.',
  ], M, 4.35, CW - 0.4, false, 14.5);
  notes(s, 'Per tenant adapters is a genuinely strong B2B argument and worth dwelling on for a moment.');
}
{
  const s = slide(false);
  title(s, 'Alignment: turning a base model into an assistant', false, 'Instruction tuning, then preference tuning');
  bullets(s, [
    'Supervised instruction tuning teaches the format of helpful answers, using prompt and response pairs.',
    'Preference tuning then nudges the model toward answers humans rated better and away from ones they did not.',
    'This is what separates a base model from the instruct model you actually want to use.',
    'Your own fine-tuning is the same machinery, applied narrowly to one task rather than to general helpfulness.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  body(s, 'Practical consequence: fine-tuning an instruct model on a narrow task can erode its general helpfulness. We will measure exactly that in part 7.', M, 4.4, CW - 0.4, false, 15);
  notes(s, 'Sets up the regression check finding later. Make the forward reference explicit.');
}

/* ===================== PART 5: RUNNING ===================== */
section('05', 'Running them', 'Formats, runtimes, hardware, and what performance to expect.');
{
  const s = slide(false);
  title(s, 'Formats and runtimes', false, 'Two file formats and four runtimes cover almost everything');
  const rows = [
    [hdr('Thing'), hdr('What it is'), hdr('You meet it when')],
    ['safetensors', 'Full precision weights, the training format', 'Downloading a base model, fine-tuning'],
    ['GGUF', 'Quantized single file for local inference', 'Running locally on CPU or a laptop GPU'],
    ['llama.cpp', 'C++ inference engine, CPU first', 'Local serving, laptops, edge, air gapped'],
    ['Ollama', 'A friendly wrapper over local inference', 'Getting started, demos, teaching'],
    ['vLLM', 'High throughput GPU server', 'Production serving with real concurrency'],
    ['MLX', 'Apple silicon training and inference', 'Fine-tuning on a Mac'],
  ];
  tbl(s, rows, M, 2.05, CW, { colW: [2.3, 5.0, CW - 7.3], rowH: 0.42, fontSize: 12 });
  notes(s, 'The lab uses the local stack. Mention vLLM only so they know where to go at production concurrency.');
}
{
  const s = slide(false);
  title(s, 'What performance to expect', false, 'Order of magnitude, so you can sanity check a vendor claim');
  const rows = [
    [hdr('Setup'), hdr('Generation speed'), hdr('Verdict')],
    ['3B, 4 bit, modern laptop CPU', 'roughly 30 to 60 tokens per second', 'Comfortable for most work'],
    ['7B to 9B, 4 bit, laptop CPU', 'roughly 10 to 25 tokens per second', 'Usable, feels slow interactively'],
    ['3B to 9B on a consumer GPU', 'well over 100 tokens per second', 'Comfortable for anything'],
    ['Below 5 tokens per second', 'any setup', 'Not tolerable for an interactive agent'],
  ];
  tbl(s, rows, M, 2.1, CW, { colW: [4.6, 4.2, CW - 8.8], rowH: 0.46, fontSize: 12.5 });
  bullets(s, [
    'Always separate prompt processing speed from generation speed when comparing numbers.',
    'Benchmark on the hardware you will deploy on. Laptop numbers do not transfer to a shared server.',
    'Concurrency changes everything. A single stream number tells you very little about throughput under load.',
  ], M, 4.45, CW - 0.4, false, 14.5);
  notes(s, 'These are deliberately broad bands. The point is detecting a claim that is off by an order of magnitude.');
}
{
  const s = slide(false);
  title(s, 'Self hosting is a separate decision from model size', false, 'These two get conflated constantly');
  card(s, M, 2.1, CW / 2 - 0.2, 2.9, false, 'E7F2EE');
  s.addText('Small versus large', { x: M + 0.35, y: 2.3, w: 4, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 14, bold: true, color: '17513F' });
  bullets(s, [
    'Nearly always a win on a narrow task',
    'Decided by task shape and your eval',
    'Cheap to test: swap the model, rerun the golden set',
  ], M + 0.35, 2.75, CW / 2 - 0.9, false, 13.5);
  card(s, M + CW / 2 + 0.2, 2.1, CW / 2 - 0.2, 2.9, false, 'FBF0E2');
  s.addText('Self host versus API', { x: M + CW / 2 + 0.55, y: 2.3, w: 4, h: 0.4, isTextBox: true,
    margin: 0, fontFace: BF, fontSize: 14, bold: true, color: '5A4415' });
  bullets(s, [
    'Almost never won on token price alone',
    'Won on sovereignty, latency guarantees, per tenant weights, air gap, deprecation risk',
    'Costs you an ops burden forever',
  ], M + CW / 2 + 0.55, 2.75, CW / 2 - 0.9, false, 13.5);
  body(s, 'A cheap hosted small model captures most of the win with none of the operational cost. Reach for self hosting when you have a reason that is not the token price.', M, 5.2, CW - 0.4, false, 14.5);
  notes(s, 'This slide prevents the most expensive mistake in the room: self hosting for imagined savings.');
}

/* ===================== PART 6: RELIABILITY ===================== */
section('06', 'Making them reliable', 'The core of the class. Architecture beats parameters.');
{
  const s = slide(false);
  title(s, 'A tool call succeeds 90 percent of the time', false, 'Your agent takes ten steps. What is the end to end success rate?');
  stat(s, M, 2.3, 3.4, '34.9%', 'ten steps at 0.90 each', BAD, false, 52);
  card(s, M + 4.4, 2.25, CW - 4.4, 2.3, false);
  bullets(s, [
    'Errors compound multiplicatively. Ten good steps are not a good pipeline.',
    'To reach 90 percent over ten steps you need 0.990 per step.',
    'Nothing on any leaderboard reaches 0.990 reliably, frontier models included.',
    'So you have to engineer around this regardless of model size.',
  ], M + 4.8, 2.5, CW - 5.2, false, 14);
  body(s, 'That reframes the whole question. It is not "is a small model good enough". It is "your architecture must tolerate imperfect steps", and once you accept that, small models become far more interesting.', M, 4.85, CW - 0.4, false, 15);
  notes(s, 'Let the number sit for a beat before you explain it. It does the persuasion for you.');
}
{
  const s = slide(false);
  title(s, 'The compounding table', false, 'Find your row before you choose a model');
  const rows = [
    [hdr('Per step reliability'), hdr('5 steps'), hdr('10 steps'), hdr('20 steps')],
    ['0.80', '32.8%', '10.7%', '1.2%'],
    ['0.90', '59.0%', '34.9%', '12.2%'],
    ['0.95', '77.4%', '59.9%', '35.8%'],
    ['0.99', '95.1%', '90.4%', '81.8%'],
    ['0.999', '99.5%', '99.0%', '98.0%'],
  ];
  tbl(s, rows, M, 2.15, CW * 0.78, { colW: [3.2, 2.4, 2.4, CW * 0.78 - 8.0], rowH: 0.42, fontSize: 13 });
  body(s, 'Two ways to move right and down this table: raise per step reliability, which is hard and expensive, or cut the number of steps, which is architecture and is usually free.', M, 4.75, CW - 0.4, false, 15);
  notes(s, 'Ask the room which lever they have been reaching for. It is almost always the model.');
}
{
  const s = slide(false);
  title(s, 'Four fixes, in the order you should apply them', false, 'All four are cheaper than a bigger model');
  const y = 2.2, h = 1.25, bw = (CW - 3 * 0.3) / 4;
  const fixes = [['1  DECOMPOSE', 'cut N, checkpoint between segments'],
                 ['2  CONSTRAIN', 'grammar or schema at decode time'],
                 ['3  VERIFY', 'validate every step mechanically'],
                 ['4  ROUTE', 'escalate only what fails']];
  fixes.forEach((f, i) => fbox(s, M + i * (bw + 0.3), y, bw, h, f[0], f[1], TINT, false));
  bullets(s, [
    'Decompose: four verified five step segments need 0.979 per step. One unverified twenty step run needs 0.995.',
    'Constrain: forcing valid JSON at decode time removes an entire class of failure without any training.',
    'Verify: a cheap deterministic validator after each step converts silent corruption into a retry.',
    'Route: send the easy majority to the small model, escalate the failures. Most traffic is easy.',
  ], M, 3.75, CW - 0.4, false, 14.5);
  notes(s, 'Constrained decoding is the single highest leverage item on this slide and the most often skipped.');
}
{
  const s = slide(false);
  title(s, 'The router pattern, drawn', false, 'Small model first, escalate on a validator verdict');
  fbox(s, M, 2.4, 2.4, 1.0, 'REQUEST', null, TINT, false);
  arrow(s, M + 2.6, 2.8, 0.55);
  fbox(s, M + 3.35, 2.4, 2.6, 1.0, 'SMALL MODEL', 'handles the majority', 'E7F2EE', false);
  arrow(s, M + 6.15, 2.8, 0.55);
  fbox(s, M + 6.9, 2.4, 2.4, 1.0, 'VALIDATOR', 'schema and rules', TINT, false);
  arrow(s, M + 9.5, 2.8, 0.55);
  fbox(s, M + 10.25, 2.4, 1.9, 1.0, 'ACCEPT', null, 'E7F2EE', false);
  fbox(s, M + 6.9, 3.9, 2.4, 0.95, 'ESCALATE', 'on failure only', 'FBF0E2', false);
  fbox(s, M + 10.25, 3.9, 1.9, 0.95, 'BIG MODEL', null, TINT, false);
  arrow(s, M + 9.5, 4.3, 0.55);
  body(s, 'You pay frontier prices only for the fraction that fails. If the small model clears 80 percent of traffic, you have cut the bill by roughly 80 percent while keeping a quality floor guaranteed by the validator.', M, 5.15, CW - 0.4, false, 15);
  notes(s, 'Emphasise that the validator, not the model, is what guarantees the floor.');
}

/* ===================== PART 7: ADAPTING ===================== */
section('07', 'Adapting a model', 'A complete fine-tuning run, and the traps that come with it.');
{
  const s = slide(false);
  title(s, 'First, classify the failure honestly', false, 'Only two of these three are fine-tuning problems');
  const rows = [
    [hdr('Failure'), hdr('Looks like'), hdr('Does fine-tuning fix it?')],
    ['Format', 'Invalid JSON, wrong fields, chatty preamble', 'Yes. Fast, on few examples'],
    ['Domain', 'Well formed but wrong vocabulary or conventions', 'Partly. A few hundred examples'],
    ['Reasoning', 'Cannot work the answer out at all', 'No. Decompose or size up'],
  ];
  tbl(s, rows, M, 2.1, CW, { colW: [2.2, 5.4, CW - 7.6], rowH: 0.52, fontSize: 12.5 });
  card(s, M, 4.15, CW, 1.35, false, 'E7F2EE');
  s.addText('The cheapest diagnostic: can a peer model of the same size do the task?',
    { x: M + 0.4, y: 4.32, w: CW - 0.8, h: 0.4, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 15, bold: true, color: '17513F' });
  s.addText('If yes, the capability exists at that size and your problem is conformance, which trains well. If no model at that size can do it, you have a reasoning problem and training is the wrong lever.',
    { x: M + 0.4, y: 4.72, w: CW - 0.8, h: 0.7, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '17513F', lineSpacing: 19 });
  notes(s, 'This one slide prevents most wasted fine-tuning projects. Spend time here.');
}
{
  const s = slide(false);
  title(s, 'Your training data already exists', false, 'It is the output your current system has been producing');
  bullets(s, [
    'Find where your system stores what the model produced. That is your gold.',
    'Ask whether it is the raw model output or a processed record. It is almost always processed.',
    'Field names get renamed, envelopes get added, values get validated and coerced on the way in.',
    'Train on the stored shape and you teach the model the database format, not the format your parser accepts.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  card(s, M, 4.3, CW, 1.25, false, 'FBF0E2');
  s.addText('The rule: find the exact function where raw model text is parsed. Whatever goes into that function is your training target. Write the transform back from stored shape to emitted shape, and check one example by hand.',
    { x: M + 0.4, y: 4.5, w: CW - 0.8, h: 0.9, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '5A4415', lineSpacing: 19 });
  notes(s, 'This is subtle poisoning: it passes every check written against the database and fails in production.');
}
{
  const s = slide(false);
  title(s, 'The hard part is recovering the prompts', false, 'Systems log what they produced, never what they asked');
  fbox(s, M, 2.25, 3.7, 1.4, 'A  REBUILD BY HAND', 'approximate, drifts from reality', 'F7E7E2', false);
  fbox(s, M + 4.1, 2.25, 3.7, 1.4, 'B  REPLAY LIVE', 'you get the student answer, slowly', 'F7E7E2', false);
  fbox(s, M + 8.2, 2.25, 3.7, 1.4, 'C  TEACHER FORCED', 'real prompt, true gold, minutes', 'E7F2EE', false);
  bullets(s, [
    'Run the real system, but intercept the single function that calls the model.',
    'Instead of calling out, return the recorded answer and log the prompt the system just built.',
    'You get byte exact prompts with genuine gold answers, and no inference cost at all.',
    'Because the injected answer drives the next decision, a branching agent walks its original path.',
  ], M, 3.95, CW - 0.4, false, 14.5);
  notes(s, 'Option C is the technique worth stealing from this deck. It generalises to any agentic system.');
}
{
  const s = slide(false);
  title(s, 'Turning pairs into a dataset', false, 'Five transforms, and skipping one gives you a model that scores well and behaves badly');
  bullets(s, [
    'Validate against the real schema, not just "does it parse". Import the actual validators from your application.',
    'Strip code fences before validating, or you reject everything and conclude your gold is garbage.',
    'Deduplicate. Replays and retries produce near identical pairs that inflate size and leak across the split.',
    'Balance the class mix, but do not over correct and throw away most of your data.',
    'Split by episode and never by row, then scrub anything sensitive before it becomes weights.',
  ], M, 2.05, CW - 0.4, false, 15);
  card(s, M, 4.5, CW, 1.05, false, 'F7E7E2');
  s.addText('Row level splitting is the most commonly botched step in the whole process. Rows from the same episode share context, so random splitting puts near identical content on both sides and your validation set measures memorisation.',
    { x: M + 0.4, y: 4.68, w: CW - 0.8, h: 0.75, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13, color: '7A2E1C', lineSpacing: 18 });
  notes(s, 'If they take one dataset rule away, make it the episode level split.');
}
{
  const s = slide(false);
  title(s, 'The training run is the easy part', false, 'A recipe that works on a laptop');
  const rows = [
    [hdr('Setting'), hdr('Value'), hdr('Why')],
    ['Method', 'QLoRA over a 4 bit base', 'Fits consumer memory'],
    ['Rank', '32', 'Ample for format learning'],
    ['Layers adapted', '16', 'Full depth exhausted memory for no gain'],
    ['Loss', 'Answer tokens only', 'Otherwise capacity memorises the input'],
    ['Steps', '2000, batch of 1', 'About two passes over 1000 examples'],
    ['Peak memory', '24.4 GB', 'On a 36 GB laptop'],
  ];
  tbl(s, rows, M, 2.1, CW, { colW: [3.0, 3.6, CW - 6.6], rowH: 0.37, fontSize: 12.5 });
  body(s, 'Validation loss fell from 1.15 to 0.31. For conformance work loss is only a proxy. The number that matters is the share of held out outputs that actually validate.', M, 4.65, CW - 0.4, false, 15);
  notes(s, 'Reassure them: by this point in a project, training is the least interesting phase.');
}
{
  const s = slide(false);
  title(s, 'The trap that nearly stopped the project', false, 'Loss reported as nan before anything trained');
  bullets(s, [
    'The prompts were evidence heavy, some over 5700 tokens long.',
    'The trainer truncates from the end of the sequence.',
    'The end of the sequence is exactly where the answer lives, so the answer was cut off.',
    'Masking the prompt then masked everything that remained, leaving zero trainable tokens.',
    'Zero trainable tokens is a division by zero. Loss becomes nan and nothing learns.',
  ], M, 2.05, CW - 0.4, false, 15);
  card(s, M, 4.5, CW, 1.1, false, 'E7F2EE');
  s.addText('Fix: trim the middle of the input when building the dataset so the system prompt and the answer always survive. Rule: if you mask prompts, guarantee every example keeps answer tokens, and check the first validation loss is a real number before committing to a long run.',
    { x: M + 0.4, y: 4.68, w: CW - 0.8, h: 0.8, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13, color: '17513F', lineSpacing: 18 });
  notes(s, 'A two second check catches this. Tell them to make it a habit.');
}
{
  const s = slide(false);
  title(s, 'The result, and the column that makes it honest', false, 'Always measure the base model on the identical set');
  const rows = [
    [hdr('Model'), hdr('Task A'), hdr('Task B'), hdr('Overall')],
    ['Smaller model, base', '2%', '30%', '18%'],
    ['Smaller model, fine-tuned', '98%', '95%', '97%'],
    ['Larger model, fine-tuned', '98%', '95%', '97%'],
  ];
  tbl(s, rows, M, 2.15, CW * 0.72, { colW: [4.6, 1.7, 1.7, CW * 0.72 - 8.0], rowH: 0.44, fontSize: 13 });
  bullets(s, [
    'Without the base row you cannot tell what you achieved from what the model could already do.',
    'Both fine-tunes landing on identical numbers says the dataset, not the base model, did the work.',
    'When quality ties, decide on size, speed and fit. The smaller model won every remaining axis.',
  ], M, 4.15, CW - 0.4, false, 14.5);
  notes(s, 'The identical scores are the most reusable finding: good data transfers across bases.');
}
{
  const s = slide(false);
  title(s, 'Then test what you did not train', false, 'One dataset buys exactly one capability');
  stat(s, M, 2.35, 3.6, '36 to 48%', 'fabricated detail rate on summarisation, a task never trained', BAD, false, 34);
  card(s, M + 4.6, 2.3, CW - 4.6, 2.4, false);
  bullets(s, [
    'Specialising on one task measurably degraded a capability the training never touched.',
    'If a second capability matters, it needs its own data and its own gate.',
    'Name your proxy metric honestly. This one over counts, so only the relative movement is trustworthy.',
    'Hold every model to identical harness conditions or you will report artifacts as results.',
  ], M + 5.0, 2.55, CW - 5.4, false, 13.5);
  body(s, 'This finding is worth as much as the headline. A regression check is not optional politeness, it is how you find out what your fine-tune cost you.', M, 5.0, CW - 0.4, false, 15);
  notes(s, 'Close part 7 on this. It is the intellectually honest note the whole section needs.');
}

/* ===================== PART 8: EVALUATING ===================== */
section('08', 'Evaluating', 'Without a golden set you are guessing, expensively.');
{
  const s = slide(false);
  title(s, 'Build the golden set before anything else', false, 'It answers every other question in this deck');
  bullets(s, [
    'Fifty to one hundred cases drawn from real production traffic, not invented examples.',
    'Around twenty percent deliberately nasty: malformed inputs, edge cases, the things that actually break.',
    'Each case needs an input and a known good output, or at minimum a mechanical pass condition.',
    'Version it, keep it in the repository, and run it in continuous integration.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  card(s, M, 4.35, CW, 1.2, false, 'E7F2EE');
  s.addText('Without it you cannot size a model, justify self hosting, decide whether to fine-tune, or notice when a prompt change made things worse. Every decision in this class routes through the golden set.',
    { x: M + 0.4, y: 4.55, w: CW - 0.8, h: 0.85, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 13.5, color: '17513F', lineSpacing: 19 });
  notes(s, 'If they do exactly one thing after this class, it is this.');
}
{
  const s = slide(false);
  title(s, 'Measure the things that decide', false, 'Four metrics carry most decisions');
  const rows = [
    [hdr('Metric'), hdr('How to get it'), hdr('Decides')],
    ['Task success', 'Golden set pass rate, mechanical where possible', 'Is this model sufficient'],
    ['Schema validity', 'Share of outputs that pass the real validator', 'Is it safe in a pipeline'],
    ['Latency', 'Prefill and decode measured separately', 'Is it usable interactively'],
    ['Cost per unit of work', 'Tokens in and out, times price or amortised hardware', 'Does self hosting pay'],
  ];
  tbl(s, rows, M, 2.1, CW, { colW: [3.2, 5.2, CW - 8.4], rowH: 0.46, fontSize: 12.5 });
  bullets(s, [
    'Prefer mechanical checks over model graded ones wherever the task allows it.',
    'When you must use a model as judge, fix the judge and the conditions, and report the proxy openly.',
  ], M, 4.5, CW - 0.4, false, 14.5);
  notes(s, 'Mechanical beats judged whenever you can define a pass condition. Cheaper and far more stable.');
}

/* ===================== PART 9: DECIDING ===================== */
section('09', 'Deciding', 'The sequence, and the page you keep.');
{
  const s = slide(false);
  title(s, 'The decision sequence', false, 'Answer in order. Do not skip ahead.');
  const rows = [
    [hdr('#'), hdr('Question'), hdr('If the answer is')],
    ['1', 'What is the task shape?', 'Extraction or routing, a small model is fine. Agentic, 7B floor'],
    ['2', 'How many steps between checkpoints?', 'Above about ten unverified, decompose before anything else'],
    ['3', 'What is your volume?', 'Low volume, use a hosted model and revisit later'],
    ['4', 'Is there a non cost reason to self host?', 'If not, a cheap hosted small model wins'],
    ['5', 'Do you have a golden set?', 'If not, build it first. Nothing above is answerable without it'],
    ['6', 'Is the residual failure format or reasoning?', 'Format, fine-tune. Reasoning, decompose or size up'],
  ];
  tbl(s, rows, M, 2.05, CW, { colW: [0.6, 4.6, CW - 5.2], rowH: 0.46, fontSize: 12.5 });
  notes(s, 'Question six is the one this deck added. The first five come from the field card.');
}
{
  const s = slide(false);
  title(s, 'When a small model is the wrong choice', false, 'Say this out loud in your own design reviews');
  bullets(s, [
    'The task needs novel reasoning or long horizon planning that you cannot decompose.',
    'Your volume is low, so engineering effort dwarfs any token saving.',
    'You have no golden set and no appetite to build one.',
    'Quality requirements are absolute and there is no acceptable escalation path.',
    'Nobody will own the model, the dataset, the evaluation harness and the retraining, permanently.',
  ], M, 2.05, CW - 0.4, false, 15.5);
  card(s, M, 4.6, CW, 1.0, false, 'F7E7E2');
  s.addText('Recommending against a small model when these hold is what makes your recommendation credible when it goes the other way.',
    { x: M + 0.4, y: 4.8, w: CW - 0.8, h: 0.65, isTextBox: true, margin: 0, fontFace: BF,
      fontSize: 14, color: '7A2E1C', lineSpacing: 19 });
  notes(s, 'Be blunt here. Credibility earned on this slide pays off on every other one.');
}
{
  const s = slide(true);
  title(s, 'The five habits worth keeping', true);
  bullets(s, [
    'Build the golden set first. Everything else is guessing until you have it.',
    'Cut the number of steps before you reach for more parameters.',
    'Constrain and verify at every boundary, so failure becomes a retry instead of corruption.',
    'Measure the base model on the identical set before claiming any improvement.',
    'Check what you broke, not only what you improved.',
  ], M, 2.2, CW - 0.6, true, 17);
  notes(s, 'Close on these. They are portable to any model, any vendor, any year.');
}
{
  const s = slide(true);
  s.addText('Go and measure something', { x: M, y: 2.7, w: CW, h: 1.0, isTextBox: true, margin: 0,
    fontFace: HF, fontSize: 42, bold: true, color: PAPER });
  s.addText('The field card and the fine-tuning deep dive are yours to keep. Model names, prices and leaderboard positions will move. The decision sequence will not.',
    { x: M, y: 3.8, w: CW * 0.8, h: 1.0, isTextBox: true, margin: 0, fontFace: BF, fontSize: 17,
      color: MUTEDD, lineSpacing: 26 });
  notes(s, 'Hand out both documents here and point at the checklist on the back of the deep dive.');
}

p.writeFile({ fileName: path.join(__dirname, '..', '01-deck', 'slm-first-principles.pptx') })
  .then(f => console.log('wrote ' + f + '  (' + n + ' slides)'));
