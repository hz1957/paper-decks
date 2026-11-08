"use strict";

const path = require("path");
const pptxgen = require("pptxgenjs");
const { autoFontSize } = require("./pptxgenjs_helpers/text");
const {
  warnIfSlideHasOverlaps,
  warnIfSlideElementsOutOfBounds,
} = require("./pptxgenjs_helpers/layout");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "OpenAI Codex";
pptx.subject = "Large Language Monkeys paper presentation";
pptx.title = "Large Language Monkeys: Scaling Inference Compute with Repeated Sampling";
pptx.company = "";
pptx.lang = "zh-CN";
pptx.theme = {
  headFontFace: "Microsoft YaHei",
  bodyFontFace: "Microsoft YaHei",
  lang: "zh-CN",
};

const OUT = path.join(__dirname, "large-language-monkeys.pptx");
const FONT = "Microsoft YaHei";
const C = {
  bg: "F7F4ED",
  paper: "FFFFFF",
  ink: "17191C",
  muted: "6B7280",
  faint: "9CA3AF",
  grid: "D8D3C8",
  blue: "176BFF",
  blue2: "79A8FF",
  bluePale: "E8F0FF",
  green: "18A56A",
  greenPale: "E6F6EF",
  orange: "F59E0B",
  orangePale: "FFF4D6",
  red: "E24A4A",
  redPale: "FDECEC",
};

function tx(slide, text, x, y, w, h, opts = {}) {
  const base = {
    x, y, w, h,
    fontFace: FONT,
    fontSize: opts.fontSize || 18,
    color: opts.color || C.ink,
    bold: Boolean(opts.bold),
    margin: opts.margin === undefined ? 0 : opts.margin,
    breakLine: false,
    valign: opts.valign || "top",
    align: opts.align || "left",
    paraSpaceAfterPt: 0,
    lineSpacingMultiple: opts.lineSpacing || 1,
    isTextBox: true,
  };
  slide.addText(text, base);
}

function fitTx(slide, text, x, y, w, h, opts = {}) {
  const sizing = autoFontSize(text, FONT, {
    x, y, w, h,
    fontSize: opts.fontSize || 24,
    minFontSize: opts.minFontSize || 12,
    maxFontSize: opts.maxFontSize || opts.fontSize || 24,
    mode: "shrink",
    bold: Boolean(opts.bold),
    margin: opts.margin === undefined ? 0 : opts.margin,
    leading: opts.leading || 1.08,
  });
  slide.addText(text, {
    ...sizing,
    fontFace: FONT,
    color: opts.color || C.ink,
    bold: Boolean(opts.bold),
    margin: opts.margin === undefined ? 0 : opts.margin,
    valign: opts.valign || "top",
    align: opts.align || "left",
    breakLine: false,
    paraSpaceAfterPt: 0,
    lineSpacingMultiple: opts.lineSpacing || 1,
  });
}

function line(slide, x1, y1, x2, y2, color = C.grid, width = 1, dash = "solid") {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  slide.addShape(pptx.ShapeType.line, {
    x, y, w, h,
    flipH: x2 < x1,
    flipV: y2 < y1,
    line: { color, width, dashType: dash },
  });
}

function circle(slide, x, y, d, fill, border = fill, borderPt = 0) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x, y, w: d, h: d,
    fill: { color: fill },
    line: { color: border, width: borderPt },
  });
}

function rounded(slide, x, y, w, h, fill, border, radius = 0.12) {
  // Text placed on top of these boxes is intentional overlap.
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: radius,
    fill: { color: fill },
    line: { color: border, width: 1.3 },
  });
}

function arrow(slide, x, y, w, h, color = C.ink, width = 1.5) {
  const normalized = {
    x: w < 0 ? x + w : x,
    y: h < 0 ? y + h : y,
    w: Math.abs(w),
    h: Math.abs(h),
    flipH: w < 0,
    flipV: h < 0,
  };
  slide.addShape(pptx.ShapeType.line, {
    ...normalized,
    line: { color, width, beginArrowType: "none", endArrowType: "triangle" },
  });
}

