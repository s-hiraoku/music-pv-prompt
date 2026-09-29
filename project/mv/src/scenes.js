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
