// scenes.js: one scene per lyric line (SCENES[i]) plus the intro and instrumental montage. Each scene gets
// (ctx, t, s) with s = { L (the line), lt (t - line start), t0/t1 (window), k (0..1 through the window) }.
const SCENES = {};

// ---- intro: slow fog, the title typed out on the hits, a small rose, the first stills drifting in
function sceneIntro(ctx, t, s) {
  fillBg(ctx, PAL.ink);
  const fog = ctx.createRadialGradient(W * .62, H * .45, 50, W * .62, H * .45, 900);
  fog.addColorStop(0, 'rgba(169,155,214,.30)'); fog.addColorStop(1, 'rgba(20,18,24,0)');
  ctx.fillStyle = fog; ctx.fillRect(0, 0, W, H);
  // thin grid, barely there
  ctx.strokeStyle = 'rgba(232,229,224,.06)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 96) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 96) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // stills: first a blurred close-up that slowly comes into focus, then full-body cuts on the hits
  const firstHit = DATA.hits.find(h => h > 6) ?? 6.5;
  if (t < firstHit) {
    const k = prog(t, 0, firstHit);
    still(ctx, 0, W * .63, H * .42, lerp(3300, 2900, k), { blur: lerp(26, 7, easeOut(k)), alpha: clamp(t / 1.2) * .9, ghost: 10 });
  } else {
    const pose = poseAt(t, POSES.calm.concat(POSES.shy), 3);
    const kick = pulse(t, .2);
    still(ctx, pose, W * .66, H * .3, 980 * (1 + .04 * kick), { ghost: 6 + 10 * kick, blur: .6 });
  }
  // title, one character per beat after the first hit
  const title = '私の薔薇には棘がない';
  const hs = DATA.beats.filter(h => h >= firstHit - .01);
  const L = { i: 900, chars: [...title].map((c, i) => [c, hs[i] ?? 99]) };
  popLine(ctx, L, t, { x: 150, y: H * .5, size: 58, align: 'left', color: PAL.paper, lead: 0, pop: .1, tilt: 0, from: 1.35, vertical: true });
  ctx.fillStyle = PAL.fog; ctx.font = font(22, 500, FONT_EN); ctx.textAlign = 'left';
  withAlpha(ctx, prog(t, 1, 2.5), () => {
    ctx.fillText('WATASHI NO BARA NI WA TOGE GA NAI', 250, H * .5 - 280);
    chip(ctx, 'Flehmann × OTO MAYUMI', 250, H * .5 - 230, 18, PAL.lav, PAL.ink);
  });
  rose(ctx, 330, H * .78, 70, t, { bloom: prog(t, firstHit, firstHit + 3), colour: PAL.rose, line: PAL.paper, stem: false });
}

// ---- 0: 強いコントラスト. A hard diagonal split, paper against ink; the split jumps on each hit, and everything that
// crosses it is inverted (her, the type).
function splitScene(ctx, t, s, pose = 2) {
  const jumps = Math.max(0, hitIdx(t) - hitIdx(s.t0));
  const ang = -.32 + (jumps % 2 ? .1 : -.06) + s.k * .05;
  const off = (hash(jumps, 11) - .5) * 260;
  const clipPaper = () => {
    ctx.beginPath(); const cx = W / 2 + off, cy = H / 2, d = 3000;
    ctx.moveTo(cx - Math.cos(ang) * d, cy - Math.sin(ang) * d); ctx.lineTo(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d);
    ctx.lineTo(cx + Math.cos(ang) * d + Math.sin(ang) * d, cy + Math.sin(ang) * d - Math.cos(ang) * d);
    ctx.lineTo(cx - Math.cos(ang) * d + Math.sin(ang) * d, cy - Math.sin(ang) * d - Math.cos(ang) * d); ctx.closePath();
  };
  const p = poseAt(t, [pose, 11, 8, 2], 17);
  const kick = pulse(t, .18);
  const her = { x: W * .7, y: H * .26, h: 1150 * (1 + .05 * kick) };
  const size = fitSize(ctx, s.L.text, W * .8, 250);
  const type = col => popLine(ctx, s.L, t, { x: W * .5, y: H * .64, size, color: col, flash: false, from: 1.45, pop: .09, tilt: 0 });
  // ink side
  fillBg(ctx, PAL.ink);
  still(ctx, p, her.x, her.y, her.h, { mono: .15 });
  type(PAL.paper);
  // paper side, clipped: her as a flat ink silhouette, type in ink
  ctx.save(); clipPaper(); ctx.clip();
  fillBg(ctx, PAL.paper);
  still(ctx, p, her.x, her.y, her.h, { tint: { colour: PAL.ink, a: 1 } });
  type(PAL.ink);
  ctx.restore();
  // garnish: counters and a thin rule along the split
  chip(ctx, 'STRONG CONTRAST', 60, 90, 20, PAL.lav, PAL.ink);
  ctx.fillStyle = PAL.grey; ctx.font = font(18, 600, FONT_EN); ctx.textAlign = 'left';
  ctx.fillText(`${String(jumps).padStart(2, '0')} / BLACK ⟷ WHITE`, 60, 130);
}
SCENES[0] = (ctx, t, s) => splitScene(ctx, t, s, 2);