function baseSlide(title, page, kicker) {
  const slide = pptx.addSlide();
  slide.background = { color: C.bg };
  line(slide, 0.75, 0.5, 12.58, 0.5, C.blue, 2.1);
  if (kicker) tx(slide, kicker, 0.75, 0.69, 2.3, 0.25, { fontSize: 10.5, bold: true, color: C.blue });
  tx(slide, title, 0.75, kicker ? 0.98 : 0.78, 11.0, 0.62, { fontSize: 25.5, bold: true });
  tx(slide, "Brown et al. · 2024", 0.75, 7.08, 2.0, 0.16, { fontSize: 8.5, color: C.faint });
  tx(slide, String(page).padStart(2, "0"), 12.0, 7.06, 0.55, 0.18, { fontSize: 9, color: C.faint, align: "right" });
  return slide;
}

function addNotes(slide, text) {
  if (typeof slide.addNotes === "function") slide.addNotes(text);
}

function chartOpts(x, y, w, h, max, legend = false) {
  return {
    x, y, w, h,
    showTitle: false,
    showLegend: legend,
    legendPos: "b",
    legendFontFace: FONT,
    legendFontSize: 10,
    showValue: false,
    showCatName: false,
    showSerName: false,
    showPercent: false,
    showMarker: true,
    markerSize: 5,
    lineSize: 2.2,
    catAxisLabelFontFace: FONT,
    catAxisLabelFontSize: 9.5,
    valAxisLabelFontFace: FONT,
    valAxisLabelFontSize: 9.5,
    catAxisLineColor: C.grid,
    valAxisLineColor: C.grid,
    valGridLine: { color: C.grid, width: 1 },
    showCatName: false,
    valAxisMinVal: 0,
    valAxisMaxVal: max,
    showBorder: false,
  };
}

// 1. Cover
{
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  tx(s, "论文分享 · arXiv:2407.21787", 0.8, 0.64, 4.6, 0.25, { fontSize: 10.5, bold: true, color: C.blue });
  fitTx(s, "Large Language Monkeys", 0.8, 1.35, 7.6, 0.83, { fontSize: 43, minFontSize: 30, bold: true });
  fitTx(s, "Scaling Inference Compute with Repeated Sampling", 0.82, 2.27, 7.4, 0.34, { fontSize: 18, minFontSize: 14, color: C.muted });
  fitTx(s, "重复采样如何把推理算力变成可预测的性能增长", 0.82, 3.02, 6.55, 0.88, { fontSize: 24, minFontSize: 20, bold: true });

  line(s, 8.45, 1.78, 12.1, 1.78, C.grid, 1.4);
  const xs = [8.45, 9.1, 9.75, 10.4, 11.05, 11.7];
  const ys = [1.78, 1.45, 2.12, 1.22, 1.9, 0.98];
  for (let i = 0; i < xs.length; i++) {
    if (i > 0) line(s, xs[i - 1] + 0.12, ys[i - 1] + 0.12, xs[i] + 0.12, ys[i] + 0.12, i === xs.length - 1 ? C.green : C.blue2, 2.1);
    circle(s, xs[i], ys[i], 0.24, i === xs.length - 1 ? C.green : C.paper, i === xs.length - 1 ? C.green : C.blue, 1.7);
  }
  tx(s, "1 次", 8.25, 2.35, 0.8, 0.2, { fontSize: 10, color: C.muted });
  tx(s, "更多独立尝试", 10.7, 2.35, 1.5, 0.2, { fontSize: 10, color: C.muted, align: "right" });
  fitTx(s, "正确答案能被验证，弱模型也能被重复采样放大", 8.25, 3.0, 4.05, 0.82, { fontSize: 17, minFontSize: 15, bold: true });

  line(s, 0.8, 5.9, 12.52, 5.9, C.grid, 1);
  fitTx(s, "Bradley Brown · Jordan Juravsky · Ryan Ehrlich · Ronald Clark · Quoc V. Le · Christopher Ré · Azalia Mirhoseini", 0.8, 6.18, 10.7, 0.4, { fontSize: 12, minFontSize: 9, color: C.muted });
  tx(s, "Stanford · Oxford · Google DeepMind", 0.8, 6.7, 4.5, 0.22, { fontSize: 10.5, color: C.faint });
  tx(s, "01", 12.0, 7.06, 0.55, 0.18, { fontSize: 9, color: C.faint, align: "right" });
  addNotes(s, "来源：Brown et al., Large Language Monkeys: Scaling Inference Compute with Repeated Sampling, arXiv:2407.21787v3, 2024。封面线条为重复采样概念示意。");
}

