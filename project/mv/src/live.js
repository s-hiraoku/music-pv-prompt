// live.js: "living stills". A still is drawn through a small WebGL shader that shifts every pixel by its depth
// (Depth Anything V2 map) as the camera drifts, so near and far separate like a real camera move, and sways the
// hair (a mask from design/live.py) in a slow wind. On top, in 2D: the city lights twinkle and a cigarette smokes.
// Used by the fresh cut (index.html?cut=fresh&live=1) for every still.
const LIVE = { ready: false, tex: {}, lights: {} };
const LIVE_IDS = ['room', 'rose', 'lying', 'sit', 'roof', 'sunset', 'near', 'lookup', 'smoke'];

function loadLive() {
  const gl0 = makeCanvas(W, H);
  const gl = gl0.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true });
  LIVE.canvas = gl0; LIVE.gl = gl;
  const vs = `attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; v.y = 1. - v.y; gl_Position = vec4(p, 0., 1.); }`;
  const fs = `precision highp float; varying vec2 v;
    uniform sampler2D img, spl, dep, hair; uniform vec4 view; uniform vec2 shift; uniform float focus, t, colour, wind;
    void main(){
      vec2 uv = view.xy + v * view.zw, p = uv;
      for (int i = 0; i < 10; i++) { float d = texture2D(dep, p).r; p = uv - (d - focus) * shift; }   // invert the depth shift
      float hm = texture2D(hair, p).r;                                                             // wind in the hair
      p.x += hm * wind * (sin(t * 1.7 + p.y * 9.) * .6 + sin(t * 3.1 + p.y * 23.) * .4);
      p.y += hm * wind * .35 * sin(t * 2.3 + p.x * 11.);
      vec3 c = mix(texture2D(spl, p).rgb, texture2D(img, p).rgb, colour);
      gl_FragColor = vec4(c, 1.);
    }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  LIVE.pr = pr; LIVE.u = n => gl.getUniformLocation(pr, n);
  ['img', 'spl', 'dep', 'hair'].forEach((n, i) => gl.uniform1i(LIVE.u(n), i));
  const load = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  const texOf = im => { const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); return tx; };
  return Promise.all(LIVE_IDS.map(async id => {
    const [img, spl, dep, hair] = await Promise.all([`cut/${id}_full.jpg`, `splash/${id}_full.jpg`, `depth/${id}_depth.png`, `depth/${id}_hair.png`].map(f => load(`../design/${f}`)));
    LIVE.tex[id] = { img: texOf(img), spl: texOf(spl), dep: texOf(dep), hair: texOf(hair), w: img.width, h: img.height };
    LIVE.lights[id] = await fetch(`../design/depth/${id}_lights.json`).then(r => r.json()).catch(() => []);
  })).then(() => { LIVE.ready = true; });
}

// Draw a living still. cam: { at (source-crop px), zoom, shift [x, y] (uv parallax), focus (depth kept still) }.
// Returns the uv view rect so overlays can map points: screen = ((u - view.x) / view.w * W, (v - view.y) / view.h * H).
function liveShot(ctx, id, t, cam, o = {}) {
  const T = LIVE.tex[id], gl = LIVE.gl, P = PHOTOS[id], s = T.w / P.crop[2];
  const [rx, ry, rw, rh] = (o.rect ?? [0, 0, W, H]).map(Math.round);       // a split-screen cell or the whole frame
  const sc = Math.max(rw / T.w, rh / T.h) * cam.zoom, vw = rw / (T.w * sc), vh = rh / (T.h * sc);
  const vx = clamp(cam.at[0] * s / T.w - vw / 2, .02, Math.max(.02, 1 - vw - .02)), vy = clamp(cam.at[1] * s / T.h - vh / 2, .02, Math.max(.02, 1 - vh - .02));
  gl.viewport(0, 0, rw, rh); gl.useProgram(LIVE.pr);
  [T.img, T.spl, T.dep, T.hair].forEach((tx, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tx); });
  gl.uniform4f(LIVE.u('view'), vx, vy, vw, vh);
  gl.uniform2f(LIVE.u('shift'), cam.shift[0], cam.shift[1]);
  gl.uniform1f(LIVE.u('focus'), cam.focus ?? .55); gl.uniform1f(LIVE.u('t'), t);
  gl.uniform1f(LIVE.u('colour'), o.colour ?? 1); gl.uniform1f(LIVE.u('wind'), o.wind ?? .0025);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  ctx.drawImage(LIVE.canvas, 0, H - rh, rw, rh, rx, ry, rw, rh);           // GL draws from the bottom-left corner
  return { x: vx, y: vy, w: vw, h: vh, rect: [rx, ry, rw, rh] };
}
const toScreen = (view, u, v) => { const [rx, ry, rw, rh] = view.rect ?? [0, 0, W, H]; return [rx + (u - view.x) / view.w * rw, ry + (v - view.y) / view.h * rh]; };

// far lights twinkle: each light breathes on its own slow cycle, a few sparkle on the hits
function twinkle(ctx, id, view, t, shift, o = {}) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  (LIVE.lights[id] ?? []).forEach(([u, v, a], i) => {
    const [x, y] = toScreen(view, u + shift[0] * .6, v + shift[1] * .6); if (x < -20 || y < -20 || x > W + 20 || y > H + 20) return;
    const k = .35 + .65 * Math.max(0, Math.sin(t * hr(.6, 2.2, i, 1) + hash(i, 2) * 7)) + (hash(i, 3) > .85 ? pulse(t, .25) : 0);
    const r = (2 + Math.sqrt(a) * .9) * (view.w < .7 ? 1.6 : 1);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4); g.addColorStop(0, `rgba(255,236,210,${.35 * k})`); g.addColorStop(1, 'rgba(255,200,160,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  });
  ctx.restore();
}
// cigarette smoke: soft puffs rising from the tip, curling, widening, fading
function smoke(ctx, view, t, tipUV, o = {}) {
  const [x0, y0] = toScreen(view, tipUV[0], tipUV[1]);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 70; i++) {
    const life = 4.5, born = Math.floor(t / .08) * .08 - i * .08, age = t - born; if (age < 0 || age > life) continue;
    const k = age / life, seed = Math.floor(born / .08);
    const x = x0 + Math.sin(age * 1.3 + seed * .7) * 40 * k + age * 22 + Math.sin(age * 3.1 + seed) * 12 * k;
    const y = y0 - age * 95 - k * k * 60, r = 10 + k * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(215,210,225,${.17 * (1 - k)})`); g.addColorStop(1, 'rgba(215,210,225,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  // the ember
  const e = .6 + .4 * Math.sin(t * 7) * Math.sin(t * 3.3); const g = ctx.createRadialGradient(x0, y0, 0, x0, y0, 22);
  g.addColorStop(0, `rgba(255,120,60,${.7 * e})`); g.addColorStop(1, 'rgba(255,80,40,0)'); ctx.fillStyle = g; ctx.fillRect(x0 - 22, y0 - 22, 44, 44);
  ctx.restore();
}

// candle flames and a warm glow (the rose still), sun bloom (sunset): small living touches drawn over the view
function candles(ctx, view, t, pts) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  pts.forEach(([u, v], i) => { const [x, y] = toScreen(view, u, v), f = .7 + .3 * Math.sin(t * 11 + i * 3) * Math.sin(t * 4.3 + i);
    const g = ctx.createRadialGradient(x, y, 0, x, y, 120 * f); g.addColorStop(0, `rgba(255,190,110,${.45 * f})`); g.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 130, y - 130, 260, 260); });
  ctx.restore();
}
function sunGlow(ctx, view, t, uv) {
  const [x, y] = toScreen(view, uv[0], uv[1]), r = 260 + 30 * Math.sin(t * .8);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, 'rgba(255,200,140,.45)'); g.addColorStop(1, 'rgba(255,120,80,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
