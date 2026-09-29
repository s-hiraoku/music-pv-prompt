// main.js: picks the scene for a time, paints it, adds the global finish (camera shake, grain, vignette, corner type).
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const LEAD = .18;   // a line's scene starts this long before its first sung character (cut on the pickup)

// windows: each line owns [start - LEAD, next start - LEAD); gaps longer than 2.5 s become instrumental montage
function windowAt(t) {
  const Ls = DATA.lines;
  if (t < Ls[0].start - LEAD) return { kind: 'intro', t0: 0, t1: Ls[0].start - LEAD };
  const last = Ls[Ls.length - 1];
  if (t >= last.end + .6) return { kind: 'outro', t0: last.end + .6, t1: DATA.duration };
  for (let i = 0; i < Ls.length; i++) {
    const a = Ls[i].start - LEAD, next = i + 1 < Ls.length ? Ls[i + 1].start - LEAD : last.end + .6;
    if (t < a || t >= next) continue;
    if (next - Ls[i].end > 2.5 && t > Ls[i].end + .6 && i + 1 < Ls.length) return { kind: 'montage', t0: Ls[i].end + .6, t1: next, L: Ls[i] };
    const t1 = Math.min(next, Ls[i].end + (i + 1 < Ls.length ? 2.5 + .6 : 99));
    return { kind: 'line', i, t0: a, t1: Math.max(t1, a + .5), L: Ls[i] };
  }
  return { kind: 'montage', t0: 0, t1: DATA.duration };
}

function draw(t) {
  const w = windowAt(t);
  const s = { ...w, lt: w.L ? t - w.L.start : t, k: prog(t, w.t0, w.t1) };
  ctx.save();
  // camera: a small shake on strong hits
  const sp = strongPulse(t, .25);
  if (sp) ctx.translate(hr(-1, 1, Math.floor(t * 30)) * 14 * sp, hr(-1, 1, Math.floor(t * 30), 3) * 10 * sp);
  if (w.kind === 'intro') sceneIntro(ctx, t, s);
  else if (w.kind === 'montage') sceneMontage(ctx, t, s);
  else if (w.kind === 'outro') sceneOutro(ctx, t, s);
  else (SCENES[w.i] ?? sceneFallback)(ctx, t, s);
  ctx.restore();
  // every frame is a film still: soft bloom and letterbox
  if (STYLE === 'R') printFinish(ctx, t); else { bloom(ctx, .28); letterbox(ctx, 64); }
  // finish: grain, vignette, fade in/out
  if (STYLE !== 'R') grain(ctx, t, .09);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,8,14,.45)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const fade = Math.max(1 - prog(t, 0, .8), prog(t, DATA.duration - 2.5, DATA.duration));
  if (fade > 0) { ctx.fillStyle = `rgba(10,8,14,${fade})`; ctx.fillRect(0, 0, W, H); }
}

window.MV = {
  ready: false,
  frame(t, q = .92) { draw(t); return canvas.toDataURL('image/jpeg', q); },
};
Promise.all([loadPhotos(), STYLE === 'R' ? loadRiso() : null, document.fonts.load(font(100, 800)), document.fonts.load(font(100, 500)),
  document.fonts.load(font(100, 900, FONT_HERO)), document.fonts.load(font(40, 500, FONT_EN)),
  ...Object.values(FACES).map(f => document.fonts.load(font(100, f.w, f.fam), 'あ漢A0')),
  ...['800 100px "Kaisei Tokumin"', 'italic 700 100px "Bodoni Moda"', '400 100px "Reggae One"', '400 100px "Stick"', '400 100px "Train One"']
    .map(f => document.fonts.load(f, 'あ漢A0'))])
  .then(() => { MV.ready = true; if (location.hash) draw(+location.hash.slice(1)); })
  .catch(e => console.error('load failed', e));
