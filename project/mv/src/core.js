// core.js: canvas, palette, timing helpers, easing, deterministic randomness, typography primitives.
const W = 1920, H = 1080, FPS = 30;
// ennui palette: smoky, desaturated, one dusty rose accent
const PAL = {
  ink: '#141218', paper: '#e8e5e0', white: '#f4f2ee', grey: '#8b8794', smoke: '#4a4652', fog: '#b9b5bd',
  lav: '#a99bd6', lavDeep: '#5d4f96', cyan: '#9fc9d4', pink: '#d9b3c6', rose: '#c8475f', roseDeep: '#7d2436',
};
const IRIS = ['#a99bd6', '#9fc9d4', '#d9b3c6', '#b8aee0'];
const FONT = '"Noto Sans CJK JP", "Noto Sans JP", sans-serif';
const FONT_EN = '"Noto Sans", "Noto Sans CJK JP", sans-serif';

// ---- math & easing
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
const easeOut = k => 1 - Math.pow(1 - k, 3);
const easeIn = k => k * k * k;
const easeInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const expoOut = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * k);
const backOut = (k, s = 2.2) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
// hash-based randomness: same input -> same value on every render (frames are painted out of order by workers)
const hash = (...xs) => { let h = 2166136261; for (const x of xs) { h ^= Math.floor(x * 1000) | 0; h = Math.imul(h, 16777619); h ^= h >>> 13; } return ((h >>> 0) % 100000) / 100000; };
const hr = (a, b, ...seed) => lerp(a, b, hash(...seed));

// ---- music timing (DATA from data.js)
function lastOf(list, t) { let lo = 0, hi = list.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (list[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }
const hitIdx = t => lastOf(DATA.hits, t);
const sinceHit = t => { const i = hitIdx(t); return i < 0 ? 99 : t - DATA.hits[i]; };
const sinceStrong = t => { const i = lastOf(DATA.strong, t); return i < 0 ? 99 : t - DATA.strong[i]; };
const beatIdx = t => lastOf(DATA.beats, t);
const sinceBeat = t => { const i = beatIdx(t); return i < 0 ? 99 : t - DATA.beats[i]; };
const energyAt = t => DATA.energy[clamp(Math.floor(t * 10), 0, DATA.energy.length - 1)];
// a decaying pulse after each hit: 1 on the hit, 0 after `len` seconds
const pulse = (t, len = .18) => { const s = sinceHit(t); return s < len ? 1 - s / len : 0; };
const strongPulse = (t, len = .3) => { const s = sinceStrong(t); return s < len ? 1 - s / len : 0; };

// ---- canvas helpers
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function fillBg(ctx, c) { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); }
function withAlpha(ctx, a, fn) { ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore(); }
function irisGradient(ctx, x0, y0, x1, y1, shift = 0) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  IRIS.forEach((c, i) => g.addColorStop(((i / (IRIS.length - 1)) + shift) % 1, c));
  return g;
}

// ---- typography
function font(size, weight = 900, fam = FONT) { return `${weight} ${size}px ${fam}`; }
function measure(ctx, text, size, weight = 900, fam = FONT) { ctx.font = font(size, weight, fam); return ctx.measureText(text).width; }
// size that makes `text` fit `maxW`, capped at `maxSize`
function fitSize(ctx, text, maxW, maxSize, weight = 900, fam = FONT) {
  const w = measure(ctx, text, 100, weight, fam); return Math.min(maxSize, 100 * maxW / Math.max(1, w));
}