// 2. Motivation
{
  const s = baseSlide("推理算力的另一条扩展轴", 2, "研究问题");
  tx(s, "训练侧", 0.86, 2.05, 1.3, 0.25, { fontSize: 12, bold: true, color: C.blue });
  fitTx(s, "更大的模型、更多数据、更长训练", 0.86, 2.48, 4.4, 0.48, { fontSize: 21, minFontSize: 18, bold: true });
  fitTx(s, "缩放律让“增加训练算力”成为可预测路径", 0.86, 3.1, 4.45, 0.58, { fontSize: 15, minFontSize: 13, color: C.muted });
  tx(s, "推理侧", 0.86, 4.3, 1.3, 0.25, { fontSize: 12, bold: true, color: C.orange });
  fitTx(s, "大多数系统只让模型尝试一次", 0.86, 4.72, 4.4, 0.48, { fontSize: 21, minFontSize: 18, bold: true });
  fitTx(s, "思维链让单次尝试更长，却没有增加独立解法的数量。", 0.86, 5.35, 4.45, 0.7, { fontSize: 15, minFontSize: 13, color: C.muted });

  tx(s, "把样本数 k 作为推理算力", 6.55, 2.08, 5.1, 0.48, { fontSize: 23, bold: true, align: "center" });
  tx(s, "同一道题生成多个相互独立的候选解", 6.85, 2.62, 4.5, 0.25, { fontSize: 13, color: C.muted, align: "center" });
  line(s, 6.35, 3.55, 12.0, 3.55, C.grid, 2);
  const labels = ["1×", "2×", "4×", "8×", "16×"];
  const px = [6.55, 7.85, 9.15, 10.45, 11.75];
  for (let i = 0; i < px.length; i++) {
    circle(s, px[i], 3.43, 0.24, i === 0 ? C.paper : C.bluePale, C.blue, 1.6);
    tx(s, labels[i], px[i] - 0.16, 3.9, 0.55, 0.22, { fontSize: 10, bold: true, color: C.blue, align: "center" });
  }
  tx(s, "研究问题", 6.55, 4.75, 1.3, 0.22, { fontSize: 10.5, bold: true, color: C.green });
  fitTx(s, "性能会不会随采样次数稳定增长？", 6.55, 5.2, 5.05, 0.65, { fontSize: 24, minFontSize: 20, bold: true });
  addNotes(s, "来源：论文摘要与第 1 节。研究将 inference compute 定义为通过重复采样增加独立候选解的数量。");
}

// 3. Method
{
  const s = baseSlide("重复采样与验证", 3, "方法");
  rounded(s, 0.78, 2.72, 1.95, 1.13, C.paper, C.grid);
  tx(s, "题目", 1.05, 2.94, 1.4, 0.23, { fontSize: 11, bold: true, color: C.blue, align: "center" });
  tx(s, "输入与约束", 1.0, 3.3, 1.5, 0.32, { fontSize: 16, bold: true, align: "center" });
  rounded(s, 3.52, 2.42, 2.2, 1.72, C.bluePale, C.blue);
  tx(s, "LLM", 4.07, 2.72, 1.1, 0.3, { fontSize: 18, bold: true, color: C.blue, align: "center" });
  tx(s, "正温度采样", 3.9, 3.26, 1.45, 0.22, { fontSize: 12.5, align: "center" });
  tx(s, "独立生成 N 次", 3.85, 3.62, 1.55, 0.22, { fontSize: 12.5, color: C.muted, align: "center" });
  arrow(s, 2.73, 3.28, 0.65, 0, C.ink, 1.4);

  const cy = [2.1, 2.86, 3.62, 4.38];
  for (let i = 0; i < cy.length; i++) {
    const ok = i === 2;
    rounded(s, 6.62, cy[i], 2.23, 0.5, ok ? C.greenPale : C.paper, ok ? C.green : C.grid);
    tx(s, ok ? "候选解 3 · 正确" : `候选解 ${i + 1}`, 6.84, cy[i] + 0.15, 1.8, 0.2, { fontSize: 11, bold: ok, color: ok ? C.green : C.muted, align: "center" });
    arrow(s, 5.72, 3.28, 0.72, cy[i] + 0.25 - 3.28, C.blue2, 1.1);
    arrow(s, 8.85, cy[i] + 0.25, 0.76, 3.28 - (cy[i] + 0.25), C.grid, 1.1);
  }
  rounded(s, 9.62, 2.42, 2.45, 1.72, C.greenPale, C.green);
  tx(s, "验证器", 10.2, 2.72, 1.3, 0.3, { fontSize: 18, bold: true, color: C.green, align: "center" });
  tx(s, "单元测试 / 证明检查器", 9.94, 3.22, 1.8, 0.24, { fontSize: 11, align: "center" });
  tx(s, "选择最终答案", 10.08, 3.62, 1.55, 0.24, { fontSize: 12.5, bold: true, align: "center" });

  line(s, 0.8, 5.32, 12.24, 5.32, C.grid, 1);
  tx(s, "Coverage", 0.86, 5.62, 1.15, 0.25, { fontSize: 14, bold: true, color: C.blue });
  tx(s, "N 个样本中，至少一个正确的题目比例", 2.08, 5.62, 4.2, 0.25, { fontSize: 13.5 });
  tx(s, "Precision", 7.08, 5.62, 1.15, 0.25, { fontSize: 14, bold: true, color: C.green });
  tx(s, "能否从候选集合里找出正确解", 8.3, 5.62, 3.55, 0.25, { fontSize: 13.5 });
  fitTx(s, "本文只研究可判定对错的 pass/fail 任务：自动验证器可把 coverage 直接转化为成绩；否则 coverage 只是上限。", 0.86, 6.17, 11.0, 0.58, { fontSize: 14, minFontSize: 12.5, color: C.muted });
  addNotes(s, "来源：论文 Figure 1、第 1 节与第 2 节。论文聚焦 pass/fail 任务。流程按论文重绘为可编辑形状和连接线；绿色候选仅用于解释 coverage/precision。");
}

