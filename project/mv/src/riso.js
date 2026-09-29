// riso.js: the print look. Stills are risograph prints (design/riso.py: navy + fluoro pink + rose red on cream,
// halftoned, out of register) with the character cut out as her own layer, so type can sit behind her. Type is
// never laid on top as a font: it is rasterised, inked (multiply), speckled and misregistered like the pictures.
const INK = { paper: '#f1e9da', navy: '#1d2a6b', pink: '#ff5fa2', red: '#d61e3a', cream: '#fbf5ea' };
const RISO = {};                               // id -> { full, fg, s } (s: riso px per source-crop px)
const RISO_IDS = ['room', 'rose', 'lying', 'sit', 'roof', 'sunset', 'near', 'lookup', 'smoke'];

function loadRiso() {
  const load = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  return Promise.all(RISO_IDS.map(async id => {
    const [full, fg] = await Promise.all([load(`../design/riso/${id}_full.jpg`), load(`../design/riso/${id}_fg.png`)]);
    RISO[id] = { full, fg, s: full.width / PHOTOS[id].crop[2] };
  }));
}

// Like shot() but on the riso print; `layer` 'full' (whole print) or 'fg' (character only). `at` is in the same
// source-crop coordinates as PHOTOS, so all the points of interest still apply.
function rshot(ctx, id, at, zoom, o = {}) {
  const R = RISO[id]; if (!R) return;
  const im = o.layer === 'fg' ? R.fg : R.full, [rx, ry, rw, rh] = o.rect ?? [0, 0, W, H];
  const s = Math.max(rw / im.width, rh / im.height) * zoom;
  const pos = o.pos ?? [rx + rw / 2, ry + rh / 2];
  let x = pos[0] - at[0] * R.s * s, y = pos[1] - at[1] * R.s * s;
  if (!o.free) { x = Math.min(rx, Math.max(rx + rw - im.width * s, x)); y = Math.min(ry, Math.max(ry + rh - im.height * s, y)); }
  ctx.save(); ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.drawImage(im, x, y, im.width * s, im.height * s);
  ctx.restore();
}
// same framing for both layers, returned as a function so a scene can draw bg, then type, then her
function rframe(id, t, s, a, b, kick = 1) {
  const k = easeInOut(s.k), z = lerp(a.zoom, b.zoom, k) * (1 + .045 * kick * pulse(t, .2));
  const at = [lerp(a.at[0], b.at[0], k), lerp(a.at[1], b.at[1], k)];
  return (ctx, layer, extra = {}) => rshot(ctx, id, at, z, { layer, ...extra });
}

// ---- inked type
let SPECK;
function speckle() {            // white flecks where the ink didn't take (tiled texture)
  if (SPECK) return SPECK;
  SPECK = makeCanvas(512, 512); const g = SPECK.getContext('2d'); const d = g.createImageData(512, 512);
  for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 5); d.data[i + 3] = v > .93 ? 255 : v > .88 ? 90 : 0; }
  g.putImageData(d, 0, 0); return SPECK;
}
// Rasterise whatever `draw(g)` paints (in black) and print it: fill ink, optional misregistered outline ink,
// speckles, multiplied onto the frame like ink on paper.
function inked(ctx, draw, o) {
  const c = makeCanvas(W, H), g = c.getContext('2d'); draw(g);
  const plate = (ink, dx, dy, stroke) => {
    const p = makeCanvas(W, H), q = p.getContext('2d');
    if (stroke) {   // outline plate: dilate the shape by drawing it offset in a ring, then cut the shape out
      for (let a = 0; a < 12; a++) q.drawImage(c, Math.cos(a * Math.PI / 6) * stroke, Math.sin(a * Math.PI / 6) * stroke);
      if (o.hollow !== false) { q.globalCompositeOperation = 'destination-out'; q.drawImage(c, 0, 0); }
    } else q.drawImage(c, 0, 0);
    q.globalCompositeOperation = 'source-in'; q.fillStyle = ink; q.fillRect(0, 0, W, H);
    q.globalCompositeOperation = 'destination-out'; q.fillStyle = q.createPattern(speckle(), 'repeat');
    q.save(); q.translate(hash(Math.floor((o.t ?? 0) * 8)) * 512, 0); q.fillRect(-512, 0, W + 512, H); q.restore();
    ctx.save(); ctx.globalCompositeOperation = o.blend ?? 'multiply'; ctx.globalAlpha = o.alpha ?? 1; ctx.drawImage(p, dx, dy); ctx.restore();
  };
  if (o.fill) plate(o.fill, 0, 0, 0);
  if (o.outline) plate(o.outline, o.reg?.[0] ?? 5, o.reg?.[1] ?? 4, o.outlineW ?? 8);
}
// big printed lyric: popLine rasterised and inked
function printLine(ctx, L, t, o) {
  inked(ctx, g => popLine(g, L, t, { ...o, color: '#000', flash: false, stroke: null, shadow: null }), { t, ...o.ink });
}