// Staccato per-character reveal. Each character pops at its sung time: overshoot scale, a white flash frame, a tiny
// random tilt. Returns the laid-out boxes so scenes can decorate them.
//   opts: x, y (baseline centre or left), size, align ('center'|'left'|'right'), color, stroke, strokeW, lead (s before
//   the sung time), pop (s), tilt (deg), vertical, spacing, shadow {dx, dy, color}, hide (fn char index -> bool)
function popLine(ctx, L, t, o) {
  const size = o.size, chars = L.chars, sp = o.spacing ?? 0;
  ctx.font = font(size, o.weight ?? 900, o.fam ?? FONT);
  const widths = chars.map(([c]) => c === ' ' || c === '　' ? size * .35 : ctx.measureText(c).width + sp * size);
  const total = widths.reduce((a, b) => a + b, 0);
  const boxes = [];
  let cx = o.vertical ? o.x : o.align === 'left' ? o.x : o.align === 'right' ? o.x - total : o.x - total / 2;
  let cy = o.vertical ? (o.align === 'top' ? o.y : o.y - chars.length * size * 1.02 / 2) : o.y;
  chars.forEach(([c, ct], i) => {
    const w = widths[i];
    const bx = o.vertical ? cx : cx + w / 2, by = o.vertical ? cy + size * .5 : cy;
    const k = (t - (ct - (o.lead ?? .04))) / (o.pop ?? .12);
    if (k >= 0 && !(o.hide && o.hide(i)) && c.trim()) {
      const s = k < 1 ? lerp(o.from ?? 1.7, 1, backOut(clamp(k))) : 1;
      const rot = (o.tilt ?? 4) * (hash(L.i, i) - .5) * Math.PI / 180;
      ctx.save(); ctx.translate(bx + (o.jx ? o.jx(i) : 0), by + (o.jy ? o.jy(i) : 0)); ctx.rotate(rot); ctx.scale(s, s);
      ctx.textAlign = 'center'; ctx.textBaseline = o.vertical ? 'middle' : 'alphabetic';
      if (o.shadow) { ctx.fillStyle = o.shadow.color; ctx.fillText(c, o.shadow.dx, o.shadow.dy); }
      if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.strokeW ?? size * .12; ctx.strokeStyle = o.stroke; ctx.strokeText(c, 0, 0); }
      ctx.fillStyle = k < .35 && o.flash !== false ? (o.flashColor ?? PAL.white) : (typeof o.color === 'function' ? o.color(i) : o.color);
      if (o.outlineOnly) { ctx.lineWidth = size * .035; ctx.strokeStyle = ctx.fillStyle; ctx.strokeText(c, 0, 0); } else ctx.fillText(c, 0, 0);
      ctx.restore();
    }
    boxes.push({ x: bx, y: by, w, c, t: ct, shown: k >= 0 });
    if (o.vertical) cy += size * 1.02; else cx += w;
  });
  return { boxes, total };
}

// label chip: small English/number type in a filled box (graphic-design garnish)
function chip(ctx, text, x, y, size, bg, fg, align = 'left') {
  ctx.font = font(size, 800, FONT_EN);
  const w = ctx.measureText(text).width + size * .8, h = size * 1.35;
  const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  ctx.fillStyle = bg; ctx.fillRect(x0, y - h * .78, w, h);
  ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x0 + size * .4, y);
  return w;
}

// a band of repeating text that scrolls; used for tickers and caution tape
function ticker(ctx, text, y, size, speed, t, fg, bg, angle = 0, h) {
  ctx.save(); ctx.translate(W / 2, y); ctx.rotate(angle);
  const bh = h ?? size * 1.6;
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(-W * 1.5, -bh / 2, W * 3, bh); }
  ctx.font = font(size, 900); ctx.fillStyle = fg; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const unit = ctx.measureText(text).width;
  let x = -W * 1.5 - ((t * speed) % unit + unit) % unit;
  while (x < W * 1.5) { ctx.fillText(text, x, size * .04); x += unit; }
  ctx.restore();
}

// horizontal slice glitch of the current frame: shift random strips sideways
function sliceGlitch(ctx, amount, seed, n = 7) {
  if (amount <= 0) return;
  const snap = ctx.getImageData(0, 0, W, H); const tmp = makeCanvas(W, H); tmp.getContext('2d').putImageData(snap, 0, 0);
  for (let i = 0; i < n; i++) {
    const y = hr(0, H, seed, i), h = hr(10, 90, seed, i, 2), dx = hr(-1, 1, seed, i, 3) * 160 * amount;
    ctx.drawImage(tmp, 0, y, W, h, dx, y, W, h);
  }
}

function invertFrame(ctx) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }

// halftone dot field, dots grow toward `dir`; cheap texture for print feel
function halftone(ctx, color, step, maxR, fn) {
  ctx.fillStyle = color;
  for (let y = step / 2; y < H + step; y += step) for (let x = ((y / step) % 2) * step / 2; x < W + step; x += step) {
    const r = maxR * fn(x / W, y / H); if (r > .4) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  }
}

// paper grain overlay (pre-rendered once, offset per frame)
let GRAIN;
function grain(ctx, t, a = .07) {
  if (!GRAIN) {
    GRAIN = makeCanvas(512, 512); const g = GRAIN.getContext('2d'); const d = g.createImageData(512, 512);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0);
  }
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay';
  const ox = Math.floor(hash(Math.floor(t * 12)) * 512), oy = Math.floor(hash(Math.floor(t * 12), 7) * 512);
  for (let y = -oy; y < H; y += 512) for (let x = -ox; x < W; x += 512) ctx.drawImage(GRAIN, x, y);
  ctx.restore();
}