// ---- 1: 怪我なしでは出られない迷路. A maze drawn on as she stands small inside it; the words sit in ink tiles.
SCENES[1] = (ctx, t, s) => {
  fillBg(ctx, PAL.paper);
  const z = lerp(1.12, 1, easeOut(s.k));
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  maze(ctx, clamp(s.k * 1.6 + .1), PAL.smoke, 72, -48, -36);
  const p = poseAt(t, POSES.shy, 5, 2);
  still(ctx, p, W * .5, H * .38, 640, { outline: { w: 6, colour: PAL.paper } });
  ctx.restore();
  tiles(ctx, s.L, t, 150, H - 170, 86);
};

// ink tiles, one per character (paper type on ink squares), for lines that read like labels or warnings
function tiles(ctx, L, t, x, y, size, bg = PAL.ink, fg = PAL.paper) {
  let cx = x;
  L.chars.forEach(([c, ct], i) => {
    if (!c.trim()) { cx += size * .4; return; }
    const k = (t - ct + .03) / .1;
    if (k >= 0) {
      const s = lerp(.6, 1, backOut(clamp(k)));
      ctx.save(); ctx.translate(cx + size / 2, y); ctx.scale(s, s);
      ctx.fillStyle = bg; ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.fillStyle = fg; ctx.font = font(size * .72); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(c, 0, size * .03); ctx.restore();
    }
    cx += size * 1.06;
  });
}

// ---- fallback for lines whose scene is not written yet: a drifting still and the line in plain type
function sceneFallback(ctx, t, s) {
  fillBg(ctx, PAL.ink);
  const p = poseAt(t, POSES.all, s.L.i, 2);
  driftStill(ctx, p, t, s.t0, s.t1, { x: W * .68, y: H * .3, h: 1000 }, { x: W * .64, y: H * .3, h: 1080 }, { kick: 1, ghost: 5 });
  popLine(ctx, s.L, t, { x: 140, y: H * .72, size: fitSize(ctx, s.L.text, W * .6, 110), align: 'left', color: PAL.paper });
}

// ---- instrumental stretches: stills cut on every hit over slow stripes
function sceneMontage(ctx, t, s) {
  fillBg(ctx, PAL.ink);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.35);
  for (let i = -12; i < 12; i++) { ctx.fillStyle = i % 2 ? 'rgba(169,155,214,.08)' : 'rgba(0,0,0,0)'; ctx.fillRect(i * 110 + (t * 40) % 220, -1200, 110, 2400); }
  ctx.restore();
  const p = poseAt(t, POSES.all, 77);
  const kick = pulse(t, .2), side = hitIdx(t) % 2 ? .32 : .68;
  still(ctx, p, W * side, H * .28, 1020 * (1 + .05 * kick), { ghost: 8 * kick + 3 });
}

// ======== adult look: the protagonist as film stills (full illustrations), camera over them ========

