// final.js: the video as it ships. The original illustrations are the base; lyrics are printed panels that move in
// (stand up, stamp, wipe, slide, flip) and sit in front of or behind her. Only the impact lines are big; the rest
// are small tags. The riso print of the same stills (PRINT) is used as an accent: split frames, strobes, flashes.
// Loaded after scenes.js / riso.js and replaces their scenes unless a style lab (?style=) is open.
(() => {
if (new URLSearchParams(location.search).get('style')) return;
const F = {};

// ---------- shared
const win = s => s.t1 - .25;                                  // when panels leave
function base(ctx, id, t, s, a, b, o = {}) {                  // the still, moving; returns the framing for the fg layer
  const f = rframe(id, t, s, a, b, o.kick ?? 1);
  if (o.print) f(ctx, 'full', { print: true }); else f(ctx, 'full');
  return f;
}
// quiet line: a small tag standing up somewhere calm, falling back when the line ends
function quiet(ctx, L, t, s, x, y, o = {}) {
  standUp(ctx, card(L.text.replace(/[「」]/g, ''), { size: o.size ?? 48, face: o.face ?? 'label', bg: o.bg ?? INK.cream, fg: o.fg ?? INK.navy, border: o.border ?? INK.pink }),
    x, y, t, at(L, 0), { dur: .28, out: win(s) });
}
// a hard cut to the riso print of the same framing for a couple of frames on strong hits
function printFlash(ctx, f, t, len = .09) { if (sinceStrong(t) < len) f(ctx, 'full', { print: true }); }
// diagonal split: original on one side, the print on the other; jumps on hits
function splitPrint(ctx, t, s, f) { diagonal(ctx, t, s, () => f(ctx, 'full'), () => f(ctx, 'full', { print: true })); }
function vignette(ctx, a = .35) { const g = ctx.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(20,10,30,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }

// ---------- intro: a blurred close-up focusing, then the title stands up in three printed panels over a sunburst
sceneIntro = (ctx, t, s) => {
  const firstHit = DATA.hits.find(h => h > 6) ?? 6.5, k = prog(t, 0, firstHit);
  ctx.filter = `blur(${lerp(26, 3, easeOut(clamp(k)))}px) brightness(${lerp(.35, .7, k)})`;
  rshot(ctx, 'rose', [320, 330], lerp(1.5, 1.25, prog(t, 0, s.t1))); ctx.filter = 'none';
  if (t >= firstHit) {
    const kk = easeOut(prog(t, firstHit, firstHit + 1.2));
    withAlpha(ctx, kk, () => { sunburst(ctx, W / 2, H * .55, t, 'rgba(217,74,154,.6)', 20, .06); dotField(ctx, INK.lilac, 24, (x, y) => clamp(1 - Math.hypot(x - .5, y - .55) * 1.6) * .6); });
    const bs = DATA.beats.filter(b => b >= firstHit - .01);
    printFlash(ctx, (c, l, o) => rshot(c, 'rose', [320, 330], 1.25, o), t, .07);
    stamp(ctx, card('私の', { size: 120, face: 'hero', bg: INK.navy, fg: INK.cream }), W * .22, H * .42, t, bs[1] ?? firstHit, { rot: -.08, blend: 'source-over' });
    standUp(ctx, card('薔薇には', { size: 190, face: 'hero', bg: INK.red, fg: INK.cream, shadowInk: INK.navy }), W * .54, H * .62, t, bs[3] ?? firstHit + 1);
    standUp(ctx, card('棘がない', { size: 190, face: 'hero', bg: INK.cream, fg: INK.red, shadowInk: INK.navy, border: INK.red }), W * .6, H * .93, t, bs[6] ?? firstHit + 2.5);
    const e = prog(t, bs[9] ?? firstHit + 4, (bs[9] ?? firstHit + 4) + .5);
    if (e > 0) {
      paperTag(ctx, W - 470, 80 - (1 - easeOut(e)) * 200, 400, 120, .03, g => {
        tagText(g, 'My rose has no thorns', 28, 56, 34, INK.navy, FONT_EN, 600);
        tagText(g, 'Flehmann × OTO MAYUMI', 28, 94, 20, INK.pink, FACES.mono.fam, FACES.mono.w);
      });
    }
  }
};

// ---------- verse 1
// 0 強いコントラスト (big): original against its print on a jumping diagonal; 強い stamped, コントラスト slides in
F[0] = (ctx, t, s) => {
  const f = rframe('roof', t, s, { at: [520, 300], zoom: 1.2 }, { at: [470, 300], zoom: 1.3 });
  splitPrint(ctx, t, s, f);
  f(ctx, 'fg');
  stamp(ctx, card('強い', { size: 200, face: 'loud', bg: INK.red, fg: INK.cream }), W * .2, H * .3, t, at(s.L, 0), { rot: -.1, blend: 'source-over' });
  slideIn(ctx, card('コントラスト', { size: 170, face: 'loud', bg: INK.cream, fg: INK.navy, shadowInk: INK.pink, torn: true }), W * .6, H * .8, t, at(s.L, 2), { rot: -.04 });
};
// 1 怪我なしでは出られない迷路 (quiet): maze lines over the room
F[1] = (ctx, t, s) => {
  base(ctx, 'room', t, s, { at: [455, 320], zoom: 1.05 }, { at: [455, 300], zoom: 1.2 });
  const z = lerp(1.12, 1, easeOut(s.k));
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  maze(ctx, clamp(s.k * 1.6 + .1), 'rgba(203,182,242,.5)', 72, -48, -36); ctx.restore();
  quiet(ctx, s.L, t, s, 360, H - 70);
};
// 2 無理矢理 白く塗り潰した汚い夢 (quiet): scribbles over her, then a cream roller paints over the frame
F[2] = (ctx, t, s) => {
  base(ctx, 'lying', t, s, { at: [175, 250], zoom: 1.1 }, { at: [175, 250], zoom: 1.3 });
  const h0 = hitIdx(s.t0), n = Math.max(0, hitIdx(t) - h0 + 1);
  for (let i = 0; i < Math.min(n, 9); i++)
    scribble(ctx, 40 + i, clamp((t - (DATA.hits[h0 + i] ?? s.t0)) / .25), i % 3 ? INK.navy : INK.red, hr(300, W - 300, i, 1), hr(250, H - 250, i, 2), hr(160, 320, i, 3));
  const paint = easeInOut(prog(t, s.L.chars[5][1], s.L.end));
  if (paint > 0) { ctx.fillStyle = INK.cream; ctx.beginPath(); ctx.moveTo(0, 0); const x = paint * (W + 200);
    for (let y = 0; y <= H; y += 40) ctx.lineTo(x - hash(y, 7) * 60, y); ctx.lineTo(0, H); ctx.closePath(); ctx.fill(); }
  quiet(ctx, s.L, t, s, W / 2, H - 70, { face: 'marker', border: INK.red });
};
// 3 わたしになれないヒト (quiet, first verse): the rose portrait, grey ghosts drifting apart
F[3] = (ctx, t, s) => {
  fillBg(ctx, INK.navy);
  const k = easeInOut(s.k), rect = [W * .3, 0, W * .7, H];
  ctx.save(); ctx.filter = 'grayscale(1) blur(3px)'; ctx.globalAlpha = .25;
  [-1, 1].forEach(d => rshot(ctx, 'rose', [320 + d * lerp(40, 120, k), 330], 1.1, { rect })); ctx.restore();
  rshot(ctx, 'rose', [lerp(320, 330, k), lerp(360, 320, k)], lerp(1.02, 1.14, k) * (1 + .04 * pulse(t)), { rect });
  dotField(ctx, INK.lilac, 22, (x, y) => clamp(.35 - x) * 1.4);
  quiet(ctx, s.L, t, s, W * .15, H - 80, { face: 'base', bg: INK.navy, fg: INK.cream, border: INK.lilac });
};
// 4 うるさくしがみつくの (quiet): the tag multiplies on every hit, clinging all over the frame
F[4] = (ctx, t, s) => {
  base(ctx, 'room', t, s, { at: [420, 330], zoom: 1.3 }, { at: [420, 330], zoom: 1.45 });
  const n = Math.max(0, hitIdx(t) - hitIdx(s.t0) + 1), c = card(s.L.text, { size: 40, face: 'label', bg: INK.cream, fg: INK.navy, border: INK.pink });
  for (let i = 1; i < Math.min(n, 14); i++) {
    const t0 = DATA.hits[hitIdx(s.t0) + i];
    stamp(ctx, c, hr(200, W - 200, i, 1), hr(150, H - 150, i, 2), t, t0, { rot: hr(-.3, .3, i, 3), scale: hr(.7, 1.1, i, 4), blend: 'source-over' });
  }
  quiet(ctx, s.L, t, s, W / 2, H - 70, { size: 60 });
};
// 5 気をつけて？ / 18 気をつけて (medium): the caution tape is the lyric
F[5] = (ctx, t, s) => {
  base(ctx, 'roof', t, s, { at: [470, 290], zoom: 1.4 }, { at: [470, 290], zoom: 1.55 });
  caution(ctx, t, s, '気をつけて？ ／ CAUTION ／ ');
};
F[18] = (ctx, t, s) => {
  base(ctx, 'room', t, s, { at: [455, 300], zoom: 1.3 }, { at: [455, 300], zoom: 1.5 });
  caution(ctx, t, s, '気をつけて ／ HANDLE WITH CARE ／ ');
};
// 6 ヤケドするよ (big): the rose print in red ink, heat at the bottom; ヤケド stamped, するよ stands up
F[6] = (ctx, t, s) => {
  const f = base(ctx, 'rose', t, s, { at: [320, 330], zoom: 1.15 }, { at: [320, 330], zoom: 1.3 }, { print: true });
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(214,30,58,.45)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  flames(ctx, t, 'rgba(163,18,58,.85)', 'rgba(217,74,154,.8)', 300);
  stamp(ctx, card('ヤケド', { size: 230, face: 'brush', bg: INK.cream, fg: INK.red, shadowInk: INK.navy }), W * .32, H * .45, t, at(s.L, 0), { rot: -.07, blend: 'source-over' });
  standUp(ctx, card('するよ', { size: 150, face: 'brush', bg: INK.red, fg: INK.cream }), W * .68, H * .86, t, at(s.L, 3), { out: win(s) });
};
// 7 「まだですか？」 / 8 「またですか？」 (quiet whispers): small speech cards turning over, left then right
F[7] = (ctx, t, s) => {
  base(ctx, 'sit', t, s, { at: [262, 130], zoom: 1.15 }, { at: [262, 115], zoom: 1.3 });
  flipIn(ctx, card('まだですか？', { size: 70, face: 'hand', bg: INK.cream, fg: INK.navy, border: INK.lilac }), W * .25, H * .3, t, at(s.L, 1), { rot: -.05 });
};
F[8] = (ctx, t, s) => {
  base(ctx, 'sit', t, s, { at: [262, 115], zoom: 1.3 }, { at: [262, 115], zoom: 1.45 });
  flipIn(ctx, card('まだですか？', { size: 70, face: 'hand', bg: INK.cream, fg: INK.navy, border: INK.lilac }), W * .25, H * .3, t, -1, { rot: -.05 });
  flipIn(ctx, card('またですか？', { size: 70, face: 'hand', bg: INK.pink, fg: INK.cream }), W * .72, H * .42, t, at(s.L, 1), { rot: .06 });
};
// 9 脳内フラッシュバック (big): strobe between originals and prints of every still; the two words flip on hits
F[9] = (ctx, t, s) => {
  const fr = Math.floor(t * FPS), id = CUTS[Math.floor(hash(Math.floor(t * 10), 3) * CUTS.length)];
  rshot(ctx, id, PHOTOS[id].face, 1.2 + hash(fr >> 2) * .4, { print: (fr >> 1) % 2 === 1 });
  flipIn(ctx, card('脳内', { size: 150, face: 'pixel', bg: INK.navy, fg: INK.pink }), W * .28, H * .35, t, at(s.L, 0), { dur: .15, rot: -.05 });
  flipIn(ctx, card('フラッシュバック', { size: 125, face: 'pixel', bg: INK.pink, fg: INK.navy }), W * .58, H * .68, t, at(s.L, 2), { dur: .15, rot: .03 });
  sliceGlitch(ctx, .5, fr >> 1, 5);
};
// 10 操ろうとしたって もう (quiet): puppet strings to her hand
F[10] = (ctx, t, s) => {
  base(ctx, 'room', t, s, { at: [420, 330], zoom: 1.35 }, { at: [420, 330], zoom: 1.6 });
  ctx.strokeStyle = 'rgba(246,236,241,.7)'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { const x = W * .35 + i * 90 + Math.sin(t * 2 + i) * 20, len = lerp(0, H * .55, easeOut(prog(t, s.t0 + i * .08, s.t0 + .6 + i * .08)));
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + Math.sin(t * 1.5 + i) * 30, len); ctx.stroke(); }
  quiet(ctx, s.L, t, s, W - 360, H - 70);
};
// 11 時間切れ（タイムオーバー） (big): a split-flap countdown card, then TIME OVER stamped
F[11] = (ctx, t, s) => {
  ctx.filter = 'blur(10px) brightness(.45)'; rshot(ctx, 'sit', PHOTOS.sit.neon, 1.5); ctx.filter = 'none';
  const end = at(s.L, 5), left = Math.max(0, end - t);
  const digits = `00:0${Math.floor(left)}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`;
  drop(ctx, () => ctx.drawImage(card(digits, { size: 170, face: 'pixel', bg: INK.navy, fg: INK.lilac }), W / 2 - 430, H * .28));
  standUp(ctx, card('時間切れ', { size: 110, face: 'pixel', bg: INK.cream, fg: INK.navy }), W * .3, H * .9, t, at(s.L, 0), { out: win(s) });
  stamp(ctx, card('TIME OVER', { size: 150, face: 'pixel', bg: INK.red, fg: INK.cream }), W * .66, H * .72, t, end, { rot: -.12, blend: 'source-over' });
};

// ---------- chorus 1 (the approved sample)
F[12] = PANEL_SCENES[12];
F[13] = PANEL_SCENES[13];
F[14] = PANEL_SCENES[14];
F[15] = PANEL_SCENES[15];
// 16 まるで群がっている蛾のよう (quiet): moths around the moon
F[16] = (ctx, t, s) => {
  base(ctx, 'roof', t, s, { at: [1320, 300], zoom: 1.5 }, { at: [1320, 300], zoom: 1.8 });
  const g = ctx.createRadialGradient(W / 2, H * .45, 10, W / 2, H * .45, 420);
  g.addColorStop(0, 'rgba(246,236,241,.35)'); g.addColorStop(1, 'rgba(246,236,241,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  moths(ctx, t, W / 2, H * .45, Math.floor(lerp(10, 70, s.k)), 'rgba(246,236,241,.85)');
  quiet(ctx, s.L, t, s, 420, H - 70);
};
// 17 面白いね (quiet): the close-up, a small hand-written card
F[17] = (ctx, t, s) => {
  base(ctx, 'near', t, s, { at: [380, 200], zoom: 1.25 }, { at: [380, 200], zoom: 1.4 }, { kick: 0 });
  quiet(ctx, s.L, t, s, W - 260, H - 70, { face: 'hand', size: 56 });
};
// 19 ヤケドするよ (big, second time): rooftop print, flames, a red bar wipes the words on
F[19] = (ctx, t, s) => {
  const f = base(ctx, 'roof', t, s, { at: [470, 300], zoom: 1.3 }, { at: [470, 300], zoom: 1.55 }, { print: true });
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(214,30,58,.4)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  flames(ctx, t, 'rgba(163,18,58,.85)', 'rgba(217,74,154,.8)', 420);
  f(ctx, 'fg', { print: true });
  wipe(ctx, card('ヤケドするよ', { size: 210, face: 'brush', bg: INK.cream, fg: INK.red, shadowInk: INK.navy }), W / 2, H * .78, t, at(s.L, 0), { bar: INK.navy, dur: .35 });
  sliceGlitch(ctx, pulse(t, .15), hitIdx(t), 7);
};

// ---------- instrumental: cuts on every hit, alternating original and print, sunburst accents
sceneMontage = (ctx, t, s) => {
  const i = Math.max(0, hitIdx(t)), [id, pt, z] = DETAILS[Math.floor(hash(77, i) * DETAILS.length)], since = sinceHit(t);
  rshot(ctx, id, PHOTOS[id][pt], z * (1 + .06 * Math.max(0, 1 - since / .25)) + since * .03, { print: i % 3 === 1 });
  if (i % 3 === 2) { sunburst(ctx, W / 2, H / 2, t, 'rgba(217,74,154,.5)', 16, .2); }
  paperTag(ctx, 70, H - 170, 260, 90, -.03, g => {
    tagText(g, `CUT ${String(Math.max(0, i - hitIdx(s.t0))).padStart(3, '0')}`, 24, 58, 40, INK.navy, FACES.mono.fam, FACES.mono.w); });
};

// ---------- bridge
// 20 理想の理想化 (quiet): frames within frames, each a printed card of the room
F[20] = (ctx, t, s) => {
  fillBg(ctx, INK.navy);
  const ph = (t * .45) % 1;
  for (let d = 0; d <= 5; d++) {
    const sc = Math.pow(.62, d - ph), w = W * sc, h = H * sc, rect = [W / 2 - w / 2, H / 2 - h / 2, w, h];
    ctx.fillStyle = d % 2 ? INK.pink : INK.cream; ctx.fillRect(rect[0] - 12, rect[1] - 12, w + 24, h + 24);
    rshot(ctx, 'room', PHOTOS.room.face, 1.1, { rect, print: d % 2 === 1 });
  }
  quiet(ctx, s.L, t, s, W / 2, H - 60, { face: 'fragile', size: 56 });
};
// 21 加速するユートピア (big): the city rushing past; two torn strips slide in fast from opposite sides
F[21] = (ctx, t, s) => {
  rshot(ctx, 'roof', PHOTOS.roof.city, lerp(1.2, 2.2, easeIn(s.k)), {});
  speedLines(ctx, t, W / 2, H / 2, lerp(.5, 3, easeIn(s.k)), 'rgba(246,236,241,.55)');
  slideIn(ctx, card('加速する', { size: 170, face: 'loud', bg: INK.lilac, fg: INK.navy, torn: true }), W * .36, H * .38, t, at(s.L, 0), { from: -1, dur: .18, rot: -.05 });
  slideIn(ctx, card('ユートピア', { size: 190, face: 'loud', bg: INK.pink, fg: INK.cream, torn: true }), W * .62, H * .66, t, at(s.L, 4), { from: 1, dur: .18, rot: .04 });
};
// 22 楽園（エデン）は遥か遠く (quiet): pulling back from the setting sun
F[22] = (ctx, t, s) => {
  base(ctx, 'sunset', t, s, { at: [85, 148], zoom: 2.3 }, { at: [85, 148], zoom: 1.0 }, { kick: 0 });
  quiet(ctx, s.L, t, s, W * .3, H - 70, { face: 'fragile', size: 52 });
};
// 23 だからこそ綺麗 (quiet): the looking-up close-up, blur resolving
F[23] = (ctx, t, s) => {
  ctx.filter = `blur(${lerp(12, 0, easeOut(s.k))}px)`; base(ctx, 'lookup', t, s, { at: [330, 190], zoom: 1.2 }, { at: [330, 190], zoom: 1.35 }, { kick: 0 }); ctx.filter = 'none';
  for (let i = 0; i < 26; i++) { const a = .5 + .5 * Math.sin(t * 4 + i * 2), x = hr(0, W, i, 1), y = hr(0, H, i, 2), r = hr(3, 9, i, 3) * a;
    ctx.fillStyle = `rgba(246,236,241,${.7 * a})`; ctx.beginPath(); ctx.moveTo(x, y - r * 3); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 3); ctx.lineTo(x - r, y); ctx.fill(); }
  quiet(ctx, s.L, t, s, W - 300, H - 70, { face: 'fragile', size: 56 });
};
// 24 弱さも強さも愛せないのなら (medium): the split again (callback to line 0); 弱さも on the print, 強さも on the original
F[24] = (ctx, t, s) => {
  const f = rframe('room', t, s, { at: [455, 300], zoom: 1.2 }, { at: [455, 300], zoom: 1.3 });
  splitPrint(ctx, t, s, f);
  stamp(ctx, card('弱さも', { size: 110, face: 'loud', bg: INK.cream, fg: INK.navy }), W * .22, H * .25, t, at(s.L, 0), { rot: -.08, blend: 'source-over' });
  stamp(ctx, card('強さも', { size: 110, face: 'loud', bg: INK.navy, fg: INK.cream }), W * .76, H * .72, t, at(s.L, 3), { rot: .06, blend: 'source-over' });
  quiet(ctx, { ...s.L, text: '愛せないのなら', chars: s.L.chars.slice(6) }, t, s, W / 2, H - 50, { size: 44 });
};
// 25 わたしが生きる意味はないから (quiet): near dark, her small, a lone card
F[25] = (ctx, t, s) => {
  fillBg(ctx, INK.navy);
  rshot(ctx, 'lookup', PHOTOS.lookup.face, 1.2, { rect: [W * .55, H * .18, W * .36, H * .64] });
  dotField(ctx, INK.lilac, 22, (x, y) => clamp(.5 - x) * .8);
  quiet(ctx, s.L, t, s, W * .28, H * .6, { face: 'base', size: 58, bg: INK.cream, fg: INK.navy, border: INK.red });
};

// ---------- final chorus
// 26 トゲのない薔薇に相応しい (big): the rose, a drawn thornless rose opening; the words stand up in two panels
F[26] = (ctx, t, s) => {
  const f = base(ctx, 'rose', t, s, { at: [300, 420], zoom: 1.15 }, { at: [300, 400], zoom: 1.28 });
  withAlpha(ctx, .9, () => rose(ctx, W * .78, H * .3, 150, t, { bloom: easeOut(clamp(s.k * 1.3)), colour: INK.red, line: INK.cream }));
  standUp(ctx, card('トゲのない薔薇に', { size: 150, face: 'rose', bg: INK.cream, fg: INK.red, shadowInk: INK.navy, border: INK.red }), W * .42, H * .72, t, at(s.L, 0), { out: win(s) });
  standUp(ctx, card('相応しい', { size: 150, face: 'rose', bg: INK.red, fg: INK.cream }), W * .62, H * .96, t, at(s.L, 8), { out: win(s) });
};
// 27 生き様さ (big): rooftop print, one giant stamp
F[27] = (ctx, t, s) => {
  const f = base(ctx, 'roof', t, s, { at: [470, 290], zoom: 1.6 }, { at: [470, 290], zoom: 1.8 }, { print: true });
  sunburst(ctx, W / 2, H * .6, t, 'rgba(255,95,162,.35)', 20, .1);
  f(ctx, 'fg', { print: true });
  stamp(ctx, card('生き様さ', { size: 300, face: 'loud', bg: INK.cream, fg: INK.red, shadowInk: INK.navy, border: INK.navy }), W / 2, H * .72, t, at(s.L, 0), { rot: -.05, blend: 'source-over' });
};
// 28 わたしになれなくても (quiet): five strips, the middle one in colour, the rest printed
F[28] = (ctx, t, s) => {
  fillBg(ctx, INK.navy);
  const n = 5, sw = W / n, shown = clamp(hitIdx(t) - hitIdx(s.t0) + 1, 1, n), order = [2, 1, 3, 0, 4];
  for (let j = 0; j < shown; j++) { const col = order[j], age = t - (DATA.hits[hitIdx(s.t0) + j] ?? s.t0), z = lerp(1.25, 1, expoOut(clamp(age / .35)));
    rshot(ctx, 'roof', [470 + (col - 2) * 50, 350], 1.05 * z, { rect: [col * sw + 6, 0, sw - 12, H], print: col !== 2 }); }
  quiet(ctx, s.L, t, s, W / 2, H - 60, { size: 50 });
};
// 29 アナタは別の色 (big): four quarters, the original and three prints in different inks; two cards turn over
F[29] = (ctx, t, s) => {
  const inks = [null, INK.pink, INK.lilac, INK.red], n = clamp(hitIdx(t) - hitIdx(s.t0) + 2, 2, 4);
  fillBg(ctx, INK.navy);
  for (let q = 0; q < n; q++) {
    const rect = [(q % 2) * W / 2, Math.floor(q / 2) * H / 2, W / 2, H / 2];
    rshot(ctx, 'sit', PHOTOS.sit.face, 1.05, { rect, print: q > 0 });
    if (inks[q]) { ctx.save(); ctx.beginPath(); ctx.rect(...rect); ctx.clip(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = inks[q]; ctx.fillRect(...rect); ctx.restore(); }
  }
  flipIn(ctx, card('アナタは', { size: 130, face: 'loud', bg: INK.cream, fg: INK.navy }), W * .34, H * .5, t, at(s.L, 0), { rot: -.04 });
  flipIn(ctx, card('別の色', { size: 150, face: 'loud', bg: INK.pink, fg: INK.cream }), W * .66, H * .5, t, at(s.L, 4), { rot: .05, back: INK.lilac });
};
// 30 間違いと呼ばないで (quiet): a small card where 間違い is struck through, then the strike is pulled away
F[30] = (ctx, t, s) => {
  base(ctx, 'sit', t, s, { at: [262, 115], zoom: 1.2 }, { at: [262, 115], zoom: 1.4 });
  const x = W / 2, y = H - 70;
  quiet(ctx, s.L, t, s, x, y, { face: 'hand', size: 62 });
  const c = card(s.L.text, { size: 62, face: 'hand' }), c2 = s.L.chars[2][1], c3 = s.L.chars[3][1];
  const on = easeOut(prog(t, c2, c2 + .2)), off = easeIn(prog(t, c3 + .6, c3 + 1.0)), x0 = x - c.width / 2 + 18, x1 = x0 + c.width * .36;
  if (on > 0 && off < 1 && t < win(s)) { ctx.strokeStyle = INK.red; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(lerp(x0, x1, off), y - c.height * .5); ctx.lineTo(lerp(x0, x1, on), y - c.height * .5); ctx.stroke(); }
};
// 31 トゲがない薔薇なだけ (big): print flash accent, the words wiped on under a red bar, her in front
F[31] = (ctx, t, s) => {
  const f = base(ctx, 'rose', t, s, { at: [320, 330], zoom: 1.2 }, { at: [320, 330], zoom: 1.45 });
  printFlash(ctx, f, t, .1);
  wipe(ctx, card('トゲがない薔薇なだけ', { size: 150, face: 'rose', bg: INK.navy, fg: INK.pink }), W / 2, H * .8, t, at(s.L, 0), { bar: INK.red, dur: .5 });
};

// ---------- ending
// 32 見納めて (quiet): the smoking close-up pulling out, colour draining
F[32] = (ctx, t, s) => {
  ctx.filter = `saturate(${lerp(1, .4, s.k)})`; base(ctx, 'smoke', t, s, { at: [330, 130], zoom: 1.5 }, { at: [330, 130], zoom: 1.05 }, { kick: 0 }); ctx.filter = 'none';
  quiet(ctx, s.L, t, s, W - 280, H - 70, { face: 'fragile', size: 60 });
};
// 33 枯れゆくまで (big, gentle): the rose print greys out, petals fall, the card stands and then falls slowly
F[33] = (ctx, t, s) => {
  ctx.filter = `grayscale(${s.k})`; base(ctx, 'rose', t, s, { at: [300, 420], zoom: 1.6 }, { at: [300, 420], zoom: 1.8 }, { print: s.k > .5, kick: 0 }); ctx.filter = 'none';
  petals(ctx, t, s.t0, 40, `rgba(163,18,58,${lerp(.8, .3, s.k)})`);
  standUp(ctx, card('枯れゆくまで', { size: 170, face: 'fragile', bg: INK.cream, fg: INK.red, border: INK.red }), W / 2, H * .82, t, at(s.L, 0), { dur: .6, out: s.t1 - .8 });
};
// outro: slow crossfades through the stills, alternating with their prints, the title panels return
sceneOutro = (ctx, t, s) => {
  const seq = ['sunset', 'rose', 'near', 'roof', 'lookup', 'room', 'smoke', 'rose'], dur = (s.t1 - s.t0) / seq.length;
  const j = Math.min(seq.length - 1, Math.floor((t - s.t0) / dur)), k = ((t - s.t0) % dur) / dur;
  const draw = (id, kk, a, pr) => { ctx.save(); ctx.globalAlpha = a; ctx.filter = `grayscale(${lerp(.2, .9, s.k)}) brightness(${lerp(.95, .55, s.k)})`;
    rshot(ctx, id, PHOTOS[id].face, lerp(1.2, 1.35, kk), { print: pr }); ctx.restore(); };
  fillBg(ctx, INK.navy);
  draw(seq[j], k, 1, j % 2 === 1);
  if (k > .75 && j + 1 < seq.length) draw(seq[j + 1], 0, (k - .75) / .25, (j + 1) % 2 === 1);
  petals(ctx, t, s.t0 - 3, 24, 'rgba(163,18,58,.35)');
  const e = s.t1 - 7;
  standUp(ctx, card('私の薔薇には棘がない', { size: 110, face: 'hero', bg: INK.cream, fg: INK.red, border: INK.red }), W / 2, H * .62, t, e, { dur: .5 });
  if (t > e + .6) paperTag(ctx, W / 2 - 200, H * .66, 400, 90, .02, g => {
    tagText(g, 'Flehmann × OTO MAYUMI', 30, 58, 30, INK.navy, FACES.mono.fam, FACES.mono.w); });
};

Object.assign(SCENES, F);
})();
