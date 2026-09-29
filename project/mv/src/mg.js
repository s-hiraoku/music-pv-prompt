// mg.js: motion-graphics typography for the fresh cut. Each function is a small designed composition built around
// a word (shapes, lines, bands, rings moving with it), always drawn in front of the picture. All take the time the
// word is sung (t0) and the time it must be gone (t1).
const MG = { red: '#d0142c', deep: '#6e0816', cream: '#f3ece6', ink: '#16141b', grey: '#bdb8c4', lilac: '#b9a8e8' };

function word(ctx, text, x, y, size, o = {}) {
  const f = FACES[o.face ?? 'base'];
  ctx.font = font(size, f.w, f.fam); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = o.base ?? 'alphabetic';
  ctx.letterSpacing = `${o.spacing ?? 0}px`;
  if (o.shadow !== false) { ctx.shadowColor = 'rgba(10,6,14,.55)'; ctx.shadowBlur = size * .12; ctx.shadowOffsetY = size * .03; }
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.strokeW ?? size * .06; ctx.strokeStyle = o.stroke; ctx.strokeText(text, x, y); ctx.shadowColor = 'transparent'; }
  if (o.fill !== null) { ctx.fillStyle = o.fill ?? MG.red; ctx.fillText(text, x, y); }
  ctx.shadowColor = 'transparent'; ctx.letterSpacing = '0px';
}
const inOut = (t, t0, t1, a = .3, b = .3) => Math.min(clamp((t - t0) / a), 1 - clamp((t - (t1 - b)) / b));
const wordW = (ctx, text, size, face = 'base', sp = 0) => { const f = FACES[face]; ctx.font = font(size, f.w, f.fam); ctx.letterSpacing = `${sp}px`; const w = ctx.measureText(text).width; ctx.letterSpacing = '0px'; return w; };

