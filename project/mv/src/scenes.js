// scenes.js: one scene per lyric line (SCENES[i]) plus intro, instrumental montage and outro. Each scene gets
// (ctx, t, s) with s = { L (the line), lt (t - line start), t0/t1 (window), k (0..1 through the window) }.
// The protagonist exists only as film stills (photos.js); motion comes from the camera, the cuts and the type.
const SCENES = {};

// ---------- shared pieces

function dim(ctx, a, col = '10,8,14') { ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(0, 0, W, H); }
function bottomShade(ctx, a = .75) {
  const g = ctx.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(10,8,14,0)'); g.addColorStop(1, `rgba(10,8,14,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function caption(ctx, text, x, y, a = 1, align = 'left') {
  withAlpha(ctx, a, () => { ctx.fillStyle = PAL.fog; ctx.font = font(26, 500, FONT_EN); ctx.textAlign = align; ctx.fillText(text, x, y); });
}
// a slow push toward a point of a photo across the scene window, snapping on hits
function push(ctx, id, pt, t, s, z0, z1, o = {}) {
  const at = typeof pt === 'string' ? PHOTOS[id][pt] : pt;
  moveShot(ctx, id, t, s.t0, s.t1, { at, zoom: z0 }, { at, zoom: z1 }, { kick: 1, ...o });
}
// a hit-driven detail cut (for montage and flashes)
function detailCut(ctx, t, seed, o = {}) {
  const i = Math.max(0, hitIdx(t)), [id, pt, z] = DETAILS[Math.floor(hash(seed, i) * DETAILS.length)];
  const since = sinceHit(t);
  shot(ctx, id, PHOTOS[id][pt], z * (1 + .06 * Math.max(0, 1 - since / .25)) + since * .03, o);
}
// a hard diagonal split: `a` everywhere, `b` clipped to one side; the split jumps on each hit
function diagonal(ctx, t, s, a, b) {
  const jumps = Math.max(0, hitIdx(t) - hitIdx(s.t0));
  const ang = -.32 + (jumps % 2 ? .1 : -.06) + s.k * .05, off = (hash(jumps, 11) - .5) * 260;
  a();
  ctx.save(); ctx.beginPath(); const cx = W / 2 + off, cy = H / 2, d = 3000;
  ctx.moveTo(cx - Math.cos(ang) * d, cy - Math.sin(ang) * d); ctx.lineTo(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d);
  ctx.lineTo(cx + Math.cos(ang) * d + Math.sin(ang) * d, cy + Math.sin(ang) * d - Math.cos(ang) * d);
  ctx.lineTo(cx - Math.cos(ang) * d + Math.sin(ang) * d, cy - Math.sin(ang) * d - Math.cos(ang) * d); ctx.closePath();
  ctx.clip(); b(); ctx.restore();
  return jumps;
}
// the negative of a photo: mono, brightened, then inverted
function negative(ctx, id, at, z) {
  shot(ctx, id, at, z, { mono: 1, bright: 1.6 });
  ctx.save(); ctx.globalCompositeOperation = 'difference'; fillBg(ctx, '#fff'); ctx.restore();
}
// ink tiles, one per character, for lines that read like labels or warnings
function tiles(ctx, L, t, x, y, size, bg = PAL.ink, fg = PAL.paper) {
  let cx = x;
  L.chars.forEach(([c, ct]) => {
    if (!c.trim()) { cx += size * .4; return; }
    const k = (t - ct + .03) / .1;
    if (k >= 0) {
      const s = lerp(.6, 1, backOut(clamp(k)));
      ctx.save(); ctx.translate(cx + size / 2, y); ctx.scale(s, s);
      ctx.fillStyle = bg; ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.fillStyle = fg; ctx.font = font(size * .72, FACES.label.w, FACES.label.fam); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(c, 0, size * .03); ctx.restore();
    }
    cx += size * 1.06;
  });
}
// strips of one photo: colour in the middle, grey blurred copies around it; strips land on the hits
function strips(ctx, t, s, id, n = 3, drift = 60) {
  fillBg(ctx, PAL.ink);
  const sw = W / n, mid = Math.floor(n / 2), shown = clamp(hitIdx(t) - hitIdx(s.t0) + 1, 1, n);
  const order = [mid, ...Array.from({ length: n }, (_, j) => j).filter(j => j !== mid)];
  for (let j = 0; j < shown; j++) {
    const col = order[j], me = col === mid, age = t - (DATA.hits[hitIdx(s.t0) + j] ?? s.t0);
    const z = lerp(1.25, 1, expoOut(clamp(age / .35)));
    shot(ctx, id, [PHOTOS[id].face[0] + (col - mid) * drift, PHOTOS[id].face[1] + 60], (me ? 1.05 : 1.2) * z,
      { rect: [col * sw + 6, 0, sw - 12, H], mono: me ? 0 : 1, blur: me ? 0 : 5, bright: me ? 1 : .6, ghost: me ? 3 : 0 });
  }
}
// caution tape bands
function caution(ctx, t, s, words) {
  [[H * .2, -.12, 1], [H * .52, .08, -1.3], [H * .83, -.05, .8]].forEach(([y, a, v], i) => {
    const k = clamp((t - s.t0 - i * .12) / .2); if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k; ticker(ctx, words, y, 38, 260 * v, t, PAL.ink, i === 1 ? PAL.rose : PAL.lav, a, 64); ctx.restore();
  });
}
// heat: rose tint, flames, the type wobbling
function heat(ctx, t, s, id, big) {
  push(ctx, id, 'face', t, s, big ? 1.35 : 1.15, big ? 1.6 : 1.3, { sat: .6, ghost: 6 });
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(200,71,95,.55)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  flames(ctx, t, 'rgba(125,36,54,.85)', 'rgba(200,71,95,.8)', big ? 460 : 320);
  popLine(ctx, s.L, t, { x: W / 2, y: H * .5, size: big ? 200 : 160, color: PAL.paper, tilt: 3, from: 1.7,
    jy: i => Math.sin(t * 9 + i * 1.3) * (big ? 14 : 8), shadow: { dx: 0, dy: 10, color: PAL.roseDeep } });
  if (big) sliceGlitch(ctx, pulse(t, .15), hitIdx(t), 8);
}