// 12: そう トゲがない. The rose portrait framed on the right, the same image huge and out of focus behind it;
// the camera slides from the rose up to her eyes. Type set vertically on the left, quiet then heavy.
SCENES[12] = (ctx, t, s) => {
  fillBg(ctx, PAL.ink);
  shot(ctx, 'rose', PHOTOS.rose.face, 1.5, { blur: 34, bright: .45, sat: .7 });
  const rect = [W * .47, 110, W * .43, H - 220];
  const k = easeInOut(prog(t, s.t0, s.t1));
  const kick = pulse(t, .2);
  shot(ctx, 'rose', [lerp(300, 330, k), lerp(470, 330, k)], lerp(1.35, 1.12, k) * (1 + .04 * kick),
    { rect, blur: lerp(3, .6, k), ghost: 3 + 6 * kick });
  ctx.strokeStyle = 'rgba(232,229,224,.5)'; ctx.lineWidth = 2; ctx.strokeRect(rect[0] - 14, rect[1] - 14, rect[2] + 28, rect[3] + 28);
  const L = s.L, first = { ...L, chars: L.chars.slice(0, 2) }, rest = { ...L, i: L.i + .5, chars: L.chars.slice(3) };
  popLine(ctx, first, t, { x: W * .34, y: 250, size: 54, weight: 300, color: PAL.fog, vertical: true, align: 'top', tilt: 0, from: 1.2, flash: false });
  popLine(ctx, rest, t, { x: W * .24, y: 190, size: 150, color: PAL.paper, vertical: true, align: 'top', tilt: 2, from: 1.6, shadow: { dx: 6, dy: 6, color: PAL.roseDeep } });
  chip(ctx, 'NO THORNS', rect[0] - 14, rect[1] - 34, 18, PAL.rose, PAL.paper);
};

// 13: 痛々しさが愛しいでしょ？ Rooftop at night; a slow pan from the city lights across to her face, snap zooms on the hits.
SCENES[13] = (ctx, t, s) => {
  moveShot(ctx, 'roof', t, s.t0, s.t1, { at: [1150, 330], zoom: 1.35 }, { at: PHOTOS.roof.face, zoom: 1.6 },
    { kick: 1, ghost: 3, sat: .85 });
  const g = ctx.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(10,8,14,0)'); g.addColorStop(1, 'rgba(10,8,14,.75)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  popLine(ctx, s.L, t, { x: 130, y: H - 150, size: fitSize(ctx, s.L.text, W * .72, 118), align: 'left', color: PAL.paper, tilt: 1.5, from: 1.5 });
  ctx.fillStyle = PAL.fog; ctx.font = font(20, 500, FONT_EN); ctx.textAlign = 'left';
  ctx.fillText('IT HURTS, AND YOU LOVE IT', 134, H - 110);
};

// 14: わたしになれないヒト. The room image in three strips: her in the middle, two grey, blurred copies that
// cannot be her. The strips slam in on the hits.
SCENES[14] = (ctx, t, s) => {
  fillBg(ctx, PAL.ink);
  const sw = W / 3, n = clamp(hitIdx(t) - hitIdx(s.t0) + 1, 1, 3);
  const order = [1, 0, 2];
  for (let j = 0; j < n; j++) {
    const col = order[j], rect = [col * sw + 6, 0, sw - 12, H], me = col === 1;
    const age = t - (DATA.hits[hitIdx(s.t0) + j] ?? s.t0);
    const z = lerp(1.25, 1, expoOut(clamp(age / .35)));
    shot(ctx, 'room', [PHOTOS.room.face[0] + (col - 1) * 60, PHOTOS.room.face[1] + 60], (me ? 1.05 : 1.2) * z,
      { rect, mono: me ? 0 : 1, blur: me ? 0 : 5, bright: me ? 1 : .6, ghost: me ? 3 : 0 });
  }
  popLine(ctx, s.L, t, { x: W / 2, y: H - 120, size: 112, color: PAL.paper, stroke: PAL.ink, strokeW: 16, tilt: 2 });
};

// 15: 激しくふりほどくの. Hard cuts between the two small panels on every hit, slices tearing on the hits; the
// characters shake loose and drift outward after they land.
SCENES[15] = (ctx, t, s) => {
  const hi = hitIdx(t), id = hi % 2 ? 'lying' : 'sit', P = PHOTOS[id];
  const kick = pulse(t, .16);
  shot(ctx, id, P.face, (1.25 + .1 * hash(hi)) * (1 + .08 * kick), { ghost: 4 + 10 * kick, blur: 1.2, sat: .8 });
  fillBg(ctx, `rgba(10,8,14,${.25 + .2 * kick})`);
  const L = s.L;
  popLine(ctx, L, t, {
    x: W / 2, y: H * .56, size: 150, color: PAL.paper, tilt: 6, from: 1.8,
    jx: i => { const a = t - L.chars[i][1]; return a > .15 ? Math.sin(i * 2.3) * (a - .15) * 260 : 0; },
    jy: i => { const a = t - L.chars[i][1]; return a > .15 ? Math.cos(i * 1.7) * (a - .15) * 140 : 0; },
  });
  sliceGlitch(ctx, kick, hi, 9);
};