// a red band races across and leaves the word knocked out in cream; small labels ride its ends; it retracts on exit
function band(ctx, text, t, t0, t1, o = {}) {
  if (t < t0 - .05 || t > t1) return;
  const size = o.size ?? 200, y = o.y ?? H * .5, h = size * 1.3, face = o.face ?? 'base';
  const tw = wordW(ctx, text, size, face, o.spacing ?? 0), bw = tw + size * 1.2, x0 = (o.x ?? W / 2) - bw / 2;
  const a = expoOut(clamp((t - t0) / .28)), b = easeIn(clamp((t - (t1 - .3)) / .3));
  const L = x0 + bw * b, R = x0 + bw * a;
  if (R <= L) return;
  ctx.save(); ctx.translate(0, (o.skew ?? 0) ? 0 : 0);
  ctx.fillStyle = o.bg ?? MG.red; ctx.fillRect(L, y - h / 2, R - L, h);
  ctx.beginPath(); ctx.rect(L, y - h / 2, R - L, h); ctx.clip();
  word(ctx, text, x0 + bw / 2 + (1 - a) * -80, y + size * .36, size, { face, fill: o.fg ?? MG.cream, shadow: false, spacing: o.spacing });
  ctx.restore();
  if (o.labels) { ctx.fillStyle = o.bg ?? MG.red; ctx.font = font(22, FACES.mono.w, FACES.mono.fam); ctx.textAlign = 'left';
    ctx.globalAlpha = a * (1 - b); ctx.fillText(o.labels[0], x0, y - h / 2 - 14); ctx.textAlign = 'right'; ctx.fillText(o.labels[1], x0 + bw, y + h / 2 + 32); ctx.globalAlpha = 1; }
}
// the word slams in; radial lines shoot out and a ring expands; outline echoes trail; it blows up and fades on exit
function burst(ctx, text, t, t0, t1, o = {}) {
  if (t < t0 || t > t1) return;
  const x = o.x ?? W / 2, y = o.y ?? H * .55, size = o.size ?? 260, k = clamp((t - t0) / .22), age = t - t0;
  const ex = clamp((t - (t1 - .25)) / .25), s = lerp(2.3, 1, expoOut(k)) * (1 + .4 * easeIn(ex));
  ctx.save(); ctx.globalAlpha = 1 - ex;
  if (age < .6) {                                   // lines
    const p = age / .6; ctx.strokeStyle = o.lines ?? MG.cream; ctx.lineWidth = 4 * (1 - p);
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + hash(i, 5) * .2, r0 = size * (.5 + p * 1.6), r1 = r0 + size * (.3 + hash(i, 6) * .5) * (1 - p);
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y - size * .35 + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y - size * .35 + Math.sin(a) * r1); ctx.stroke(); }
    ctx.strokeStyle = o.ring ?? MG.red; ctx.lineWidth = 10 * (1 - p); ctx.beginPath(); ctx.arc(x, y - size * .35, size * (.4 + p * 2.2), 0, 7); ctx.stroke();
  }
  for (let e = 2; e >= 1; e--) { const se = s * (1 + e * .08 * (1 - k)); ctx.save(); ctx.translate(x, y - size * .35); ctx.scale(se, se); ctx.globalAlpha *= .35 / e;
    word(ctx, text, 0, size * .35, size, { face: o.face, fill: null, stroke: o.fill ?? MG.red, strokeW: 3, shadow: false }); ctx.restore(); }
  const sh = age < .25 ? (1 - age / .25) * 14 : 0;
  ctx.translate(x + hr(-1, 1, Math.floor(t * 60)) * sh, y - size * .35 + hr(-1, 1, Math.floor(t * 60), 2) * sh); ctx.scale(s, s);
  word(ctx, text, 0, size * .35, size, { face: o.face, fill: o.fill ?? MG.red, stroke: o.stroke ?? MG.cream, strokeW: size * .05 });
  ctx.restore();
}
// the word comes in as two halves (top from above, bottom from below, different inks) that snap together
function split(ctx, text, t, t0, t1, o = {}) {
  if (t < t0 || t > t1) return;
  const x = o.x ?? W / 2, y = o.y ?? H * .55, size = o.size ?? 240, k = expoOut(clamp((t - t0) / .35)), ex = easeIn(clamp((t - (t1 - .3)) / .3));
  const mid = y - size * .36, off = (1 - k) * size * 1.2;
  const half = (top, ink, dx, dy) => { ctx.save(); ctx.beginPath(); ctx.rect(0, top ? 0 : mid, W, top ? mid : H - mid); ctx.clip();
    word(ctx, text, x + dx, y + dy, size, { face: o.face, fill: ink, stroke: o.stroke, strokeW: size * .04 }); ctx.restore(); };
  ctx.save(); ctx.globalAlpha = 1 - ex;
  half(true, o.top ?? MG.red, -ex * 300, -off); half(false, o.bottom ?? MG.cream, ex * 300, off);
  ctx.fillStyle = o.line ?? MG.cream; const lw = wordW(ctx, text, size, o.face) * 1.15 * k; ctx.fillRect(x - lw / 2, mid - 1.5, lw, 3);
  ctx.restore();
}
// the characters of `text` on a turning circle
function ring(ctx, text, t, t0, t1, o = {}) {
  const a = inOut(t, t0, t1, .5, .4); if (a <= 0) return;
  const x = o.x ?? W / 2, y = o.y ?? H / 2, r = (o.r ?? 300) * lerp(.7, 1, expoOut(clamp((t - t0) / .6))), size = o.size ?? 44, chars = [...text];
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate((t - t0) * (o.spin ?? .35));
  const f = FACES[o.face ?? 'mono']; ctx.font = font(size, f.w, f.fam); ctx.textAlign = 'center'; ctx.fillStyle = o.fill ?? MG.cream;
  chars.forEach((c, i) => { ctx.save(); ctx.rotate(i / chars.length * Math.PI * 2); ctx.fillText(c, 0, -r); ctx.restore(); });
  ctx.strokeStyle = o.fill ?? MG.cream; ctx.globalAlpha = a * .5; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, r - size * 1.1, 0, 7); ctx.stroke();
  ctx.restore();
}
// solid word rises; hollow copies stack up behind it one by one; on exit they all slide up and fade
function echo(ctx, text, t, t0, t1, o = {}) {
  if (t < t0 || t > t1) return;
  const x = o.x ?? W / 2, y = o.y ?? H * .7, size = o.size ?? 240, n = o.n ?? 4, ex = easeIn(clamp((t - (t1 - .35)) / .35)), up = -ex * 200;
  ctx.save(); ctx.globalAlpha = 1 - ex;
  for (let e = n; e >= 1; e--) { const k = expoOut(clamp((t - t0 - e * .07) / .35)); if (k <= 0) continue;
    ctx.save(); ctx.globalAlpha *= (.75 - e * .15) * k; word(ctx, text, x, y - e * size * .42 * k + up, size, { face: o.face, fill: null, stroke: o.outline ?? MG.cream, strokeW: 2.5, shadow: false, align: o.align }); ctx.restore(); }
  const k = expoOut(clamp((t - t0) / .3));
  ctx.beginPath(); ctx.rect(-W, y - size * 1.1 + up, 3 * W, size * 1.3); ctx.clip();
  word(ctx, text, x, y + (1 - k) * size + up, size, { face: o.face, fill: o.fill ?? MG.red, stroke: o.stroke, strokeW: size * .04, align: o.align });
  ctx.restore();
}
// characters fly in from scattered positions and lock into the word; with o.disperse they drift apart and fall on exit
function assemble(ctx, text, t, t0, t1, o = {}) {
  if (t < t0 - .05 || t > t1) return;
  const x = o.x ?? W / 2, y = o.y ?? H * .55, size = o.size ?? 220, f = FACES[o.face ?? 'base'], chars = [...text];
  ctx.font = font(size, f.w, f.fam); const ws = chars.map(c => ctx.measureText(c).width), total = ws.reduce((a, b) => a + b, 0);
  let cx = x - total / 2;
  chars.forEach((c, i) => {
    const k = expoOut(clamp((t - t0 - i * .045) / .5)), ex = clamp((t - (t1 - .6) - i * .05) / .6);
    const sx = hr(-W * .6, W * .6, i, 11), sy = hr(-H * .6, H * .6, i, 12), rot = hr(-2, 2, i, 13) * (1 - k);
    let px = cx + ws[i] / 2 + sx * (1 - k), py = y + sy * (1 - k), a = k;
    if (o.disperse) { px += Math.sin(i * 1.7) * 120 * ex; py += ex * ex * 500; a *= 1 - ex; } else a *= 1 - ex;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(px, py); ctx.rotate(rot + (o.disperse ? ex * hr(-1, 1, i, 14) : 0)); ctx.scale(lerp(2, 1, k), lerp(2, 1, k));
    word(ctx, c, 0, 0, size, { face: o.face, fill: Array.isArray(o.fill) ? o.fill[i % o.fill.length] : (o.fill ?? MG.red), stroke: o.stroke, strokeW: size * .04 });
    ctx.restore(); cx += ws[i];
  });
}
// the word with a cyan/magenta split and slices torn sideways; heavy on entry and on hits
function glitch(ctx, text, t, t0, t1, o = {}) {
  const a = inOut(t, t0, t1, .08, .2); if (a <= 0) return;
  const x = o.x ?? W / 2, y = o.y ?? H * .55, size = o.size ?? 230, fr = Math.floor(t * 30), amt = Math.max(1 - (t - t0) / .5, pulse(t, .18)) * (o.amt ?? 1);
  const c = makeCanvas(W, H), g = c.getContext('2d');
  word(g, text, x, y, size, { face: o.face, fill: o.fill ?? MG.red, stroke: o.stroke ?? MG.cream, strokeW: size * .04 });
  ctx.save(); ctx.globalAlpha = a;
  if (amt > .05) { ctx.globalCompositeOperation = 'screen';
    [['rgba(0,255,255,.6)', -1], ['rgba(255,0,200,.6)', 1]].forEach(([col, d]) => { const q = makeCanvas(W, H), qg = q.getContext('2d'); qg.drawImage(c, 0, 0);
      qg.globalCompositeOperation = 'source-in'; qg.fillStyle = col; qg.fillRect(0, 0, W, H); ctx.drawImage(q, d * 14 * amt, 0); });
    ctx.globalCompositeOperation = 'source-over'; }
  for (let i = 0; i < 12; i++) { const sy = y - size + i * size * 1.3 / 12, sh = size * 1.3 / 12, dx = amt * hr(-1, 1, fr, i) * 90 * (hash(fr, i, 4) > .5 ? 1 : 0);
    ctx.drawImage(c, 0, sy, W, sh, dx, sy, W, sh); }
  ctx.restore();
}

