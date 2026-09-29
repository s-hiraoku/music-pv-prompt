// fresh.js: the "only red has colour" cut (index.html?cut=fresh). The world is grey and only the stills' reds keep
// their colour; the choruses open into full colour and the ending drains back until the red goes too.
// Every still is alive (live.js: depth parallax, wind in the hair, twinkling lights, smoke, candles, sun), split
// screens snap on the staccato hits, and the lyrics are motion graphics drawn in front of everything: every line
// set small and editorial (red mincho, hairline, English gloss), the key words as designed compositions (mg.js).
(() => {
if (new URLSearchParams(location.search).get('cut') !== 'fresh') return;
const RED = MG.red, DEEP = MG.deep, CREAM = MG.cream, GREY = MG.grey, INKG = MG.ink;
const SPLASH = {};
window.loadFresh = () => {
  const load = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  return Promise.all(RISO_IDS.map(async id => {
    const [full, fg] = await Promise.all([load(`../design/splash/${id}_full.jpg`), load(`../design/splash/${id}_fg.png`)]);
    SPLASH[id] = { full, fg, s: full.width / PHOTOS[id].crop[2] };
  }));
};
window.loadLiveExtra = loadLive;
window.afterScene = (ctx, t) => hud(ctx, t, t < 1.5 ? prog(t, .5, 1.5) : t > DATA.duration - 4 ? 1 - prog(t, DATA.duration - 4, DATA.duration - 2) : 1);

const T = i => DATA.lines[i];
function colour(t) {
  const up = (a, b) => easeInOut(prog(t, a, b)), dn = (a, b) => 1 - easeInOut(prog(t, a, b));
  const c1 = T(12).start - .3, e1 = T(19).end + .5, c2 = T(26).start - .3, e2 = T(33).end;
  if (t < c1) return 0;
  if (t < e1) return up(c1, c1 + .5);
  if (t < T(20).start - .2) return 0;
  if (t < c2) return .55 * Math.min(up(T(22).start - .3, T(22).start + .8), dn(T(24).start - .3, T(24).start + .2));
  if (t < T(32).start) return up(c2, c2 + .5);
  return dn(T(32).start, e2);
}
// a living still; the camera always breathes a little (parallax), kicks on hits; overlays per still when full frame
const CANDLES = { rose: [[.035, .05]] };
function still(ctx, id, at, z, o = {}) {
  const t = window.CUR_T ?? 0, seed = RISO_IDS.indexOf(id) * 1.7;
  if (!LIVE.ready) { rshot(ctx, id, at, z, { ...o, set: (o.colour ?? 0) < .5 ? SPLASH : undefined }); return; }
  const kick = pulse(t, .2) * .004, shift = [.013 * Math.sin(t * .42 + seed) + kick, .004 * Math.sin(t * .31 + seed * 2)];
  ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const view = liveShot(ctx, id, t, { at, zoom: z, shift, focus: .5 }, { colour: o.colour ?? 0, rect: o.rect, wind: o.rect ? .0015 : .0026 });
  ctx.restore();
  if (o.rect && o.rect[2] < W * .6) return;                           // cells stay clean
  if (LIVE.lights[id]?.length > 3) twinkle(ctx, id, view, t, shift);
  if (id === 'smoke') smoke(ctx, view, t, [245 / 764, 66 / 506]);
  if (CANDLES[id]) candles(ctx, view, t, CANDLES[id]);
  if (id === 'sunset') sunGlow(ctx, view, t, [85 / 762, 148 / 506]);
}
function move(ctx, t, s, id, a, b, o = {}) {
  const k = easeInOut(s.k), z = lerp(a[1], b[1], k) * (1 + .03 * (o.kick ?? 1) * pulse(t, .2));
  const P = PHOTOS[id], pa = typeof a[0] === 'string' ? P[a[0]] : a[0], pb = typeof b[0] === 'string' ? P[b[0]] : b[0];
  still(ctx, id, [lerp(pa[0], pb[0], k), lerp(pa[1], pb[1], k)], z, { colour: o.colour ?? colour(t) });
}
function grid(ctx, t, s, rects, cells) {
  fillBg(ctx, INKG);
  const h0 = hitIdx(s.t0);
  cells.forEach((c, i) => {
    if (i > 0 && t < (DATA.hits[h0 + i] ?? 1e9)) return;
    const age = t - (i ? DATA.hits[h0 + i] : s.t0), z = c.z * lerp(1.12, 1, expoOut(clamp(age / .3)));
    const P = PHOTOS[c.id]; still(ctx, c.id, typeof c.pt === 'string' ? P[c.pt] : c.pt, z, { rect: rects[i], colour: c.colour ?? colour(t) });
  });
}
const cols = (n, g = 8) => Array.from({ length: n }, (_, i) => [i * W / n + g / 2, 0, W / n - g, H]);
const quad = (g = 8) => [[0, 0, W / 2 - g / 2, H / 2 - g / 2], [W / 2 + g / 2, 0, W / 2 - g / 2, H / 2 - g / 2], [0, H / 2 + g / 2, W / 2 - g / 2, H / 2 - g / 2], [W / 2 + g / 2, H / 2 + g / 2, W / 2 - g / 2, H / 2 - g / 2]];
const nine = (g = 6) => Array.from({ length: 9 }, (_, i) => [(i % 3) * W / 3 + g / 2, Math.floor(i / 3) * H / 3 + g / 2, W / 3 - g, H / 3 - g]);

// the editorial lyric: a red hairline grows, the Japanese rises on it, an English gloss fades in under it
const EN = ['strong contrast', "a maze you can't leave unhurt", 'a dirty dream, forced white', "someone who can't be me", 'clinging, loudly',
  'careful?', "you'll get burned", 'not yet?', 'again?', 'a flashback, inside my head', 'try pulling my strings — too late', 'time over',
  'yes, no thorns', "the ache is lovable, isn't it?", "someone who can't be me", 'shaking you off, hard', 'like moths in a swarm',
  "funny, isn't it", 'careful', "you'll get burned", 'idealising the ideal', 'utopia, accelerating', 'eden, so far away',
  "which is why it's beautiful", "if you can't love weakness and strength", "there's no reason for me to live", 'fit for a rose without thorns',
  "that's how I live", "even if you can't be me", "you're another colour", "don't call it a mistake", 'just a rose without thorns',
  'take your last look', 'until it withers'];
function lyric(ctx, L, t, s, pos = 'bl', o = {}) {
  const i = Math.floor(L.i), t0 = at(L, 0), leave = s.t1 - .25, text = (o.text ?? L.text).replace(/[「」]/g, '');
  const right = pos[1] === 'r', top = pos[0] === 't', x = right ? W - 110 : 110, y = top ? 200 : H - 150, al = right ? 'right' : 'left';
  const ink = o.ink ?? CREAM, len = measure(ctx, text, 70, FACES.base.w, FACES.base.fam) + 40;
  const g = easeOut(prog(t, t0 - .15, t0 + .25)) * (1 - easeIn(prog(t, leave, leave + .25)));
  if (g > 0) {
    const gy = top ? 0 : H - 330, gr = ctx.createLinearGradient(0, top ? 330 : H - 330, 0, top ? 0 : H);
    gr.addColorStop(0, 'rgba(16,14,20,0)'); gr.addColorStop(1, `rgba(16,14,20,${.6 * g})`); ctx.fillStyle = gr; ctx.fillRect(right ? W * .35 : 0, gy, W * .65, 330);
    ctx.fillStyle = RED; ctx.fillRect(right ? x - len * g : x - 6, y + 22, len * g, 3);
    ctx.fillRect(right ? x - len * g - 14 : x - 6 + len * g + 6, y + 17, 8 * g, 8 * g);          // a small red square rides the rule's end
  }
  kin(ctx, text, t, t0, { x, y, size: 70, face: 'base', fx: 'rise', align: al, fill: ink, under: 'rgba(208,20,44,.85)', reg: [3, 2], out: leave, dur: .28 });
  kin(ctx, EN[i], t, t0 + .2, { x: right ? x : x + 4, y: y + 70, size: 34, face: 'en', fx: 'fade', align: al, fill: GREY, out: leave, dur: .5 });
}
const end = s => s.t1 - .05;

// ---------- intro: the rose portrait assembles from a 4x4 mosaic on the beats; the title assembles, a ring turns
sceneIntro = (ctx, t, s) => {
  fillBg(ctx, INKG);
  const first = DATA.hits.find(h => h > 6) ?? 6.5, bs = DATA.beats.filter(b => b >= first - .01);
  const nb = bs.findIndex(b => b > t), shown = t < first ? Math.floor(prog(t, .5, first) * 4) : 4 + (nb === -1 ? 12 : nb);
  const order = Array.from({ length: 16 }, (_, i) => i).sort((a, b) => hash(a, 3) - hash(b, 3)), tw = W / 4, th = H / 4;
  const full = makeCanvas(W, H), g = full.getContext('2d'); still(g, 'rose', [310, 380], lerp(1.35, 1.2, prog(t, 0, s.t1)), { colour: 0 });
  for (let j = 0; j < Math.min(16, shown); j++) { const q = order[j], r = [(q % 4) * tw + 3, Math.floor(q / 4) * th + 3, tw - 6, th - 6]; ctx.drawImage(full, ...r, ...r); }
  if (t > first + 1.5) {
    const k = easeOut(prog(t, first + 1.5, first + 3)); ctx.fillStyle = `rgba(22,20,27,${.55 * k})`; ctx.fillRect(0, 0, W, H);
    ring(ctx, 'MY ROSE HAS NO THORNS · 私の薔薇には棘がない · ', t, first + 1.6, s.t1 + .2, { x: W / 2, y: H * .47, r: 430, size: 26, fill: GREY, spin: .25 });
    assemble(ctx, '私の薔薇には棘がない', t, first + 1.8, s.t1 + .3, { x: W / 2, y: H * .52, size: 150, fill: RED, stroke: DEEP });
    band(ctx, 'Flehmann × OTO MAYUMI', t, first + 3.2, s.t1 + .3, { y: H * .7, size: 34, face: 'mono', labels: ['FEAT.', '2024'] });
  }
};

const F = {};
// ---------- verse 1 (grey + red)
F[0] = (ctx, t, s) => { move(ctx, t, s, 'roof', [[560, 300], 1.2], ['face', 1.35]);
  split(ctx, 'コントラスト', t, at(s.L, 2), end(s), { y: H * .56, size: 250 }); lyric(ctx, s.L, t, s, 'bl'); };
F[1] = (ctx, t, s) => { move(ctx, t, s, 'room', [[455, 360], 1.05], ['face', 1.22]); lyric(ctx, s.L, t, s, 'br'); };
F[2] = (ctx, t, s) => { move(ctx, t, s, 'lying', [[260, 300], 1.1], ['face', 1.35]);
  glitch(ctx, '汚い夢', t, at(s.L, 12), end(s), { x: W * .7, y: H * .4, size: 180 }); lyric(ctx, s.L, t, s, 'bl'); };
F[3] = (ctx, t, s) => { move(ctx, t, s, 'rose', ['rose', 1.45], ['face', 1.15]); lyric(ctx, s.L, t, s, 'br'); };
F[4] = (ctx, t, s) => { grid(ctx, t, s, quad(), [{ id: 'room', pt: 'hand', z: 1.6 }, { id: 'room', pt: 'face', z: 1.9 }, { id: 'near', pt: 'rings', z: 1.4 }, { id: 'room', pt: 'panda', z: 1.8 }]);
  lyric(ctx, s.L, t, s, 'bl'); };
F[5] = (ctx, t, s) => { move(ctx, t, s, 'roof', ['moon', 1.8], ['moon', 1.5]); lyric(ctx, s.L, t, s, 'tr'); };
F[6] = (ctx, t, s) => { move(ctx, t, s, 'rose', ['rose', 1.9], ['rose', 2.2]);
  burst(ctx, 'ヤケド', t, at(s.L, 0), end(s), { y: H * .62, size: 380, ring: '#ff5a3a' }); lyric(ctx, s.L, t, s, 'br'); };
F[7] = (ctx, t, s) => { move(ctx, t, s, 'sit', [[262, 160], 1.2], ['face', 1.4]); lyric(ctx, s.L, t, s, 'tl'); };
F[8] = (ctx, t, s) => { grid(ctx, t, s, cols(2), [{ id: 'sit', pt: 'face', z: 1.3 }, { id: 'sit', pt: 'neon', z: 1.3 }]); lyric(ctx, s.L, t, s, 'tr'); };
F[9] = (ctx, t, s) => {
  fillBg(ctx, INKG); const fr = Math.floor(t * 15);
  nine().forEach((r, i) => { const id = CUTS[Math.floor(hash(fr, i) * CUTS.length)]; still(ctx, id, PHOTOS[id].face, 1.3 + hash(fr, i, 2) * .5, { rect: r, colour: hash(fr, i, 3) > .7 ? 1 : 0 }); });
  glitch(ctx, 'フラッシュバック', t, at(s.L, 2), end(s), { y: H * .6, size: 210 }); lyric(ctx, s.L, t, s, 'bl');
};
F[10] = (ctx, t, s) => { move(ctx, t, s, 'room', ['hand', 1.8], ['hand', 1.5]); lyric(ctx, s.L, t, s, 'br'); };
F[11] = (ctx, t, s) => {
  move(ctx, t, s, 'sit', ['neon', 1.6], ['neon', 1.9]);
  const e = at(s.L, 5), left = Math.max(0, e - t);
  band(ctx, `00:0${Math.floor(left)}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`, t, s.t0, e + .05, { y: H * .42, size: 120, face: 'mono', bg: INKG, fg: RED });
  burst(ctx, 'TIME OVER', t, e, end(s), { y: H * .62, size: 230, face: 'en' }); lyric(ctx, s.L, t, s, 'bl');
};

// ---------- chorus 1 (colour opens)
F[12] = (ctx, t, s) => { move(ctx, t, s, 'rose', ['rose', 1.3], ['face', 1.1]);
  ring(ctx, 'NO THORNS · NO THORNS · NO THORNS · ', t, at(s.L, 0), end(s), { x: W * .44, y: H * .45, r: 380, size: 30, fill: CREAM });
  assemble(ctx, 'トゲがない', t, at(s.L, 3), end(s), { y: H * .9, size: 300, fill: CREAM, stroke: RED }); lyric(ctx, s.L, t, s, 'tl'); };
F[13] = (ctx, t, s) => { move(ctx, t, s, 'roof', [[900, 330], 1.1], ['face', 1.3]);
  echo(ctx, '痛々しさが', t, at(s.L, 0), end(s), { x: 70, y: H * .78, size: 250, align: 'left', fill: RED, stroke: CREAM }); lyric(ctx, s.L, t, s, 'tr'); };
F[14] = (ctx, t, s) => { grid(ctx, t, s, cols(3), [{ id: 'room', pt: 'face', z: 1.3, colour: 1 }, { id: 'lookup', pt: 'face', z: 1.1, colour: 0 }, { id: 'near', pt: 'face', z: 1.2, colour: 0 }]);
  burst(ctx, 'ヒト', t, at(s.L, 8), end(s), { y: H * .66, size: 360 }); lyric(ctx, s.L, t, s, 'bl'); };
F[15] = (ctx, t, s) => { const hi = hitIdx(t), id = hi % 2 ? 'lying' : 'sit';
  still(ctx, id, PHOTOS[id].face, (1.2 + .08 * hash(hi)) * (1 + .05 * pulse(t, .16)), { colour: colour(t) });
  band(ctx, 'ふりほどく', t, at(s.L, 3), end(s), { y: H * .4, size: 150, labels: ['SHAKE', 'OFF'] }); lyric(ctx, s.L, t, s, 'br'); };
F[16] = (ctx, t, s) => { move(ctx, t, s, 'roof', [[820, 330], 1.12], ['face', 1.3]);
  moths(ctx, t, W * .7, H * .35, Math.floor(lerp(8, 40, s.k)), 'rgba(243,236,230,.75)'); lyric(ctx, s.L, t, s, 'bl'); };
F[17] = (ctx, t, s) => { move(ctx, t, s, 'smoke', [[360, 150], 1.2], [[320, 125], 1.3], { kick: 0 }); lyric(ctx, s.L, t, s, 'br'); };
F[18] = (ctx, t, s) => { move(ctx, t, s, 'smoke', [[320, 125], 1.3], [[300, 120], 1.38], { kick: 0 });
  ticker(ctx, '気をつけて ／ CAREFUL ／ ', H * .18, 34, 240, t, INKG, RED, -.05, 58); lyric(ctx, s.L, t, s, 'bl'); };
F[19] = (ctx, t, s) => { move(ctx, t, s, 'roof', ['face', 1.35], ['face', 1.6]);
  glitch(ctx, 'ヤケドするよ', t, at(s.L, 0), end(s), { y: H * .36, size: 250 }); lyric(ctx, s.L, t, s, 'br'); };

// ---------- instrumental: 2 → 4 → 9 split cuts on the hits, colour and grey alternating by cell; bands cross
sceneMontage = (ctx, t, s) => {
  const hi = Math.max(0, hitIdx(t) - hitIdx(s.t0)), stage = hi < 6 ? cols(2) : hi < 14 ? quad() : nine();
  fillBg(ctx, INKG);
  stage.forEach((r, i) => { const [id, pt, z] = DETAILS[Math.floor(hash(hi >> 1, i, 7) * DETAILS.length)];
    still(ctx, id, PHOTOS[id][pt], z * (1 + .05 * pulse(t, .2)), { rect: r, colour: (i + hi) % 2 }); });
  ticker(ctx, 'NO THORNS ✕ 棘がない ✕ ', H * .35, 64, 700, t, CREAM, RED, -.08, 100);
  ticker(ctx, 'MY ROSE ✕ 私の薔薇 ✕ ', H * .7, 44, -520, t, RED, CREAM, .05, 70);
};

// ---------- bridge
F[20] = (ctx, t, s) => { grid(ctx, t, s, cols(2), [{ id: 'room', pt: 'face', z: 1.1 }, { id: 'room', pt: 'window', z: 1.6 }]);
  echo(ctx, '理想', t, at(s.L, 3), end(s), { x: W / 2, y: H * .6, size: 220, fill: RED, stroke: CREAM, n: 5 }); lyric(ctx, s.L, t, s, 'bl'); };
F[21] = (ctx, t, s) => { move(ctx, t, s, 'roof', ['city', 1.2], ['city', 2.0]);
  speedLines(ctx, t, W / 2, H / 2, lerp(.5, 3, easeIn(s.k)), 'rgba(208,20,44,.5)');
  band(ctx, 'ユートピア', t, at(s.L, 4), end(s), { y: H * .55, size: 230, labels: ['ACCELERATE', '→→→'] }); lyric(ctx, s.L, t, s, 'tl'); };
F[22] = (ctx, t, s) => { move(ctx, t, s, 'sunset', ['sun', 2.2], ['sun', 1.0], { kick: 0 });
  ring(ctx, 'EDEN · 楽園 · EDEN · 楽園 · ', t, at(s.L, 0), end(s), { x: W * .15, y: H * .3, r: 150, size: 24, fill: CREAM, spin: .5 }); lyric(ctx, s.L, t, s, 'tr', { text: '楽園は遥か遠く' }); };
F[23] = (ctx, t, s) => { ctx.filter = `blur(${lerp(10, 0, easeOut(s.k))}px)`; move(ctx, t, s, 'lookup', ['face', 1.2], ['face', 1.35], { kick: 0 }); ctx.filter = 'none';
  assemble(ctx, '綺麗', t, at(s.L, 5), end(s), { x: W * .72, y: H * .5, size: 200, fill: CREAM, stroke: RED }); lyric(ctx, s.L, t, s, 'br'); };
F[24] = (ctx, t, s) => { grid(ctx, t, s, cols(2), [{ id: 'room', pt: 'face', z: 1.2, colour: 0 }, { id: 'room', pt: 'face', z: 1.2, colour: 1 }]);
  split(ctx, '弱さも', t, at(s.L, 0), end(s), { x: W * .25, y: H * .5, size: 170 });
  split(ctx, '強さも', t, at(s.L, 3), end(s), { x: W * .75, y: H * .5, size: 170, top: CREAM, bottom: RED }); lyric(ctx, s.L, t, s, 'bl'); };
F[25] = (ctx, t, s) => { fillBg(ctx, INKG); still(ctx, 'lookup', PHOTOS.lookup.face, 1.2, { rect: [W * .5, H * .15, W * .4, H * .7], colour: 0 });
  lyric(ctx, s.L, t, s, 'bl'); };

// ---------- final chorus (colour again)
F[26] = (ctx, t, s) => { move(ctx, t, s, 'rose', ['face', 1.1], ['rose', 1.4]);
  ring(ctx, '薔薇 · ROSE · 薔薇 · ROSE · ', t, at(s.L, 5), end(s), { x: W * .45, y: H * .45, r: 330, size: 34, fill: CREAM, spin: -.4 });
  assemble(ctx, '薔薇', t, at(s.L, 5), end(s), { x: W * .76, y: H * .7, size: 380, fill: RED, stroke: CREAM }); lyric(ctx, s.L, t, s, 'bl'); };
F[27] = (ctx, t, s) => { move(ctx, t, s, 'roof', ['face', 1.6], ['face', 1.85]);
  burst(ctx, '生き様さ', t, at(s.L, 0), end(s), { y: H * .74, size: 330 }); lyric(ctx, s.L, t, s, 'tl'); };
F[28] = (ctx, t, s) => { grid(ctx, t, s, cols(5), [2, 1, 3, 0, 4].map(c => ({ id: 'roof', pt: [470 + (c - 2) * 50, 330], z: 1.05, colour: c === 2 ? 1 : 0 })));
  lyric(ctx, s.L, t, s, 'br'); };
F[29] = (ctx, t, s) => { grid(ctx, t, s, quad(), [{ id: 'sit', pt: 'face', z: 1.1, colour: 1 }, { id: 'sit', pt: 'face', z: 1.1, colour: 0 }, { id: 'near', pt: 'face', z: 1.2, colour: 1 }, { id: 'lookup', pt: 'face', z: 1.1, colour: 0 }]);
  assemble(ctx, '別の色', t, at(s.L, 4), end(s), { y: H * .6, size: 320, fill: [RED, MG.lilac, CREAM], stroke: INKG }); lyric(ctx, s.L, t, s, 'bl'); };
F[30] = (ctx, t, s) => { move(ctx, t, s, 'sit', ['face', 1.25], ['face', 1.45]);
  band(ctx, '間違い', t, at(s.L, 0), at(s.L, 3) + .9, { x: W * .62, y: H * .35, size: 150, bg: INKG, fg: CREAM, labels: ['ERROR?', 'NO.'] });
  const c3 = at(s.L, 3), strike = easeOut(prog(t, c3 + .1, c3 + .35)) * (1 - easeIn(prog(t, c3 + .7, c3 + .95)));
  if (strike > 0) { const w = wordW(ctx, '間違い', 150) + 60; ctx.fillStyle = RED; ctx.fillRect(W * .62 - w / 2, H * .35 - 6, w * strike, 12); }
  lyric(ctx, s.L, t, s, 'br'); };
F[31] = (ctx, t, s) => { move(ctx, t, s, 'rose', ['rose', 1.5], ['face', 1.2]);
  echo(ctx, 'トゲがない', t, at(s.L, 0), end(s), { x: W / 2, y: H * .92, size: 300, fill: CREAM, stroke: RED, outline: RED }); lyric(ctx, s.L, t, s, 'tl'); };

// ---------- ending
F[32] = (ctx, t, s) => { move(ctx, t, s, 'smoke', ['face', 1.5], ['face', 1.05], { kick: 0 }); lyric(ctx, s.L, t, s, 'br'); };
F[33] = (ctx, t, s) => {
  move(ctx, t, s, 'rose', ['rose', 1.6], ['rose', 1.9], { kick: 0 });
  petals(ctx, t, s.t0, 30, 'rgba(208,20,44,.7)');
  assemble(ctx, '枯れゆくまで', t, at(s.L, 0), s.t1 - .2, { y: H * .58, size: 210, fill: RED, stroke: CREAM, disperse: true }); lyric(ctx, s.L, t, s, 'bl');
};
sceneOutro = (ctx, t, s) => {
  const seq = ['sunset', 'near', 'roof', 'lookup', 'room', 'smoke', 'rose'], dur = (s.t1 - s.t0) / seq.length;
  const j = Math.min(seq.length - 1, Math.floor((t - s.t0) / dur)), k = ((t - s.t0) % dur) / dur;
  fillBg(ctx, INKG);
  still(ctx, seq[j], PHOTOS[seq[j]].face, lerp(1.2, 1.3, k), { colour: 0 });
  if (k > .75 && j + 1 < seq.length) still(ctx, seq[j + 1], PHOTOS[seq[j + 1]].face, 1.2, { colour: 0, alpha: (k - .75) / .25 });
  const g = prog(t, s.t1 - 6, s.t1 - 2.5); if (g > 0) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${g})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  ring(ctx, 'MY ROSE HAS NO THORNS · 私の薔薇には棘がない · ', t, s.t1 - 8.5, s.t1 + 1, { x: W / 2, y: H * .5, r: 420, size: 24, fill: GREY, spin: .2 });
  assemble(ctx, '私の薔薇には棘がない', t, s.t1 - 8, s.t1 + 1, { y: H * .55, size: 120, fill: RED, stroke: DEEP });
};

Object.assign(SCENES, F);
})();
