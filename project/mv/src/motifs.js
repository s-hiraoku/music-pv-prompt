// motifs.js: recurring graphic elements: the thornless rose, the maze, moths, flames, scribbles, speed lines.

// A rose seen from above: rings of cupped petals around a tight bud; `bloom` 0..1 opens it, `wither` 0..1 greys it
// and droops the outer ring. No thorns anywhere: the stem is one smooth curve.
function rose(ctx, x, y, r, t, o = {}) {
  const bloom = o.bloom ?? 1, wither = o.wither ?? 0, col = o.colour ?? PAL.rose, line = o.line ?? PAL.ink;
  const mix = (a, b, k) => { const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16)); return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`; };
  const fill = wither ? mix(col, '#6d6870', wither) : col;
  ctx.save(); ctx.translate(x, y); ctx.rotate((o.rot ?? 0) + t * .05);
  if (o.stem) {   // stem drawn first, down and to the side, smooth: no thorns
    ctx.strokeStyle = o.stemColour ?? PAL.smoke; ctx.lineWidth = r * .07; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, r * .5); ctx.bezierCurveTo(r * .3, r * 1.4, -r * .35, r * 2.1, r * .1, r * 3); ctx.stroke();
  }
  const rings = [[7, 1.0, .0], [6, .78, .35], [5, .56, .7], [4, .36, 1.1], [3, .2, 1.6]];
  rings.forEach(([n, rr, off], ri) => {
    const open = clamp(bloom * 1.25 - ri * .12);
    const rad = r * rr * lerp(.35, 1, open) * (ri === 0 ? 1 + .15 * wither : 1);
    for (let i = 0; i < n; i++) {
      const a = off + i * Math.PI * 2 / n;
      ctx.save(); ctx.rotate(a); ctx.translate(0, ri === 0 ? wither * r * .12 : 0);
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(rad * .55, -rad * .15, rad * .75, -rad * .95, 0, -rad * 1.02);
      ctx.bezierCurveTo(-rad * .75, -rad * .95, -rad * .55, -rad * .15, 0, 0);
      ctx.fillStyle = fill; ctx.globalAlpha = lerp(.75, 1, ri / 4); ctx.fill();
      ctx.globalAlpha = 1; ctx.lineWidth = Math.max(1.5, r * .018); ctx.strokeStyle = line; ctx.stroke();
      ctx.restore();
    }
  });
  ctx.restore();
}

// falling petals for the ending; deterministic per index
function petals(ctx, t, t0, n, col) {
  for (let i = 0; i < n; i++) {
    const start = t0 + hash(i, 1) * 6, age = t - start; if (age < 0) continue;
    const x = hr(0, W, i, 2) + Math.sin(age * 1.3 + i) * 60, y = -40 + age * hr(90, 180, i, 3);
    if (y > H + 50) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(age * hr(-2, 2, i, 4)); ctx.scale(1, .6 + .4 * Math.sin(age * 3 + i));
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 16, 26, 0, 0, 7); ctx.fill(); ctx.restore();
  }
}

// maze: a perfect maze from a deterministic depth-first carve; walls are revealed along `k`
let MAZE;
function mazeWalls(cols = 28, rows = 16) {
  if (MAZE) return MAZE;
  const seen = new Set(), walls = new Set();
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { walls.add(`h${x},${y}`); walls.add(`v${x},${y}`); }
  const stack = [[0, 0]]; seen.add('0,0'); let n = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy])
      .filter(([a, b]) => a >= 0 && b >= 0 && a < cols && b < rows && !seen.has(`${a},${b}`));
    if (!nb.length) { stack.pop(); continue; }
    const [a, b, dx, dy] = nb[Math.floor(hash(n++, 99) * nb.length)];
    if (dx === 1) walls.delete(`v${a},${b}`); if (dx === -1) walls.delete(`v${x},${y}`);
    if (dy === 1) walls.delete(`h${a},${b}`); if (dy === -1) walls.delete(`h${x},${y}`);
    seen.add(`${a},${b}`); stack.push([a, b]);
  }
  MAZE = { cols, rows, walls: [...walls].map(s => [s[0], ...s.slice(1).split(',').map(Number)]) };
  return MAZE;
}
function maze(ctx, k, colour, cell = 72, ox = 0, oy = 0) {
  const m = mazeWalls(); ctx.strokeStyle = colour; ctx.lineWidth = 5; ctx.lineCap = 'square';
  ctx.beginPath();
  m.walls.forEach(([d, x, y], i) => {
    if (hash(i, 5) > k) return;
    const px = ox + x * cell, py = oy + y * cell;
    if (d === 'h') { ctx.moveTo(px, py); ctx.lineTo(px + cell, py); } else { ctx.moveTo(px, py); ctx.lineTo(px, py + cell); }
  });
  ctx.stroke();
}

// moths: small flapping V shapes orbiting a light
function moths(ctx, t, cx, cy, n, col) {
  ctx.strokeStyle = col; ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const r = hr(90, 520, i, 1), sp = hr(.4, 1.3, i, 2) * (hash(i, 3) > .5 ? 1 : -1), a = hr(0, 7, i, 4) + t * sp;
    const x = cx + Math.cos(a) * r * 1.3 + Math.sin(t * 2 + i) * 20, y = cy + Math.sin(a) * r * .7 + Math.cos(t * 1.7 + i) * 20;
    const flap = .35 + .65 * Math.abs(Math.sin(t * 18 + i)), s = hr(16, 34, i, 5);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2 * Math.sign(sp));
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-s, -s * flap, -s * 1.3, s * .2 * flap); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s, -s * flap, s * 1.3, s * .2 * flap); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// rising flame tongues along the bottom edge
function flames(ctx, t, colA, colB, height = 380) {
  for (let layer = 0; layer < 2; layer++) {
    ctx.fillStyle = layer ? colB : colA; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 60) {
      const i = x / 60, h = height * (layer ? .6 : 1) * (.5 + .5 * Math.abs(Math.sin(t * (3 + hash(i, layer) * 3) + i)));
      ctx.lineTo(x - 30, H - h * .35); ctx.lineTo(x, H - h);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
}

// a rough marker scribble, deterministic per seed; `k` draws it on
function scribble(ctx, seed, k, col, cx, cy, size) {
  ctx.strokeStyle = col; ctx.lineWidth = hr(6, 14, seed, 9); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); const n = 26, m = Math.floor(n * k);
  for (let i = 0; i <= m; i++) {
    const x = cx + (hash(seed, i) - .5) * size * 2, y = cy + (hash(seed, i, 1) - .5) * size;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
}

// radial speed lines around a centre; `v` scales their length and count
function speedLines(ctx, t, cx, cy, v, col) {
  ctx.strokeStyle = col;
  for (let i = 0; i < 120; i++) {
    const a = hash(i, 1) * Math.PI * 2, ph = (t * v * hr(.8, 1.6, i, 2) + hash(i, 3)) % 1;
    const r0 = lerp(120, 1400, ph), r1 = r0 + lerp(40, 420, ph) * v;
    ctx.lineWidth = lerp(1, 5, ph); ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
  }
}