// ---------- intro: a blurred close-up slowly focusing, then cuts every two beats while the title types itself
function sceneIntro(ctx, t, s) {
  fillBg(ctx, PAL.ink);
  const firstHit = DATA.hits.find(h => h > 6) ?? 6.5;
  if (t < firstHit) {
    const k = prog(t, 0, firstHit);
    shot(ctx, 'rose', PHOTOS.rose.face, lerp(1.6, 1.35, k), { blur: lerp(30, 6, easeOut(k)), bright: lerp(.3, .75, k), sat: .7 });
  } else {
    const b = Math.floor((beatIdx(t) - beatIdx(firstHit)) / 2);
    if (b % 2) { const id = CUTS[Math.floor(hash(b, 4) * CUTS.length)]; shot(ctx, id, PHOTOS[id].face, 1.25 + sinceBeat(t) * .05, { blur: 1.5, sat: .75, bright: .8 }); }
    else detailCut(ctx, t, 21, { blur: 2, sat: .7, bright: .75 });
    dim(ctx, .35);
  }
  titleCard(ctx, t, firstHit, s.t1);
}

// The title: a drawn rose opens behind it, the characters rise one per beat in a heavy mincho with 薔薇 glowing
// rose-red, petals drift, then everything holds and is cut away by the first line.
function titleCard(ctx, t, t0, t1) {
  if (t < t0 - .4) return;
  const k = prog(t, t0 - .4, t0 + 3.2), cx = W / 2, cy = H * .47;
  // glow + rose
  const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 620);
  g.addColorStop(0, `rgba(200,71,95,${.45 * k})`); g.addColorStop(1, 'rgba(200,71,95,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  dim(ctx, .35 * k);
  withAlpha(ctx, .6 * k, () => rose(ctx, cx, cy, lerp(140, 380, easeOut(k)) * (1 + .03 * pulse(t, .2)), t,
    { bloom: easeOut(k), colour: PAL.roseDeep, line: 'rgba(244,242,238,.35)' }));
  petals(ctx, t, t0, 30, 'rgba(200,71,95,.7)');
  // the title, one character per beat
  const title = '私の薔薇には棘がない', bs = DATA.beats.filter(h => h >= t0 - .01);
  const size = 150, rose2 = i => i === 2 || i === 3;
  ctx.save(); ctx.shadowColor = 'rgba(200,71,95,.9)';
  const L = { i: 900, chars: [...title].map((c, i) => [c, bs[i] ?? 99]) };
  ctx.shadowBlur = 40;
  popLine(ctx, L, t, { x: cx, y: cy + size * .36, size, fam: FONT_HERO, weight: 900, color: i => rose2(i) ? '#e0566f' : PAL.white,
    lead: 0, pop: .16, tilt: 0, from: 2.2, flashColor: '#ffd9df', spacing: .04 });
  ctx.restore();
  // rules and English title once the Japanese is complete
  const done = bs[title.length - 1] ?? t0 + 4, r = easeOut(prog(t, done, done + .6));
  if (r > 0) {
    ctx.strokeStyle = `rgba(244,242,238,${.7 * r})`; ctx.lineWidth = 2;
    [[-1, cy - size * .85], [1, cy + size * .75]].forEach(([d, y]) => { ctx.beginPath(); ctx.moveTo(cx - 760 * r, y); ctx.lineTo(cx + 760 * r, y); ctx.stroke(); });
    withAlpha(ctx, r, () => {
      ctx.fillStyle = PAL.paper; ctx.font = font(64, 500, FONT_EN); ctx.textAlign = 'center';
      ctx.fillText('My rose has no thorns', cx, cy + size * .75 + 72);
      caption(ctx, 'Flehmann × OTO MAYUMI', cx, cy + size * .75 + 116, 1, 'center');
    });
  }
}