// 4. Coverage gains
{
  const s = baseSlide("采样次数提高覆盖率", 4, "主要发现 1");
  fitTx(s, "除 Pythia 在 CodeContests 上始终为 0 外，论文测试的模型覆盖率普遍随采样预算上升。下图只使用正文明确报告的端点。", 0.76, 1.68, 11.6, 0.4, { fontSize: 14, minFontSize: 12.5, color: C.muted });
  const defs = [
    { x: 0.72, title: "SWE-bench Lite", sub: "DeepSeek-Coder-V2 · k=1→250", labels: ["1", "250"], vals: [15.9, 56], color: C.blue, max: 60, end: "15.9% → 56%" },
    { x: 4.7, title: "CodeContests", sub: "Gemma-2B · k=1→10k", labels: ["1", "10k"], vals: [0.02, 7.1], color: C.green, max: 8, end: "0.02% → 7.1%" },
    { x: 8.68, title: "MATH", sub: "Pythia-160M · k=1→10k", labels: ["1", "10k"], vals: [0.27, 57], color: C.orange, max: 60, end: "0.27% → 57%" },
  ];
  for (const d of defs) {
    tx(s, d.title, d.x, 2.2, 3.45, 0.3, { fontSize: 16.5, bold: true });
    tx(s, d.sub, d.x, 2.55, 3.45, 0.22, { fontSize: 11, color: C.muted });
    s.addChart(pptx.ChartType.line, [{ name: "Coverage", labels: d.labels, values: d.vals }], {
      ...chartOpts(d.x, 2.88, 3.45, 2.38, d.max, false),
      chartColors: [d.color],
      lineDataSymbol: "circle",
      lineDataSymbolSize: 7,
    });
    tx(s, d.end, d.x, 5.52, 3.45, 0.32, { fontSize: 17.5, bold: true, color: d.color, align: "center" });
  }
  tx(s, "端点来自论文正文；连线仅表示方向，不补造中间实验值", 0.75, 6.4, 5.8, 0.22, { fontSize: 10, color: C.faint });
  tx(s, "边界：Pythia 在 CodeContests 上即使 k=10k，coverage 仍为 0", 6.7, 6.34, 5.7, 0.35, { fontSize: 12, bold: true, color: C.red, align: "right" });
  addNotes(s, "来源：论文摘要、第 1 节、第 2.1/2.2 节。SWE-bench Lite 15.9%→56%（250 样本）；CodeContests/Gemma-2B 0.02%→7.1%（10,000 样本）；MATH/Pythia-160M 0.27%→57%。为避免把估读值伪装成精确数据，图中只使用正文明确报告的端点。");
}

