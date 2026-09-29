// kinetic.js: big motion typography, word by word (never letter by letter). Every word is rasterised and inked like
// the pictures (riso.js inked(): speckle, a second ink out of register, optional glow), so it sits in the image.
// kin(ctx, text, t, t0, o): o.fx is how the word arrives:
//   rise     climbs up out of a mask line          slam     falls from huge to size
//   track    letter-spacing snaps shut             stretch  squashed wide, springs back
//   drop     falls in from above and bounces       slide    slides in from o.from (-1 left / 1 right)
//   fade     soft fade and drift (for the fragile lines)
// o: x, y (baseline), size, face (FACES key), align, fill, under (second ink), reg [dx, dy], glow {color, blur, a},
//    vertical, rot, dur, out (time it leaves; it exits with the reverse of its entrance), spacing (px),
//    photo {id, at, zoom, print} (a still inside the letters), fill: null + outline/outlineW (hollow type)
function kin(ctx, text, t, t0, o) {
  const dur = o.dur ?? .32, k = clamp((t - t0) / dur); if (k <= 0) return;
  const ko = o.out != null ? clamp((t - o.out) / (o.outDur ?? .25)) : 0; if (ko >= 1) return;
  const face = FACES[o.face ?? 'loud'], size = o.size, e = o.fx === 'drop' ? backOut(k, 1.4) : expoOut(k), x = o.x, y = o.y;
  const draw = g => {
    g.save(); g.font = font(size, face.w, face.fam); g.fillStyle = '#000'; g.textBaseline = 'alphabetic';
    g.textAlign = o.align ?? 'center';
    let sp = o.spacing ?? 0;
    switch (o.fx) {
      case 'rise': g.beginPath(); if (o.vertical) g.rect(x - size, y - size * .9, size * 2, size * 1.03 * [...text].length + size * .2);
        else g.rect(-W, y - size * 1.05, 3 * W, size * 1.3); g.clip();
        g.translate(0, (1 - e) * size * 1.15 - easeIn(ko) * size * 1.15); break;
      case 'slam': { const s = lerp(2.4, 1, e) * (1 + .15 * easeIn(ko)); g.translate(x, y - size * .35); g.scale(s, s); g.translate(-x, -(y - size * .35)); break; }
      case 'track': sp = lerp(size * .7, sp, e) + easeIn(ko) * size * .7; break;
      case 'stretch': { const sx = lerp(2.6, 1, e); g.translate(x, y); g.scale(sx, lerp(.5, 1, e)); g.translate(-x, -y); break; }
      case 'drop': g.translate(0, -(1 - e) * H * .7 + easeIn(ko) * H); break;
      case 'slide': g.translate((1 - e) * W * (o.from ?? 1) - easeIn(ko) * W * (o.from ?? 1), 0); break;
      case 'fade': g.globalAlpha = k * (1 - ko); g.translate(0, (1 - e) * 30 - ko * 30); break;
    }
    if (o.rot) { g.translate(x, y); g.rotate(o.rot); g.translate(-x, -y); }
    g.letterSpacing = `${sp}px`;
    if (o.vertical) { g.textAlign = 'center'; [...text].forEach((ch, i) => g.fillText(ch, x, y + i * size * 1.03)); }
    else g.fillText(text, x, y);
    g.restore();
  };
  // o.photo {id, at, zoom, print}: the letters are filled with a still instead of an ink; o.fill null: outline only
  const fill = o.photo ? (q => rshot(q, o.photo.id, o.photo.at ?? PHOTOS[o.photo.id].face, o.photo.zoom ?? 1.2, { print: o.photo.print }))
    : o.fill === null ? null : (o.fill ?? INK.cream);
  inked(ctx, draw, { t, fill, under: o.under, underOff: o.reg, glow: o.glow, blend: 'source-over',
    alpha: o.fx === 'fade' ? 1 : 1, outline: o.outline, outlineW: o.outlineW, hollow: o.hollow });
}
// a huge word travelling across the frame the whole time (behind her, usually)
function marquee(ctx, text, t, y, size, speed, o = {}) {
  const face = FACES[o.face ?? 'loud'];
  inked(ctx, g => {
    g.font = font(size, face.w, face.fam); g.fillStyle = '#000'; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const unit = g.measureText(text + '　').width; let x = -((t * speed) % unit + unit) % unit - unit;
    while (x < W + unit) { g.fillText(text + '　', x, y); x += unit; }
  }, { t, fill: o.fill ?? INK.pink, under: o.under, underOff: o.reg, blend: 'source-over', alpha: o.alpha ?? 1 });
}
// small, quiet type: a line of plain inked type that rises in and leaves; no panel
function small(ctx, L, t, s, x, y, o = {}) {
  kin(ctx, o.text ?? L.text.replace(/[「」]/g, ''), t, at(L, 0), { x, y, size: o.size ?? 54, face: o.face ?? 'base', fx: o.fx ?? 'rise',
    align: o.align ?? 'left', fill: o.fill ?? INK.cream, under: o.under ?? 'rgba(217,74,154,.8)', reg: [3, 2], out: s.t1 - .25, dur: .3 });
}