// ---------- verse 1

// 0 強いコントラスト: colour against its negative, split on a diagonal that jumps on the hits
SCENES[0] = (ctx, t, s) => {
  const size = fitSize(ctx, s.L.text, W * .8, 250), at = [lerp(430, 480, s.k), 300], z = 1.3 * (1 + .05 * pulse(t, .18));
  const type = col => popLine(ctx, s.L, t, { x: W / 2, y: H * .64, size, color: col, flash: false, from: 1.45, pop: .09, tilt: 0 });
  const jumps = diagonal(ctx, t, s, () => { shot(ctx, 'roof', at, z, { sat: .8 }); dim(ctx, .25); type(PAL.paper); },
    () => { negative(ctx, 'roof', at, z); type(PAL.ink); });
  chip(ctx, 'STRONG CONTRAST', 80, 120, 20, PAL.lav, PAL.ink);
  caption(ctx, `${String(jumps).padStart(2, '0')} / BLACK ⟷ WHITE`, 80, 160);
};

// 1 怪我なしでは出られない迷路: a maze drawn over the room; the words in ink tiles
SCENES[1] = (ctx, t, s) => {
  push(ctx, 'room', 'face', t, s, 1.05, 1.25, { sat: .7, bright: .7 });
  dim(ctx, .3);
  const z = lerp(1.12, 1, easeOut(s.k));
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  maze(ctx, clamp(s.k * 1.6 + .1), 'rgba(232,229,224,.55)', 72, -48, -36);
  ctx.restore();
  tiles(ctx, s.L, t, 150, H - 190, 86);
};

// 2 無理矢理 白く塗り潰した汚い夢: scribbles pile up over her, then a white roller paints the frame over
SCENES[2] = (ctx, t, s) => {
  push(ctx, 'lying', 'face', t, s, 1.1, 1.35, { sat: .8 });
  const h0 = hitIdx(s.t0), n = Math.max(0, hitIdx(t) - h0 + 1);
  for (let i = 0; i < Math.min(n, 9); i++)
    scribble(ctx, 40 + i, clamp((t - (DATA.hits[h0 + i] ?? s.t0)) / .25), i % 3 ? PAL.ink : PAL.roseDeep, hr(300, W - 300, i, 1), hr(250, H - 250, i, 2), hr(160, 320, i, 3));
  const paint = easeInOut(prog(t, s.L.chars[5][1], s.L.end));   // the roller finishes as the line does
  if (paint > 0) {
    ctx.fillStyle = PAL.white; ctx.beginPath(); ctx.moveTo(0, 0);
    const x = paint * (W + 200);
    for (let y = 0; y <= H; y += 40) ctx.lineTo(x - hash(y, 7) * 60, y);
    ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  }
  popLine(ctx, s.L, t, { x: W / 2, y: H * .56, size: fitSize(ctx, s.L.text, W * .86, 150), color: PAL.ink, flashColor: PAL.rose, stroke: PAL.white, strokeW: 14, tilt: 3 });
};

// 3 わたしになれないヒト: the rose portrait, two grey ghost copies drifting apart; vertical type
SCENES[3] = (ctx, t, s) => {
  fillBg(ctx, PAL.ink);
  const k = easeInOut(s.k), rect = [W * .38, 0, W * .62, H];
  [-1, 1].forEach(d => shot(ctx, 'rose', [320 + d * lerp(40, 120, k), 330], 1.15, { alpha: .22, mono: 1, blur: 4, rect }));
  shot(ctx, 'rose', [lerp(320, 330, k), lerp(360, 320, k)], lerp(1.05, 1.18, k) * (1 + .04 * pulse(t)), { rect, ghost: 3 });
  popLine(ctx, s.L, t, { x: W * .2, y: 150, size: 108, color: PAL.paper, vertical: true, align: 'top', tilt: 2 });
  ctx.strokeStyle = 'rgba(232,229,224,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * .29, 150); ctx.lineTo(W * .29, H - 150); ctx.stroke();
  caption(ctx, 'SOMEONE WHO CAN\'T BE ME', W * .3 + 20, H - 150);
};

