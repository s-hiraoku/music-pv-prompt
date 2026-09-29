# The original stills at print resolution plus their character cut-outs (masks from design/riso.py), so lyric panels
# can sit between her and the background without changing the look of the illustrations.
#   python3 design/cutout.py   -> design/cut/<id>_full.jpg, <id>_fg.png
import os, json
from PIL import Image, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
os.makedirs(P('design/cut'), exist_ok=True)
CROPS = {
  'room': ('room.webp', (0, 0, 1536, 1024)), 'rose': ('rose_triptych.webp', (2, 2, 722, 1020)),
  'lying': ('rose_triptych.webp', (732, 2, 802, 442)), 'sit': ('rose_triptych.webp', (732, 452, 802, 570)),
  'roof': ('rooftop.webp', (0, 0, 1536, 1024)), 'sunset': ('faces.webp', (2, 2, 762, 506)),
  'near': ('faces.webp', (770, 2, 764, 506)), 'lookup': ('faces.webp', (2, 516, 762, 506)),
  'smoke': ('faces.webp', (770, 516, 764, 506)),
}
for key, (src, (x, y, w, h)) in CROPS.items():
    im = Image.open(P('assets/adult', src)).convert('RGB').crop((x, y, x + w, y + h))
    S = 2400 / max(w, h)
    big = im.resize((int(w * S), int(h * S)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
    big.save(P('design/cut', f'{key}_full.jpg'), quality=93)
    mask = Image.open(P('design/riso', f'{key}_mask.png')).resize(big.size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
    fg = big.copy(); fg.putalpha(mask); fg.save(P('design/cut', f'{key}_fg.png'))
    print(key, big.size)