// 5. Cost and budget
{
  const s = baseSlide("计算预算与成本", 5, "主要发现 2");
  tx(s, "SWE-bench Lite · Moatless Tools", 0.78, 1.65, 5.5, 0.25, { fontSize: 13, bold: true, color: C.blue });
  const rows = [
    ["模型", "单次成本", "采样数", "解决率", "总成本"],
    ["DeepSeek-Coder-V2", "$0.0072", "5", "29.6%", "$10.8"],
    ["GPT-4o", "$0.13", "1", "24.0%", "$39"],
    ["Claude 3.5 Sonnet", "$0.17", "1", "26.7%", "$51"],
  ].map((row, ri) => row.map((text) => ({
    text,
    options: {
      fontFace: FONT,
      fontSize: ri === 0 ? 10 : 10.5,
      bold: ri <= 1,
      color: ri === 0 ? C.paper : C.ink,
      fill: ri === 0 ? C.ink : ri === 1 ? C.bluePale : C.paper,
      margin: 0.06,
      valign: "mid",
    },
  })));
  // The layout helper reports native tables in EMUs as if they were inches;
  // PowerPoint's rendered table is inside the slide bounds.
  s.addTable(rows, {
    x: 0.78, y: 2.12, w: 6.55, h: 2.78,
    colW: [2.2, 1.05, 0.8, 1.1, 1.0],
    rowH: [0.52, 0.68, 0.68, 0.68],
    border: { type: "solid", color: C.grid, pt: 0.7 },
    fontFace: FONT,
    margin: 0.06,
    valign: "mid",
  });
  fitTx(s, "五次 DeepSeek 的解决率更高，总成本仍不到 GPT‑4o 的三分之一。", 0.8, 5.28, 6.5, 0.9, { fontSize: 17, minFontSize: 15, bold: true });

  fitTx(s, "固定 FLOPs 下：最优模型随任务而变", 8.0, 1.8, 4.25, 0.72, { fontSize: 20, minFontSize: 18, bold: true });
  line(s, 8.0, 2.68, 12.18, 2.68, C.grid, 1);
  tx(s, "MiniF2F / MATH / GSM8K", 8.0, 2.94, 3.1, 0.25, { fontSize: 12, bold: true, color: C.green });
  tx(s, "8B 模型 · 更多样本", 8.0, 3.35, 3.8, 0.35, { fontSize: 18, bold: true });
  line(s, 8.22, 4.04, 11.6, 4.04, C.green, 2.5);
  circle(s, 8.1, 3.92, 0.24, C.green, C.green, 1);
  for (let x = 8.85; x <= 11.55; x += 0.62) circle(s, x, 3.98, 0.12, C.greenPale, C.green, 1.1);
  tx(s, "更高采样吞吐", 10.15, 4.28, 1.55, 0.22, { fontSize: 11, color: C.muted, align: "right" });
  line(s, 8.0, 4.88, 12.18, 4.88, C.grid, 1);
  tx(s, "CodeContests", 8.0, 5.14, 1.8, 0.25, { fontSize: 12, bold: true, color: C.orange });
  tx(s, "70B 模型 · 更少样本", 8.0, 5.55, 3.8, 0.35, { fontSize: 18, bold: true });
  circle(s, 8.12, 6.15, 0.3, C.orange, C.orange, 1);
  line(s, 8.47, 6.3, 11.62, 6.3, C.orange, 2.5);
  tx(s, "更强单次能力", 10.15, 6.53, 1.55, 0.22, { fontSize: 11, color: C.muted, align: "right" });
  addNotes(s, "来源：论文 Table 1 与第 2.3 节。成本为论文使用 Moatless Tools 在 SWE-bench Lite 上的比较；总成本对应完整任务集。右侧为论文结论的可编辑示意，不表示额外数值。");
}