// 4 うるさくしがみつくの: the line repeated as clutter piling up on the hits, the real line bold in the middle
SCENES[4] = (ctx, t, s) => {
  push(ctx, 'room', 'hand', t, s, 1.3, 1.5, { mono: .5, bright: .7 });
  const n = Math.max(0, hitIdx(t) - hitIdx(s.t0) + 1) * 3;
  for (let i = 0; i < Math.min(n, 40); i++) {
    ctx.save(); ctx.translate(hr(0, W, i, 1), hr(0, H, i, 2)); ctx.rotate(hr(-.4, .4, i, 3));
    ctx.font = font(hr(24, 60, i, 4), FACES.loud.w, FACES.loud.fam); ctx.fillStyle = `rgba(232,229,224,${hr(.2, .5, i, 5)})`; ctx.fillText(s.L.text, 0, 0); ctx.restore();
  }
  const shake = pulse(t, .12) * 10;
  popLine(ctx, s.L, t, { x: W / 2 + hr(-1, 1, t) * shake, y: H * .55, size: 140, color: PAL.paper, stroke: PAL.ink, strokeW: 18, tilt: 5 });
};

// 5 気をつけて？ / 18 気をつけて: caution tape across her
SCENES[5] = (ctx, t, s) => {
  push(ctx, 'roof', 'face', t, s, 1.4, 1.55, { sat: .7, bright: .8 });
  caution(ctx, t, s, 'CAUTION ／ 気をつけて ／ ');
  popLine(ctx, s.L, t, { x: W / 2, y: H * .62, size: 170, color: PAL.paper, stroke: PAL.ink, strokeW: 22, tilt: 4 });
};
SCENES[18] = (ctx, t, s) => {
  push(ctx, 'room', 'face', t, s, 1.3, 1.5, { sat: .7, bright: .8 });
  caution(ctx, t, s, 'HANDLE WITH CARE ／ 気をつけて ／ ');
  popLine(ctx, s.L, t, { x: W / 2, y: H * .62, size: 170, color: PAL.paper, stroke: PAL.ink, strokeW: 22, tilt: 4 });
};

// 6 / 19 ヤケドするよ
SCENES[6] = (ctx, t, s) => heat(ctx, t, s, 'rose', false);
SCENES[19] = (ctx, t, s) => heat(ctx, t, s, 'roof', true);

// 7 「まだですか？」 / 8 「またですか？」: flat speech boxes over a slow push; the second answers from the right
function asking(ctx, t, s, left) {
  push(ctx, 'sit', 'face', t, s, 1.15, 1.35, { sat: .7, bright: .75, blur: 1 });
  dim(ctx, .25);
  const L = s.L, size = 88, c0 = L.chars[0][1];
  if (t >= c0 - .05) {
    const w = measure(ctx, L.text, size) + 80, x0 = left ? 220 : W - 220 - w, k = backOut(clamp((t - c0 + .05) / .15));
    ctx.save(); ctx.translate(x0, H * .3); ctx.scale(k, k);
    ctx.fillStyle = PAL.paper; ctx.fillRect(0, 0, w, size * 1.6);
    const tx = left ? 60 : w - 60; ctx.beginPath(); ctx.moveTo(tx, size * 1.6); ctx.lineTo(tx, size * 2.1); ctx.lineTo(tx + (left ? 60 : -60), size * 1.6); ctx.fill();
    ctx.restore();
    popLine(ctx, L, t, { x: x0 + 40, y: H * .3 + size * 1.12, size, align: 'left', color: PAL.ink, flashColor: PAL.rose, tilt: 0, from: 1.2 });
  }
  caption(ctx, left ? 'NOT YET?' : 'AGAIN?', left ? 220 : W - 220, H * .3 - 24, 1, left ? 'left' : 'right');
}
SCENES[7] = (ctx, t, s) => asking(ctx, t, s, true);
SCENES[8] = (ctx, t, s) => {
  asking(ctx, t, s, false);
  withAlpha(ctx, .35, () => popLine(ctx, DATA.lines[7], 999, { x: 260, y: H * .62, size: 60, align: 'left', color: PAL.paper, tilt: 0 }));
};

// 9 脳内フラッシュバック: strobing cuts across every still, inverted on alternate frame pairs
SCENES[9] = (ctx, t, s) => {
  const f = Math.floor(t * FPS), id = CUTS[Math.floor(hash(Math.floor(t * 10), 3) * CUTS.length)], inv = (f >> 1) % 2;
  shot(ctx, id, PHOTOS[id].face, 1.2 + hash(f >> 2) * .5, { sat: .6 });
  if (inv) invertFrame(ctx);
  popLine(ctx, s.L, t, { x: W / 2, y: H * .58, size: fitSize(ctx, s.L.text, W * .9, 190), color: inv ? PAL.ink : PAL.paper, tilt: 2, flash: false });
  sliceGlitch(ctx, .6, f >> 1, 6);
};

