# Colour-splash versions of every still: the world goes grey (a cool lilac grey), only the reds keep their colour.
#   python3 design/splash.py   -> design/splash/<id>_full.jpg, <id>_fg.png (same sizes and masks as design/cut)
import os, numpy as np
from PIL import Image, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
os.makedirs(P('design/splash'), exist_ok=True)
IDS = ['room', 'rose', 'lying', 'sit', 'roof', 'sunset', 'near', 'lookup', 'smoke']
for key in IDS:
    im = np.asarray(Image.open(P('design/cut', f'{key}_full.jpg')).convert('RGB'), np.float32) / 255
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mx, mn = im.max(-1), im.min(-1); sat = (mx - mn) / (mx + 1e-4)
    # hue in degrees
    d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    red = ((h < 16) | (h > 338)) & (sat > .5) & (mx > .18)
    m = Image.fromarray((red * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(2.5))
    keep = np.asarray(m, np.float32)[..., None] / 255
    L = (.3 * r + .59 * g + .11 * b)[..., None]
    grey = np.clip(L * np.array([.94, .92, 1.0]) + .02, 0, 1)                   # a cool, slightly lilac grey
    out = grey * (1 - keep) + np.clip(im * np.array([1.08, .95, .95]), 0, 1) * keep
    full = Image.fromarray((out * 255).astype(np.uint8))
    full.save(P('design/splash', f'{key}_full.jpg'), quality=93)
    fg = full.copy(); fg.putalpha(Image.open(P('design/cut', f'{key}_fg.png')).getchannel('A')); fg.save(P('design/splash', f'{key}_fg.png'))
    print(key, 'red share', round(float(keep.mean()), 3))