// 6. Scaling law
{
  const s = baseSlide("推理时缩放律", 6, "主要发现 3");
  tx(s, "log(c) ≈ a · kᵇ", 0.78, 1.7, 4.3, 0.48, { fontSize: 27, bold: true, color: C.blue });
  tx(s, "等价于  c ≈ exp(a · kᵇ)，拟合中 a、b 通常为负", 0.8, 2.27, 4.45, 0.28, { fontSize: 12, color: C.muted });
  fitTx(s, "论文发现：coverage 与样本数的关系经常可由指数化幂律近似。", 0.8, 2.78, 4.35, 0.82, { fontSize: 16, minFontSize: 14.5 });
  fitTx(s, "它提供预算外推视角：增加多少采样，预计能换来多少覆盖率。", 0.8, 3.88, 4.35, 0.78, { fontSize: 15, minFontSize: 13.5, color: C.muted });
  fitTx(s, "MiniF2F 偏差明显：这是经验拟合，不是普适定律", 0.8, 5.16, 4.4, 0.56, { fontSize: 12.8, minFontSize: 12, bold: true, color: C.red });
  s.addChart(pptx.ChartType.line, [
    { name: "较小模型", labels: ["1", "10", "100", "1k", "10k"], values: [8, 18, 36, 58, 75] },
    { name: "较大模型", labels: ["1", "10", "100", "1k", "10k"], values: [30, 53, 72, 86, 94] },
  ], {
    ...chartOpts(5.82, 1.9, 6.35, 4.25, 100, true),
    chartColors: [C.blue2, C.blue],
    lineDataSymbol: "circle",
    lineDataSymbolSize: 5,
  });
  line(s, 7.8, 4.45, 9.45, 4.45, C.green, 1.3, "dash");
  tx(s, "同一 coverage", 7.48, 4.08, 1.75, 0.24, { fontSize: 11, color: C.green });
  tx(s, "家族内曲线经水平平移后形状相似", 6.45, 6.24, 5.0, 0.35, { fontSize: 17.5, bold: true, color: C.blue, align: "center" });
  tx(s, "右图为归一化示意，不是论文实验原始数据", 6.52, 6.66, 4.9, 0.25, { fontSize: 11.5, color: C.muted, align: "center" });
  addNotes(s, "来源：论文第 3 节、Figure 5 与 Figure 6。右侧曲线为论文‘家族内曲线形状相似、较大模型向左平移’结论的归一化示意，不对应具体任务的精确数据。");
}

// 7. Verifier gap
{
  const s = baseSlide("覆盖率增长，选择器却饱和", 7, "主要发现 4");
  s.addChart(pptx.ChartType.line, [
    { name: "Coverage（oracle verifier）", labels: ["100", "10,000"], values: [82.9, 98.44] },
    { name: "最佳常用选择器", labels: ["100", "10,000"], values: [40.50, 41.41] },
  ], {
    ...chartOpts(0.75, 1.78, 7.95, 4.75, 100, true),
    chartColors: [C.blue, C.red],
    lineDataSymbol: "circle",
    lineDataSymbolSize: 7,
  });
  tx(s, "98.44%", 9.35, 2.0, 2.3, 0.55, { fontSize: 32, bold: true, color: C.blue });
  tx(s, "10,000 个样本的 coverage", 9.38, 2.58, 2.7, 0.25, { fontSize: 11, color: C.muted });
  line(s, 9.35, 3.2, 12.1, 3.2, C.grid, 1);
  tx(s, "41.41%", 9.35, 3.55, 2.3, 0.55, { fontSize: 32, bold: true, color: C.red });
  tx(s, "最佳常用选择方法的成绩", 9.38, 4.13, 2.65, 0.25, { fontSize: 11, color: C.muted });
  fitTx(s, "正确答案越来越像“草堆里的针”", 9.35, 4.82, 2.8, 0.72, { fontSize: 18, minFontSize: 15.5, bold: true });
  fitTx(s, "多数投票、奖励模型和加权投票都在约 100 个样本前后饱和。", 9.35, 5.68, 2.8, 0.88, { fontSize: 14, minFontSize: 12.5, color: C.red });
  addNotes(s, "来源：论文第 1 节、第 4.1 节与 Figure 7。正文明确报告：Llama-3-8B-Instruct 在 MATH 上，coverage 从 k=100 时的 82.9% 增至 k=10,000 时的 98.44%；常用选择方法中最大的成绩变化仅为 40.50%→41.41%。为避免把 Figure 7 估读值当作精确数据，图中只绘制正文明确报告的两个预算点。");
}