// 10 操ろうとしたって もう: puppet strings drop from above to her hand
SCENES[10] = (ctx, t, s) => {
  push(ctx, 'room', 'hand', t, s, 1.35, 1.6, { sat: .7, bright: .8 });
  dim(ctx, .2);
  ctx.strokeStyle = 'rgba(232,229,224,.7)'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const x = W * .35 + i * 90 + Math.sin(t * 2 + i) * 20, len = lerp(0, H * .55, easeOut(prog(t, s.t0 + i * .08, s.t0 + .6 + i * .08)));
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + Math.sin(t * 1.5 + i) * 30, len); ctx.stroke();
  }
  popLine(ctx, s.L, t, { x: 120, y: H - 140, size: 110, align: 'left', color: PAL.paper, tilt: 2 });
};

// 11 時間切れ（タイムオーバー）: a countdown to zero, then the stamp
SCENES[11] = (ctx, t, s) => {
  fillBg(ctx, PAL.ink);
  shot(ctx, 'sit', PHOTOS.sit.neon, 1.6, { blur: 12, bright: .4 });
  const end = s.L.end - .25, left = Math.max(0, end - t);
  ctx.fillStyle = left > 0 ? PAL.lav : PAL.rose; ctx.font = font(240, FACES.pixel.w, FACES.pixel.fam); ctx.textAlign = 'center';
  ctx.fillText(`00:0${Math.floor(left)}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`, W / 2, H * .52);
  popLine(ctx, s.L, t, { x: W / 2, y: H * .25, size: 86, color: PAL.paper, tilt: 0 });
  if (left <= 0) {
    const k = backOut(clamp((t - end) / .15));
    ctx.save(); ctx.translate(W / 2, H * .75); ctx.rotate(-.12); ctx.scale(k, k);
    ctx.strokeStyle = PAL.rose; ctx.lineWidth = 8; ctx.strokeRect(-330, -80, 660, 140);
    ctx.fillStyle = PAL.rose; ctx.font = font(96, FACES.pixel.w, FACES.pixel.fam); ctx.fillText('TIME OVER', 0, 30); ctx.restore();
  }
};

// ---------- chorus 1

// 12 そう トゲがない: the rose portrait framed on the right, the same image huge and out of focus behind it
SCENES[12] = (ctx, t, s) => {
  fillBg(ctx, PAL.ink);
  shot(ctx, 'rose', PHOTOS.rose.face, 1.5, { blur: 34, bright: .45, sat: .7 });
  const rect = [W * .47, 110, W * .43, H - 220], k = easeInOut(s.k), kick = pulse(t, .2);
  shot(ctx, 'rose', [lerp(300, 330, k), lerp(470, 330, k)], lerp(1.35, 1.12, k) * (1 + .04 * kick), { rect, blur: lerp(3, .6, k), ghost: 3 + 6 * kick });
  ctx.strokeStyle = 'rgba(232,229,224,.5)'; ctx.lineWidth = 2; ctx.strokeRect(rect[0] - 14, rect[1] - 14, rect[2] + 28, rect[3] + 28);
  const L = s.L, first = { ...L, chars: L.chars.slice(0, 2) }, rest = { ...L, i: L.i + .5, chars: L.chars.slice(3) };
  popLine(ctx, first, t, { x: W * .34, y: 250, size: 54, color: PAL.fog, vertical: true, align: 'top', tilt: 0, from: 1.2, flash: false });
  popLine(ctx, rest, t, { x: W * .24, y: 190, size: 150, color: PAL.paper, vertical: true, align: 'top', tilt: 2, from: 1.6, shadow: { dx: 6, dy: 6, color: PAL.roseDeep } });
  chip(ctx, 'NO THORNS', rect[0] - 14, rect[1] - 34, 18, PAL.rose, PAL.paper);
};

// 13 痛々しさが愛しいでしょ？: rooftop, a slow pan from the city lights across to her face
SCENES[13] = (ctx, t, s) => {
  moveShot(ctx, 'roof', t, s.t0, s.t1, { at: [1150, 330], zoom: 1.35 }, { at: PHOTOS.roof.face, zoom: 1.6 }, { kick: 1, ghost: 3, sat: .85 });
  bottomShade(ctx);
  popLine(ctx, s.L, t, { x: 130, y: H - 150, size: fitSize(ctx, s.L.text, W * .72, 118), align: 'left', color: PAL.paper, tilt: 1.5, from: 1.5 });
  caption(ctx, 'IT HURTS, AND YOU LOVE IT', 134, H - 110);
};

// 14 わたしになれないヒト: the room in three strips, colour only in the middle
SCENES[14] = (ctx, t, s) => {
  strips(ctx, t, s, 'room', 3);
  popLine(ctx, s.L, t, { x: W / 2, y: H - 120, size: 112, color: PAL.paper, stroke: PAL.ink, strokeW: 16, tilt: 2 });
};

