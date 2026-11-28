#!/usr/bin/env python3
# tools/blender/tex_preview.py — QA contact sheet for the tileable sets (system python3): per set a 2×2 tiled
# basecolor (seams), a lit shading of normal+AO+roughness under a low grazing light, roughness and normal.
#   python3 tools/blender/tex_preview.py [name ...]  → out/blender_preview/tex_<name>.jpg (+ tex_all.jpg)
import os, sys
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
TEX = os.path.join(ROOT, 'src', 'real', 'assets', 'tex')
OUT = os.path.join(ROOT, 'out', 'blender_preview'); os.makedirs(OUT, exist_ok=True)

def load(n, k, mode='RGB'):
    return np.asarray(Image.open(os.path.join(TEX, f'{n}_{k}.png')).convert(mode), dtype=np.float32) / 255.0

def lit(n):
    c = load(n, 'color'); c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    nm = load(n, 'normal') * 2 - 1; nm[..., 1] *= -1     # image rows go down, +Y (green) is up
    ao = load(n, 'ao', 'L'); r = load(n, 'rough', 'L')
    L = np.array([-0.55, 0.45, 0.70]); L /= np.linalg.norm(L)
    V = np.array([0, 0, 1.0]); H = (L + V) / np.linalg.norm(L + V)
    ndl = np.clip((nm * L).sum(-1), 0, 1); ndh = np.clip((nm * H).sum(-1), 0, 1)
    a2 = np.maximum(r, 0.04) ** 4
    D = a2 / (np.pi * ((ndh ** 2) * (a2 - 1) + 1) ** 2)
    spec = 0.04 * D * ndl * 0.25
    col = c * (0.12 * ao[..., None] + 0.9 * ndl[..., None]) + spec[..., None]
    col = col / (1 + col)  # reinhard
    return (np.clip(col, 0, 1) ** (1 / 2.2) * 255).astype(np.uint8)

def sheet(n):
    S = 512
    c = Image.open(os.path.join(TEX, f'{n}_color.png')).convert('RGB').resize((S // 2, S // 2), Image.LANCZOS)
    t = Image.new('RGB', (S, S)); [t.paste(c, (x, y)) for x in (0, S // 2) for y in (0, S // 2)]
    l = Image.fromarray(lit(n)).resize((S, S), Image.LANCZOS)
    r = Image.open(os.path.join(TEX, f'{n}_rough.png')).convert('RGB').resize((S // 2, S // 2))
    nn = Image.open(os.path.join(TEX, f'{n}_normal.png')).convert('RGB').resize((S // 2, S // 2))
    crop = Image.fromarray(lit(n)).crop((0, 0, 256, 256))
    out = Image.new('RGB', (S * 2 + S // 2, S), (20, 20, 20))
    out.paste(t, (0, 0)); out.paste(l, (S, 0)); out.paste(r, (2 * S, 0)); out.paste(crop, (2 * S, S // 2))
    ImageDraw.Draw(out).text((6, 6), n, fill=(255, 255, 0))
    return out

if __name__ == '__main__':
    names = sys.argv[1:] or sorted({f.rsplit('_', 1)[0] for f in os.listdir(TEX) if f.endswith('_color.png')})
    ims = [sheet(n) for n in names]
    for n, im in zip(names, ims): im.save(os.path.join(OUT, f'tex_{n}.jpg'), quality=88)
    if len(ims) > 1:
        W, H = ims[0].size; allim = Image.new('RGB', (W, H * len(ims)))
        for i, im in enumerate(ims): allim.paste(im, (0, i * H))
        allim.save(os.path.join(OUT, 'tex_all.jpg'), quality=85)
