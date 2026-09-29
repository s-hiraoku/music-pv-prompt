// stylelab.js: three typography directions for the same chorus lines (12 そう トゲがない / 13 痛々しさが愛しいでしょ？),
// to choose from before the whole video is rebuilt. Open index.html?style=A|B|C (render.mjs --style=A).
const STYLE = new URLSearchParams(location.search).get('style');
const F = {
  tokumin: '"Kaisei Tokumin", serif', bodoni: '"Bodoni Moda", serif', reggae: '"Reggae One", sans-serif',
  stick: '"Stick", sans-serif', train: '"Train One", sans-serif', syne: '"Syne", sans-serif', dot: '"DotGothic16", monospace',
};
const COL = { crimson: '#b0102e', blood: '#5c0616', blush: '#ffc4d3', lilac: '#c9a8ff', plum: '#2a0f2e', magenta: '#ff2bd6',
  cyan: '#2ef2ff', lime: '#d7ff3a', violet: '#3b1d6e', mint: '#b8ffe4', peach: '#ffd1b3' };

function grad(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
function duotone(ctx, dark, light) {
  ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = light; ctx.fillRect(0, 0, W, H); ctx.restore();
}
const sub = (L, a, b, di = .5) => ({ ...L, i: L.i + di, chars: L.chars.slice(a, b) });
// text filled with a photo: draw the text on an offscreen canvas, then the photo "source-in"
function photoText(ctx, L, t, id, at, zoom, o) {
  const c = makeCanvas(W, H), g = c.getContext('2d');
  popLine(g, L, t, { ...o, color: '#000', flash: false });
  g.globalCompositeOperation = 'source-in'; shot(g, id, at, zoom, { sat: 1.2 });
  ctx.drawImage(c, 0, 0);
}

// ---------------- A. Magazine Rose: crimson duotone stills, colour blocks, giant cropped mincho, Bodoni italics
const A = {
  12(ctx, t, s) {
    shot(ctx, 'rose', [lerp(300, 330, s.k), 360], 1.25 + .05 * s.k, { sat: 1 }); duotone(ctx, COL.blood, COL.blush);
    // a crimson block slams in from the left on the first hit, a lilac sliver follows
    const b = expoOut(prog(t, s.L.chars[3][1] - .1, s.L.chars[3][1] + .25));
    ctx.fillStyle = COL.crimson; ctx.fillRect(0, 0, W * .5 * b, H);
    ctx.fillStyle = COL.lilac; ctx.fillRect(W * .5 * b, 0, 18 * b, H);
    // giant English behind
    withAlpha(ctx, .55, () => { ctx.fillStyle = COL.lilac; ctx.font = `italic 700 300px ${F.bodoni}`; ctx.textAlign = 'left';
      ctx.fillText('no thorns', lerp(-200, -80, s.k), H - 120); });
    popLine(ctx, sub(s.L, 0, 2, .1), t, { x: 120, y: 200, size: 90, fam: F.tokumin, weight: 800, align: 'left', color: COL.blush, tilt: 0, flash: false });
    popLine(ctx, sub(s.L, 3, 8), t, { x: W * .08, y: H * .62, size: 330, fam: F.tokumin, weight: 800, align: 'left', tilt: 0, from: 1.35, pop: .08,
      color: (i, g, size) => grad(g, 0, -size, 0, 0, [COL.blush, '#ff8fb0']), shadow: { dx: 14, dy: 14, color: COL.blood }, flashColor: COL.lilac });
    chip(ctx, 'VOL.12  NO THORNS ISSUE', W - 520, 110, 22, COL.blush, COL.crimson);
  },
  13(ctx, t, s) {
    fillBg(ctx, COL.lilac);
    // stripes of crimson sliding at the hits
    const n = Math.max(0, hitIdx(t) - hitIdx(s.t0));
    for (let j = 0; j < 4; j++) { ctx.fillStyle = j % 2 ? COL.crimson : COL.blush; const x = ((n * 140 + j * 480) % (W + 480)) - 240; ctx.fillRect(x, 0, 60, H); }
    const k = s.k;
    photoText(ctx, sub(s.L, 0, 5), t, 'roof', [lerp(900, 470, k), 290], 1.4, { x: 60, y: H * .47, size: 360, fam: F.tokumin, weight: 800, align: 'left', tilt: 0, from: 1.3 });
    popLine(ctx, sub(s.L, 5, 12), t, { x: W - 60, y: H * .9, size: 240, fam: F.tokumin, weight: 800, align: 'right', tilt: 0, from: 1.4,
      color: COL.crimson, shadow: { dx: 10, dy: 10, color: COL.blush }, flashColor: '#fff0f4' });
    withAlpha(ctx, .9, () => { ctx.fillStyle = COL.plum; ctx.font = `italic 600 64px ${F.bodoni}`; ctx.textAlign = 'right';
      ctx.fillText('the ache is the part you love', W - 70, 110); });
  },
};

// ---------------- B. Neon Garage: night city in magenta/cyan, slanted heavy type slammed on the hits, colour swaps
const NEON = [COL.magenta, COL.cyan, COL.lime];
const B = {
  12(ctx, t, s) {
    shot(ctx, 'roof', PHOTOS.roof.city, 1.3 + .1 * s.k, { bright: .55 }); duotone(ctx, '#1a0633', '#ff2bd6');
    // speed bars
    for (let i = 0; i < 14; i++) { const y = hr(0, H, i, 1), w = hr(200, 900, i, 2), x = ((t * hr(900, 2400, i, 3) + hash(i, 4) * W) % (W + w)) - w;
      ctx.fillStyle = `rgba(46,242,255,${hr(.08, .3, i, 5)})`; ctx.fillRect(x, y, w, hr(2, 8, i, 6)); }
    const hi = hitIdx(t), col = NEON[hi % 3];
    popLine(ctx, sub(s.L, 0, 2, .1), t, { x: 140, y: 260, size: 110, fam: F.reggae, weight: 400, align: 'left', skew: -.2, color: COL.cyan, tilt: 0, flash: false,
      glow: { color: COL.cyan, blur: 30 } });
    popLine(ctx, sub(s.L, 3, 8), t, { x: W / 2, y: H * .7, size: 340, fam: F.reggae, weight: 400, skew: -.22, tilt: 0, from: 2.6, pop: .07,
      color: (i, g, size) => grad(g, 0, -size, 0, 0, [COL.lime, col, COL.magenta]), glow: { color: col, blur: 40 },
      echo: { n: 4, dx: -26, dy: 14, color: e => NEON[(hi + e) % 3], alpha: .7, w: 5 }, flashColor: '#fff' });
    sliceGlitch(ctx, pulse(t, .12) * .6, hi, 5);
  },
  13(ctx, t, s) {
    const hi = hitIdx(t);
    shot(ctx, 'smoke', PHOTOS.smoke.face, 1.2 + .03 * pulse(t, .2), { bright: .6 }); duotone(ctx, '#12052b', NEON[(hi + 1) % 3]);
    // every character lands somewhere new, big, rotated; a collage that builds up
    s.L.chars.forEach((ch, i) => popLine(ctx, { i: s.L.i + i * .01, chars: [ch] }, t, {
      x: hr(200, W - 200, s.L.i, i, 1), y: hr(300, H - 120, s.L.i, i, 2), size: hr(200, 330, i, 3), fam: F.reggae, weight: 400,
      skew: -.18, tilt: 0, rotOf: () => hr(-.35, .35, i, 4), from: 2.8, pop: .07, color: NEON[(i + hi) % 3],
      glow: { color: NEON[(i + hi) % 3], blur: 28 }, echo: { n: 2, dx: 14, dy: 10, color: COL.plum, alpha: .9, w: 10 } }));
    ticker(ctx, 'ITAI  ITAI  SHISA GA  ITOSHII  DESHO  ', H - 60, 34, 500, t, '#12052b', COL.lime, 0, 60);
  },
};

// ---------------- C. Iridescent Glitch: flowing pastel gradient, stretched thin type, chromatic offsets, dot tickers
const C = {
  12(ctx, t, s) {
    const g = grad(ctx, 0, 0, W, H, [COL.lilac, COL.mint, COL.blush, COL.peach, COL.lilac]);
    ctx.save(); ctx.translate(-((t * 120) % W), 0); ctx.fillStyle = g; ctx.fillRect(0, 0, W * 2, H); ctx.restore();
    ctx.save(); ctx.globalAlpha = .55; ctx.globalCompositeOperation = 'multiply'; shot(ctx, 'near', PHOTOS.near.face, 1.2, { sat: .6 }); ctx.restore();
    for (let r = 0; r < 3; r++) ticker(ctx, 'SOU TOGE GA NAI // そう トゲがない // ', 70 + r * 46, 26, (r % 2 ? -1 : 1) * 220, t, COL.violet, null, 0);
    const L = sub(s.L, 3, 8), hi = hitIdx(t);
    const common = { x: W / 2, y: H * .76, size: 260, fam: F.stick, weight: 400, sx: 1.35, tilt: 0, from: 1.8, pop: .08, flash: false };
    popLine(ctx, L, t, { ...common, jx: () => -10 - 18 * pulse(t, .2), color: COL.magenta });
    popLine(ctx, L, t, { ...common, jx: () => 10 + 18 * pulse(t, .2), color: '#16c8e0' });
    popLine(ctx, L, t, { ...common, color: COL.violet });
    popLine(ctx, sub(s.L, 0, 2, .1), t, { x: W / 2, y: H * .36, size: 120, fam: F.train, weight: 400, sx: 1.3, tilt: 0, color: COL.violet, flash: false });
    sliceGlitch(ctx, pulse(t, .1) * .5, hi, 4);
  },
  13(ctx, t, s) {
    const g = grad(ctx, 0, H, W, 0, [COL.blush, COL.lilac, COL.mint, COL.peach]);
    fillBg(ctx, g);
    ctx.save(); ctx.globalAlpha = .6; ctx.globalCompositeOperation = 'multiply';
    shot(ctx, 'lookup', PHOTOS.lookup.face, 1.15, { rect: [W * .55, 0, W * .45, H], sat: .7 }); ctx.restore();
    // outlined echo rows behind, solid rows in front, both stretched
    for (let r = 0; r < 4; r++) withAlpha(ctx, .35, () => popLine(ctx, s.L, t, { x: 40, y: 220 + r * 230, size: 130, fam: F.train, weight: 400, sx: 1.25,
      align: 'left', color: COL.violet, tilt: 0, flash: false, outlineOnly: true }));
    const common = { x: 70, size: 215, fam: F.stick, weight: 400, sx: 1.3, align: 'left', tilt: 0, from: 1.6, pop: .08 };
    popLine(ctx, sub(s.L, 0, 5), t, { ...common, y: H * .45, color: COL.violet, flashColor: COL.magenta, shadow: { dx: 8, dy: 0, color: COL.magenta } });
    popLine(ctx, sub(s.L, 5, 12), t, { ...common, y: H * .8, color: COL.violet, flashColor: '#16c8e0', shadow: { dx: -8, dy: 0, color: '#16c8e0' } });
    ctx.fillStyle = COL.violet; ctx.font = `400 26px ${F.dot}`; ctx.textAlign = 'right';
    ctx.fillText(`REC ● ${t.toFixed(2)}s  ITOSHII.EXE`, W - 60, 80);
  },
};

if (STYLE) { const S = { A, B, C, R: RISO_SCENES }[STYLE]; if (S) for (const k of Object.keys(S)) SCENES[k] = S[k]; }
