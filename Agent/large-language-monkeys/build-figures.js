"use strict";

// Recreates the paper's Figures 1-8 as vector-drawn PNGs (figures_recreated/).
// Curve shapes use the paper's own functional form c(k)=exp(a*k^b) (Figure 5);
// where the paper reports fit parameters they are used verbatim, otherwise
// (a,b) are fitted through endpoints read off the published figures.

const fs = require("fs");
const path = require("path");
const {
  newCanvas, Panel, legend, richText, centerRich, roundRectPath, arrow,
  setFont, pow10, pl, fit2, sat, INK,
} = require("./figures_lib");

const OUT = path.join(__dirname, "figures_recreated");
fs.mkdirSync(OUT, { recursive: true });

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmtPow = (v) => {
  const e = Math.round(Math.log10(v));
  return e === 0 ? "1" : pow10(e);
};

// Palette read off the published figures (matplotlib-style categorical colors)
const COL = {
  blue: "#4C82C4",
  deepBlue: "#3A76C0",
  teal: "#17A578",
  orange: "#F0A05A",
  lightGreen: "#98D86B",
  red: "#E05C5C",
  purple: "#9B7EC8",
  brown: "#8C4A4A",
  rosy: "#C08080",
  pink: "#F0A0C0",
  gray: "#C4C4C4",
  olive: "#B5B030",
  cyan: "#20C0D0",
  lightCyan: "#A0DCE4",
  gpt4o: "#EF4444",
  sota: "#8A6888",
  fitOrange: "#F08C32",
  mvTeal: "#00A080",
  rmBon: "#F0A030",
  rmMv: "#E06070",
  barGreen: "#2CA02C",
  barRed: "#D02A52",
};

const MODELS13 = [
  { key: "llama8b", label: "Llama-3-8B", color: COL.orange },
  { key: "llama8bi", label: "Llama-3-8B-Instruct", color: COL.blue },
  { key: "llama70bi", label: "Llama-3-70B-Instruct", color: COL.teal },
  { key: "gemma2b", label: "Gemma-2B", color: COL.lightGreen },
  { key: "gemma7b", label: "Gemma-7B", color: COL.red },
  { key: "p70m", label: "Pythia-70M", color: COL.purple },
  { key: "p160m", label: "Pythia-160M", color: COL.brown },
  { key: "p410m", label: "Pythia-410M", color: COL.rosy },
  { key: "p1b", label: "Pythia-1B", color: COL.pink },
  { key: "p14b", label: "Pythia-1.4B", color: COL.gray },
  { key: "p28b", label: "Pythia-2.8B", color: COL.olive },
  { key: "p69b", label: "Pythia-6.9B", color: COL.cyan },
  { key: "p12b", label: "Pythia-12B", color: COL.lightCyan },
];

