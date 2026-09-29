# Depth maps for every still with Depth Anything V2 (small), 1 = near.   python3 design/depth.py
import os, numpy as np, torch
from PIL import Image
from transformers import pipeline
IDS = ['room', 'rose', 'lying', 'sit', 'roof', 'sunset', 'near', 'lookup', 'smoke']
os.makedirs('design/depth', exist_ok=True)
pipe = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Small-hf', device='cpu')
for key in IDS:
    out = f'design/depth/{key}_depth.png'
    if os.path.exists(out): continue
    im = Image.open(f'design/cut/{key}_full.jpg').convert('RGB'); small = im.copy(); small.thumbnail((1024, 1024))
    d = pipe(small)['predicted_depth']
    d = torch.nn.functional.interpolate(d[None] if d.dim() == 3 else d[None, None], size=im.size[::-1], mode='bicubic')[0, 0].numpy()
    d = (d - d.min()) / (d.max() - d.min())
    Image.fromarray((d * 255).astype(np.uint8)).save(out); print(key, flush=True)