// ---------- the frame around everything: corner marks, section and line labels, timecode, beat dots
const SECTIONS = [[0, 'INTRO'], [0, 'VERSE 01', 0], [7, 'BRIDGE 01', 7], [12, 'CHORUS 01', 12], [20, 'INTERLUDE', -1], [20, 'BRIDGE 02', 20], [26, 'CHORUS 02', 26], [32, 'OUTRO', 32]];
function sectionAt(t) {
  const Ls = DATA.lines, st = i => Ls[i].start - .2;
  if (t < st(0)) return 'INTRO'; if (t < st(7)) return 'VERSE 01'; if (t < st(12)) return 'BRIDGE 01'; if (t < Ls[19].end + .6) return 'CHORUS 01';
  if (t < st(20)) return 'INTERLUDE'; if (t < st(26)) return 'BRIDGE 02'; if (t < st(32)) return 'CHORUS 02'; return 'OUTRO';
}
function hud(ctx, t, a = 1) {
  if (a <= 0) return;
  const m = 44, l = 36, flash = pulse(t, .15);
  ctx.save(); ctx.globalAlpha = a * (.55 + .45 * flash); ctx.strokeStyle = MG.cream; ctx.lineWidth = 2;
  [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath(); ctx.moveTo(x, y + dy * l); ctx.lineTo(x, y); ctx.lineTo(x + dx * l, y); ctx.stroke(); });
  ctx.globalAlpha = a * .8; ctx.fillStyle = MG.cream; ctx.font = font(18, FACES.mono.w, FACES.mono.fam); ctx.textAlign = 'left';
  ctx.fillText(sectionAt(t), m + 50, m + 6);
  const li = DATA.lines.findIndex(L => L.start - .2 > t); const n = li < 0 ? 34 : li;
  ctx.fillText(`LINE ${String(n).padStart(2, '0')} / 34`, m + 50, m + 32);
  ctx.textAlign = 'right'; const f = Math.floor(t * 30); ctx.fillText(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}:${String(f % 30).padStart(2, '0')}`, W - m - 50, m + 6);
  ctx.fillText('152 BPM  ·  SPEED GARAGE', W - m - 50, m + 32);
  const b = Math.max(0, beatIdx(t)) % 8;                      // eight beat dots, the current one red
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i === b ? MG.red : 'rgba(243,236,230,.4)'; ctx.beginPath(); ctx.arc(W / 2 - 70 + i * 20, m, i === b ? 5 + 2 * pulse(t, .2) : 3.5, 0, 7); ctx.fill(); }
  ctx.restore();
}