// ---------------------------------------------------------------- Figure 1
async function fig1() {
  const { canvas, ctx } = newCanvas(2000, 660);

  centerRich(ctx, 700, 100, [
    { t: "Step 1: ", bold: true }, { t: "Generate many candidate solutions." },
  ], 25);
  centerRich(ctx, 1345, 100, [
    { t: "Step 2: ", bold: true }, { t: "Use a verifier to pick a final answer." },
  ], 25);

  // Problem box
  roundRectPath(ctx, 55, 265, 235, 115, 10);
  ctx.fillStyle = "#F8D3AE"; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke();
  centerRich(ctx, 172, 305, [{ t: "Problem: ", bold: true }, { t: "Input" }], 20);
  setFont(ctx, 20); ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("a number from", 172, 318);
  ctx.fillText("stdin and ...", 172, 344);
  arrow(ctx, 292, 322, 360, 322, INK, 4.5);

  // LLM box + monkey
  roundRectPath(ctx, 365, 150, 330, 310, 18);
  ctx.fillStyle = "#C9D7EA"; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke();
  setFont(ctx, 27, true); ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("LLM", 530, 168);
  // monkey face
  ctx.fillStyle = "#8B5A2B";
  ctx.beginPath(); ctx.arc(487, 268, 17, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(573, 268, 17, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(530, 285, 46, 0, 7); ctx.fill();
  ctx.fillStyle = "#D9B38C";
  ctx.beginPath(); ctx.arc(513, 272, 15, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(547, 272, 15, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(530, 305, 26, 20, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#221100";
  ctx.beginPath(); ctx.arc(515, 272, 4, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(545, 272, 4, 0, 7); ctx.fill();
  ctx.strokeStyle = "#221100"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(530, 300, 13, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
  // keyboard
  roundRectPath(ctx, 452, 358, 156, 30, 6);
  ctx.fillStyle = "#EDEDED"; ctx.fill();
  ctx.strokeStyle = "#888888"; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = "#AAAAAA"; ctx.lineWidth = 1.5;
  for (let kx = 466; kx < 600; kx += 17) {
    ctx.beginPath(); ctx.moveTo(kx, 364); ctx.lineTo(kx, 382); ctx.stroke();
  }

  // Candidate solutions
  const cands = [
    { y: 170, fill: "#F8DCDC", stroke: "#D43A3A", text: "data = {} ..." },
    { y: 292, fill: "#DDEBD2", stroke: "#3F8F3F", text: "x = int(input()) ..." },
    { y: 414, fill: "#F8DCDC", stroke: "#D43A3A", text: "import requests ..." },
  ];
  for (const cd of cands) {
    arrow(ctx, 700, cd.y + 32, 782, cd.y + 32, INK, 4.5);
    roundRectPath(ctx, 790, cd.y, 290, 64, 8);
    ctx.fillStyle = cd.fill; ctx.fill();
    ctx.strokeStyle = cd.stroke; ctx.lineWidth = 3; ctx.setLineDash([11, 8]); ctx.stroke();
    ctx.setLineDash([]);
    setFont(ctx, 20); ctx.fillStyle = "#333333"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(cd.text, 935, cd.y + 33);
    arrow(ctx, 1085, cd.y + 32, 1172, cd.y + 32, INK, 4.5);
  }

  // Verifier box + magnifier
  roundRectPath(ctx, 1180, 150, 330, 310, 18);
  ctx.fillStyle = "#C9D7EA"; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke();
  setFont(ctx, 27, true); ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("Verifier", 1345, 168);
  setFont(ctx, 19); ctx.fillStyle = INK;
  ctx.fillText("(e.g. unit tests, proof", 1345, 208);
  ctx.fillText("checkers, majority voting)", 1345, 234);
  ctx.fillStyle = "#DDE5EE";
  ctx.beginPath(); ctx.arc(1330, 340, 44, 0, 7); ctx.fill();
  ctx.strokeStyle = "#666666"; ctx.lineWidth = 9; ctx.stroke();
  ctx.strokeStyle = "#333333"; ctx.lineWidth = 15; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(1362, 372); ctx.lineTo(1398, 408); ctx.stroke();
  ctx.lineCap = "butt";

  arrow(ctx, 1515, 305, 1585, 305, INK, 4.5);
  roundRectPath(ctx, 1590, 270, 340, 70, 8);
  ctx.fillStyle = "#CFE3B8"; ctx.fill();
  ctx.strokeStyle = "#222222"; ctx.lineWidth = 2.6; ctx.stroke();
  setFont(ctx, 20); ctx.fillStyle = "#333333"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("x = int(input()) ...", 1760, 306);

  // Bottom problem statements
  centerRich(ctx, 700, 560, [{ t: "Problem 1 (coverage): ", bold: true }, { t: "Can we generate a correct" }], 23);
  setFont(ctx, 23); ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("solution?", 700, 574);
  centerRich(ctx, 1400, 560, [{ t: "Problem 2 (precision): ", bold: true }, { t: "Can we identify a correct" }], 23);
  setFont(ctx, 23); ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("solution from the generated samples?", 1400, 574);

  await canvas.toFile(path.join(OUT, "fig1.png"));
}

// ---------------------------------------------------------------- Figure 2
async function fig2() {
  const { canvas, ctx } = newCanvas(2000, 1260);

  // Left: SWE-bench Lite
  setFont(ctx, 27, true); ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("SWE-bench Lite", 550, 165);
  const L = new Panel(ctx, {
    x: 170, y: 250, w: 760, h: 830, xlog: true, xmin: 1, xmax: 400,
    xticks: [1, 10, 100], xtickfmt: fmtPow, yticks: [0, 0.5, 1],
  });
  L.ylabel("Coverage (pass@k)", 23);
  L.xlabel("Number of Samples (k)", 23, 52);
  legend(ctx, 215, 320, [
    { label: "DeepSeek-Coder-V2-Instruct + Moatless Tools", color: COL.deepBlue },
    { label: "Single-Attempt SOTA (CodeStory Aide + Mixed Models)", color: COL.sota, dash: [10, 8] },
    { label: "Single-Attempt GPT-4o + Moatless Tools", color: COL.gpt4o, dash: [10, 8] },
  ], { size: 19, maxW: 700, rowH: 38 });
  const fSwe = fit2(0.159, 0.56, 250);
  L.line(pl(fSwe.a, fSwe.b, 1, 250), COL.deepBlue, 3.6);
  L.hline(0.43, COL.sota);
  L.hline(0.2467, COL.gpt4o);
  setFont(ctx, 23, true); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COL.deepBlue; ctx.fillText("56%", L.X(250) + 12, L.Y(0.56) - 12);
  ctx.fillStyle = COL.sota; ctx.textAlign = "right"; ctx.fillText("43%", L.x + L.w - 6, L.Y(0.43) - 10);
  ctx.fillStyle = COL.gpt4o; ctx.fillText("24.67%", L.x + L.w - 6, L.Y(0.2467) - 10);

  // Right: 2x2 tasks
  legend(ctx, 1120, 105, [
    { label: "Llama-3-8B-Instruct", color: COL.blue },
    { label: "Llama-3-70B-instruct", color: COL.teal },
    { label: "Single-Attempt GPT-4o", color: COL.gpt4o, dash: [10, 8] },
  ], { size: 20, maxW: 860, rowH: 40 });
  const defs = [
    { x: 1120, y: 250, title: "MiniF2F-MATH (Formal Proofs)", b8: [0.22, 0.50], b70: [0.25, 0.52], g: 0.27, yl: true },
    { x: 1560, y: 250, title: "CodeContests", b8: [0.05, 0.22], b70: [0.08, 0.38], g: 0.22 },
    { x: 1120, y: 700, title: "MATH (Oracle Verifier)", b8: [0.27, 0.98], b70: [0.48, 0.99], g: 0.65, yl: true, xl: true },
    { x: 1560, y: 700, title: "GSM8K (Oracle Verifier)", b8: [0.80, 0.97], b70: [0.95, 0.985], g: 0.94, xl: true },
  ];
  for (const d of defs) {
    const p = new Panel(ctx, {
      x: d.x, y: d.y, w: 400, h: 330, xlog: true, xmin: 1, xmax: 1e4,
      xticks: d.xl ? [1, 1e2, 1e4] : [], xtickfmt: fmtPow, yticks: [0, 0.5, 1], tickSize: 17,
    });
    p.title([d.title], 22);
    if (d.yl) p.ylabel("Coverage (pass@k)", 20);
    if (d.xl) p.xlabel("Number of Samples (k)", 19, 44);
    const f8 = fit2(d.b8[0], d.b8[1]);
    const f70 = fit2(d.b70[0], d.b70[1]);
    p.line(pl(f8.a, f8.b), COL.blue, 3);
    p.line(pl(f70.a, f70.b), COL.teal, 3);
    p.hline(d.g, COL.gpt4o, 2.2);
  }
  await canvas.toFile(path.join(OUT, "fig2.png"));
}

// ---------------------------------------------------------------- Figure 3
async function fig3() {
  const { canvas, ctx } = newCanvas(2000, 1180);
  legend(ctx, 130, 55, MODELS13.map((m) => ({ label: m.label, color: m.color })),
    { size: 20, maxW: 1800, rowH: 42 });

  const END = {
    llama8b: [0.14, 0.97], llama8bi: [0.27, 0.98], llama70bi: [0.48, 0.99],
    gemma2b: [0.09, 0.95], gemma7b: [0.19, 0.98],
    p70m: [0.0005, 0.27], p160m: [0.003, 0.57], p410m: [0.004, 0.65],
    p1b: [0.005, 0.75], p14b: [0.006, 0.78], p28b: [0.008, 0.82],
    p69b: [0.01, 0.85], p12b: [0.02, 0.87],
  };
  const END_CC = {
    llama8b: [0.01, 0.22], llama8bi: [0.02, 0.24], llama70bi: [0.07, 0.38],
    gemma2b: [0.002, 0.07], gemma7b: [0.01, 0.27],
    p70m: [0.0001, 0.001], p160m: [0.0001, 0.002], p410m: [0.0001, 0.003],
    p1b: [0.0001, 0.004], p14b: [0.0001, 0.005], p28b: [0.0001, 0.006],
    p69b: [0.0001, 0.008], p12b: [0.0001, 0.01],
  };
  const panels = [
    { x: 170, title: "MATH (Oracle Verifier)", end: END, yl: true, xl: true },
    { x: 1080, title: "CodeContests", end: END_CC, xl: true },
  ];
  for (const d of panels) {
    const p = new Panel(ctx, {
      x: d.x, y: 320, w: 830, h: 700, xlog: true, xmin: 1, xmax: 1e4,
      xticks: [1, 10, 100, 1000, 10000], xtickfmt: fmtPow, tickSize: 20,
    });
    p.title([d.title], 25);
    if (d.yl) p.ylabel("Coverage (pass@k)", 23);
    if (d.xl) p.xlabel("Number of Samples (k)", 22, 50);
    for (const m of MODELS13) {
      const [c1, c2] = d.end[m.key];
      const f = fit2(c1, c2);
      p.line(pl(f.a, f.b), m.color, 2.7);
    }
  }
  await canvas.toFile(path.join(OUT, "fig3.png"));
}

// ---------------------------------------------------------------- Figure 4
async function fig4() {
  const { canvas, ctx } = newCanvas(2000, 1560);
  legend(ctx, 640, 60, [
    { label: "Llama-3-8B-Instruct", color: COL.blue },
    { label: "Llama-3-70B-Instruct", color: COL.teal },
  ], { size: 21, gap: 60 });

  const F8 = 2e13; const F70 = 2e14;
  const toFlops = (pts, f) => pts.map(([k, v]) => [k * f, v]);
  const defs = [
    {
      x: 170, title: "MiniF2F-MATH", xmin: 1e13, ticks: [1e14, 1e15, 1e16, 1e17],
      c8: [0.21, 0.50, 2000], c70: [0.24, 0.52, 500], yl: true,
    },
    {
      x: 640, title: "CodeContests", xmin: 1e13, ticks: [1e14, 1e15, 1e16, 1e17],
      c8: [0.05, 0.22, 1e4], c70: [0.08, 0.38, 1e4],
    },
    {
      x: 1110, title: "MATH (Oracle Verifier)", xmin: 1e13, ticks: [1e14, 1e15, 1e16, 1e17],
      c8: [0.27, 0.98, 500], c70: [0.48, 0.99, 500],
    },
    {
      x: 1580, title: "GSM8K (Oracle Verifier)", xmin: 1e12, ticks: [1e13, 1e14, 1e15, 1e16, 1e17],
      c8: [0.80, 0.97, 100], c70: [0.95, 0.985, 1e4],
    },
  ];
  for (const d of defs) {
    const p = new Panel(ctx, {
      x: d.x, y: 170, w: 400, h: 560, xlog: true, xmin: d.xmin, xmax: 3e17,
      xticks: d.ticks, xtickfmt: fmtPow, tickSize: 16,
    });
    p.title([d.title], 22);
    if (d.yl) p.ylabel("Coverage", 21);
    p.xlabel("Total Inference FLOPs", 19, 46);
    const f8 = fit2(d.c8[0], d.c8[1]);
    const f70 = fit2(d.c70[0], d.c70[1]);
    p.line(toFlops(pl(f8.a, f8.b, 1, d.c8[2]), F8), COL.blue, 3);
    p.line(toFlops(pl(f70.a, f70.b, 1, d.c70[2]), F70), COL.teal, 3);
  }

  // Table 1
  const ty = 950;
  const cols = [270, 800, 1010, 1220, 1420, 1640];
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(250, ty); ctx.lineTo(1750, ty); ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(250, ty + 118); ctx.lineTo(1750, ty + 118); ctx.stroke();
  ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(250, ty + 292); ctx.lineTo(1750, ty + 292); ctx.stroke();

  ctx.fillStyle = INK; ctx.textBaseline = "top";
  setFont(ctx, 22, true); ctx.textAlign = "left";
  ctx.fillText("Model", cols[0], ty + 40);
  const heads = [
    ["Cost per", "attempt (USD)"], ["Number of", "attempts"], ["Issues", "solved (%)"],
    ["Total cost", "(USD)"], ["Relative", "total cost"],
  ];
  heads.forEach((h, i) => {
    ctx.textAlign = "center";
    ctx.fillText(h[0], cols[i + 1], ty + 18);
    ctx.fillText(h[1], cols[i + 1], ty + 52);
  });
  const rows = [
    ["DeepSeek-Coder-V2-Instruct", "0.0072", "5", "29.62", "10.8", "1x"],
    ["GPT-4o", "0.13", "1", "24.00", "39", "3.6x"],
    ["Claude 3.5 Sonnet", "0.17", "1", "26.70", "51", "4.7x"],
  ];
  setFont(ctx, 21);
  rows.forEach((r, ri) => {
    const ry = ty + 140 + ri * 50;
    ctx.textAlign = "left";
    ctx.fillText(r[0], cols[0], ry);
    ctx.textAlign = "center";
    for (let i = 1; i < 6; i++) ctx.fillText(r[i], cols[i], ry);
  });
  await canvas.toFile(path.join(OUT, "fig4.png"));
}

// ---------------------------------------------------------------- Figure 5
async function fig5() {
  const { canvas, ctx } = newCanvas(2000, 1420);
  legend(ctx, 660, 55, [
    { label: "Coverage", color: COL.blue },
    { label: "Power Law Fit, c = exp(ak^b)", color: COL.fitOrange },
  ], { size: 21, gap: 60 });

  const defs = [
    { m: "Llama-3-8B-Instruct", t: "MATH (Oracle Verifier)", a: -1.33, b: -0.43, e: "0.003 ± 0.0027" },
    { m: "Llama-3-70B-Instruct", t: "MATH (Oracle Verifier)", a: -0.75, b: -0.46, e: "0.0056 ± 0.0036" },
    { m: "Llama-3-8B-Instruct", t: "CodeContests", a: -3.88, b: -0.11, e: "0.002 ± 0.0015" },
    { m: "Llama-3-70B-Instruct", t: "CodeContests", a: -2.52, b: -0.11, e: "0.0056 ± 0.0027" },
    { m: "Pythia-70M", t: "MATH (Oracle Verifier)", a: -7.59, b: -0.18, e: "0.0052 ± 0.0071" },
    { m: "Pythia-12B", t: "MATH (Oracle Verifier)", a: -3.92, b: -0.35, e: "0.0189 ± 0.0118" },
    { m: "Gemma-2B", t: "MATH (Oracle Verifier)", a: -2.45, b: -0.38, e: "0.0218 ± 0.014" },
    { m: "Llama-3-8B-Instruct", t: "MiniF2F-MATH", a: -1.33, b: -0.08, e: "0.0297 ± 0.0157" },
  ];
  const XS = [150, 620, 1090, 1560];
  defs.forEach((d, i) => {
    const px = XS[i % 4];
    const py = i < 4 ? 330 : 930;
    const p = new Panel(ctx, {
      x: px, y: py, w: 410, h: 380, xlog: true, xmin: 1, xmax: 1e4,
      xticks: i < 4 ? [] : [1, 10, 100, 1000, 10000], xtickfmt: fmtPow,
      yticks: [0, 0.2, 0.4, 0.6, 0.8, 1.0], ytickfmt: (v) => v.toFixed(1), tickSize: 16,
    });
    p.title([d.m, d.t, `(a=${d.a}, b=${d.b})`, `Error: ${d.e}`], 20, 4);
    if (i % 4 === 0) p.ylabel("Coverage (pass@k)", 19);
    if (i >= 4) p.xlabel("Number of Samples (k)", 18, 42);
    const fit = pl(d.a, d.b);
    const wig = i === 7 ? 0.05 : 0.03;
    const amp = i === 7 ? 0.85 : 1;
    const cov = pl(d.a * amp, i === 7 ? d.b * 1.35 : d.b).map(([k, v], j) => [
      k, clamp(v * (1 + wig * Math.sin(Math.log10(k) * 5.1 + j * 0.17 + i)), 0, 1),
    ]);
    p.line(cov, COL.blue, 3);
    p.line(fit, COL.fitOrange, 3);
  });
  await canvas.toFile(path.join(OUT, "fig5.png"));
}

// ---------------------------------------------------------------- Figure 6
async function fig6() {
  const { canvas, ctx } = newCanvas(2000, 940);
  const shift = (a, b, c) => {
    const c1 = Math.exp(a);
    const pts = pl(a, b);
    return pts.map(([k, v]) => [(k * c1) / c, v]);
  };
  const defs = [
    {
      title: ["Llama-3", "MATH (Oracle Verifier)"], c: 0.48, xmin: 1, xmax: 1e4,
      ticks: [1, 1e2, 1e4], cLabel: "0.48",
      series: [
        { label: "Llama-3-70B-Instruct", color: COL.teal, ab: [-0.75, -0.46] },
        { label: "Llama-3-8B-Instruct", color: COL.blue, ab: [-1.33, -0.43] },
        { label: "Llama-3-8B", color: COL.orange, ab: [Math.log(0.14), -0.452] },
      ],
      legendY: 0.55, yl: true,
    },
    {
      title: ["Gemma", "MATH (Oracle Verifier)"], c: 0.2, xmin: 1, xmax: 1e5,
      ticks: [1, 1e2, 1e4], cLabel: "0.2",
      series: [
        { label: "Gemma-2B", color: COL.lightGreen, ab: [-2.45, -0.38] },
        { label: "Gemma-7B", color: COL.red, ab: [Math.log(0.19), -0.479] },
      ],
      legendY: 0.12,
    },
    {
      title: ["Pythia", "MATH (Oracle Verifier)"], c: 0.02, xmin: 1, xmax: 1e6,
      ticks: [1, 1e2, 1e4, 1e6], cLabel: "0.02",
      series: [
        { label: "Pythia-1.4B", color: COL.gray, ab: [Math.log(0.006), fit2(0.006, 0.78).b] },
        { label: "Pythia-12B", color: COL.lightCyan, ab: [-3.92, -0.35] },
        { label: "Pythia-160M", color: COL.brown, ab: [Math.log(0.003), fit2(0.003, 0.57).b] },
        { label: "Pythia-1B", color: COL.pink, ab: [Math.log(0.005), fit2(0.005, 0.75).b] },
        { label: "Pythia-2.8B", color: COL.olive, ab: [Math.log(0.008), fit2(0.008, 0.82).b] },
        { label: "Pythia-410M", color: COL.rosy, ab: [Math.log(0.004), fit2(0.004, 0.65).b] },
        { label: "Pythia-6.9B", color: COL.cyan, ab: [Math.log(0.01), fit2(0.01, 0.85).b] },
        { label: "Pythia-70M", color: COL.purple, ab: [-7.59, -0.18] },
      ],
      legendY: 0.1,
    },
    {
      title: ["Llama-3", "CodeContests"], c: 0.07, xmin: 1e-1, xmax: 1e4,
      ticks: [1e-1, 1e1, 1e3], cLabel: "0.07",
      series: [
        { label: "Llama-3-70B-instruct", color: COL.teal, ab: [Math.log(0.08), -0.104] },
        { label: "Llama-3-8B-instruct", color: COL.blue, ab: [Math.log(0.02), -0.109] },
        { label: "Llama-3-8B", color: COL.orange, ab: [Math.log(0.01), -0.121] },
      ],
      legendY: 0.12,
    },
  ];
  const XS = [170, 640, 1110, 1580];
  defs.forEach((d, i) => {
    const p = new Panel(ctx, {
      x: XS[i], y: 200, w: 400, h: 560, xlog: true, xmin: d.xmin, xmax: d.xmax,
      xticks: d.ticks, xtickfmt: fmtPow, tickSize: 17,
    });
    p.title(d.title, 23);
    if (d.yl) p.ylabel("Coverage (pass@k)", 21);
    p.xlabel(`k / pass@k⁻¹ (${d.cLabel})`, 20, 46);
    for (const s of d.series) p.line(shift(s.ab[0], s.ab[1], d.c), s.color, 2.8);
    legend(ctx, XS[i] + 40, 200 + 560 * d.legendY, d.series.map((s) => ({
      label: s.label, color: s.color,
    })), { size: 15, sample: 32, rowH: 26, gap: 16, maxW: 340 });
  });
  await canvas.toFile(path.join(OUT, "fig6.png"));
}

// ---------------------------------------------------------------- Figure 7
async function fig7() {
  const { canvas, ctx } = newCanvas(2000, 980);
  legend(ctx, 60, 55, [
    { label: "Majority Vote", color: COL.mvTeal },
    { label: "Reward Model + Best-of-N", color: COL.rmBon },
    { label: "Reward Model + Majority Vote", color: COL.rmMv },
    { label: "Coverage (pass@k)", color: COL.blue },
  ], { size: 20, gap: 46, maxW: 1900 });

  const defs = [
    {
      title: ["Llama-3-8B-Instruct", "GSM8K"], yl: true,
      cov: fit2(0.78, 0.997), sel: [[0.78, 0.885, 0.35], [0.76, 0.86, 0.3], [0.78, 0.895, 0.4]],
    },
    {
      title: ["Llama-3-70B-Instruct", "GSM8K"],
      cov: fit2(0.93, 0.995), sel: [[0.93, 0.975, 0.4], [0.94, 0.915, 0.2], [0.94, 0.985, 0.5]],
    },
    {
      title: ["Llama-3-8B-Instruct", "MATH"],
      cov: { a: -1.33, b: -0.43 }, sel: [[0.26, 0.415, 0.35], [0.27, 0.315, 0.25], [0.27, 0.415, 0.4]],
    },
    {
      title: ["Llama-3-70B-Instruct", "MATH"],
      cov: { a: -0.75, b: -0.46 }, sel: [[0.48, 0.585, 0.4], [0.49, 0.505, 0.15], [0.49, 0.585, 0.45]],
    },
  ];
  const XS = [170, 640, 1110, 1580];
  const selCols = [COL.mvTeal, COL.rmBon, COL.rmMv];
  defs.forEach((d, i) => {
    const p = new Panel(ctx, {
      x: XS[i], y: 210, w: 400, h: 560, xlog: true, xmin: 1, xmax: 1e4,
      xticks: [1, 10, 100, 1000, 10000], xtickfmt: fmtPow,
      yticks: [0, 0.2, 0.4, 0.6, 0.8, 1.0], ytickfmt: (v) => v.toFixed(1), tickSize: 17,
    });
    p.title(d.title, 23);
    if (d.yl) p.ylabel("Success Rate", 21);
    p.xlabel("Number of Samples (k)", 20, 46);
    d.sel.forEach((s, si) => {
      const pts = sat(s[0], s[1], s[2]);
      p.band(pts, pts.map(() => 0.02), selCols[si], 0.22);
      p.line(pts, selCols[si], 2.8);
    });
    p.line(pl(d.cov.a, d.cov.b), COL.blue, 2.8);
  });
  await canvas.toFile(path.join(OUT, "fig7.png"));
}

// ---------------------------------------------------------------- Figure 8
async function fig8() {
  const { canvas, ctx } = newCanvas(2000, 900);
  legend(ctx, 520, 55, [
    { label: "Problem is correct with majority voting", color: COL.barGreen, swatch: "box" },
    { label: "Problem is incorrect with majority voting", color: COL.barRed, swatch: "box" },
  ], { size: 20, gap: 50 });

  const shapes = [
    { title: ["Llama-3-8B-Instruct", "GSM8K"], f: (t) => (t < 0.62 ? Math.pow(t / 0.62, 0.55) : 1) },
    {
      title: ["Llama-3-8B-Instruct", "MATH"],
      f: (t) => (t < 0.45 ? 0.02 * (t / 0.45) : Math.min(1, Math.pow((t - 0.45) / 0.55, 1.7))),
    },
    {
      title: ["Llama-3-70B-Instruct", "GSM8K"],
      f: (t) => (t < 0.1 ? Math.pow(t / 0.1, 0.45) : Math.min(1, 0.96 + (0.04 * (t - 0.1)) / 0.9)),
    },
    {
      title: ["Llama-3-70B-Instruct", "MATH"],
      f: (t) => (t < 0.35 ? 0.03 * Math.pow(t / 0.35, 1.2) : Math.min(1, Math.pow((t - 0.35) / 0.65, 1.5))),
    },
  ];
  const XS = [170, 640, 1110, 1580];
  const N = 130;
  shapes.forEach((d, i) => {
    const p = new Panel(ctx, {
      x: XS[i], y: 190, w: 400, h: 520, xlog: false, xmin: 0, xmax: 1,
      xticks: [], yticks: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
      ytickfmt: (v) => `${Math.round(v * 100)}%`, tickSize: 17,
    });
    p.title(d.title, 23);
    if (i === 0) p.ylabel("Correct Sample Percentage", 19);
    p.xlabel("Problem Index", 19, 42);
    p.xlabel("(Sorted by Correct Fraction)", 19, 66);
    const bw = p.w / N;
    for (let b = 0; b < N; b++) {
      const t = (b + 0.5) / N;
      let f = d.f(t) * (1 + 0.05 * Math.sin(b * 2.3 + i) + 0.03 * Math.sin(b * 0.7));
      if (d.f(t) >= 0.995) f = 1;
      f = clamp(f, 0, 1);
      const py = p.Y(f);
      ctx.fillStyle = f >= 0.5 ? COL.barGreen : COL.barRed;
      ctx.fillRect(p.x + b * bw + 0.6, py, bw - 1.2, p.y + p.h - py);
    }
  });
  await canvas.toFile(path.join(OUT, "fig8.png"));
}

async function main() {
  await fig1();
  await fig2();
  await fig3();
  await fig4();
  await fig5();
  await fig6();
  await fig7();
  await fig8();
  console.log("Wrote figures_recreated/fig1-8.png");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