// ---- printed ephemera
function paperTag(ctx, x, y, w, h, rot, drawInside) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(29,42,107,.25)'; ctx.fillRect(6, 8, w, h);
  ctx.fillStyle = INK.cream; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(29,42,107,.35)'; ctx.lineWidth = 2; ctx.strokeRect(6, 6, w - 12, h - 12);
  drawInside(ctx, w, h); ctx.restore();
}
function tagText(ctx, text, x, y, size, ink, fam = FACES.label.fam, w = FACES.label.w) {
  ctx.fillStyle = ink; ctx.font = font(size, w, fam); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x, y);
}
// small, quiet lyric: printed on a paper tag, characters typed on as sung
function quietLine(ctx, L, t, x, y, rot = -.02) {
  const shown = L.chars.filter(([, ct]) => t >= ct - .03).map(([c]) => c).join('');
  const w = Math.max(360, measure(ctx, L.text, 46, FACES.label.w, FACES.label.fam) + 70);
  paperTag(ctx, x, y, w, 110, rot, (g) => {
    tagText(g, `LYRIC ${String(Math.floor(L.i) + 1).padStart(2, '0')}`, 24, 34, 18, INK.pink, FACES.mono.fam, FACES.mono.w);
    tagText(g, shown, 24, 86, 46, INK.navy);
  });
}

// sunburst rays in an ink, rotating slowly, printed (multiply) on paper
function sunburst(ctx, cx, cy, t, ink, n = 18, spin = .05) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = ink; ctx.translate(cx, cy); ctx.rotate(t * spin);
  for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, 2600, a, a + Math.PI / n); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// a halftone dot field (fade across the frame), printed in an ink
function dotField(ctx, ink, step, fn) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; halftone(ctx, ink, step, step * .55, fn); ctx.restore(); }
// paper grain + a hair of misregistration on the whole print
function printFinish(ctx, t) {
  grain(ctx, t, .12);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(241,233,218,.18)'; ctx.fillRect(0, 0, W, H); ctx.restore();
}

