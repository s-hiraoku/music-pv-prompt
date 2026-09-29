// render.mjs: paints the video frame by frame in headless Chromium, then joins the frames and the song with ffmpeg.
//   node render.mjs --stills=1.5,12,40 [--w=480] --out=out/check/sheet.jpg   contact sheet of chosen times
//   node render.mjs --frames [--range=0:30] [--workers=4]                     JPEG frames -> out/frames (resumable)
//   node render.mjs --encode [--preview] [--out=out/mv.mp4]                   out/frames + song -> MP4 (--preview: small file)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const FPS = +(args.fps || 30);
const AUDIO = path.resolve(here, args.audio || '../assets/song.mp3');
const DURATION = 133.85;
const CHROME = args.chrome || process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function openPage() {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--window-size=1920,1080', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'],
  });
  const page = await browser.newPage();
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[page error]', e.message));
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('file://' + path.join(here, 'index.html'));
  await page.waitForFunction('window.MV && window.MV.ready === true', { timeout: 60000 });
  return { browser, page };
}

const grab = (page, t, q = 0.92) => page.evaluate((t, q) => window.MV.frame(t, q), t, q)
  .then(s => Buffer.from(s.slice(s.indexOf(',') + 1), 'base64'));

if (args.stills) {
  const times = String(args.stills).split(',').map(Number);
  const out = path.resolve(here, args.out || 'out/check/sheet.jpg');
  const tmp = path.join(path.dirname(out), '.stills'); fs.mkdirSync(tmp, { recursive: true });
  const { browser, page } = await openPage();
  const files = [];
  for (const [i, t] of times.entries()) {
    const f = path.join(tmp, `${String(i).padStart(3, '0')}.jpg`);
    fs.writeFileSync(f, await grab(page, t)); files.push(f);
  }
  await browser.close();
  const cols = +(args.cols || Math.min(4, times.length)), w = +(args.w || 480);
  const label = times.map((t, i) => `[${i}:v]scale=${w}:-1,drawtext=text='${t.toFixed(2)}s':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(';');
  const rows = Math.ceil(times.length / cols);
  const layout = times.map((_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * Math.round(w * 9 / 16)}`).join('|');
  const inputs = files.flatMap(f => ['-i', f]);
  const filter = times.length === 1 ? `${label};[v0]null[o]` : `${label};${times.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${times.length}:layout=${layout}:fill=black[o]`;
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex', filter, '-map', '[o]', '-frames:v', '1', out]);
  if (r.status) console.error(String(r.stderr));
  fs.rmSync(tmp, { recursive: true });
  console.log(out, `(${times.length} frames, ${rows} rows)`);
} else if (args.frames) {
  const [a, b] = String(args.range || `0:${DURATION}`).split(':').map(Number);
  const n0 = Math.round(a * FPS), n1 = Math.min(Math.round(b * FPS), Math.floor(DURATION * FPS));
  const dir = path.join(here, 'out/frames'); fs.mkdirSync(dir, { recursive: true });
  const todo = [];
  for (let n = n0; n < n1; n++) if (!fs.existsSync(path.join(dir, `${String(n).padStart(5, '0')}.jpg`))) todo.push(n);
  const workers = +(args.workers || 4);
  console.log(`${todo.length} frames to paint with ${workers} workers`);
  const t0 = Date.now(); let done = 0;
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const { browser, page } = await openPage();
    for (let i = w; i < todo.length; i += workers) {
      const n = todo[i];
      fs.writeFileSync(path.join(dir, `${String(n).padStart(5, '0')}.jpg`), await grab(page, n / FPS));
      if (++done % 150 === 0) console.log(`${done}/${todo.length}  ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
    }
    await browser.close();
  }));
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
} else if (args.encode) {
  const out = path.resolve(here, args.out || 'out/mv.mp4');
  // start at the first painted frame; the audio is cut from the same time so a partial render stays in sync
  const first = Math.min(...fs.readdirSync(path.join(here, 'out/frames')).filter(f => f.endsWith('.jpg')).map(f => parseInt(f)));
  const p = spawn('ffmpeg', ['-loglevel', 'error', '-stats', '-y', '-framerate', String(FPS), '-start_number', String(first),
    '-i', path.join(here, 'out/frames/%05d.jpg'), '-ss', (first / FPS).toFixed(4), '-i', AUDIO, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', args.preview ? '26' : '17', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
  p.on('close', c => console.log(c ? `ffmpeg failed (${c})` : out));
} else {
  console.log('usage: --stills=t1,t2 | --frames [--range=a:b] | --encode');
}
