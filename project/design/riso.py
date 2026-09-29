# Turns each still into a three-ink risograph print on cream paper, and cuts the character out as her own layer so
# type can sit between her and the background.
#   python3 design/riso.py            -> design/riso/<id>_full.jpg, <id>_fg.png (print, character only), <id>_mask.png
# Inks: navy (shadows and line), fluoro pink (mid-tones, violets, skin warmth), rose red (reds: the roses, lips).
# Each ink is halftoned at its own screen angle and printed slightly out of register, like a real riso pass.
import os, json
import numpy as np
from PIL import Image, ImageFilter
import onnxruntime as ort
from huggingface_hub import hf_hub_download

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
OUT = P('design/riso'); os.makedirs(OUT, exist_ok=True)

PAPER = np.array([241, 233, 218]) / 255
INKS = {'navy': np.array([29, 42, 107]) / 255, 'pink': np.array([255, 95, 162]) / 255, 'red': np.array([214, 30, 58]) / 255}
ANGLE = {'navy': 45, 'pink': 15, 'red': 75}
SHIFT = {'navy': (0, 0), 'pink': (4, -3), 'red': (-3, 4)}
CELL = 7                                   # halftone cell, px at the working resolution

CROPS = {   # same crops as mv/src/photos.js
  'room': ('room.webp', (0, 0, 1536, 1024)), 'rose': ('rose_triptych.webp', (2, 2, 722, 1020)),
  'lying': ('rose_triptych.webp', (732, 2, 802, 442)), 'sit': ('rose_triptych.webp', (732, 452, 802, 570)),
  'roof': ('rooftop.webp', (0, 0, 1536, 1024)), 'sunset': ('faces.webp', (2, 2, 762, 506)),
  'near': ('faces.webp', (770, 2, 764, 506)), 'lookup': ('faces.webp', (2, 516, 762, 506)),
  'smoke': ('faces.webp', (770, 516, 764, 506)),
}

seg = ort.InferenceSession(hf_hub_download('skytnt/anime-seg', 'isnetis.onnx'))
def character_mask(img):
    """anime-seg (ISNet): 1024x1024 letterboxed input -> soft foreground mask at the image's size"""
    w, h = img.size; s = 1024 / max(w, h); nw, nh = int(w * s), int(h * s)
    canvas = np.zeros((1024, 1024, 3), np.float32)
    x0, y0 = (1024 - nw) // 2, (1024 - nh) // 2
    canvas[y0:y0 + nh, x0:x0 + nw] = np.asarray(img.convert('RGB').resize((nw, nh), Image.BICUBIC), np.float32) / 255
    m = seg.run(None, {'img': canvas.transpose(2, 0, 1)[None]})[0][0, 0][y0:y0 + nh, x0:x0 + nw]
    return Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)

def separations(rgb):
    """ink coverage 0..1 per ink from an RGB image (float, HxWx3). Levels are stretched first so the paper shows
    through like a real print; navy carries the deep shadows plus an extracted line drawing."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    L = .3 * r + .59 * g + .11 * b
    lo, hi = np.percentile(L, 2), np.percentile(L, 98); Ln = np.clip((L - lo) / (hi - lo + 1e-4), 0, 1) ** .8
    mx, mn = rgb.max(-1), rgb.min(-1); sat = (mx - mn) / (mx + 1e-4)
    # line drawing: difference of gaussians on luminance, dark edges only
    Li = Image.fromarray((Ln * 255).astype(np.uint8))
    dog = (np.asarray(Li.filter(ImageFilter.GaussianBlur(4)), np.float32) - np.asarray(Li.filter(ImageFilter.GaussianBlur(1)), np.float32)) / 255
    lines = np.clip(dog * 9 - .15, 0, 1)
    navy = np.clip(np.clip((.38 - Ln) / .38, 0, 1) ** 1.3 * .95 + lines, 0, 1)
    redness = np.clip((r - np.maximum(g, b)) * 3.2, 0, 1) * np.clip(sat * 1.6, 0, 1)
    violet = np.clip((b + r * .6 - g * 1.4) * 1.8, 0, 1) * np.clip(sat * 2, 0, 1)
    warmth = np.clip((r - b) * 2.2 + .1, 0, 1)
    pink = np.clip(.6 * violet + .5 * warmth, 0, 1) * np.clip(1.15 - Ln * .85, 0, 1) * (1 - redness * .6) * .85
    return {'navy': navy, 'pink': pink, 'red': redness}

def halftone(cov, angle, cell):
    """round dots on a rotated grid; each dot's area follows the coverage under it"""
    h, w = cov.shape; yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    a = np.deg2rad(angle); u = xx * np.cos(a) + yy * np.sin(a); v = -xx * np.sin(a) + yy * np.cos(a)
    du = (u / cell) % 1 - .5; dv = (v / cell) % 1 - .5
    d = np.sqrt(du * du + dv * dv)                      # 0 at the cell centre, ~.707 at corners
    radius = np.sqrt(np.clip(cov, 0, 1) / np.pi) * 1.05 # area-true radius in cell units
    return np.clip((radius - d) * cell * .9 + .5, 0, 1) # anti-aliased dot edge

def print_riso(img, seed):
    rgb = np.asarray(img.convert('RGB'), np.float32) / 255
    cov = separations(rgb)
    out = np.ones_like(rgb) * PAPER
    rng = np.random.default_rng(seed)
    for name in ('pink', 'red', 'navy'):
        dots = halftone(cov[name], ANGLE[name], CELL)
        dx, dy = SHIFT[name]; dots = np.roll(np.roll(dots, dy, 0), dx, 1)
        # uneven ink: soft blotches where the drum laid down less
        blot = np.asarray(Image.fromarray((rng.random((dots.shape[0] // 24 + 1, dots.shape[1] // 24 + 1)) * 255).astype(np.uint8))
                          .resize((dots.shape[1], dots.shape[0]), Image.BICUBIC), np.float32) / 255
        dots = dots * (.82 + .18 * blot)
        out *= 1 - dots[..., None] * (1 - INKS[name])
    grain = rng.normal(0, .025, out.shape[:2])[..., None]
    return np.clip(out + grain, 0, 1)

for i, (key, (src, (x, y, w, h))) in enumerate(CROPS.items()):
    im = Image.open(P('assets/adult', src)).convert('RGB').crop((x, y, x + w, y + h))
    S = 2400 / max(w, h)                               # work large so the dots stay crisp when the camera pushes in
    big = im.resize((int(w * S), int(h * S)), Image.LANCZOS)
    mask = character_mask(im).resize(big.size, Image.BICUBIC)
    riso = print_riso(big, i)
    full = Image.fromarray((riso * 255).astype(np.uint8))
    full.save(os.path.join(OUT, f'{key}_full.jpg'), quality=92)
    fg = full.copy(); fg.putalpha(mask.filter(ImageFilter.GaussianBlur(1.2)))
    fg.save(os.path.join(OUT, f'{key}_fg.png'))
    mask.save(os.path.join(OUT, f'{key}_mask.png'))
    print(key, big.size, 'mask cover', round(float(np.asarray(mask).mean() / 255), 2), flush=True)
json.dump({k: [int(v[1][2] * 2400 / max(v[1][2:])), int(v[1][3] * 2400 / max(v[1][2:]))] for k, v in CROPS.items()},
          open(os.path.join(OUT, 'sizes.json'), 'w'))
