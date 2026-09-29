# 3x Lanczos upscale + unsharp mask of the cut sprites (premultiplied so edges don't pick up dark fringes)
import numpy as np
from PIL import Image, ImageFilter
import glob, os
os.makedirs('design/sprites_hd', exist_ok=True)
for f in sorted(glob.glob('design/sprites/pose*.png')):
    im = Image.open(f).convert('RGBA'); a = np.asarray(im).astype(np.float32) / 255
    rgb, al = a[..., :3] * a[..., 3:], a[..., 3]
    S = 3; size = (im.width * S, im.height * S)
    up = lambda x: np.asarray(Image.fromarray((x * 255).astype(np.uint8)).resize(size, Image.LANCZOS)).astype(np.float32) / 255
    rgb_u = np.stack([up(rgb[..., c]) for c in range(3)], -1); al_u = up(al)
    col = np.clip(rgb_u / np.maximum(al_u[..., None], 1e-3), 0, 1)
    out = Image.fromarray((np.dstack([col, al_u]) * 255).astype(np.uint8), 'RGBA')
    rgbimg = out.convert('RGB').filter(ImageFilter.UnsharpMask(radius=2.2, percent=120, threshold=2))
    rgbimg.putalpha(out.getchannel('A')); rgbimg.save(f.replace('sprites/', 'sprites_hd/'))
    print(os.path.basename(f), rgbimg.size)
