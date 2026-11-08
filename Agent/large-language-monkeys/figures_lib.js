"use strict";

// Minimal matplotlib-style plotting library on skia-canvas, used to recreate
// the paper figures (figures/figN.png) as vector-drawn PNGs for the deck.
// Visual target = the original matplotlib figures: white background,
// left+bottom spines, outward ticks, DejaVu Sans (matplotlib's default face).

const { Canvas } = require("skia-canvas");

const FONT = "DejaVu Sans";
const INK = "#1a1a1a";
const MUTED = "#444444";

function newCanvas(w, h) {
  const canvas = new Canvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);
  ctx.lineCap = "butt";
  ctx.lineJoin = "round";
  return { canvas, ctx };
}

const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "-": "⁻" };
function pow10(e) {
  if (e === 0) return "1";
  return "10" + String(e).split("").map((ch) => SUP[ch]).join("");
}

function setFont(ctx, size, bold = false, italic = false) {
  ctx.font = `${italic ? "italic " : ""}${bold ? "bold " : ""}${size}px "${FONT}"`;
}

// Rich text: [{t, bold, italic, color}] drawn left to right; returns end x.
function richText(ctx, x, y, parts, size, baseline = "alphabetic") {
  let cx = x;
  ctx.textBaseline = baseline;
  ctx.textAlign = "left";
  for (const p of parts) {
    setFont(ctx, p.size || size, p.bold, p.italic);
    ctx.fillStyle = p.color || INK;
    ctx.fillText(p.t, cx, y);
    cx += ctx.measureText(p.t).width;
  }
  return cx;
}

function richWidth(ctx, parts, size) {
  let w = 0;
  for (const p of parts) {
    setFont(ctx, p.size || size, p.bold, p.italic);
    w += ctx.measureText(p.t).width;
  }
  return w;
}

function centerRich(ctx, cx, y, parts, size, baseline = "alphabetic") {
  const w = richWidth(ctx, parts, size);
  return richText(ctx, cx - w / 2, y, parts, size, baseline);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function arrow(ctx, x1, y1, x2, y2, color = INK, width = 4, head = 14) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - head * 0.7 * Math.cos(ang), y2 - head * 0.7 * Math.sin(ang));
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(ang - 0.42), y2 - head * Math.sin(ang - 0.42));
  ctx.lineTo(x2 - head * Math.cos(ang + 0.42), y2 - head * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();
}

class Panel {
  constructor(ctx, o) {
    this.ctx = ctx;
    this.x = o.x; this.y = o.y; this.w = o.w; this.h = o.h;
    this.xlog = Boolean(o.xlog);
    this.xmin = o.xmin; this.xmax = o.xmax;
    this.ymin = o.ymin === undefined ? 0 : o.ymin;
    this.ymax = o.ymax === undefined ? 1 : o.ymax;
    this.xticks = o.xticks || [];
    this.yticks = o.yticks === undefined ? [0, 0.2, 0.4, 0.6, 0.8, 1.0] : o.yticks;
    this.xtickfmt = o.xtickfmt || ((v) => String(v));
    this.ytickfmt = o.ytickfmt || ((v) => String(v));
    this.tickSize = o.tickSize || 19;
    this.frame();
  }

  X(v) {
    if (this.xlog) {
      const l0 = Math.log10(this.xmin);
      const l1 = Math.log10(this.xmax);
      return this.x + ((Math.log10(v) - l0) / (l1 - l0)) * this.w;
    }
    return this.x + ((v - this.xmin) / (this.xmax - this.xmin)) * this.w;
  }

  Y(v) {
    return this.y + this.h - ((v - this.ymin) / (this.ymax - this.ymin)) * this.h;
  }

  frame() {
    const c = this.ctx;
    c.setLineDash([]);
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(this.x, this.y);
    c.lineTo(this.x, this.y + this.h);
    c.lineTo(this.x + this.w, this.y + this.h);
    c.stroke();
    c.fillStyle = INK;
    for (const t of this.xticks) {
      const px = this.X(t);
      c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(px, this.y + this.h); c.lineTo(px, this.y + this.h + 9); c.stroke();
      setFont(c, this.tickSize);
      c.textAlign = "center"; c.textBaseline = "top";
      c.fillText(this.xtickfmt(t), px, this.y + this.h + 14);
    }
    for (const t of this.yticks) {
      const py = this.Y(t);
      c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(this.x - 9, py); c.lineTo(this.x, py); c.stroke();
      setFont(c, this.tickSize);
      c.textAlign = "right"; c.textBaseline = "middle";
      c.fillText(this.ytickfmt(t), this.x - 15, py);
    }
  }

