// photos.js: full illustrations (with their own backgrounds) used as film stills. The camera pans and pushes over
// them; softness from upscaling is kept on purpose (blur, bloom, chromatic smear).
const PHOTO_SRC = { room: 'room.webp', triptych: 'rose_triptych.webp', roof: 'rooftop.webp' };
const PHOTO_IMG = {};
// crops in source pixels, and the face / points of interest inside each crop
const PHOTOS = {
  room:  { src: 'room',     crop: [0, 0, 1536, 1024],    face: [455, 300], hand: [420, 330] },
  rose:  { src: 'triptych', crop: [2, 2, 722, 1020],     face: [320, 320], rose: [300, 420] },
  lying: { src: 'triptych', crop: [732, 2, 802, 442],    face: [175, 250] },
  sit:   { src: 'triptych', crop: [732, 452, 802, 570],  face: [262, 115], legs: [420, 360] },
  roof:  { src: 'roof',     crop: [0, 0, 1536, 1024],    face: [470, 290], legs: [520, 800] },
};

function loadPhotos() {
  return Promise.all(Object.entries(PHOTO_SRC).map(([k, f]) => new Promise((res, rej) => {
    const im = new Image(); im.onload = () => { PHOTO_IMG[k] = im; res(); }; im.onerror = rej;
    im.src = `../assets/adult/${f}`;
  })));
}

// Draw a crop so that point `at` (crop px) lands at screen `pos` ([x, y], default centre) with `zoom` relative to
// the scale that just covers the destination rect. `rect` ([x, y, w, h]) clips to a frame; default full screen.
// Options: blur, mono, bright, ghost (px chromatic offset copies), alpha.
function shot(ctx, id, at, zoom, o = {}) {
  const P = PHOTOS[id], im = PHOTO_IMG[P.src]; if (!im) return;
  const [cx, cy, cw, ch] = P.crop, [rx, ry, rw, rh] = o.rect ?? [0, 0, W, H];
  const s = Math.max(rw / cw, rh / ch) * zoom;
  const pos = o.pos ?? [rx + rw / 2, ry + rh / 2];
  let x = pos[0] - at[0] * s, y = pos[1] - at[1] * s;
  // never show past the crop's edge
  x = Math.min(rx, Math.max(rx + rw - cw * s, x)); y = Math.min(ry, Math.max(ry + rh - ch * s, y));
  ctx.save(); ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const f = [];
  if (o.blur) f.push(`blur(${o.blur}px)`);
  if (o.mono) f.push(`grayscale(${o.mono})`);
  if (o.bright) f.push(`brightness(${o.bright})`);
  if (o.sat != null) f.push(`saturate(${o.sat})`);
  ctx.filter = f.length ? f.join(' ') : 'none';
  if (o.ghost) {
    const a = ctx.globalAlpha; ctx.globalAlpha = a * .35; ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(im, cx, cy, cw, ch, x - o.ghost, y, cw * s, ch * s);
    ctx.drawImage(im, cx, cy, cw, ch, x + o.ghost, y + o.ghost * .4, cw * s, ch * s);
    ctx.globalAlpha = a; ctx.globalCompositeOperation = 'source-over';
  }
  ctx.drawImage(im, cx, cy, cw, ch, x, y, cw * s, ch * s);
  ctx.filter = 'none';
  ctx.restore();
}

// camera move over a shot between two framings {at, zoom} across [t0, t1], with an optional snap on hits
function moveShot(ctx, id, t, t0, t1, a, b, o = {}) {
  const k = (o.ease ?? easeInOut)(prog(t, t0, t1));
  const kick = (o.kick ?? 0) * pulse(t, .2);
  shot(ctx, id, [lerp(a.at[0], b.at[0], k), lerp(a.at[1], b.at[1], k)], lerp(a.zoom, b.zoom, k) * (1 + .05 * kick), o);
}

// soft bloom: a blurred bright copy of the frame screened over itself (dreamy, low contrast)
function bloom(ctx, a = .35, r = 18) {
  const c = makeCanvas(W / 4, H / 4), g = c.getContext('2d');
  g.filter = `blur(${r / 4}px) brightness(1.2)`; g.drawImage(ctx.canvas, 0, 0, W / 4, H / 4);
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(c, 0, 0, W, H); ctx.restore();
}

// letterbox bars that breathe slightly; cinematic framing for the stills
function letterbox(ctx, h = 70) { ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); }