// 8. Boundaries and impact
{
  const s = baseSlide("结果边界与研究影响", 8, "实验细节");
  const xs = [0.78, 4.72, 8.66];
  const nums = ["01", "02", "03"];
  const heads = ["Flaky 测试", "测试集假阴性", "独立采样重复劳动"];
  const bodies = [
    "SWE-bench Lite 有 11.3% 的题测试不稳定。对被识别为 flaky 的题，候选解测试 11 次并多数表决。",
    "CodeContests 的 122 道 Python 题中，35 道存在“官方正确解也通不过测试”的假阴性。",
    "所有尝试使用相同提示与超参数且彼此隔离；多样性主要来自正温度采样。",
  ];
  for (let i = 0; i < 3; i++) {
    tx(s, nums[i], xs[i], 1.88, 0.6, 0.25, { fontSize: 11, bold: true, color: C.blue });
    tx(s, heads[i], xs[i], 2.38, 3.2, 0.34, { fontSize: 18, bold: true });
    fitTx(s, bodies[i], xs[i], 2.98, 3.15, 1.38, { fontSize: 14.5, minFontSize: 12.5, color: C.muted });
    if (i < 2) line(s, xs[i] + 3.52, 1.82, xs[i] + 3.52, 4.65, C.grid, 1);
  }
  line(s, 0.78, 5.03, 12.55, 5.03, C.grid, 1.5);
  tx(s, "验证器仍有可学信号", 0.78, 5.38, 2.0, 0.25, { fontSize: 12, bold: true, color: C.green });
  fitTx(s, "人工检查 105 条正确 CoT：超过 90% 的推理链忠实有效", 0.78, 5.76, 6.25, 0.72, { fontSize: 18, minFontSize: 15.5, bold: true });
  fitTx(s, "重复采样扩展生成；能否转化为成绩取决于可扩展验证", 7.18, 5.76, 5.34, 0.72, { fontSize: 15.5, minFontSize: 13.5, bold: true, color: C.red, align: "right" });
  addNotes(s, "来源：论文第 4.1/4.2 节、第 5 节与附录。SWE-bench Lite 的 11.3% flaky 测试只对被识别为 flaky 的题运行 11 次并多数表决；CodeContests 的 35/122 假阴性来自论文报告；105 条正确 CoT 中超过 90% 被人工判断为忠实有效。独立采样使用相同 prompt 与超参数，多样性主要来自正温度采样。");
}

// 9. Conclusion
{
  const s = baseSlide("重复采样的结论", 9, "Q&A");
  const blocks = [
    { y: 1.82, n: "01", c: C.blue, h: "采样预算是一条独立的推理扩展轴", b: "若正确解具有非零概率，更多独立尝试会提高 coverage；是否实用取决于概率与预算。" },
    { y: 3.72, n: "02", c: C.green, h: "弱模型多采样有时更省成本", b: "最优组合依赖任务、模型、总推理 FLOPs、系统吞吐和验证成本。" },
    { y: 5.3, n: "03", c: C.red, h: "验证器决定扩展能否落地", b: "生成出正确答案，不等于能从候选集合中认出它。" },
  ];
  for (const b of blocks) {
    tx(s, b.n, 0.8, b.y, 0.6, 0.25, { fontSize: 11, bold: true, color: b.c });
    fitTx(s, b.h, 0.8, b.y + 0.42, 6.5, 0.48, { fontSize: 21, minFontSize: 18, bold: true });
    fitTx(s, b.b, 0.8, b.y + 0.96, 6.5, 0.62, { fontSize: 14, minFontSize: 12.5, color: C.muted });
  }
  line(s, 7.95, 1.8, 7.95, 6.58, C.grid, 1);
  tx(s, "论文", 8.55, 2.06, 1.0, 0.22, { fontSize: 10, bold: true, color: C.blue });
  s.addText([{ text: "arxiv.org/abs/2407.21787", options: { hyperlink: { url: "https://arxiv.org/abs/2407.21787" }, color: C.ink, underline: { color: C.grid } } }], { x: 8.55, y: 2.42, w: 3.7, h: 0.32, fontFace: FONT, fontSize: 14, margin: 0 });
  tx(s, "代码", 8.55, 3.22, 1.0, 0.22, { fontSize: 10, bold: true, color: C.green });
  s.addText([{ text: "github.com/ScalingIntelligence/\nlarge_language_monkeys", options: { hyperlink: { url: "https://github.com/ScalingIntelligence/large_language_monkeys" }, color: C.ink } }], { x: 8.55, y: 3.58, w: 3.7, h: 0.62, fontFace: FONT, fontSize: 13, margin: 0, breakLine: false });
  tx(s, "数据", 8.55, 4.92, 1.0, 0.22, { fontSize: 10, bold: true, color: C.orange });
  s.addText([{ text: "huggingface.co/datasets/\nScalingIntelligence/monkey_business", options: { hyperlink: { url: "https://huggingface.co/datasets/ScalingIntelligence/monkey_business" }, color: C.ink } }], { x: 8.55, y: 5.28, w: 3.8, h: 0.7, fontFace: FONT, fontSize: 12, margin: 0 });
  addNotes(s, "来源：论文总结、代码仓库与数据集链接。");
}

