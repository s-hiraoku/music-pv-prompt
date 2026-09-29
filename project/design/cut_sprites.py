# Cut the 4x4 pose sheet into cells and remove the white background by flood fill from the cell edges.
import numpy as np
from PIL import Image, ImageFilter
from collections import deque
im = np.asarray(Image.open('assets/character_sheet.webp').convert('RGB')).astype(np.int16)
H, W = im.shape[:2]; cw, ch = W // 4, H // 4
# measured grid lines (the sheet's cells are not uniform)
XS = [(2, 255), (258, 512), (515, 767), (770, 1022)]
YS = [(2, 361), (363, 720), (723, 1074), (1076, 1534)]
def bgmask(c):
    h, w = c.shape[:2]
    mx, mn = c.max(2), c.min(2)
    cand = (mn > 236) & (mx - mn < 14)        # the sheet's off-white paper (~250), unsaturated
    seen = np.zeros((h, w), bool); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if cand[y, x]: seen[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if cand[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    # paper enclosed by hair strands or arms: flat, paper-coloured pockets that the edge fill cannot reach
    from scipy import ndimage
    lab, n = ndimage.label(cand & ~seen)
    for i in range(1, n + 1):
        m = lab == i
        ys = np.nonzero(m)[0]
        low = ys.mean() > h * 0.62              # leg-warmer area: only large gaps (between the legs) are paper
        if m.sum() >= (400 if low else 25) and np.median(c[m].mean(-1)) >= 247.5:
            seen |= m & (c.mean(-1) >= 244)
    # soft grey floor shadow under the feet, touching the paper
    shadow = (mn > 170) & (mx - mn < 18) & (np.arange(h)[:, None] > h * 0.88)
    lab, n = ndimage.label(shadow)
    for i in range(1, n + 1):
        m = lab == i
        if (ndimage.binary_dilation(m) & seen).any(): seen |= m
    return seen
for r in range(4):
    for c in range(4):
        (x0, x1), (y0, y1) = XS[c], YS[r]
        cell = im[y0+2:y1-2, x0+2:x1-2]
        bg = bgmask(cell)
        a = Image.fromarray(((~bg) * 255).astype(np.uint8))
        a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
        rgba = Image.fromarray(cell.astype(np.uint8)).convert('RGBA'); rgba.putalpha(a)
        bb = rgba.getbbox(); rgba = rgba.crop(bb)
        rgba.save(f'design/sprites/pose{r*4+c:02d}.png')
        print(r*4+c, rgba.size)
# preview on dark background
tiles = [Image.open(f'design/sprites/pose{i:02d}.png') for i in range(16)]
cw, ch = 260, 470
sheet = Image.new('RGB', (4*cw, 4*ch), (40, 20, 60))
for i, t in enumerate(tiles):
    x = (i % 4) * cw + (cw - t.width) // 2; y = (i // 4) * ch + (ch - t.height) // 2
    sheet.paste(t, (x, y), t)
sheet.save('design/sprites_preview.jpg', quality=90)