// 15 激しくふりほどくの: hard cuts between the two small panels, slices tearing; characters shake loose
SCENES[15] = (ctx, t, s) => {
  const hi = hitIdx(t), id = hi % 2 ? 'lying' : 'sit', kick = pulse(t, .16);
  shot(ctx, id, PHOTOS[id].face, (1.25 + .1 * hash(hi)) * (1 + .08 * kick), { ghost: 4 + 10 * kick, blur: 1.2, sat: .8 });
  dim(ctx, .25 + .2 * kick);
  const L = s.L;
  popLine(ctx, L, t, { x: W / 2, y: H * .56, size: 150, color: PAL.paper, tilt: 6, from: 1.8,
    jx: i => { const a = t - L.chars[i][1]; return a > .15 ? Math.sin(i * 2.3) * (a - .15) * 260 : 0; },
    jy: i => { const a = t - L.chars[i][1]; return a > .15 ? Math.cos(i * 1.7) * (a - .15) * 140 : 0; } });
  sliceGlitch(ctx, kick, hi, 9);
};

// 16 まるで群がっている蛾のよう: moths around the moon over the city
SCENES[16] = (ctx, t, s) => {
  push(ctx, 'roof', 'moon', t, s, 1.5, 1.8, { sat: .7, bright: .7 });
  const g = ctx.createRadialGradient(W / 2, H * .45, 10, W / 2, H * .45, 420);
  g.addColorStop(0, 'rgba(244,242,238,.35)'); g.addColorStop(1, 'rgba(244,242,238,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  moths(ctx, t, W / 2, H * .45, Math.floor(lerp(10, 70, s.k)), 'rgba(232,229,224,.8)');
  bottomShade(ctx, .6);
  popLine(ctx, s.L, t, { x: W / 2, y: H - 150, size: fitSize(ctx, s.L.text, W * .8, 120), color: PAL.paper, tilt: 3 });
};

// 17 面白いね: a quiet close-up, thin type
SCENES[17] = (ctx, t, s) => {
  push(ctx, 'near', 'face', t, s, 1.25, 1.4, { blur: 1.5, ghost: 5, sat: .85 });
  popLine(ctx, s.L, t, { x: W - 160, y: H * .84, size: 64, align: 'right', color: PAL.paper, tilt: 0, from: 1.1, flash: false });
  caption(ctx, 'FUNNY, ISN\'T IT', W - 160, H * .84 + 40, 1, 'right');
};

// ---------- instrumental montage: detail cuts on every hit over slow stripes
function sceneMontage(ctx, t, s) {
  detailCut(ctx, t, 77, { sat: .75, ghost: 3 });
  dim(ctx, .2);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.35); ctx.globalAlpha = .12; ctx.fillStyle = PAL.lav;
  for (let i = -12; i < 12; i += 2) ctx.fillRect(i * 110 + (t * 40) % 220, -1200, 110, 2400);
  ctx.restore();
  chip(ctx, `CUT ${String(Math.max(0, hitIdx(t) - hitIdx(s.t0))).padStart(3, '0')}`, 80, H - 120, 18, PAL.paper, PAL.ink);
}

// ---------- bridge

// 20 理想の理想化: frames within frames, sinking inward
SCENES[20] = (ctx, t, s) => {
  fillBg(ctx, PAL.paper);
  const ph = (t * .45) % 1;
  for (let d = 0; d <= 5; d++) {   // outermost first; each frame sits inside the last
    const sc = Math.pow(.62, d - ph), w = W * sc, h = H * sc, rect = [W / 2 - w / 2, H / 2 - h / 2, w, h];
    ctx.fillStyle = PAL.paper; ctx.fillRect(rect[0] - 10, rect[1] - 10, w + 20, h + 20);
    shot(ctx, 'room', PHOTOS.room.face, 1.1, { rect, sat: .5 + .1 * d, bright: 1 - .06 * d });
  }
  popLine(ctx, s.L, t, { x: W / 2, y: H - 90, size: 76, color: PAL.ink, flash: false, tilt: 0, stroke: PAL.paper, strokeW: 14 });
};

// 21 加速するユートピア: the city rushing, speed lines accelerating
SCENES[21] = (ctx, t, s) => {
  shot(ctx, 'roof', PHOTOS.roof.city, lerp(1.2, 2.2, easeIn(s.k)), { blur: lerp(0, 6, s.k), sat: .8 });
  speedLines(ctx, t, W / 2, H / 2, lerp(.5, 3, easeIn(s.k)), 'rgba(244,242,238,.55)');
  popLine(ctx, s.L, t, { x: W / 2, y: H * .56, size: 150, color: PAL.paper, stroke: PAL.ink, strokeW: 16, tilt: 3,
    jx: i => (i - s.L.chars.length / 2) * s.k * 30 });
};

