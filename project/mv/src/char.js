// char.js: the protagonist as still images. She never animates frame to frame; the camera moves over the stills
// (slow drifts, snap zooms on hits, slides) and the stills are swapped on the beat.
const SPRITES = [];          // HD sprites (3x upscaled cut-outs of the pose sheet)
const SIL = new Map();       // cached solid-colour silhouettes, key `${pose}|${colour}`
// face centre of each pose, as a fraction of the sprite (for close-ups)
const FACE = [[.5, .11], [.52, .11], [.5, .13], [.52, .16], [.46, .12], [.5, .12], [.5, .13], [.55, .16],
              [.5, .12], [.48, .11], [.47, .11], [.5, .12], [.5, .11], [.47, .11], [.5, .12], [.52, .11]];
// poses by mood, for picking stills that fit a line
const POSES = {
  calm: [0, 15, 6, 12], open: [2, 11, 8, 5], up: [3, 7], kick: [1, 4, 10, 13], shy: [0, 6, 9, 15], point: [14, 2],
  all: [...Array(16).keys()],
};

function loadSprites() {
  return Promise.all(Array.from({ length: 16 }, (_, i) => new Promise((res, rej) => {
    const im = new Image(); im.onload = () => { SPRITES[i] = im; res(); }; im.onerror = rej;
    im.src = `../design/sprites_hd/pose${String(i).padStart(2, '0')}.png`;
  })));
}

function silhouette(pose, colour) {
  const key = pose + '|' + colour; if (SIL.has(key)) return SIL.get(key);
  const im = SPRITES[pose], c = makeCanvas(im.width, im.height), g = c.getContext('2d');
  g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = colour; g.fillRect(0, 0, c.width, c.height);
  if (SIL.size > 40) SIL.delete(SIL.keys().next().value);
  SIL.set(key, c); return c;
}

// Draw a still. The sprite point `focus` (fractions; default the face) lands at screen (x, y); `h` is the sprite's
// full height on screen. Options: flip, alpha, shadow {dx, dy, colour}, outline {w, colour}, tint {colour, a},
// mono (desaturate 0..1), blur (px; softness is part of the look), ghost (chromatic double image, px), rot.
function still(ctx, pose, x, y, h, o = {}) {
  const im = SPRITES[pose]; if (!im) return;
  const s = h / im.height, w = im.width * s;
  const [fx, fy] = o.focus ?? FACE[pose];
  ctx.save();
  ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.flip) ctx.scale(-1, 1);
  const x0 = -fx * w, y0 = -fy * h;
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.shadow) ctx.drawImage(silhouette(pose, o.shadow.colour), x0 + o.shadow.dx, y0 + o.shadow.dy, w, h);
  if (o.outline) {
    const sil = silhouette(pose, o.outline.colour), r = o.outline.w;
    for (let a = 0; a < 8; a++) ctx.drawImage(sil, x0 + Math.cos(a * Math.PI / 4) * r, y0 + Math.sin(a * Math.PI / 4) * r, w, h);
  }
  const f = [];
  if (o.mono) f.push(`grayscale(${o.mono})`, `contrast(${1 + .15 * o.mono})`);
  if (o.blur) f.push(`blur(${o.blur}px)`);
  ctx.filter = f.length ? f.join(' ') : 'none';
  if (o.ghost) {   // lavender / cyan offset copies behind: a soft chromatic smear
    const a = ctx.globalAlpha;
    ctx.globalAlpha = a * .55; ctx.drawImage(silhouette(pose, PAL.lav), x0 - o.ghost, y0, w, h);
    ctx.drawImage(silhouette(pose, PAL.cyan), x0 + o.ghost, y0 + o.ghost * .3, w, h); ctx.globalAlpha = a;
  }
  ctx.drawImage(im, x0, y0, w, h);
  ctx.filter = 'none';
  if (o.tint) { ctx.globalAlpha *= o.tint.a; ctx.drawImage(silhouette(pose, o.tint.colour), x0, y0, w, h); }
  ctx.restore();
}

// Camera over a still: a slow drift from `from` to `to` over [t0, t1] (each {x, y, h}), plus a snap-zoom kick on
// every hit when `kick` > 0. Returns the frame so callers can place things around her.
function driftStill(ctx, pose, t, t0, t1, from, to, o = {}) {
  const k = easeInOut(prog(t, t0, t1));
  const kick = (o.kick ?? 0) * pulse(t, .22);
  const f = { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k), h: lerp(from.h, to.h, k) * (1 + .06 * kick) };
  still(ctx, pose, f.x, f.y, f.h, o);
  return f;
}

// pose that changes on every `every`-th hit inside a line, drawn from a pool
function poseAt(t, pool, seed, every = 1) {
  const i = Math.floor(Math.max(0, hitIdx(t)) / every);
  return pool[Math.floor(hash(seed, i) * pool.length)];
}