// 10-17. Appendix: recreated paper figures (vector-redrawn PNGs, see build-figures.js)
{
  const FIGS = [
    { ar: 2000 / 660, t: "重复采样流程", cap: "Figure 1 · 重复采样流程：LLM 并行生成多个候选解，验证器挑选最终答案，由此提出 coverage 与 precision 两个问题" },
    { ar: 2000 / 1260, t: "Coverage 随样本数缩放", cap: "Figure 2 · Coverage (pass@k) 随样本数 k 平滑缩放：8B-Instruct 在 MATH 上 k=250 时达 56%，超过单次采样的 70B-Instruct（43%）" },
    { ar: 2000 / 1180, t: "13 个模型的 coverage 曲线", cap: "Figure 3 · 13 个模型在 MATH 与 CodeContests 上的 coverage 曲线：不同模型规模下 coverage 都随 k 持续改善" },
    { ar: 2000 / 1560, t: "Coverage 与推理 FLOPs", cap: "Figure 4 · 以总推理 FLOPs 衡量，小模型 + 更多采样可能更省：DeepSeek-Coder-V2-Lite-Instruct 采 5 次约 1x 成本，单次 GPT-4o 与 Claude 3.5 Sonnet 分别为 3.6x 与 4.7x" },
    { ar: 2000 / 1420, t: "Coverage 的幂律拟合", cap: "Figure 5 · 各模型与任务的 coverage 曲线均可用幂律 c = exp(a·k^b) 拟合，且拟合误差很小" },
    { ar: 2000 / 940, t: "归一化后的曲线坍缩", cap: "Figure 6 · 横轴按 k / pass@k⁻¹（即除以 pass@1）归一化后，同族模型的 coverage 曲线近似坍缩到一条曲线" },
    { ar: 2000 / 980, t: "选择策略对比", cap: "Figure 7 · 选择策略对比：多数投票持续优于 RM+Best-of-N，在多数投票上加 RM 增益有限；上限为 coverage (pass@k)" },
    { ar: 2000 / 900, t: "逐题可解性分布", cap: "Figure 8 · 逐题正确样本比例（排序）：绿色 = 多数投票可解的题，红色 = 不可解；平均 coverage 高时仍有题目完全解不出" },
  ];
  const BX = 0.62, BW = 12.09, BY = 1.68, BH = 4.32;
  FIGS.forEach((fig, i) => {
    const s = baseSlide(`Figure ${i + 1} · ${fig.t}（复刻）`, 10 + i, "附录 · 论文图表复刻");
    const w = Math.min(BW, BH * fig.ar);
    const h = w / fig.ar;
    s.addImage({
      path: path.join(__dirname, "figures_recreated", `fig${i + 1}.png`),
      x: BX + (BW - w) / 2,
      y: BY + (BH - h) / 2,
      w,
      h,
    });
    fitTx(s, fig.cap, 0.75, 6.12, 11.83, 0.8, { fontSize: 11, minFontSize: 9, color: C.muted });
    addNotes(s, `复刻图：以 skia-canvas 按论文 Figure ${i + 1} 的形状与配色矢量重绘后导出 PNG 嵌入；曲线数据取自论文公布的拟合参数或自原图读取。源图见 figures/fig${i + 1}.png，绘制脚本见 build-figures.js。`);
  });
}

// These analyzers intentionally see overlaps where text sits on top of diagram boxes,
// where chart objects contain internal labels, and where cover circles sit on line art.
for (const slide of pptx._slides) {
  warnIfSlideHasOverlaps(slide, pptx);
  warnIfSlideElementsOutOfBounds(slide, pptx);
}

async function main() {
  await pptx.writeFile({ fileName: OUT });
  console.log(`Wrote ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