// 22 楽園（エデン）は遥か遠く: pulling far back from the setting sun; the words get small
SCENES[22] = (ctx, t, s) => {
  push(ctx, 'sunset', 'sun', t, s, 2.4, 1.0, { sat: .8, blur: 1 });
  dim(ctx, .2);
  popLine(ctx, s.L, t, { x: W * .3, y: H * .3, size: lerp(96, 44, easeInOut(s.k)), color: PAL.paper, tilt: 0, flash: false, from: 1.2 });
  caption(ctx, 'EDEN, FAR AWAY', W * .3, H * .3 + 40, 1 - s.k, 'center');
};

// 23 だからこそ綺麗: blur resolving to sharp on her face, sparkles
SCENES[23] = (ctx, t, s) => {
  push(ctx, 'lookup', 'face', t, s, 1.2, 1.35, { blur: lerp(14, 1, easeOut(s.k)), ghost: 4, sat: .9 });
  for (let i = 0; i < 26; i++) {
    const a = .5 + .5 * Math.sin(t * 4 + i * 2), x = hr(0, W, i, 1), y = hr(0, H, i, 2), r = hr(3, 9, i, 3) * a;
    ctx.fillStyle = `rgba(244,242,238,${.7 * a})`; ctx.beginPath(); ctx.moveTo(x, y - r * 3); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 3); ctx.lineTo(x - r, y); ctx.fill();
  }
  popLine(ctx, s.L, t, { x: W - 170, y: H * .5, size: 80, color: PAL.paper, vertical: true, tilt: 0, flash: false });
};

// 24 弱さも強さも愛せないのなら: the contrast split again (callback to line 0)
SCENES[24] = (ctx, t, s) => {
  const size = fitSize(ctx, s.L.text, W * .86, 170), at = PHOTOS.room.face, z = 1.25 * (1 + .05 * pulse(t, .18));
  const type = col => popLine(ctx, s.L, t, { x: W / 2, y: H * .66, size, color: col, flash: false, tilt: 0 });
  diagonal(ctx, t, s, () => { shot(ctx, 'room', at, z, { sat: .8 }); dim(ctx, .25); type(PAL.paper); },
    () => { negative(ctx, 'room', at, z); type(PAL.ink); });
};

// 25 わたしが生きる意味はないから: near-black, heavy white type in two lines, her small and dim
SCENES[25] = (ctx, t, s) => {
  fillBg(ctx, PAL.ink);
  shot(ctx, 'lookup', PHOTOS.lookup.face, 1.2, { rect: [W - 560, H - 420, 440, 300], mono: .7, bright: .7 });
  const L = s.L, a = { ...L, chars: L.chars.slice(0, 5) }, b = { ...L, i: L.i + .5, chars: L.chars.slice(5) };
  popLine(ctx, a, t, { x: 140, y: H * .38, size: 150, align: 'left', color: PAL.paper, tilt: 0 });
  popLine(ctx, b, t, { x: 140, y: H * .38 + 190, size: 150, align: 'left', color: PAL.paper, tilt: 0 });
};

// ---------- final chorus

// 26 トゲのない薔薇に相応しい: the rose close-up framed, a drawn thornless rose opening beside it
SCENES[26] = (ctx, t, s) => {
  fillBg(ctx, PAL.ink);
  shot(ctx, 'rose', PHOTOS.rose.rose, 2.2, { blur: 30, bright: .4 });
  push(ctx, 'rose', 'rose', t, s, 1.3, 1.1, { rect: [W * .5, 90, W * .42, H - 180], ghost: 3 });
  rose(ctx, W * .27, H * .38, 150, t, { bloom: easeOut(clamp(s.k * 1.3)), colour: PAL.rose, line: PAL.paper });
  popLine(ctx, s.L, t, { x: W * .27, y: H - 170, size: 84, color: PAL.paper, tilt: 2 });
};

// 27 生き様さ: three giant characters over her face
SCENES[27] = (ctx, t, s) => {
  push(ctx, 'roof', 'face', t, s, 1.7, 1.9, { sat: .8, ghost: 4 });
  dim(ctx, .2);
  popLine(ctx, s.L, t, { x: W / 2, y: H * .74, size: 330, color: PAL.paper, stroke: PAL.ink, strokeW: 20, tilt: 3, from: 1.9 });
};

// 28 わたしになれなくても: five strips this time
SCENES[28] = (ctx, t, s) => {
  strips(ctx, t, s, 'roof', 5, 50);
  popLine(ctx, s.L, t, { x: W / 2, y: H - 120, size: 108, color: PAL.paper, stroke: PAL.ink, strokeW: 16, tilt: 2 });
};

