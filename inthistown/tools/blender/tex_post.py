#!/usr/bin/env python3
# tools/blender/tex_post.py — turns the raw float bakes of textures.py into the shipped PNG sets (system python3,
# numpy + Pillow). Run after:  blender -b --python tools/blender/textures.py
#
#   python3 tools/blender/tex_post.py [name ...]
#
# Per set → src/real/assets/tex/<name>_color.png   sRGB basecolor (8-bit RGB)
#                                 <name>_normal.png  tangent-space normal, OpenGL convention (+Y = up/green)
#                                 <name>_rough.png   linear roughness (8-bit gray)
#                                 <name>_ao.png      ambient occlusion derived from height (8-bit gray)
#                                 <name>_height.png  height 0..1 (16-bit gray), physical range in manifest.json
#                                 <name>_orm.png     packed R=AO G=rough B=metal(0), for glTF/three (one texture)
# Everything is computed with periodic boundaries (np.roll / FFT) so the tiling stays seamless.
import os, sys, json
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
BUILD = os.path.join(ROOT, 'out', 'blender_build')
TEX = os.path.join(ROOT, 'src', 'real', 'assets', 'tex')
os.makedirs(TEX, exist_ok=True)


def load_raw(path):
    with open(path + '.json') as f:
        hdr = json.load(f)
    a = np.fromfile(path, dtype=np.float32).reshape(hdr['h'], hdr['w'], 4)
    return a  # rows bottom→top (v ascending)


def down2(a):
    h, w = a.shape[:2]
    return a.reshape(h // 2, 2, w // 2, 2, *a.shape[2:]).mean(axis=(1, 3))


def lin2srgb(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)


def gauss_periodic(h, sigma_px):
    """periodic gaussian blur via FFT."""
    H, W = h.shape
    fy = np.fft.fftfreq(H)[:, None]
    fx = np.fft.fftfreq(W)[None, :]
    k = np.exp(-2 * (np.pi ** 2) * (sigma_px ** 2) * (fx ** 2 + fy ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(h) * k))


def normal_from_height(hm, texel_m, scale=1.0):
    """hm in metres, rows = v ascending. OpenGL tangent space: X = +u, Y = +v."""
    dhdu = (np.roll(hm, -1, axis=1) - np.roll(hm, 1, axis=1)) / (2 * texel_m)
    dhdv = (np.roll(hm, -1, axis=0) - np.roll(hm, 1, axis=0)) / (2 * texel_m)
    n = np.stack([-dhdu * scale, -dhdv * scale, np.ones_like(hm)], axis=-1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return n


def ao_from_height(hm, texel_m, depth_m):
    """multi-scale cavity occlusion: how far each texel sits below its blurred neighbourhood."""
    ao = np.zeros_like(hm)
    for sig_m, w in ((depth_m * 0.5, 0.35), (depth_m * 1.5, 0.35), (depth_m * 4.0, 0.3)):
        sp = max(1.0, sig_m / texel_m)
        b = gauss_periodic(hm, sp)
        ao += w * np.clip((b - hm) / (depth_m * 0.6), 0, 1)
    return np.clip(1.0 - ao * 1.1, 0.0, 1.0) ** 1.2


def save_gray8(a, path):
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)[::-1], 'L').save(path, optimize=True)


def save_rgb8(a, path):
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)[::-1], 'RGB').save(path, optimize=True)


def save_gray16(a, path):
    im = Image.fromarray((np.clip(a, 0, 1) * 65535 + 0.5).astype(np.uint16)[::-1])
    im.save(path)


def process(name):
    with open(os.path.join(BUILD, f'tex_{name}.json')) as f:
        meta = json.load(f)
    alb = down2(load_raw(os.path.join(BUILD, f'tex_{name}_albedo.f32'))[..., :3])
    rough = down2(load_raw(os.path.join(BUILD, f'tex_{name}_rough.f32'))[..., 0])
    hraw = load_raw(os.path.join(BUILD, f'tex_{name}_height.f32'))[..., 0]
    # normalise height robustly to 0..1 (keep the bake's shape)
    lo, hi = np.percentile(hraw, 0.2), np.percentile(hraw, 99.8)
    h2 = np.clip((hraw - lo) / max(1e-6, hi - lo), 0, 1)
    h = down2(h2)
    res = h.shape[0]
    texel = meta['tile'] / res
    hm = h * meta['depth']
    n = normal_from_height(hm, texel, meta.get('normal_scale', 1.0))
    ao = ao_from_height(hm, texel, meta['depth'])
    rough = np.clip(rough, 0.03, 1.0)
    base = os.path.join(TEX, name)
    save_rgb8(lin2srgb(alb), base + '_color.png')
    save_rgb8(n * 0.5 + 0.5, base + '_normal.png')
    save_gray8(rough, base + '_rough.png')
    save_gray8(ao, base + '_ao.png')
    save_gray16(h, base + '_height.png')
    orm = np.stack([ao, rough, np.zeros_like(ao)], axis=-1)
    save_rgb8(orm, base + '_orm.png')
    # seam check: mean abs difference across the wrap vs inside (should be similar)
    a8 = lin2srgb(alb)
    wrap = np.abs(a8[:, 0] - a8[:, -1]).mean() + np.abs(a8[0] - a8[-1]).mean()
    inner = np.abs(a8[:, res // 2] - a8[:, res // 2 - 1]).mean() + np.abs(a8[res // 2] - a8[res // 2 - 1]).mean()
    stats = dict(albedo_mean_srgb=float(a8.mean()), rough_mean=float(rough.mean()), ao_mean=float(ao.mean()),
                 seam_ratio=float(wrap / max(1e-6, inner)))
    # manifest
    mp = os.path.join(ROOT, 'src', 'real', 'assets', 'manifest.json')
    man = json.load(open(mp)) if os.path.exists(mp) else {}
    files = {k: f'tex/{name}_{k}.png' for k in ('color', 'normal', 'rough', 'ao', 'height', 'orm')}
    man.setdefault('textures', {})[name] = dict(tile_m=meta['tile'], height_m=meta['depth'], res=res, desc=meta['desc'],
                                                files=files, bytes=sum(os.path.getsize(os.path.join(TEX, os.path.basename(p))) for p in files.values()))
    man['textures'] = dict(sorted(man['textures'].items()))
    json.dump(dict(sorted(man.items())), open(mp, 'w'), indent=1)
    print(f'[tex_post] {name}: {res}px tile {meta["tile"]}m  ' + '  '.join(f'{k}={v:.3f}' for k, v in stats.items()), flush=True)


if __name__ == '__main__':
    names = sys.argv[1:] or sorted(f[4:-5] for f in os.listdir(BUILD)
                                   if f.startswith('tex_') and f.endswith('.json') and not f.endswith('.f32.json'))
    for n in names:
        process(n)
