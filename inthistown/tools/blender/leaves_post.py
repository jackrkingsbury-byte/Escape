#!/usr/bin/env python3
# tools/blender/leaves_post.py — finalize the foliage atlases rendered by leaves.py (system python3).
#   2048 → 1024 box downsample (alpha-weighted colour), then colour/normal dilation into transparent texels so
#   mipmaps and alpha-tested edges never pick up black fringes.  → src/real/assets/tex/foliage_<atlas>_*.png
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
BUILD = os.path.join(ROOT, 'out', 'blender_build')
TEX = os.path.join(ROOT, 'src', 'real', 'assets', 'tex')


def srgb2lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lin2srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def down2_weighted(rgb, a):
    h, w = a.shape
    A = a.reshape(h // 2, 2, w // 2, 2)
    C = (rgb * a[..., None]).reshape(h // 2, 2, w // 2, 2, 3)
    asum = A.sum(axis=(1, 3))
    col = C.sum(axis=(1, 3)) / np.maximum(asum, 1e-6)[..., None]
    return col, asum / 4


def dilate(col, a, thresh=0.02):
    solid = a > thresh
    idx = ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    return col[idx[0], idx[1]]


def process(name):
    c = np.asarray(Image.open(os.path.join(BUILD, f'foliage_{name}_color_raw.png')).convert('RGBA'), dtype=np.float32) / 255
    n = np.asarray(Image.open(os.path.join(BUILD, f'foliage_{name}_normal_raw.png')).convert('RGBA'), dtype=np.float32) / 255
    a = c[..., 3]
    col, a2 = down2_weighted(srgb2lin(c[..., :3]), a)
    nrm, _ = down2_weighted(n[..., :3] * 2 - 1, a)
    col = dilate(col, a2)
    nrm = dilate(nrm, a2)
    nrm /= np.maximum(np.linalg.norm(nrm, axis=-1, keepdims=True), 1e-6)
    nrm[..., 2] = np.abs(nrm[..., 2])
    rgba = np.concatenate([lin2srgb(col), a2[..., None]], axis=-1)
    Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA').save(os.path.join(TEX, f'foliage_{name}_color.png'), optimize=True)
    Image.fromarray(((nrm * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8), 'RGB').save(os.path.join(TEX, f'foliage_{name}_normal.png'), optimize=True)
    # QA preview over grey
    bgc = np.full_like(col, 0.18)
    prev = lin2srgb(col * a2[..., None] + bgc * (1 - a2[..., None]))
    os.makedirs(os.path.join(ROOT, 'out', 'blender_preview'), exist_ok=True)
    Image.fromarray((prev * 255).astype(np.uint8)).save(os.path.join(ROOT, 'out', 'blender_preview', f'foliage_{name}.jpg'), quality=88)
    print(f'[leaves_post] {name}: coverage {a2.mean():.3f}', flush=True)
    import json
    mp = os.path.join(ROOT, 'src', 'real', 'assets', 'manifest.json')
    man = json.load(open(mp)) if os.path.exists(mp) else {}
    cells = json.load(open(os.path.join(TEX, 'foliage_atlas.json')))[name]['cells']
    files = {'color': f'tex/foliage_{name}_color.png', 'normal': f'tex/foliage_{name}_normal.png'}
    man.setdefault('atlases', {})[name] = dict(files=files, res=int(a2.shape[0]), cells=sorted(cells), coverage=round(float(a2.mean()), 3),
                                               bytes=sum(os.path.getsize(os.path.join(TEX, os.path.basename(f))) for f in files.values()),
                                               note='sRGB albedo + alpha (alphaTest 0.5); OpenGL normal; layout in tex/foliage_atlas.json')
    json.dump(dict(sorted(man.items())), open(mp, 'w'), indent=1)


if __name__ == '__main__':
    for nm in sys.argv[1:] or ['palm', 'canopy', 'under']:
        if os.path.exists(os.path.join(BUILD, f'foliage_{nm}_color_raw.png')):
            process(nm)