// 29 アナタは別の色: the same face in four colours
SCENES[29] = (ctx, t, s) => {
  const cols = [PAL.lav, PAL.rose, PAL.cyan, PAL.pink], n = clamp(hitIdx(t) - hitIdx(s.t0) + 1, 1, 4);
  fillBg(ctx, PAL.ink);
  for (let q = 0; q < n; q++) {
    const rect = [(q % 2) * W / 2, Math.floor(q / 2) * H / 2, W / 2, H / 2];
    shot(ctx, 'sit', PHOTOS.sit.face, 1.1, { rect, mono: 1, bright: 1.1 });
    ctx.save(); ctx.beginPath(); ctx.rect(...rect); ctx.clip(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = cols[q]; ctx.fillRect(...rect); ctx.restore();
  }
  ctx.fillStyle = PAL.ink; ctx.fillRect(0, H / 2 - 80, W, 160);
  popLine(ctx, s.L, t, { x: W / 2, y: H / 2 + 38, size: 110, color: PAL.paper, tilt: 0 });
};

// 30 間違いと呼ばないで: 間違い gets struck through, then the strike is pulled away
SCENES[30] = (ctx, t, s) => {
  push(ctx, 'sit', 'face', t, s, 1.2, 1.4, { sat: .8 });
  dim(ctx, .3);
  const y = H * .58, { boxes } = popLine(ctx, s.L, t, { x: W / 2, y, size: 150, color: PAL.paper, tilt: 0 });
  const x0 = boxes[0].x - boxes[0].w / 2, x1 = boxes[2].x + boxes[2].w / 2, c2 = s.L.chars[2][1], c3 = s.L.chars[3][1];
  const on = easeOut(prog(t, c2, c2 + .2)), off = easeIn(prog(t, c3 + .6, c3 + 1.0));
  if (on > 0 && off < 1) { ctx.strokeStyle = PAL.rose; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(lerp(x0, x1, off), y - 50); ctx.lineTo(lerp(x0, x1, on), y - 50); ctx.stroke(); }
};

// 31 トゲがない薔薇なだけ: the rose portrait, big type
SCENES[31] = (ctx, t, s) => {
  push(ctx, 'rose', 'face', t, s, 1.25, 1.5, { ghost: 4, sat: .9 });
  bottomShade(ctx, .7);
  popLine(ctx, s.L, t, { x: W / 2, y: H - 150, size: fitSize(ctx, s.L.text, W * .86, 160), color: PAL.paper, tilt: 3, shadow: { dx: 6, dy: 6, color: PAL.roseDeep } });
  chip(ctx, 'JUST A ROSE WITH NO THORNS', 80, 120, 18, PAL.rose, PAL.paper);
};

// ---------- ending

// 32 見納めて: the smoking close-up, pulling out slowly, colour draining
SCENES[32] = (ctx, t, s) => {
  push(ctx, 'smoke', 'face', t, s, 1.5, 1.05, { sat: lerp(.8, .3, s.k), kick: 0 });
  popLine(ctx, s.L, t, { x: W - 180, y: 170, size: 90, color: PAL.paper, vertical: true, align: 'top', tilt: 0, flash: false });
};

// 33 枯れゆくまで: the rose greys, petals fall
SCENES[33] = (ctx, t, s) => {
  push(ctx, 'rose', 'rose', t, s, 1.6, 1.8, { mono: s.k, bright: lerp(.9, .6, s.k), kick: 0 });
  petals(ctx, t, s.t0, 40, `rgba(200,71,95,${lerp(.8, .3, s.k)})`);
  popLine(ctx, s.L, t, { x: W / 2, y: H * .55, size: 110, color: PAL.paper, tilt: 0, flash: false, pop: .3, from: 1.1 });
};

// outro: slow crossfades through the stills, draining; the title returns; main.js fades to black
function sceneOutro(ctx, t, s) {
  const seq = ['sunset', 'rose', 'near', 'roof', 'lookup', 'room', 'smoke', 'rose'], dur = (s.t1 - s.t0) / seq.length;
  const j = Math.min(seq.length - 1, Math.floor((t - s.t0) / dur)), k = ((t - s.t0) % dur) / dur;
  const draw = (id, kk, a) => shot(ctx, id, PHOTOS[id].face, lerp(1.2, 1.35, kk), { alpha: a, mono: lerp(.3, 1, s.k), bright: lerp(.9, .5, s.k), blur: lerp(0, 4, s.k) });
  fillBg(ctx, PAL.ink);
  draw(seq[j], k, 1);
  if (k > .75 && j + 1 < seq.length) draw(seq[j + 1], 0, (k - .75) / .25);
  petals(ctx, t, s.t0 - 3, 24, 'rgba(200,71,95,.35)');
  withAlpha(ctx, prog(t, s.t1 - 7, s.t1 - 5), () => {
    ctx.fillStyle = PAL.paper; ctx.font = font(84, 900, FONT_HERO); ctx.textAlign = 'center'; ctx.fillText('私の薔薇には棘がない', W / 2, H / 2);
    caption(ctx, 'Flehmann × OTO MAYUMI', W / 2, H / 2 + 60, 1, 'center');
  });
}