// ================= riso scenes for the chorus sample (lines 12-15)
const RISO_SCENES = {
  // 12 そう トゲがない — impact. Sunburst, her cut out in front, the words huge behind her and cropped by the frame
  12(ctx, t, s) {
    fillBg(ctx, INK.paper);
    sunburst(ctx, W * .5, H * .45, t, 'rgba(255,95,162,.55)');
    dotField(ctx, INK.navy, 26, (x, y) => clamp((y - .55) * 1.4) * .5);
    const f = rframe('rose', t, s, { at: [320, 420], zoom: 1.0 }, { at: [320, 340], zoom: 1.08 });
    const L = s.L, big = { ...L, i: L.i + .5, chars: L.chars.slice(3) };
    f(ctx, 'fg', { rect: [W * .25, 0, W * .5, H], pos: [W * .5, H * .36] });
    printLine(ctx, big, t, { x: W / 2, y: H - 40, size: 330, fam: FACES.loud.fam, weight: FACES.loud.w, tilt: 0, from: 1.5, pop: .08,
      ink: { fill: INK.pink, outline: INK.navy, outlineW: 10, reg: [7, 5] } });
    // tags
    paperTag(ctx, 60, 60, 330, 130, -.03, (g) => {
      tagText(g, 'THORNS', 26, 44, 26, INK.navy); tagText(g, '棘の数', 170, 44, 18, INK.navy, FACES.mono.fam, FACES.mono.w);
      const v = Math.max(0, 8 * (1 - prog(t, s.t0, s.L.end)));
      tagText(g, `${v.toFixed(1)}%`, 26, 110, 58, INK.red, FACES.loud.fam, FACES.loud.w);
    });
    paperTag(ctx, W - 390, 70, 320, 80, .02, (g) => {
      g.fillStyle = INK.red; g.beginPath(); g.arc(30, 40, 9, 0, 7); g.fill();
      tagText(g, `LIVE  ${(t).toFixed(2)}s`, 50, 52, 30, INK.navy, FACES.mono.fam, FACES.mono.w);
    });
    printLine(ctx, { ...L, chars: L.chars.slice(0, 2) }, t, { x: 110, y: 330, size: 110, fam: FACES.loud.fam, weight: FACES.loud.w, align: 'left', tilt: 0, from: 1.3,
      ink: { fill: INK.navy } });
  },
  // 13 痛々しさが愛しいでしょ？ — impact. Rooftop print; the first half huge behind her head, the second half in front,
  // outline only, so she is sandwiched between the words
  13(ctx, t, s) {
    const f = rframe('roof', t, s, { at: [700, 330], zoom: 1.05 }, { at: [470, 300], zoom: 1.22 });
    f(ctx, 'full');
    const L = s.L, a = { ...L, chars: L.chars.slice(0, 5) }, b = { ...L, i: L.i + .5, chars: L.chars.slice(5) };
    printLine(ctx, a, t, { x: 60, y: H * .36, size: 320, align: 'left', fam: FACES.rose.fam, weight: FACES.rose.w, tilt: 0, from: 1.4, pop: .08,
      ink: { fill: INK.red, outline: INK.navy, outlineW: 7, reg: [6, 5] } });
    f(ctx, 'fg');
    printLine(ctx, b, t, { x: W - 60, y: H * .93, size: 230, align: 'right', fam: FACES.rose.fam, weight: FACES.rose.w, tilt: 0, from: 1.3,
      ink: { fill: INK.navy, outline: INK.pink, outlineW: 7, reg: [6, 5] } });
    // hit bursts: halftone circles in pink
    const p = pulse(t, .35); if (p > 0) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.strokeStyle = INK.pink; ctx.lineWidth = 14 * p;
      ctx.beginPath(); ctx.arc(W * .72, H * .3, 420 * (1 - p) + 60, 0, 7); ctx.stroke(); ctx.restore(); }
  },
  // 14 わたしになれないヒト — impact. Three of her: the print in the middle, flat single-ink copies either side
  14(ctx, t, s) {
    fillBg(ctx, INK.paper);
    dotField(ctx, INK.pink, 22, (x, y) => .25 + .35 * Math.sin(x * 6 + t));
    const n = clamp(hitIdx(t) - hitIdx(s.t0) + 1, 1, 3), sw = W / 3;
    const panel = (col, ink) => {
      const rect = [col * sw + 10, 40, sw - 20, H - 80], age = t - (DATA.hits[hitIdx(s.t0) + [1, 0, 2].indexOf(col)] ?? s.t0);
      const z = lerp(1.2, 1, expoOut(clamp(age / .35)));
      if (!ink) { rshot(ctx, 'room', [PHOTOS.room.face[0], PHOTOS.room.face[1] + 80], 1.0 * z, { rect }); return; }
      const c = makeCanvas(W, H), g = c.getContext('2d');
      g.filter = 'grayscale(1) contrast(1.3)'; rshot(g, 'room', [PHOTOS.room.face[0] + (col - 1) * 90, PHOTOS.room.face[1] + 80], 1.1 * z, { rect }); g.filter = 'none';
      g.globalCompositeOperation = 'multiply'; g.fillStyle = ink; g.fillRect(...rect);
      ctx.drawImage(c, 0, 0);
    };
    panel(1, null); if (n >= 2) panel(0, INK.pink); if (n >= 3) panel(2, INK.navy);
    printLine(ctx, s.L, t, { x: W / 2 - 60, y: 60, size: 96, fam: FACES.loud.fam, weight: FACES.loud.w, vertical: true, align: 'top', tilt: 0,
      ink: { fill: INK.red, outline: INK.navy, outlineW: 6, reg: [8, 6] } });
  },
  // 15 激しくふりほどくの — quiet. Hard cuts between two prints on the hits, torn paper strips flying; the lyric is
  // only a small printed tag
  15(ctx, t, s) {
    const hi = hitIdx(t), id = hi % 2 ? 'lying' : 'sit', kick = pulse(t, .16);
    rshot(ctx, id, PHOTOS[id].face, (1.15 + .08 * hash(hi)) * (1 + .06 * kick));
    for (let i = 0; i < 6; i++) {                     // torn strips shaken off on the hits
      const age = sinceHit(t); if (age > .5) break;
      ctx.save(); ctx.translate(hr(200, W - 200, hi, i), hr(150, H - 150, hi, i, 1) - age * 600); ctx.rotate(hr(-.6, .6, hi, i, 2) + age * 3);
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = [INK.pink, INK.navy, INK.red][i % 3]; ctx.fillRect(-120, -18, 240, 36); ctx.restore();
    }
    quietLine(ctx, s.L, t, 70, H - 200);
    sliceGlitch(ctx, kick * .5, hi, 5);
  },
};
