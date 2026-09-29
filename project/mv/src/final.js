// final.js: the video as it ships. The original illustrations are the base; the lyrics are motion typography,
// word by word, big where the song hits and small where it doesn't, inked into the picture and often slipped
// behind her (the cut-out fg layer). Paper panels are a rare accent (about one line in ten); the riso print of
// the same stills (PRINT) is the other accent: split frames, strobes, flashes, whole scenes on the burn lines.
// Loaded after scenes.js / riso.js / kinetic.js and replaces their scenes unless a style lab (?style=) is open.
(() => {
if (new URLSearchParams(location.search).get('style')) return;
const F = {};
const out = s => s.t1 - .25;                                   // when words leave
const C = INK;                                                 // cream, pink, red, navy, lilac (sampled from the stills)
function base(ctx, id, t, s, a, b, o = {}) {
  const f = rframe(id, t, s, a, b, o.kick ?? 1);
  f(ctx, 'full', o.print ? { print: true } : {});
  return f;
}
function printFlash(ctx, f, t, len = .09) { if (sinceStrong(t) < len) f(ctx, 'full', { print: true }); }
function splitPrint(ctx, t, s, f) { return diagonal(ctx, t, s, () => f(ctx, 'full'), () => f(ctx, 'full', { print: true })); }
function shade(ctx, a = .45) { const g = ctx.createLinearGradient(0, H * .35, 0, H); g.addColorStop(0, 'rgba(20,10,30,0)'); g.addColorStop(1, `rgba(20,10,30,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }

// ---------- intro: blurred close-up focusing; the title arrives huge, 薔薇 in crimson, over a sunburst, English
// title marquee behind
sceneIntro = (ctx, t, s) => {
  const firstHit = DATA.hits.find(h => h > 6) ?? 6.5, k = prog(t, 0, firstHit);
  ctx.filter = `blur(${lerp(26, 4, easeOut(clamp(k)))}px) brightness(${lerp(.35, .6, k)})`;
  rshot(ctx, 'rose', [320, 330], lerp(1.5, 1.25, prog(t, 0, s.t1))); ctx.filter = 'none';
  if (t < firstHit - .3) return;
  const kk = easeOut(prog(t, firstHit, firstHit + 1.2)), bs = DATA.beats.filter(b => b >= firstHit - .01);
  withAlpha(ctx, kk, () => { sunburst(ctx, W / 2, H * .5, t, 'rgba(217,74,154,.55)', 20, .06); });
  printFlash(ctx, (c, l, o) => rshot(c, 'rose', [320, 330], 1.25, o), t, .07);
  withAlpha(ctx, .5 * kk, () => marquee(ctx, 'My rose has no thorns', t, H * .98, 170, 90, { face: 'mono', fill: C.lilac }));
  kin(ctx, '私の', t, bs[0] ?? firstHit, { x: W * .5, y: H * .3, size: 120, face: 'hero', fx: 'drop', fill: C.cream, under: C.navy, reg: [5, 4] });
  kin(ctx, '薔薇には', t, bs[2] ?? firstHit + .8, { x: W * .5, y: H * .6, size: 290, face: 'hero', fx: 'slam', fill: C.red, under: C.cream, reg: [7, 6], glow: { color: C.pink, blur: 30, a: .5 } });
  kin(ctx, '棘がない', t, bs[5] ?? firstHit + 2, { x: W * .5, y: H * .88, size: 250, face: 'hero', fx: 'track', fill: C.cream, under: C.pink, reg: [7, 6], spacing: 10 });
};

// ---------- verse 1
// 0 強いコントラスト (big): original vs print on a jumping diagonal; the type flips colour across the split
F[0] = (ctx, t, s) => {
  const f = rframe('roof', t, s, { at: [520, 300], zoom: 1.2 }, { at: [470, 300], zoom: 1.3 });
  const words = fillA => {
    kin(ctx, '強い', t, at(s.L, 0), { x: W * .08, y: H * .45, size: 300, align: 'left', fx: 'slam', fill: fillA, under: fillA === C.cream ? C.pink : C.cream, reg: [7, 6] });
    kin(ctx, 'コントラスト', t, at(s.L, 2), { x: W * .5, y: H * .92, size: 250, fx: 'track', fill: fillA, under: fillA === C.cream ? C.pink : C.cream, reg: [7, 6] });
  };
  diagonal(ctx, t, s, () => { f(ctx, 'full'); f(ctx, 'fg'); words(C.cream); }, () => { f(ctx, 'full', { print: true }); words(C.navy); });
};
// 1 怪我なしでは出られない迷路 (small): maze lines over the room
F[1] = (ctx, t, s) => {
  base(ctx, 'room', t, s, { at: [455, 320], zoom: 1.05 }, { at: [455, 300], zoom: 1.2 });
  const z = lerp(1.12, 1, easeOut(s.k)); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  maze(ctx, clamp(s.k * 1.6 + .1), 'rgba(203,182,242,.5)', 72, -48, -36); ctx.restore();
  shade(ctx); small(ctx, s.L, t, s, 110, H - 90);
};
// 2 無理矢理 白く塗り潰した汚い夢 (small, marker): scribbles, then a cream roller paints over; 汚い夢 left in red
F[2] = (ctx, t, s) => {
  base(ctx, 'lying', t, s, { at: [175, 250], zoom: 1.1 }, { at: [175, 250], zoom: 1.3 });
  const h0 = hitIdx(s.t0), n = Math.max(0, hitIdx(t) - h0 + 1);
  for (let i = 0; i < Math.min(n, 9); i++)
    scribble(ctx, 40 + i, clamp((t - (DATA.hits[h0 + i] ?? s.t0)) / .25), i % 3 ? C.navy : C.red, hr(300, W - 300, i, 1), hr(250, H - 250, i, 2), hr(160, 320, i, 3));
  const paint = easeInOut(prog(t, s.L.chars[5][1], s.L.end));
  if (paint > 0) { ctx.fillStyle = C.cream; ctx.beginPath(); ctx.moveTo(0, 0); const x = paint * (W + 200);
    for (let y = 0; y <= H; y += 40) ctx.lineTo(x - hash(y, 7) * 60, y); ctx.lineTo(0, H); ctx.closePath(); ctx.fill(); }
  small(ctx, s.L, t, s, 110, 150, { face: 'marker', fill: C.navy, under: C.pink, text: '無理矢理 白く塗り潰した' });
  kin(ctx, '汚い夢', t, at(s.L, 12), { x: W * .62, y: H * .82, size: 200, face: 'marker', fx: 'slam', fill: C.red, under: C.navy, reg: [5, 4], rot: -.05, out: out(s) });
};
// 3 わたしになれないヒト (small, first verse): rose portrait, grey ghosts drifting apart
F[3] = (ctx, t, s) => {
  fillBg(ctx, C.navy);
  const k = easeInOut(s.k), rect = [W * .3, 0, W * .7, H];
  ctx.save(); ctx.filter = 'grayscale(1) blur(3px)'; ctx.globalAlpha = .25;
  [-1, 1].forEach(d => rshot(ctx, 'rose', [320 + d * lerp(40, 120, k), 330], 1.1, { rect })); ctx.restore();
  rshot(ctx, 'rose', [lerp(320, 330, k), lerp(360, 320, k)], lerp(1.02, 1.14, k) * (1 + .04 * pulse(t)), { rect });
  kin(ctx, s.L.text, t, at(s.L, 0), { x: W * .15, y: 170, size: 78, face: 'base', fx: 'rise', vertical: true, fill: C.cream, under: C.pink, reg: [3, 2], out: out(s) });
};
// 4 うるさくしがみつくの (small): the words repeat and pile up all over her on the hits
F[4] = (ctx, t, s) => {
  base(ctx, 'room', t, s, { at: [420, 330], zoom: 1.3 }, { at: [420, 330], zoom: 1.45 });
  const h0 = hitIdx(s.t0), n = Math.max(0, hitIdx(t) - h0 + 1);
  for (let i = 1; i < Math.min(n, 12); i++)
    kin(ctx, s.L.text, t, DATA.hits[h0 + i], { x: hr(250, W - 250, i, 1), y: hr(150, H - 100, i, 2), size: hr(34, 70, i, 3), face: 'loud', fx: 'slam',
      fill: i % 2 ? C.lilac : C.pink, rot: hr(-.3, .3, i, 4), dur: .12, out: out(s) });
  small(ctx, s.L, t, s, 110, H - 90, { size: 60 });
};
// 5 気をつけて？ / 18 気をつけて: caution tape is the lyric
F[5] = (ctx, t, s) => { base(ctx, 'roof', t, s, { at: [470, 290], zoom: 1.4 }, { at: [470, 290], zoom: 1.55 }); caution(ctx, t, s, '気をつけて？ ／ CAUTION ／ '); };
F[18] = (ctx, t, s) => { base(ctx, 'room', t, s, { at: [455, 300], zoom: 1.3 }, { at: [455, 300], zoom: 1.5 }); caution(ctx, t, s, '気をつけて ／ HANDLE WITH CARE ／ '); };
// 6 ヤケドするよ (big): the rose print in red ink, heat; ヤケド huge behind her in brush, するよ drops in front
F[6] = (ctx, t, s) => {
  const f = base(ctx, 'rose', t, s, { at: [320, 330], zoom: 1.15 }, { at: [320, 330], zoom: 1.3 }, { print: true });
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(214,30,58,.4)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  flames(ctx, t, 'rgba(163,18,58,.85)', 'rgba(217,74,154,.8)', 300);
  kin(ctx, 'ヤケド', t, at(s.L, 0), { x: W / 2, y: H * .62, size: 440, face: 'brush', fx: 'slam', fill: C.red, under: C.cream, reg: [9, 7], glow: { color: '#ff6a3a', blur: 40, a: .6 } });
  kin(ctx, 'するよ', t, at(s.L, 3), { x: W * .78, y: H * .92, size: 150, face: 'brush', fx: 'drop', fill: C.cream, under: C.red, reg: [5, 4], out: out(s) });
};
// 7 「まだですか？」 / 8 「またですか？」 (small, panels: whispers): small cards turning over
F[7] = (ctx, t, s) => {
  base(ctx, 'sit', t, s, { at: [262, 130], zoom: 1.15 }, { at: [262, 115], zoom: 1.3 });
  flipIn(ctx, card('まだですか？', { size: 70, face: 'hand', bg: C.cream, fg: C.navy, border: C.lilac }), W * .25, H * .3, t, at(s.L, 1), { rot: -.05 });
};
F[8] = (ctx, t, s) => {
  base(ctx, 'sit', t, s, { at: [262, 115], zoom: 1.3 }, { at: [262, 115], zoom: 1.45 });
  flipIn(ctx, card('まだですか？', { size: 70, face: 'hand', bg: C.cream, fg: C.navy, border: C.lilac }), W * .25, H * .3, t, -1, { rot: -.05 });
  flipIn(ctx, card('またですか？', { size: 70, face: 'hand', bg: C.pink, fg: C.cream }), W * .72, H * .42, t, at(s.L, 1), { rot: .06 });
};
// 9 脳内フラッシュバック (big): strobe of originals and prints; the words huge in pixel type, flipping colour
F[9] = (ctx, t, s) => {
  const fr = Math.floor(t * FPS), id = CUTS[Math.floor(hash(Math.floor(t * 10), 3) * CUTS.length)], inv = (fr >> 1) % 2 === 1;
  rshot(ctx, id, PHOTOS[id].face, 1.2 + hash(fr >> 2) * .4, { print: inv });
  kin(ctx, '脳内', t, at(s.L, 0), { x: W * .08, y: H * .4, size: 260, align: 'left', face: 'pixel', fx: 'stretch', fill: inv ? C.navy : C.pink, under: inv ? C.pink : C.cream, reg: [6, 0], dur: .15 });
  kin(ctx, 'フラッシュバック', t, at(s.L, 2), { x: W / 2, y: H * .85, size: 200, face: 'pixel', fx: 'track', fill: inv ? C.navy : C.cream, under: C.pink, reg: [6, 0], dur: .2 });
  sliceGlitch(ctx, .5, fr >> 1, 5);
};
// 10 操ろうとしたって もう (small): puppet strings to her hand
F[10] = (ctx, t, s) => {
  base(ctx, 'room', t, s, { at: [420, 330], zoom: 1.35 }, { at: [420, 330], zoom: 1.6 });
  ctx.strokeStyle = 'rgba(246,236,241,.7)'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { const x = W * .35 + i * 90 + Math.sin(t * 2 + i) * 20, len = lerp(0, H * .55, easeOut(prog(t, s.t0 + i * .08, s.t0 + .6 + i * .08)));
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + Math.sin(t * 1.5 + i) * 30, len); ctx.stroke(); }
  shade(ctx); small(ctx, s.L, t, s, W - 110, H - 90, { align: 'right' });
};
// 11 時間切れ（タイムオーバー） (big): the countdown itself is huge type; TIME OVER slams at zero
F[11] = (ctx, t, s) => {
  ctx.filter = 'blur(10px) brightness(.45)'; rshot(ctx, 'sit', PHOTOS.sit.neon, 1.5); ctx.filter = 'none';
  const end = at(s.L, 5), left = Math.max(0, end - t);
  kin(ctx, `0${Math.floor(left)}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`, t, s.t0, { x: W / 2, y: H * .55, size: 330, face: 'pixel', fx: 'fade', fill: C.lilac, under: C.navy, reg: [8, 0], dur: .1 });
  kin(ctx, '時間切れ', t, at(s.L, 0), { x: W * .08, y: H * .2, size: 110, align: 'left', face: 'pixel', fx: 'rise', fill: C.cream, under: C.pink, reg: [4, 0] });
  kin(ctx, 'TIME OVER', t, end, { x: W / 2, y: H * .9, size: 200, face: 'pixel', fx: 'slam', fill: C.red, under: C.cream, reg: [6, 0], rot: -.06, dur: .14 });
};

// ---------- chorus 1
// 12 そう トゲがない (big): the rose still; トゲがない huge across the bottom, そう small; the THORNS counter tag (panel accent)
F[12] = (ctx, t, s) => {
  const f = base(ctx, 'rose', t, s, { at: [320, 420], zoom: 1.0 }, { at: [320, 340], zoom: 1.1 });
  sunburst(ctx, W * .5, H * .45, t, 'rgba(217,74,154,.35)');
  for (let e = 1; e <= 3; e++)                                   // hollow echoes climbing out of the solid word
    kin(ctx, 'トゲがない', t, at(s.L, 3) + e * .1, { x: W / 2, y: H * .9 - e * 120, size: 380, face: 'loud', fx: 'rise', fill: null,
      outline: `rgba(246,236,241,${.7 - e * .18})`, outlineW: 3, hollow: true });
  kin(ctx, 'トゲがない', t, at(s.L, 3), { x: W / 2, y: H * .9, size: 380, face: 'loud', fx: 'rise', fill: C.pink, under: C.cream, reg: [8, 7] });
  kin(ctx, 'そう', t, at(s.L, 0), { x: W * .12, y: H * .24, size: 110, face: 'hand', fx: 'fade', fill: C.cream, under: C.pink, reg: [3, 2] });
  paperTag(ctx, W - 400, 60, 330, 130, .03, g => {
    tagText(g, 'THORNS', 26, 44, 26, C.navy); tagText(g, '棘の数', 170, 44, 18, C.navy, FACES.mono.fam, FACES.mono.w);
    tagText(g, `${Math.max(0, 8 * (1 - prog(t, s.t0, s.L.end))).toFixed(1)}%`, 26, 110, 58, C.red, FACES.loud.fam, FACES.loud.w);
  });
};
// 13 痛々しさが愛しいでしょ？ (big): 痛々しさが rises huge behind her head; 愛しいでしょ？ slides in front
F[13] = (ctx, t, s) => {
  const f = base(ctx, 'roof', t, s, { at: [700, 330], zoom: 1.05 }, { at: [470, 300], zoom: 1.22 });
  kin(ctx, '痛々しさが', t, at(s.L, 0), { x: 50, y: H * .36, size: 330, align: 'left', face: 'rose', fx: 'rise', fill: C.pink, under: C.navy, reg: [8, 6] });
  f(ctx, 'fg');
  kin(ctx, '愛しいでしょ？', t, at(s.L, 5), { x: W - 50, y: H * .93, size: 220, align: 'right', face: 'rose', fx: 'slide', from: 1, fill: C.cream, under: C.red, reg: [7, 5] });
  const p = pulse(t, .35); if (p > 0) { ctx.save(); ctx.strokeStyle = 'rgba(217,74,154,.8)'; ctx.lineWidth = 12 * p; ctx.beginPath(); ctx.arc(W * .74, H * .3, 420 * (1 - p) + 60, 0, 7); ctx.stroke(); ctx.restore(); }
};
// 14 わたしになれないヒト (big): three prints of her (pink / original / lilac); the words tower in front
F[14] = (ctx, t, s) => {
  fillBg(ctx, C.navy);
  const n = clamp(hitIdx(t) - hitIdx(s.t0) + 1, 1, 3), sw = W / 3;
  const panel = (col, ink) => {
    const rect = [col * sw + 10, 40, sw - 20, H - 80], age = t - (DATA.hits[hitIdx(s.t0) + [1, 0, 2].indexOf(col)] ?? s.t0), z = lerp(1.2, 1, expoOut(clamp(age / .35)));
    if (!ink) { rshot(ctx, 'room', [455, 380], z, { rect }); return; }
    const c = makeCanvas(W, H), g = c.getContext('2d');
    g.filter = 'grayscale(1) contrast(1.3)'; rshot(g, 'room', [455 + (col - 1) * 90, 380], 1.1 * z, { rect, print: true }); g.filter = 'none';
    g.globalCompositeOperation = 'multiply'; g.fillStyle = ink; g.fillRect(...rect); ctx.drawImage(c, 0, 0);
  };
  panel(1, null); if (n >= 2) panel(0, C.pink); if (n >= 3) panel(2, C.lilac);
  kin(ctx, 'わたしに', t, at(s.L, 0), { x: W * .5 - 250, y: 150, size: 170, vertical: true, face: 'loud', fx: 'rise', fill: C.cream, under: C.red, reg: [6, 5] });
  kin(ctx, 'なれない', t, at(s.L, 4), { x: W * .5 + 250, y: 150, size: 170, vertical: true, face: 'loud', fx: 'rise', fill: C.cream, under: C.red, reg: [6, 5] });
  kin(ctx, 'ヒト', t, at(s.L, 8), { x: W * .5, y: H * .92, size: 320, face: 'loud', fx: 'slam', photo: { id: 'sunset', at: [85, 148], zoom: 1.3 }, outline: C.cream, outlineW: 6, hollow: true });
};
// 15 激しくふりほどくの (small): hard cuts on hits, torn ink strips; the line small, shaken
F[15] = (ctx, t, s) => {
  const hi = hitIdx(t), id = hi % 2 ? 'lying' : 'sit', kick = pulse(t, .16);
  rshot(ctx, id, PHOTOS[id].face, (1.15 + .08 * hash(hi)) * (1 + .06 * kick), { print: hi % 4 === 3 });
  for (let i = 0; i < 6; i++) { const age = sinceHit(t); if (age > .5) break;
    ctx.save(); ctx.translate(hr(200, W - 200, hi, i), hr(150, H - 150, hi, i, 1) - age * 600); ctx.rotate(hr(-.6, .6, hi, i, 2) + age * 3);
    ctx.fillStyle = [C.pink, C.navy, C.red][i % 3]; ctx.fillRect(-120, -18, 240, 36); ctx.restore(); }
  shade(ctx); small(ctx, s.L, t, s, 110 + hr(-8, 8, hi) * kick, H - 90, { size: 62, face: 'loud' });
  sliceGlitch(ctx, kick * .5, hi, 5);
};
// 16 まるで群がっている蛾のよう (small): moths around the moon
F[16] = (ctx, t, s) => {
  base(ctx, 'roof', t, s, { at: [1320, 300], zoom: 1.5 }, { at: [1320, 300], zoom: 1.8 });
  const g = ctx.createRadialGradient(W / 2, H * .45, 10, W / 2, H * .45, 420); g.addColorStop(0, 'rgba(246,236,241,.35)'); g.addColorStop(1, 'rgba(246,236,241,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  moths(ctx, t, W / 2, H * .45, Math.floor(lerp(10, 70, s.k)), 'rgba(246,236,241,.85)');
  shade(ctx); small(ctx, s.L, t, s, 110, H - 90);
};
// 17 面白いね (small): the close-up, a hand-written aside
F[17] = (ctx, t, s) => { base(ctx, 'near', t, s, { at: [380, 200], zoom: 1.25 }, { at: [380, 200], zoom: 1.4 }, { kick: 0 });
  small(ctx, s.L, t, s, W - 140, H - 110, { face: 'hand', size: 72, align: 'right', fx: 'fade' }); };
// 19 ヤケドするよ (big, second time): rooftop print, flames; the whole line huge behind her, then glitch
F[19] = (ctx, t, s) => {
  const f = base(ctx, 'roof', t, s, { at: [470, 300], zoom: 1.3 }, { at: [470, 300], zoom: 1.55 }, { print: true });
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(214,30,58,.4)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  flames(ctx, t, 'rgba(163,18,58,.85)', 'rgba(217,74,154,.8)', 420);
  kin(ctx, 'ヤケドするよ', t, at(s.L, 0), { x: W / 2, y: H * .33, size: 300, face: 'brush', fx: 'stretch', fill: C.cream, under: C.red, reg: [9, 7], glow: { color: '#ff6a3a', blur: 40, a: .6 } });
  f(ctx, 'fg', { print: true });
  sliceGlitch(ctx, pulse(t, .15), hitIdx(t), 7);
};

// ---------- instrumental: cuts on every hit, alternating original and print, a huge word marquee behind
sceneMontage = (ctx, t, s) => {
  const i = Math.max(0, hitIdx(t)), [id, pt, z] = DETAILS[Math.floor(hash(77, i) * DETAILS.length)], since = sinceHit(t);
  rshot(ctx, id, PHOTOS[id][pt], z * (1 + .06 * Math.max(0, 1 - since / .25)) + since * .03, { print: i % 3 === 1 });
  withAlpha(ctx, .55, () => marquee(ctx, 'NO THORNS ✕ NO THORNS ✕ ', t, H * .62, 300, 700, { fill: i % 2 ? C.pink : C.cream }));
};

// ---------- bridge
// 20 理想の理想化 (small): frames within frames
F[20] = (ctx, t, s) => {
  fillBg(ctx, C.navy); const ph = (t * .45) % 1;
  for (let d = 0; d <= 5; d++) { const sc = Math.pow(.62, d - ph), w = W * sc, h = H * sc, rect = [W / 2 - w / 2, H / 2 - h / 2, w, h];
    ctx.fillStyle = d % 2 ? C.pink : C.cream; ctx.fillRect(rect[0] - 12, rect[1] - 12, w + 24, h + 24); rshot(ctx, 'room', PHOTOS.room.face, 1.1, { rect, print: d % 2 === 1 }); }
  small(ctx, s.L, t, s, W / 2, H - 70, { face: 'fragile', size: 64, align: 'center', fx: 'fade' });
};
// 21 加速するユートピア (big): speed lines; the words slide in from both sides, fast
F[21] = (ctx, t, s) => {
  rshot(ctx, 'roof', PHOTOS.roof.city, lerp(1.2, 2.2, easeIn(s.k)), {});
  speedLines(ctx, t, W / 2, H / 2, lerp(.5, 3, easeIn(s.k)), 'rgba(246,236,241,.55)');
  kin(ctx, '加速する', t, at(s.L, 0), { x: W * .06, y: H * .42, size: 230, align: 'left', face: 'loud', fx: 'slide', from: -1, fill: C.lilac, under: C.navy, reg: [14, 0], dur: .2 });
  kin(ctx, 'ユートピア', t, at(s.L, 4), { x: W * .94, y: H * .82, size: 290, align: 'right', face: 'loud', fx: 'slide', from: 1, photo: { id: 'sunset', at: [85, 148], zoom: 1.2 }, outline: C.cream, outlineW: 6, hollow: true, dur: .2 });
};
// 22 楽園（エデン）は遥か遠く (small): pulling back from the setting sun
F[22] = (ctx, t, s) => { base(ctx, 'sunset', t, s, { at: [85, 148], zoom: 2.3 }, { at: [85, 148], zoom: 1.0 }, { kick: 0 });
  small(ctx, s.L, t, s, W * .5, H * .3, { face: 'fragile', size: 70, align: 'center', fx: 'fade', text: '楽園は遥か遠く' }); };
// 23 だからこそ綺麗 (small): the looking-up close-up, blur resolving, sparkles
F[23] = (ctx, t, s) => {
  ctx.filter = `blur(${lerp(12, 0, easeOut(s.k))}px)`; base(ctx, 'lookup', t, s, { at: [330, 190], zoom: 1.2 }, { at: [330, 190], zoom: 1.35 }, { kick: 0 }); ctx.filter = 'none';
  for (let i = 0; i < 26; i++) { const a = .5 + .5 * Math.sin(t * 4 + i * 2), x = hr(0, W, i, 1), y = hr(0, H, i, 2), r = hr(3, 9, i, 3) * a;
    ctx.fillStyle = `rgba(246,236,241,${.7 * a})`; ctx.beginPath(); ctx.moveTo(x, y - r * 3); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 3); ctx.lineTo(x - r, y); ctx.fill(); }
  small(ctx, s.L, t, s, W - 140, H * .5, { face: 'fragile', size: 78, align: 'right', fx: 'fade' });
};
// 24 弱さも強さも愛せないのなら (medium): the split again; 弱さも / 強さも big on either side, the rest small
F[24] = (ctx, t, s) => {
  const f = rframe('room', t, s, { at: [455, 300], zoom: 1.2 }, { at: [455, 300], zoom: 1.3 });
  splitPrint(ctx, t, s, f);
  kin(ctx, '弱さも', t, at(s.L, 0), { x: W * .06, y: H * .3, size: 180, align: 'left', face: 'loud', fx: 'rise', fill: C.navy, under: C.cream, reg: [6, 5] });
  kin(ctx, '強さも', t, at(s.L, 3), { x: W * .94, y: H * .78, size: 180, align: 'right', face: 'loud', fx: 'slam', fill: C.cream, under: C.red, reg: [6, 5] });
  small(ctx, s.L, t, s, W / 2, H - 60, { text: '愛せないのなら', align: 'center', size: 56 });
};
// 25 わたしが生きる意味はないから (small): near dark, her small, the line alone
F[25] = (ctx, t, s) => {
  fillBg(ctx, C.navy); rshot(ctx, 'lookup', PHOTOS.lookup.face, 1.2, { rect: [W * .55, H * .18, W * .36, H * .64] });
  dotField(ctx, C.lilac, 22, (x, y) => clamp(.5 - x) * .8);
  small(ctx, s.L, t, s, 110, H * .55, { face: 'base', size: 70 });
};

// ---------- final chorus
// 26 トゲのない薔薇に相応しい (big): the rose; the words huge in two lines behind her, a drawn rose opening
F[26] = (ctx, t, s) => {
  const f = base(ctx, 'rose', t, s, { at: [300, 420], zoom: 1.15 }, { at: [300, 400], zoom: 1.28 });
  kin(ctx, 'トゲのない', t, at(s.L, 0), { x: W * .05, y: H * .34, size: 260, align: 'left', face: 'rose', fx: 'rise', fill: C.cream, under: C.red, reg: [7, 6] });
  kin(ctx, '薔薇に相応しい', t, at(s.L, 5), { x: W * .95, y: H * .9, size: 220, align: 'right', face: 'rose', fx: 'rise', fill: C.pink, under: C.navy, reg: [7, 6] });
  withAlpha(ctx, .9, () => rose(ctx, W * .82, H * .28, 120, t, { bloom: easeOut(clamp(s.k * 1.3)), colour: C.red, line: C.cream }));
};
// 27 生き様さ (big): rooftop print; hollow echoes behind her, the three characters stamped in front
F[27] = (ctx, t, s) => {
  const f = base(ctx, 'roof', t, s, { at: [470, 290], zoom: 1.6 }, { at: [470, 290], zoom: 1.8 }, { print: true });
  for (let e = 1; e <= 3; e++)                                   // hollow echoes stepping up behind the stamp
    kin(ctx, '生き様さ', t, at(s.L, 0) + e * .08, { x: W / 2, y: H * .8 - e * 150, size: 430, face: 'loud', fx: 'slam', dur: .2, fill: null,
      outline: `rgba(246,236,241,${.7 - e * .18})`, outlineW: 3, hollow: true });
  f(ctx, 'fg', { print: true });
  kin(ctx, '生き様さ', t, at(s.L, 0), { x: W / 2, y: H * .8, size: 430, face: 'loud', fx: 'slam', fill: C.red, under: C.cream, reg: [12, 9], dur: .2 });
};
// 28 わたしになれなくても (small): five strips, the middle one in colour
F[28] = (ctx, t, s) => {
  fillBg(ctx, C.navy);
  const n = 5, sw = W / n, shown = clamp(hitIdx(t) - hitIdx(s.t0) + 1, 1, n), order = [2, 1, 3, 0, 4];
  for (let j = 0; j < shown; j++) { const col = order[j], age = t - (DATA.hits[hitIdx(s.t0) + j] ?? s.t0), z = lerp(1.25, 1, expoOut(clamp(age / .35)));
    rshot(ctx, 'roof', [470 + (col - 2) * 50, 350], 1.05 * z, { rect: [col * sw + 6, 0, sw - 12, H], print: col !== 2 }); }
  shade(ctx); small(ctx, s.L, t, s, W / 2, H - 70, { align: 'center', size: 62 });
};
// 29 アナタは別の色 (big): quarters in four inks; 別の色 huge, every character a different ink
F[29] = (ctx, t, s) => {
  const inks = [null, C.pink, C.lilac, C.red], n = clamp(hitIdx(t) - hitIdx(s.t0) + 2, 2, 4);
  fillBg(ctx, C.navy);
  for (let q = 0; q < n; q++) { const rect = [(q % 2) * W / 2, Math.floor(q / 2) * H / 2, W / 2, H / 2];
    rshot(ctx, 'sit', PHOTOS.sit.face, 1.05, { rect, print: q > 0 });
    if (inks[q]) { ctx.save(); ctx.beginPath(); ctx.rect(...rect); ctx.clip(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = inks[q]; ctx.fillRect(...rect); ctx.restore(); } }
  kin(ctx, 'アナタは', t, at(s.L, 0), { x: W * .5, y: H * .38, size: 150, face: 'loud', fx: 'track', fill: C.cream, under: C.navy, reg: [5, 4] });
  ['別', 'の', '色'].forEach((ch, j) => kin(ctx, ch, t, at(s.L, 4 + j), { x: W * (.3 + j * .2), y: H * .82, size: 300, face: 'loud', fx: 'drop',
    fill: [C.pink, C.lilac, C.red][j], under: C.cream, reg: [7, 6] }));
};
// 30 間違いと呼ばないで (small, panel): the card where 間違い is struck through, then the strike is pulled away
F[30] = (ctx, t, s) => {
  base(ctx, 'sit', t, s, { at: [262, 115], zoom: 1.2 }, { at: [262, 115], zoom: 1.4 });
  const x = W / 2, y = H - 80, c = card(s.L.text, { size: 66, face: 'hand', bg: C.cream, fg: C.navy, border: C.pink });
  standUp(ctx, c, x, y, t, at(s.L, 0), { dur: .28, out: out(s) });
  const c2 = s.L.chars[2][1], c3 = s.L.chars[3][1], on = easeOut(prog(t, c2, c2 + .2)), off = easeIn(prog(t, c3 + .6, c3 + 1.0)), x0 = x - c.width / 2 + 18, x1 = x0 + c.width * .36;
  if (on > 0 && off < 1 && t < out(s)) { ctx.strokeStyle = C.red; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(lerp(x0, x1, off), y - c.height * .5); ctx.lineTo(lerp(x0, x1, on), y - c.height * .5); ctx.stroke(); }
};
// 31 トゲがない薔薇なだけ (big): print flash; トゲがない huge behind her, 薔薇なだけ in front
F[31] = (ctx, t, s) => {
  const f = base(ctx, 'rose', t, s, { at: [320, 330], zoom: 1.2 }, { at: [320, 330], zoom: 1.45 });
  printFlash(ctx, f, t, .1);
  kin(ctx, 'トゲがない', t, at(s.L, 0), { x: W / 2, y: H * .7, size: 330, face: 'loud', fx: 'rise', fill: C.pink, under: C.cream, reg: [8, 7] });
  kin(ctx, '薔薇なだけ', t, at(s.L, 5), { x: W / 2, y: H * .95, size: 180, face: 'rose', fx: 'track', fill: C.cream, under: C.red, reg: [6, 5] });
};

// ---------- ending
// 32 見納めて (small): the smoking close-up pulling out, colour draining
F[32] = (ctx, t, s) => { ctx.filter = `saturate(${lerp(1, .4, s.k)})`; base(ctx, 'smoke', t, s, { at: [330, 130], zoom: 1.5 }, { at: [330, 130], zoom: 1.05 }, { kick: 0 }); ctx.filter = 'none';
  small(ctx, s.L, t, s, W - 140, H - 110, { face: 'fragile', size: 76, align: 'right', fx: 'fade' }); };
// 33 枯れゆくまで (big, gentle): the rose greys, petals fall; the words large and fragile, fading slowly
F[33] = (ctx, t, s) => {
  ctx.filter = `grayscale(${s.k})`; base(ctx, 'rose', t, s, { at: [300, 420], zoom: 1.6 }, { at: [300, 420], zoom: 1.8 }, { print: s.k > .5, kick: 0 }); ctx.filter = 'none';
  petals(ctx, t, s.t0, 40, `rgba(163,18,58,${lerp(.8, .3, s.k)})`);
  kin(ctx, '枯れゆくまで', t, at(s.L, 0), { x: W / 2, y: H * .62, size: 230, face: 'fragile', fx: 'fade', dur: .8, fill: C.cream, under: C.red, reg: [4, 3], out: s.t1 - 1.2, outDur: 1.0 });
};
// outro: slow crossfades through the stills and their prints; the title returns huge
sceneOutro = (ctx, t, s) => {
  const seq = ['sunset', 'rose', 'near', 'roof', 'lookup', 'room', 'smoke', 'rose'], dur = (s.t1 - s.t0) / seq.length;
  const j = Math.min(seq.length - 1, Math.floor((t - s.t0) / dur)), k = ((t - s.t0) % dur) / dur;
  const draw = (id, kk, a, pr) => { ctx.save(); ctx.globalAlpha = a; ctx.filter = `grayscale(${lerp(.2, .9, s.k)}) brightness(${lerp(.95, .55, s.k)})`;
    rshot(ctx, id, PHOTOS[id].face, lerp(1.2, 1.35, kk), { print: pr }); ctx.restore(); };
  fillBg(ctx, C.navy); draw(seq[j], k, 1, j % 2 === 1);
  if (k > .75 && j + 1 < seq.length) draw(seq[j + 1], 0, (k - .75) / .25, (j + 1) % 2 === 1);
  petals(ctx, t, s.t0 - 3, 24, 'rgba(163,18,58,.35)');
  const e = s.t1 - 7;
  kin(ctx, '私の薔薇には', t, e, { x: W / 2, y: H * .5, size: 200, face: 'hero', fx: 'fade', dur: 1, fill: C.cream, under: C.red, reg: [6, 5] });
  kin(ctx, '棘がない', t, e + .6, { x: W / 2, y: H * .78, size: 200, face: 'hero', fx: 'fade', dur: 1, fill: C.red, under: C.cream, reg: [6, 5] });
  kin(ctx, 'Flehmann × OTO MAYUMI', t, e + 1.4, { x: W / 2, y: H * .9, size: 34, face: 'mono', fx: 'fade', dur: 1, fill: C.lilac });
};

Object.assign(SCENES, F);
})();
