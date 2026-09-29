# Inputs for the "living still" renderer (mv/src/live.js): per still, a hair mask (dark strands inside the character
# cut-out, feathered, for wind sway) and the positions of small bright lights in the background (city windows,
# neon) that will twinkle. Depth maps come from Depth Anything V2 (design/depth/<id>_depth.png).
#   python3 design/live.py   -> design/depth/<id>_hair.png, design/depth/<id>_lights.json
import json, numpy as np, cv2
from PIL import Image, ImageFilter
for key in ['roof', 'smoke']:
    rgb = np.asarray(Image.open(f'design/cut/{key}_full.jpg').convert('RGB'), np.float32) / 255
    fg = np.asarray(Image.open(f'design/cut/{key}_fg.png').getchannel('A'), np.float32) / 255
    depth = np.asarray(Image.open(f'design/depth/{key}_depth.png'), np.float32) / 255
    L = rgb @ np.array([.3, .59, .11], np.float32)
    h, w = L.shape
    # hair: dark, inside (or just outside) her silhouette; strands near the silhouette edge move most
    near_fg = cv2.dilate((fg > .3).astype(np.uint8), np.ones((25, 25), np.uint8)).astype(bool)
    hair = (L < .3) & near_fg
    edge = cv2.distanceTransform((fg > .5).astype(np.uint8), cv2.DIST_L2, 5)
    weight = np.clip(1 - edge / (w * .05), .25, 1)                # loose ends near the outline sway more
    m = hair * weight
    m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 3)
    Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).save(f'design/depth/{key}_hair.png')
    # lights: small bright blobs in the far background
    bright = ((L > .78) & (depth < .35) & (fg < .1)).astype(np.uint8)
    n, lab, stats, cent = cv2.connectedComponentsWithStats(bright)
    pts = [[round(float(cx / w), 4), round(float(cy / h), 4), int(a)] for (x, y, bw, bh, a), (cx, cy) in zip(stats[1:], cent[1:]) if 4 <= a <= 900]
    json.dump(pts, open(f'design/depth/{key}_lights.json', 'w'))
    print(key, 'hair share', round(float((m > .2).mean()), 3), 'lights', len(pts))
