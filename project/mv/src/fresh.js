// fresh.js: a second, independent cut ("only red has colour"), opened with index.html?cut=fresh.
// One rule carries it: the world is grey and only the rose's red keeps its colour; the choruses open into full
// colour, the ending drains back until only red is left, then that goes too. Split screens (2 / 4 / 9) snap on the
// staccato hits. Every line is set small and editorial (red mincho, a hairline rule, an English gloss); only the
// song's key words become giant red type, placed behind her.
(() => {
if (new URLSearchParams(location.search).get('cut') !== 'fresh') return;
const RED = '#d0142c', DEEP = '#6e0816', GREY = '#bdb8c4', INKG = '#16141b';
const SPLASH = {};
window.loadFresh = () => {
  const load = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  return Promise.all(RISO_IDS.map(async id => {
    const [full, fg] = await Promise.all([load(`../design/splash/${id}_full.jpg`), load(`../design/splash/${id}_fg.png`)]);
    SPLASH[id] = { full, fg, s: full.width / PHOTOS[id].crop[2] };
  }));
};
const T = i => DATA.lines[i];
// how much colour the world has at time t (0 = grey + red, 1 = full colour)
function colour(t) {
  const up = (a, b) => easeInOut(prog(t, a, b)), dn = (a, b) => 1 - easeInOut(prog(t, a, b));
  const c1 = T(12).start - .3, e1 = T(19).end + .5, c2 = T(26).start - .3, e2 = T(33).end;
  if (t < c1) return 0;
  if (t < e1) return up(c1, c1 + .5);
  if (t < T(20).start - .2) return 0;                                  // instrumental: per-cell, see montage
  if (t < c2) return .55 * Math.min(up(T(22).start - .3, T(22).start + .8), dn(T(24).start - .3, T(24).start + .2));   // the sunset warms, then goes
  if (t < T(32).start) return up(c2, c2 + .5);
  return dn(T(32).start, e2);
}
// a still in the splash world, colour mixed in by amount
function still(ctx, id, at, z, o = {}) {
  const amt = o.colour ?? 0, layer = o.layer ?? 'full';
  if (amt < 1) rshot(ctx, id, at, z, { ...o, layer, set: SPLASH });
  if (amt > 0) rshot(ctx, id, at, z, { ...o, layer, alpha: (o.alpha ?? 1) * amt });
}
function move(ctx, t, s, id, a, b, o = {}) {        // a slow camera move over the window, a small kick on hits
  const k = easeInOut(s.k), z = lerp(a[1], b[1], k) * (1 + .03 * (o.kick ?? 1) * pulse(t, .2));
  const P = PHOTOS[id], pa = typeof a[0] === 'string' ? P[a[0]] : a[0], pb = typeof b[0] === 'string' ? P[b[0]] : b[0];
  const at = [lerp(pa[0], pb[0], k), lerp(pa[1], pb[1], k)], c = o.colour ?? colour(t);
  still(ctx, id, at, z, { colour: c });
  return layer => still(ctx, id, at, z, { colour: c, layer });
}
// split screens that open one cell per hit
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
  const right = pos[1] === 'r', top = pos[0] === 't', x = right ? W - 110 : 110, y = top ? 190 : H - 150, al = right ? 'right' : 'left';
  const ink = o.ink ?? RED, len = measure(ctx, text, 70, FACES.base.w, FACES.base.fam) + 40;
  const g = easeOut(prog(t, t0 - .15, t0 + .25)) * (1 - easeIn(prog(t, leave, leave + .25)));
  if (g > 0) {                                           // a soft shadow under the words so red reads on grey
    const gy = top ? 0 : H - 330, gr = ctx.createLinearGradient(0, top ? 330 : H - 330, 0, top ? 0 : H);
    gr.addColorStop(0, 'rgba(16,14,20,0)'); gr.addColorStop(1, `rgba(16,14,20,${.6 * g})`);
    ctx.fillStyle = gr; ctx.fillRect(right ? W * .35 : 0, gy, W * .65, 330);
  }
  if (g > 0) { ctx.fillStyle = ink; ctx.fillRect(right ? x - len * g : x - 6, y + 22, len * g, 3); }
  kin(ctx, text, t, t0, { x, y, size: 70, face: 'base', fx: 'rise', align: al, fill: ink, under: o.under ?? 'rgba(0,0,0,.35)', reg: [2, 2], out: leave, dur: .28 });
  kin(ctx, EN[i], t, t0 + .2, { x: right ? x : x + 4, y: y + 70, size: 34, face: 'en', fx: 'fade', align: al, fill: o.en ?? GREY, out: leave, dur: .5 });
}
// a giant red key word; drawn before her cut-out when `behind`
function keyword(ctx, text, t, t0, o) {
  kin(ctx, text, t, t0, { size: 300, face: 'base', fx: 'rise', fill: RED, under: DEEP, reg: [8, 6], dur: .3, ...o });
}

// ---------- intro: the rose portrait assembles out of a 4x4 mosaic on the beats; only the rose is red; then the title
sceneIntro = (ctx, t, s) => {
  fillBg(ctx, INKG);
  const first = DATA.hits.find(h => h > 6) ?? 6.5, bs = DATA.beats.filter(b => b >= first - .01);
  const tiles = 16, shown = t < first ? Math.floor(prog(t, .5, first) * 4) : 4 + Math.max(0, bs.findIndex(b => b > t) === -1 ? 12 : bs.findIndex(b => b > t));
  const order = Array.from({ length: tiles }, (_, i) => i).sort((a, b) => hash(a, 3) - hash(b, 3));
  const tw = W / 4, th = H / 4, z = lerp(1.35, 1.2, prog(t, 0, s.t1));
  for (let j = 0; j < Math.min(tiles, shown); j++) {
    const q = order[j], rect = [(q % 4) * tw + 3, Math.floor(q / 4) * th + 3, tw - 6, th - 6];
    ctx.save(); ctx.beginPath(); ctx.rect(...rect); ctx.clip();
    still(ctx, 'rose', [310, 380], z, { colour: 0 }); ctx.restore();
  }
  if (t > first + 1.5) {
    const k = easeOut(prog(t, first + 1.5, first + 3));
    ctx.fillStyle = `rgba(22,20,27,${.55 * k})`; ctx.fillRect(0, 0, W, H);
    kin(ctx, '私の薔薇には棘がない', t, first + 1.8, { x: W / 2, y: H * .55, size: 150, face: 'base', fx: 'track', fill: RED, under: DEEP, reg: [5, 4], dur: .6 });
    kin(ctx, 'My rose has no thorns', t, first + 2.4, { x: W / 2, y: H * .55 + 90, size: 54, face: 'en', fx: 'fade', fill: GREY, dur: .8 });
    kin(ctx, 'Flehmann × OTO MAYUMI', t, first + 3, { x: W / 2, y: H * .55 + 150, size: 24, face: 'mono', fx: 'fade', fill: GREY, dur: .8 });
  }
};

const F = {};
// ---------- verse 1 (grey + red)
F[0] = (ctx, t, s) => { const fg = move(ctx, t, s, 'roof', [[560, 300], 1.2], ['face', 1.35]);
  keyword(ctx, 'コントラスト', t, at(s.L, 2), { x: W / 2, y: H * .5, size: 280 }); fg('fg'); lyric(ctx, s.L, t, s, 'bl'); };
F[1] = (ctx, t, s) => { move(ctx, t, s, 'room', [[455, 360], 1.05], ['face', 1.22]); lyric(ctx, s.L, t, s, 'br'); };
F[2] = (ctx, t, s) => { move(ctx, t, s, 'lying', [[260, 300], 1.1], ['face', 1.35]); lyric(ctx, s.L, t, s, 'bl'); };
F[3] = (ctx, t, s) => { move(ctx, t, s, 'rose', ['rose', 1.45], ['face', 1.15]); lyric(ctx, s.L, t, s, 'br'); };
F[4] = (ctx, t, s) => { grid(ctx, t, s, quad(), [{ id: 'room', pt: 'hand', z: 1.6 }, { id: 'room', pt: 'face', z: 1.9 }, { id: 'near', pt: 'rings', z: 1.4 }, { id: 'room', pt: 'panda', z: 1.8 }]);
  lyric(ctx, s.L, t, s, 'bl'); };
F[5] = (ctx, t, s) => { move(ctx, t, s, 'roof', ['moon', 1.8], ['moon', 1.5]); lyric(ctx, s.L, t, s, 'tr'); };
F[6] = (ctx, t, s) => { move(ctx, t, s, 'rose', ['rose', 1.9], ['rose', 2.2]);
  keyword(ctx, 'ヤケド', t, at(s.L, 0), { x: W / 2, y: H * .62, size: 420, fx: 'slam', glow: { color: '#ff3a3a', blur: 40, a: .5 } }); lyric(ctx, s.L, t, s, 'br'); };
F[7] = (ctx, t, s) => { move(ctx, t, s, 'sit', [[262, 160], 1.2], ['face', 1.4]); lyric(ctx, s.L, t, s, 'tl'); };
F[8] = (ctx, t, s) => { grid(ctx, t, s, cols(2), [{ id: 'sit', pt: 'face', z: 1.3 }, { id: 'sit', pt: 'neon', z: 1.3 }]); lyric(ctx, s.L, t, s, 'tr'); };
// 9 脳内フラッシュバック: nine cells strobing through every still, colour flickering in and out
F[9] = (ctx, t, s) => {
  fillBg(ctx, INKG); const fr = Math.floor(t * 15);
  nine().forEach((r, i) => { const id = CUTS[Math.floor(hash(fr, i) * CUTS.length)]; still(ctx, id, PHOTOS[id].face, 1.3 + hash(fr, i, 2) * .5, { rect: r, colour: hash(fr, i, 3) > .7 ? 1 : 0 }); });
  keyword(ctx, 'フラッシュバック', t, at(s.L, 2), { x: W / 2, y: H * .6, size: 220, fx: 'track' }); lyric(ctx, s.L, t, s, 'bl');
};
F[10] = (ctx, t, s) => { move(ctx, t, s, 'room', ['hand', 1.8], ['hand', 1.5]); lyric(ctx, s.L, t, s, 'br'); };
// 11 時間切れ（タイムオーバー）: neon still, the countdown small, TIME OVER giant at zero
F[11] = (ctx, t, s) => {
  move(ctx, t, s, 'sit', ['neon', 1.6], ['neon', 1.9]);
  const end = at(s.L, 5), left = Math.max(0, end - t);
  kin(ctx, `00:0${Math.floor(left)}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`, t, s.t0, { x: W - 110, y: 150, size: 60, face: 'mono', fx: 'fade', align: 'right', fill: RED, dur: .1 });
  keyword(ctx, 'TIME OVER', t, end, { x: W / 2, y: H * .6, size: 260, face: 'en', fx: 'slam', dur: .15 }); lyric(ctx, s.L, t, s, 'bl');
};

// ---------- chorus 1 (colour opens)
F[12] = (ctx, t, s) => { move(ctx, t, s, 'rose', ['rose', 1.3], ['face', 1.1]);
  keyword(ctx, 'トゲがない', t, at(s.L, 3), { x: W / 2, y: H * .9, size: 360, fill: '#e8e1e6', under: RED, reg: [9, 7] }); lyric(ctx, s.L, t, s, 'tl', { ink: '#f3ece6', under: RED }); };
F[13] = (ctx, t, s) => { const fg = move(ctx, t, s, 'roof', [[900, 330], 1.1], ['face', 1.3]);
  keyword(ctx, '痛々しさが', t, at(s.L, 0), { x: 60, y: H * .36, size: 330, align: 'left' }); fg('fg'); lyric(ctx, s.L, t, s, 'br', { ink: '#f3ece6', under: RED }); };
F[14] = (ctx, t, s) => { grid(ctx, t, s, cols(3), [{ id: 'room', pt: 'face', z: 1.3, colour: 1 }, { id: 'lookup', pt: 'face', z: 1.1, colour: 0 }, { id: 'near', pt: 'face', z: 1.2, colour: 0 }]);
  keyword(ctx, 'ヒト', t, at(s.L, 8), { x: W / 2, y: H * .7, size: 380, fx: 'slam' }); lyric(ctx, s.L, t, s, 'bl', { ink: '#f3ece6', under: RED }); };
F[15] = (ctx, t, s) => { const hi = hitIdx(t), id = hi % 2 ? 'lying' : 'sit';
  still(ctx, id, PHOTOS[id].face, (1.2 + .08 * hash(hi)) * (1 + .05 * pulse(t, .16)), { colour: colour(t) }); lyric(ctx, s.L, t, s, 'br', { ink: '#f3ece6', under: RED }); };
F[16] = (ctx, t, s) => { move(ctx, t, s, 'roof', ['city', 1.4], ['moon', 1.7]);
  moths(ctx, t, W * .7, H * .35, Math.floor(lerp(8, 50, s.k)), 'rgba(243,236,230,.8)'); lyric(ctx, s.L, t, s, 'bl', { ink: '#f3ece6', under: RED }); };
F[17] = (ctx, t, s) => { move(ctx, t, s, 'near', ['face', 1.25], ['face', 1.4], { kick: 0 }); lyric(ctx, s.L, t, s, 'br', { ink: '#f3ece6', under: RED }); };
F[18] = (ctx, t, s) => { grid(ctx, t, s, quad(), [{ id: 'room', pt: 'face', z: 1.3 }, { id: 'roof', pt: 'face', z: 1.4 }, { id: 'sit', pt: 'face', z: 1.2 }, { id: 'smoke', pt: 'face', z: 1.2 }]);
  lyric(ctx, s.L, t, s, 'bl', { ink: '#f3ece6', under: RED }); };
F[19] = (ctx, t, s) => { const fg = move(ctx, t, s, 'roof', ['face', 1.35], ['face', 1.6]);
  keyword(ctx, 'ヤケドするよ', t, at(s.L, 0), { x: W / 2, y: H * .34, size: 300, fx: 'slam', glow: { color: '#ff3a3a', blur: 40, a: .5 } }); fg('fg');
  lyric(ctx, s.L, t, s, 'br', { ink: '#f3ece6', under: RED }); };

// ---------- instrumental: 2 → 4 → 9 split cuts on the hits, colour and grey alternating by cell
sceneMontage = (ctx, t, s) => {
  const hi = Math.max(0, hitIdx(t) - hitIdx(s.t0)), stage = hi < 6 ? cols(2) : hi < 14 ? quad() : nine();
  fillBg(ctx, INKG);
  stage.forEach((r, i) => { const [id, pt, z] = DETAILS[Math.floor(hash(hi >> 1, i, 7) * DETAILS.length)];
    still(ctx, id, PHOTOS[id][pt], z * (1 + .05 * pulse(t, .2)), { rect: r, colour: (i + hi) % 2 }); });
  kin(ctx, 'NO THORNS', t, s.t0, { x: W / 2, y: H * .56, size: 200, face: 'en', fx: 'fade', fill: RED, dur: .5, out: s.t1 - .3 });
};

// ---------- bridge
F[20] = (ctx, t, s) => { grid(ctx, t, s, cols(2), [{ id: 'room', pt: 'face', z: 1.1 }, { id: 'room', pt: 'window', z: 1.6 }]); lyric(ctx, s.L, t, s, 'bl'); };
F[21] = (ctx, t, s) => { const fg = move(ctx, t, s, 'roof', ['city', 1.2], ['city', 2.0]);
  speedLines(ctx, t, W / 2, H / 2, lerp(.5, 3, easeIn(s.k)), 'rgba(208,20,44,.5)');
  keyword(ctx, 'ユートピア', t, at(s.L, 4), { x: W / 2, y: H * .62, size: 320, fx: 'slide', from: 1, dur: .2 }); lyric(ctx, s.L, t, s, 'tl'); };
F[22] = (ctx, t, s) => { move(ctx, t, s, 'sunset', ['sun', 2.2], ['sun', 1.0], { kick: 0 }); lyric(ctx, s.L, t, s, 'tr', { text: '楽園は遥か遠く' }); };
F[23] = (ctx, t, s) => { ctx.filter = `blur(${lerp(10, 0, easeOut(s.k))}px)`; move(ctx, t, s, 'lookup', ['face', 1.2], ['face', 1.35], { kick: 0 }); ctx.filter = 'none';
  lyric(ctx, s.L, t, s, 'br'); };
F[24] = (ctx, t, s) => { grid(ctx, t, s, cols(2), [{ id: 'room', pt: 'face', z: 1.2, colour: 0 }, { id: 'room', pt: 'face', z: 1.2, colour: 1 }]);
  kin(ctx, '弱さも', t, at(s.L, 0), { x: W * .25, y: H * .5, size: 190, face: 'base', fx: 'rise', fill: RED, under: DEEP, reg: [5, 4] });
  kin(ctx, '強さも', t, at(s.L, 3), { x: W * .75, y: H * .5, size: 190, face: 'base', fx: 'rise', fill: '#f3ece6', under: RED, reg: [5, 4] });
  lyric(ctx, s.L, t, s, 'bl'); };
F[25] = (ctx, t, s) => { fillBg(ctx, INKG); still(ctx, 'lookup', PHOTOS.lookup.face, 1.2, { rect: [W * .5, H * .15, W * .4, H * .7], colour: 0 });
  lyric(ctx, s.L, t, s, 'bl'); };

// ---------- final chorus (colour again)
const CR = { ink: '#f3ece6', under: RED };
F[26] = (ctx, t, s) => { move(ctx, t, s, 'rose', ['face', 1.1], ['rose', 1.4]);
  keyword(ctx, '薔薇', t, at(s.L, 5), { x: W * .72, y: H * .66, size: 460, fill: RED, under: '#f3ece6', reg: [9, 7] }); lyric(ctx, s.L, t, s, 'bl', CR); };
F[27] = (ctx, t, s) => { move(ctx, t, s, 'roof', ['face', 1.6], ['face', 1.85]);
  keyword(ctx, '生き様さ', t, at(s.L, 0), { x: W / 2, y: H * .9, size: 400, fx: 'slam', dur: .2, fill: '#f3ece6', under: RED, reg: [9, 7] }); lyric(ctx, s.L, t, s, 'tl', CR); };
F[28] = (ctx, t, s) => { grid(ctx, t, s, cols(5), [2, 1, 3, 0, 4].map(c => ({ id: 'roof', pt: [470 + (c - 2) * 50, 330], z: 1.05, colour: c === 2 ? 1 : 0 })).sort(() => 0));
  lyric(ctx, s.L, t, s, 'br', CR); };
F[29] = (ctx, t, s) => { grid(ctx, t, s, quad(), [{ id: 'sit', pt: 'face', z: 1.1, colour: 1 }, { id: 'sit', pt: 'face', z: 1.1, colour: 0 }, { id: 'near', pt: 'face', z: 1.2, colour: 1 }, { id: 'lookup', pt: 'face', z: 1.1, colour: 0 }]);
  keyword(ctx, '別の色', t, at(s.L, 4), { x: W / 2, y: H * .64, size: 340, fx: 'slam', fill: '#f3ece6', under: RED, reg: [9, 7] }); lyric(ctx, s.L, t, s, 'bl', CR); };
F[30] = (ctx, t, s) => { move(ctx, t, s, 'sit', ['face', 1.25], ['face', 1.45]); lyric(ctx, s.L, t, s, 'br', CR); };
F[31] = (ctx, t, s) => { move(ctx, t, s, 'rose', ['rose', 1.5], ['face', 1.2]);
  keyword(ctx, 'トゲがない', t, at(s.L, 0), { x: W / 2, y: H * .9, size: 360, fill: '#f3ece6', under: RED, reg: [9, 7] }); lyric(ctx, s.L, t, s, 'tl', CR); };

// ---------- ending: the colour drains back to grey + red, then the red goes too
F[32] = (ctx, t, s) => { move(ctx, t, s, 'smoke', ['face', 1.5], ['face', 1.05], { kick: 0 }); lyric(ctx, s.L, t, s, 'br'); };
F[33] = (ctx, t, s) => {
  move(ctx, t, s, 'rose', ['rose', 1.6], ['rose', 1.9], { kick: 0 });
  petals(ctx, t, s.t0, 30, 'rgba(208,20,44,.7)');
  keyword(ctx, '枯れゆくまで', t, at(s.L, 0), { x: W / 2, y: H * .6, size: 220, fx: 'fade', dur: .9, out: s.t1 - 1.2, outDur: 1 }); lyric(ctx, s.L, t, s, 'bl');
};
sceneOutro = (ctx, t, s) => {
  const seq = ['sunset', 'near', 'roof', 'lookup', 'room', 'smoke', 'rose'], dur = (s.t1 - s.t0) / seq.length;
  const j = Math.min(seq.length - 1, Math.floor((t - s.t0) / dur)), k = ((t - s.t0) % dur) / dur;
  fillBg(ctx, INKG);
  const draw = (id, a) => { ctx.save(); ctx.globalAlpha = a; still(ctx, id, PHOTOS[id].face, lerp(1.2, 1.3, k), { colour: 0 }); ctx.restore(); };
  draw(seq[j], 1); if (k > .75 && j + 1 < seq.length) draw(seq[j + 1], (k - .75) / .25);
  // the last red leaves: grey the whole frame over the final seconds
  const g = prog(t, s.t1 - 6, s.t1 - 2.5); if (g > 0) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${g})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  kin(ctx, '私の薔薇には棘がない', t, s.t1 - 8, { x: W / 2, y: H * .55, size: 120, face: 'base', fx: 'fade', fill: RED, under: DEEP, reg: [4, 3], dur: 1.2 });
  kin(ctx, 'My rose has no thorns', t, s.t1 - 7.2, { x: W / 2, y: H * .55 + 80, size: 48, face: 'en', fx: 'fade', fill: GREY, dur: 1.2 });
};

Object.assign(SCENES, F);
})();