  // pts: [[x, y], ...] in data coordinates
  line(pts, color, width = 3.2, dash = null) {
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.rect(this.x - 1, this.y - 6, this.w + 2, this.h + 7);
    c.clip();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.setLineDash(dash || []);
    c.beginPath();
    pts.forEach(([dx, dy], i) => {
      const px = this.X(dx); const py = this.Y(dy);
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    });
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  band(pts, half, color, alpha = 0.25) {
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.rect(this.x - 1, this.y - 6, this.w + 2, this.h + 7);
    c.clip();
    c.globalAlpha = alpha;
    c.fillStyle = color;
    c.beginPath();
    pts.forEach(([dx, dy], i) => {
      const px = this.X(dx); const py = this.Y(Math.min(dy + half[i], this.ymax));
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    });
    for (let i = pts.length - 1; i >= 0; i--) {
      c.lineTo(this.X(pts[i][0]), this.Y(Math.max(pts[i][1] - half[i], this.ymin)));
    }
    c.closePath();
    c.fill();
    c.globalAlpha = 1;
    c.restore();
  }

  hline(v, color, width = 2.4, dash = [10, 8]) {
    const c = this.ctx;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.setLineDash(dash);
    c.beginPath();
    c.moveTo(this.x, this.Y(v));
    c.lineTo(this.x + this.w, this.Y(v));
    c.stroke();
    c.setLineDash([]);
  }

  title(lines, size = 23, gap = 6) {
    const c = this.ctx;
    let ty = this.y - 14 - (lines.length - 1) * (size + gap);
    for (const ln of lines) {
      setFont(c, size, true);
      c.fillStyle = INK;
      c.textAlign = "center"; c.textBaseline = "top";
      c.fillText(ln, this.x + this.w / 2, ty);
      ty += size + gap;
    }
  }

  xlabel(text, size = 21, dy = 46) {
    const c = this.ctx;
    setFont(c, size, true);
    c.fillStyle = INK;
    c.textAlign = "center"; c.textBaseline = "top";
    c.fillText(text, this.x + this.w / 2, this.y + this.h + dy);
  }

  ylabel(text, size = 21) {
    const c = this.ctx;
    c.save();
    c.translate(this.x - 62, this.y + this.h / 2);
    c.rotate(-Math.PI / 2);
    setFont(c, size, true);
    c.fillStyle = INK;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(text, 0, 0);
    c.restore();
  }
}

// Horizontal wrapping legend. items: {label, color, dash, swatch:'line'|'box'}
function legend(ctx, x, y, items, o = {}) {
  const size = o.size || 21;
  const sample = o.sample === undefined ? 46 : o.sample;
  const gap = o.gap === undefined ? 40 : o.gap;
  const rowH = o.rowH === undefined ? size + 18 : o.rowH;
  const maxW = o.maxW || 1900;
  let cx = x; let cy = y;
  for (const it of items) {
    setFont(ctx, size);
    const tw = ctx.measureText(it.label).width;
    const itemW = sample + 10 + tw;
    if (cx + itemW > x + maxW && cx > x) { cx = x; cy += rowH; }
    if (it.swatch === "box") {
      ctx.fillStyle = it.color;
      ctx.fillRect(cx, cy - size * 0.62, sample * 0.62, size * 0.62);
    } else {
      ctx.strokeStyle = it.color;
      ctx.lineWidth = it.width || 3.4;
      ctx.setLineDash(it.dash || []);
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.3);
      ctx.lineTo(cx + sample, cy - size * 0.3);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = MUTED;
    setFont(ctx, size);
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(it.label, cx + sample + 10, cy - size * 0.28);
    cx += itemW + gap;
  }
  return cy + rowH;
}

// Curve generators -----------------------------------------------------------

// Power law c(k) = exp(a * k^b)  (the paper's fitted form, Figure 5)
function pl(a, b, k0 = 1, k1 = 1e4, n = 140) {
  const pts = [];
  const l0 = Math.log10(k0); const l1 = Math.log10(k1);
  for (let i = 0; i <= n; i++) {
    const k = Math.pow(10, l0 + ((l1 - l0) * i) / n);
    pts.push([k, Math.exp(a * Math.pow(k, b))]);
  }
  return pts;
}

// Fit a,b of exp(a k^b) through (1, c1) and (K, c2)
function fit2(c1, c2, K = 1e4) {
  const a = Math.log(c1);
  const b = (Math.log(-Math.log(c2)) - Math.log(-a)) / Math.log(K);
  return { a, b };
}

// Saturating curve s(k) = sInf - (sInf - s1) * k^-d
function sat(s1, sInf, d, k0 = 1, k1 = 1e4, n = 140) {
  const pts = [];
  const l0 = Math.log10(k0); const l1 = Math.log10(k1);
  for (let i = 0; i <= n; i++) {
    const k = Math.pow(10, l0 + ((l1 - l0) * i) / n);
    pts.push([k, sInf - (sInf - s1) * Math.pow(k, -d)]);
  }
  return pts;
}

module.exports = {
  Canvas,
  newCanvas,
  Panel,
  legend,
  richText,
  richWidth,
  centerRich,
  roundRectPath,
  arrow,
  setFont,
  pow10,
  pl,
  fit2,
  sat,
  FONT,
  INK,
  MUTED,
};
