# tools/blender/textures.py — procedural, seamlessly tiling PBR texture sets baked from Cycles shader node trees.
#
#   blender -b --python tools/blender/textures.py -- [name ...]      (default: all sets)
#   python3 tools/blender/tex_post.py [name ...]                      (→ src/real/assets/tex/<name>_*.png)
#
# Seamless tiling: every noise/voronoi is sampled in 4D on a flat (Clifford) torus
#   (u,v) → (cos 2πu·ku/2π, sin 2πu·ku/2π, cos 2πv·kv/2π, sin 2πv·kv/2π) + seed offset
# which is exactly periodic in u and v and undistorted (the Clifford torus is flat). Integer-frequency sine/
# frac patterns (ripples, planks, weave, rings) are periodic by construction.
# Each set is baked as three float passes (albedo [linear], roughness, height [0..1]) at 2× resolution into
# float images, dumped raw to out/blender_build/, and tex_post.py downsamples (AA), derives the OpenGL normal
# map and AO from the height with periodic finite differences, and writes the PNGs.
import os, sys, math, time, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_common import *

RES = 2048   # bake resolution (final PNGs are RES/2 after box downsampling)


# ───────────────────────────────────────────── helpers ─────────────────────────────────────────────
def local_uv(g, T, vec, w, vor):
    """offset (in torus units ≈ world-isotropic when ku == kv) from the voronoi feature point to the sample."""
    p = g.sep(vec)
    f = g.sep(vor.outputs['Position'])
    dx, dy, dz = g.sub(p[0], f[0]), g.sub(p[1], f[1]), g.sub(p[2], f[2])
    dw = g.sub(w, vor.outputs['W'])
    lu = g.add(g.mul(g.mul(dx, -1.0), T.su), g.mul(dy, T.cu))
    lv = g.add(g.mul(g.mul(dz, -1.0), T.sv), g.mul(dw, T.cv))
    return lu, lv


def rotate2(g, x, y, ang):
    c, s = g.cos(ang), g.sin(ang)
    return g.add(g.mul(x, c), g.mul(y, s)), g.sub(g.mul(y, c), g.mul(x, s))


def per_index_rand(g, idx, seed):
    """deterministic random 0..1 per integer index (white noise of a 3D point)."""
    wn = g.white(g.comb(idx, seed, seed * 0.37 + 1.3))
    return wn.outputs['Value']


# ───────────────────────────────────────────── materials ───────────────────────────────────────────
# each returns dict(albedo=<color socket, linear>, rough=<float>, height=<float 0..1>)
# and module-level META gives tile size (m) + height depth (m) for the normal map.
META = {}


def tex(name, tile, depth, desc, normal_scale=1.0):
    def deco(fn):
        META[name] = dict(fn=fn, tile=tile, depth=depth, desc=desc, normal_scale=normal_scale)
        return fn
    return deco


@tex('wet_sand', tile=2.0, depth=0.012, desc='wet beach sand: swash ripples, rain-drop pits, standing-water films, shell grit')
def wet_sand(g, T):
    warp = T.warp(2.0, 2.0, seed=1.0)
    # ripples: integer frequencies + periodic warp → periodic; two trains (straight + oblique) in different zones
    wv = g.mul(g.noise(*T.at(2.2, 2.2, seed=2), detail=3, rough=0.5), 1.6)
    ph1 = g.frac(g.add(g.mul(T.v, 15.0), wv))
    ph2 = g.frac(g.add(g.add(g.mul(T.v, 11.0), g.mul(T.u, 5.0)), g.mul(wv, 0.8)))
    def prof(ph):                                                     # long gentle stoss side, short steep lee side
        return g.mul(g.sstep(0.0, 0.78, ph), g.sub(1.0, g.sstep(0.78, 1.0, ph)))
    zone = g.noise(*T.at(1.6, 1.6, seed=3), detail=2)
    m1 = g.sstep(0.40, 0.55, zone)
    m2 = g.mul(g.sub(1.0, g.sstep(0.45, 0.60, zone)), g.sstep(0.25, 0.4, zone))
    ripple = g.add(g.mul(prof(ph1), m1), g.mul(prof(ph2), m2))
    ph = g.lerp(ph2, ph1, m1)
    ripmask = g.clamp01(g.add(m1, m2))
    big = g.noise(*T.at(3.0, 3.0, seed=4, warp=warp, warp_amt=0.6), detail=4, rough=0.55)
    grain = g.noise(*T.at(260, 260, seed=5), detail=2, rough=0.7)
    clump = g.noise(*T.at(40, 40, seed=6), detail=3, rough=0.6)
    # rain-drop pits (small craters with a faint rim)
    pv, pw = T.at(55, 55, seed=7)
    pit = g.voronoi(pv, pw, scale=1.0, feature='F1')
    pr = pit.outputs['Distance']
    pit_on = g.sstep(0.45, 0.6, g.sepc(pit.outputs['Color'])[0])
    crater = g.mul(g.sub(1.0, g.sstep(0.05, 0.25, pr)), pit_on)
    rim = g.mul(g.mul(g.sstep(0.2, 0.28, pr), g.sub(1.0, g.sstep(0.28, 0.4, pr))), pit_on)
    h = g.add(g.mul(big, 0.45), g.mul(ripple, 0.30))
    h = g.add(h, g.mul(g.sub(clump, 0.5), 0.10))
    h = g.add(h, g.mul(g.sub(grain, 0.5), 0.06))
    h = g.sub(h, g.mul(crater, 0.09))
    h = g.add(h, g.mul(rim, 0.03))
    # standing water only in a few low zones: flatten + gloss
    wz = g.sstep(0.56, 0.62, g.noise(*T.at(1.3, 1.3, seed=8), detail=3))
    water_lvl = g.add(0.33, g.mul(wz, 0.06))
    water = g.mul(wz, g.sstep(0.0, 0.015, g.sub(water_lvl, h)))
    h = g.mx(h, g.mul(water_lvl, water))
    # colour: wet dark sand, lighter drier crests, dark heavy-mineral streaks in ripple troughs, shell grit
    dryness = g.clamp01(g.add(g.mul(g.sub(h, 0.42), 2.2), g.mul(g.sub(big, 0.5), 0.6)))
    wet_c = g.ramp(g.add(g.mul(clump, 0.6), g.mul(grain, 0.4)), [(0.25, (0.085, 0.070, 0.052)), (0.75, (0.135, 0.112, 0.084))])
    dry_c = g.ramp(grain, [(0.2, (0.26, 0.225, 0.175)), (0.8, (0.36, 0.315, 0.245))])
    col = g.mixc(wet_c, dry_c, g.mul(dryness, 0.55))
    trough = g.mul(g.mul(g.sub(1.0, g.sstep(0.0, 0.35, ph)), ripmask), g.sstep(0.5, 0.7, g.noise(*T.at(9, 9, seed=9), detail=3)))
    col = g.mixc(col, (0.028, 0.026, 0.024), g.mul(trough, 0.8))
    sv, sw = T.at(140, 140, seed=10)
    shell = g.voronoi(sv, sw, scale=1.0, feature='F1')
    sh_on = g.mul(g.sstep(0.93, 0.95, g.sepc(shell.outputs['Color'])[1]), g.sub(1.0, g.sstep(0.12, 0.2, shell.outputs['Distance'])))
    col = g.mixc(col, (0.42, 0.40, 0.37), sh_on)
    h = g.add(h, g.mul(sh_on, 0.04))
    col = g.mixc(col, g.mixc(col, (0.05, 0.045, 0.04), 1.0, 'MULTIPLY'), g.mul(water, 0.25))
    rough = g.lerp(g.lerp(0.40, 0.70, dryness), 0.05, water)
    rough = g.add(rough, g.mul(g.sub(grain, 0.5), 0.12))
    return dict(albedo=col, rough=rough, height=h)


@tex('beach_pebbles', tile=1.5, depth=0.05, desc='wet rounded beach pebbles/cobbles over coarse sand')
def beach_pebbles(g, T):
    def layer(k, seed, fill):
        vec, w = T.at(k, k, seed=seed)
        f = g.voronoi(vec, w, scale=1.0, feature='F1', rand=0.9)
        nr = g.voronoi(vec, w, scale=1.0, feature='N_SPHERE_RADIUS', rand=0.9).outputs['Radius']
        rnd = g.sepc(f.outputs['Color'])
        lu, lv = local_uv(g, T, vec, w, f)
        x, y = rotate2(g, lu, lv, g.mul(rnd[0], TAU))
        R = g.mul(nr, g.add(fill, g.mul(rnd[2], 0.25)))
        a = g.add(0.55, g.mul(rnd[1], 0.4))                             # ellipse aspect
        xn, yn = g.div(x, R), g.div(y, g.mul(R, a))
        d2 = g.add(g.mul(xn, xn), g.mul(yn, yn))
        dome = g.pow(g.clamp01(g.sub(1.0, d2)), 0.42)
        mask = g.sstep(0.0, 0.06, g.sub(1.0, d2))
        hgt = g.mul(dome, g.mul(R, 1.1))
        return hgt, mask, rnd
    sp = g.noise(*T.at(300, 300, seed=15), detail=1, rough=0.5)
    sand_n = g.noise(*T.at(120, 120, seed=14), detail=3, rough=0.7)
    def stone_col(r):
        base = g.ramp(r[1], [(0.0, (0.018, 0.018, 0.019)), (0.22, (0.045, 0.043, 0.041)), (0.42, (0.10, 0.088, 0.075)),
                             (0.6, (0.07, 0.07, 0.073)), (0.8, (0.17, 0.165, 0.155)), (1.0, (0.30, 0.29, 0.275))])
        speck = g.mul(g.sstep(0.64, 0.72, sp), g.sstep(0.5, 0.7, r[0]))
        return g.mixc(base, g.mixc(base, (0.45, 0.45, 0.45), 1.0, 'SCREEN'), g.mul(speck, 0.7))
    h = g.add(0.02, g.mul(sand_n, 0.03))
    col = g.ramp(sand_n, [(0.3, (0.06, 0.052, 0.042)), (0.7, (0.11, 0.095, 0.075))])
    rgh = g.add(0.55, g.mul(sand_n, 0.15))
    for k, seed, fill in ((22.0, 13, 0.95), (14.0, 11, 0.95), (9.0, 12, 0.92), (6.0, 16, 0.9)):
        hh, mm, rr = layer(k, seed, fill)
        t = g.mul(mm, g.sstep(-0.004, 0.004, g.sub(hh, h)))
        h = g.lerp(h, g.mx(h, hh), mm)
        col = g.mixc(col, stone_col(rr), t)
        rgh = g.lerp(rgh, g.add(0.14, g.mul(rr[0], 0.2)), t)
    micro = g.noise(*T.at(220, 220, seed=17), detail=2)
    h = g.add(h, g.mul(g.sub(micro, 0.5), 0.004))
    hn = g.remap(h, 0.0, 0.16)
    wet = g.sub(1.0, g.sstep(0.15, 0.45, hn))
    col = g.mixc(col, g.mixc(col, (0.6, 0.6, 0.6), 1.0, 'MULTIPLY'), wet)
    rgh = g.lerp(rgh, 0.12, g.mul(wet, 0.5))
    return dict(albedo=col, rough=rgh, height=hn)

@tex('forest_mud', tile=2.0, depth=0.035, desc='wet rainforest mud with layered leaf litter, twigs and puddles')
def forest_mud(g, T):
    warp = T.warp(3.0, 3.0, seed=20)
    mud_n = g.noise(*T.at(5.0, 5.0, seed=21, warp=warp, warp_amt=0.8), detail=6, rough=0.6)
    mud_f = g.noise(*T.at(60, 60, seed=22), detail=3, rough=0.6)
    h = g.add(g.mul(mud_n, 0.3), g.mul(g.sub(mud_f, 0.5), 0.06))
    col = g.ramp(g.add(g.mul(mud_n, 0.7), g.mul(mud_f, 0.3)),
                 [(0.25, (0.022, 0.015, 0.010)), (0.55, (0.045, 0.032, 0.020)), (0.8, (0.07, 0.052, 0.034))])
    rough = g.add(0.5, g.mul(mud_f, 0.2))
    # puddles in the mud
    pz = g.sstep(0.57, 0.63, g.noise(*T.at(1.5, 1.5, seed=23), detail=3))
    pl = g.add(0.16, g.mul(pz, 0.04))
    pud = g.mul(pz, g.sstep(0.0, 0.02, g.sub(pl, h)))
    # leaf / twig layers (bottom → top)
    layers = [(9.0, 30, 0.34, 0.40, False), (7.5, 31, 0.36, 0.42, False), (12.0, 32, 0.30, 0.38, False),
              (6.0, 33, 0.44, 0.045, True), (10.0, 34, 0.32, 0.40, False)]
    hl = h
    for i, (k, seed, L0, wid, twig) in enumerate(layers):
        vec, w = T.at(k, k, seed=seed)
        vor = g.voronoi(vec, w, scale=1.0, feature='F1', rand=1.0)
        rnd = g.sepc(vor.outputs['Color'])
        lu, lv = local_uv(g, T, vec, w, vor)
        x, y = rotate2(g, lu, lv, g.mul(rnd[0], TAU))
        L = g.mul(L0, g.add(0.7, g.mul(rnd[2], 0.6)))
        xn = g.div(x, L)
        yn = g.div(y, g.mul(L, wid))
        if twig:
            prof = g.sub(1.0, g.mul(xn, xn))
            inside = g.sub(prof, g.mul(g.absf(yn), 0.9))
            mask = g.mul(g.sstep(0.0, 0.08, inside), g.sstep(0.72, 0.8, rnd[1]))
            lc = g.ramp(rnd[2], [(0.0, (0.03, 0.02, 0.012)), (1.0, (0.10, 0.075, 0.05))])
            lh = g.add(0.55 + 0.05 * i, g.mul(g.sqrt(g.clamp01(g.sub(1.0, g.mul(yn, yn)))), 0.25))
            lr = 0.5
        else:
            prof = g.mul(g.sub(1.0, g.mul(xn, xn)), g.add(1.0, g.mul(xn, 0.25)))
            inside = g.sub(prof, g.absf(yn))
            present = g.sstep(0.18, 0.25, rnd[1])
            holes = g.sstep(0.62, 0.66, g.noise(*T.at(80, 80, seed=40 + i), detail=3))
            decay = g.sstep(0.6, 0.8, rnd[2])
            mask = g.mul(g.mul(g.sstep(0.0, 0.05, inside), present), g.sub(1.0, g.mul(holes, decay)))
            midrib = g.sub(1.0, g.sstep(0.0, 0.06, g.absf(yn)))
            veins = g.mul(g.sstep(0.85, 1.0, g.sin(g.mul(g.add(g.mul(xn, 6.0), g.mul(g.absf(yn), 2.5)), TAU))), 0.5)
            curl = g.mul(g.mul(yn, yn), 0.25)
            lh = g.add(0.42 + 0.06 * i, g.add(curl, g.mul(g.add(midrib, veins), 0.04)))
            mott = g.noise(*T.at(40, 40, seed=50 + i), detail=3)
            lc = g.ramp(g.add(g.mul(rnd[1], 0.8), g.mul(mott, 0.25)),
                        [(0.15, (0.018, 0.012, 0.007)), (0.35, (0.060, 0.024, 0.008)), (0.55, (0.13, 0.055, 0.014)),
                         (0.70, (0.20, 0.12, 0.03)), (0.85, (0.07, 0.065, 0.025)), (1.0, (0.035, 0.03, 0.02))])
            lc = g.mixc(lc, g.mixc(lc, (0.5, 0.45, 0.4), 1.0, 'MULTIPLY'), g.mul(midrib, 0.6))
            lr = g.add(0.42, g.mul(mott, 0.18))
        # sink leaves into puddles a bit (dimmer, flatter)
        col = g.mixc(col, lc, mask)
        hl = g.lerp(hl, g.mx(hl, lh), mask)
        rough = g.lerp(rough, lr, mask)
    h = hl
    water = g.mul(pud, g.sub(1.0, g.sstep(0.38, 0.45, h)))
    h = g.mx(h, g.mul(pl, water))
    col = g.mixc(col, g.mixc(col, (0.45, 0.42, 0.38), 1.0, 'MULTIPLY'), water)
    rough = g.lerp(rough, 0.04, water)
    return dict(albedo=col, rough=rough, height=h)


@tex('mossy_rock', tile=2.0, depth=0.07, desc='wet dark volcanic rock with moss cushions and lichen')
def mossy_rock(g, T):
    warp = T.warp(2.5, 2.5, seed=60)
    rv, rw = T.at(3.0, 3.0, seed=61, warp=warp, warp_amt=0.7)
    ridge = g.musgrave(rv, rw, kind='RIDGED_MULTIFRACTAL', scale=1.0, detail=7, dim=1.1, lac=2.1, offset=1.0, gain=2.4)
    ridge = g.remap(ridge, 0.0, 1.8)
    # chipped facets (planar per voronoi cell) at two scales
    def facets(k, seed, slope):
        vec, w = T.at(k, k, seed=seed, warp=warp, warp_amt=0.4)
        f = g.voronoi(vec, w, scale=1.0, feature='F1', rand=1.0)
        r = g.sepc(f.outputs['Color'])
        lu, lv = local_uv(g, T, vec, w, f)
        return g.add(g.mul(r[2], 0.4), g.add(g.mul(g.sub(r[0], 0.5), g.mul(lu, slope)), g.mul(g.sub(r[1], 0.5), g.mul(lv, slope))))
    fa = facets(5.0, 62, 2.2)
    fb = facets(14.0, 68, 1.6)
    e = g.voronoi(*T.at(5.0, 5.0, seed=62, warp=warp, warp_amt=0.4), scale=1.0, feature='DISTANCE_TO_EDGE')
    crack = g.mul(g.sub(1.0, g.sstep(0.0, 0.03, e.outputs['Distance'])), g.sstep(0.45, 0.6, g.noise(*T.at(4, 4, seed=69), detail=3)))
    fine = g.noise(*T.at(90, 90, seed=63), detail=4, rough=0.65)
    h = g.add(g.mul(ridge, 0.35), g.mul(fa, 0.25))
    h = g.add(h, g.mul(fb, 0.10))
    h = g.add(h, g.mul(g.noise(rv, rw, scale=1.0, detail=3), 0.25))
    h = g.sub(h, g.mul(crack, 0.12))
    h = g.add(h, g.mul(g.sub(fine, 0.5), 0.07))
    rock_c = g.ramp(g.add(g.mul(fine, 0.5), g.mul(ridge, 0.5)),
                    [(0.2, (0.022, 0.022, 0.023)), (0.5, (0.052, 0.050, 0.048)), (0.8, (0.09, 0.085, 0.078))])
    rock_c = g.mixc(rock_c, (0.010, 0.010, 0.010), g.mul(crack, 0.7))
    lv_, lw_ = T.at(30, 30, seed=64)
    li = g.voronoi(lv_, lw_, scale=1.0, feature='F1')
    lich = g.mul(g.sub(1.0, g.sstep(0.2, 0.4, li.outputs['Distance'])), g.sstep(0.7, 0.75, g.sepc(li.outputs['Color'])[0]))
    lich = g.mul(lich, g.sstep(0.45, 0.6, h))
    col = g.mixc(rock_c, (0.20, 0.21, 0.17), g.mul(lich, 0.85))
    rough = g.lerp(g.add(0.30, g.mul(fine, 0.18)), 0.65, lich)
    mn = g.noise(*T.at(4.0, 4.0, seed=65, warp=warp, warp_amt=0.5), detail=5, rough=0.6)
    mmask = g.sstep(0.50, 0.58, g.add(mn, g.mul(g.sub(h, 0.45), 0.35)))
    fuzz = g.noise(*T.at(220, 220, seed=66), detail=3, rough=0.7)
    clumps = g.noise(*T.at(26, 26, seed=67), detail=4, rough=0.6)
    moss_h = g.add(0.12, g.add(g.mul(clumps, 0.12), g.mul(fuzz, 0.05)))
    moss_c = g.ramp(g.add(g.mul(clumps, 0.6), g.mul(fuzz, 0.4)),
                    [(0.2, (0.012, 0.022, 0.006)), (0.5, (0.030, 0.052, 0.012)), (0.75, (0.065, 0.085, 0.020)), (1.0, (0.11, 0.12, 0.035))])
    h = g.add(h, g.mul(moss_h, mmask))
    col = g.mixc(col, moss_c, mmask)
    rough = g.lerp(rough, g.add(0.62, g.mul(fuzz, 0.2)), mmask)
    return dict(albedo=col, rough=rough, height=h)

@tex('cliff_rock', tile=4.0, depth=0.30, desc='layered sea-cliff rock: faceted fracture planes, strata ledges, wet run-off streaks')
def cliff_rock(g, T):
    warp = T.warp(1.5, 1.5, seed=70)
    # strata: integer layer count along v + periodic warp; layer id wrapped (floored modulo) so it tiles
    sv = g.add(g.mul(T.v, 7.0), g.mul(g.noise(*T.at(1.2, 1.2, seed=71), detail=4), 1.6))
    lay = g.frac(sv)
    lay_id = g.m('FLOORED_MODULO', g.floor(sv), 7.0)
    lay_r = per_index_rand(g, lay_id, 3.7)
    ledge = g.mul(g.sstep(0.80, 0.9, lay), g.sub(1.0, g.sstep(0.9, 1.0, lay)))
    def facets(ku, kv, seed, slope, wamt):
        vec, w = T.at(ku, kv, seed=seed, warp=warp, warp_amt=wamt)
        f = g.voronoi(vec, w, scale=1.0, feature='F1', rand=1.0)
        r = g.sepc(f.outputs['Color'])
        lu, lv = local_uv(g, T, vec, w, f)
        pl = g.add(g.mul(g.sub(r[0], 0.5), g.mul(lu, slope)), g.mul(g.sub(r[1], 0.5), g.mul(lv, slope)))
        return g.add(g.mul(r[2], 0.5), pl), f
    f1, v1 = facets(5.0, 3.0, 72, 2.4, 0.5)
    f2, v2 = facets(16.0, 11.0, 73, 2.0, 0.3)
    e = g.voronoi(*T.at(5.0, 3.0, seed=72, warp=warp, warp_amt=0.5), scale=1.0, feature='DISTANCE_TO_EDGE')
    crk_w = g.add(0.004, g.mul(g.noise(*T.at(8, 8, seed=77), detail=3), 0.022))
    crack = g.mul(g.sub(1.0, g.sstep(0.0, crk_w, e.outputs['Distance'])), g.sstep(0.42, 0.55, g.noise(*T.at(3, 3, seed=78), detail=3)))
    big = g.noise(*T.at(2.0, 2.0, seed=74, warp=warp, warp_amt=0.8), detail=6, rough=0.55)
    fine = g.noise(*T.at(110, 110, seed=75), detail=4, rough=0.65)
    h = g.add(g.mul(big, 0.30), g.mul(f1, 0.40))
    h = g.add(h, g.mul(f2, 0.16))
    h = g.add(h, g.mul(g.sstep(0.0, 0.8, lay), 0.12))
    h = g.add(h, g.mul(ledge, 0.06))
    h = g.sub(h, g.mul(crack, 0.10))
    h = g.add(h, g.mul(g.sub(fine, 0.5), 0.06))
    base = g.ramp(g.add(g.mul(lay_r, 0.5), g.mul(big, 0.5)),
                  [(0.1, (0.045, 0.042, 0.039)), (0.4, (0.085, 0.078, 0.070)), (0.65, (0.125, 0.115, 0.10)), (0.9, (0.075, 0.072, 0.07))])
    base = g.mixc(base, g.mixc(base, (1.35, 1.3, 1.25), 1.0, 'MULTIPLY'), g.mul(g.sub(g.sepc(v2.outputs['Color'])[0], 0.5), 0.6))
    base = g.mixc(base, g.mixc(base, (1.3, 1.25, 1.2), 1.0, 'MULTIPLY'), g.mul(g.sub(fine, 0.5), 0.9))
    base = g.mixc(base, (0.02, 0.019, 0.018), g.mul(crack, 0.6))
    streak = g.sstep(0.56, 0.7, g.noise(*T.at(26, 1.2, seed=76), detail=4, rough=0.6))
    col = g.mixc(base, g.mixc(base, (0.35, 0.35, 0.36), 1.0, 'MULTIPLY'), g.mul(streak, 0.8))
    col = g.mixc(col, (0.20, 0.20, 0.19), g.mul(g.mul(ledge, g.sstep(0.5, 0.65, fine)), 0.4))
    rough = g.add(0.55, g.mul(fine, 0.25))
    rough = g.lerp(rough, 0.22, streak)
    return dict(albedo=col, rough=rough, height=h)

@tex('tree_bark', tile=1.5, depth=0.045, desc='rainforest hardwood bark: interlaced vertical fissures, plates, lichen and moss')
def tree_bark(g, T):
    warp = T.warp(5.0, 1.2, seed=80)
    n1 = g.noise(*T.at(11.0, 1.7, seed=81, warp=warp, warp_amt=0.35), detail=3, rough=0.5)
    jit = g.noise(*T.at(70.0, 10.0, seed=87), detail=3, rough=0.6)
    fd = g.add(g.mul(g.absf(g.sub(n1, 0.5)), 2.0), g.mul(g.sub(jit, 0.5), 0.07))
    plates = g.sstep(0.0, 0.075, fd)                                  # deep vertical fissures (level set of n1)
    top = g.sstep(0.0, 0.35, fd)                                      # rounded plate profile
    n2 = g.noise(*T.at(2.5, 12.0, seed=82), detail=3, rough=0.5)
    brk = g.sub(1.0, g.mul(g.sub(1.0, g.sstep(0.0, 0.035, g.absf(g.sub(n2, 0.5)))), g.sstep(0.5, 0.62, g.noise(*T.at(6, 3, seed=88), detail=2))))
    solid = g.mul(plates, brk)
    fine = g.noise(*T.at(120, 40, seed=83), detail=4, rough=0.65)
    h = g.mul(solid, g.add(0.45, g.mul(top, 0.35)))
    h = g.add(h, g.mul(g.sub(fine, 0.5), 0.10))
    h = g.add(h, g.mul(g.noise(*T.at(3, 1.5, seed=84), detail=3), 0.15))
    tone = g.noise(*T.at(6, 2, seed=89), detail=4)
    col = g.ramp(g.add(g.mul(tone, 0.5), g.mul(fine, 0.5)),
                 [(0.2, (0.085, 0.075, 0.062)), (0.5, (0.15, 0.135, 0.115)), (0.8, (0.22, 0.20, 0.17))])
    col = g.mixc(col, (0.022, 0.018, 0.014), g.sub(1.0, solid))
    col = g.mixc(col, g.mixc(col, (0.6, 0.6, 0.6), 1.0, 'MULTIPLY'), g.sub(1.0, top))
    ln = g.noise(*T.at(8, 6, seed=85), detail=6, rough=0.65)
    lich = g.mul(g.sstep(0.6, 0.66, ln), solid)
    col = g.mixc(col, g.ramp(fine, [(0.3, (0.24, 0.25, 0.21)), (0.8, (0.36, 0.37, 0.31))]), lich)
    h = g.add(h, g.mul(lich, 0.03))
    mn = g.noise(*T.at(3, 2, seed=86), detail=4)
    moss = g.mul(g.sstep(0.6, 0.66, mn), g.sub(1.0, g.mul(top, 0.6)))
    col = g.mixc(col, (0.025, 0.045, 0.010), moss)
    rough = g.add(0.55, g.mul(fine, 0.25))
    rough = g.lerp(rough, 0.8, g.clamp01(g.add(lich, moss)))
    rough = g.lerp(rough, 0.4, g.sub(1.0, solid))
    return dict(albedo=col, rough=rough, height=h)

@tex('palm_bark', tile=1.0, depth=0.02, desc='coconut-palm trunk: leaf-scar rings, vertical fibres, algae')
def palm_bark(g, T):
    wob = g.noise(*T.at(3.0, 1.0, seed=90), detail=3)
    rv = g.add(g.mul(T.v, 12.0), g.mul(g.sub(wob, 0.5), 0.5))
    f = g.frac(rv)
    seg = g.pow(g.sin(g.mul(f, math.pi)), 0.45)                       # bulging segment
    groove = g.sub(1.0, g.sstep(0.0, 0.07, f))                          # crisp scar edge at f≈0
    lip = g.mul(g.sstep(0.88, 0.97, f), g.sub(1.0, g.sstep(0.97, 1.0, f)))
    fib = g.noise(*T.at(70, 3, seed=91), detail=4, rough=0.6)
    fib2 = g.noise(*T.at(200, 8, seed=92), detail=2, rough=0.6)
    cv, cw = T.at(34, 5, seed=93)
    cr = g.voronoi(cv, cw, scale=1.0, feature='DISTANCE_TO_EDGE')
    crack = g.mul(g.sub(1.0, g.sstep(0.0, 0.03, cr.outputs['Distance'])), g.sstep(0.4, 0.6, g.noise(*T.at(6, 4, seed=95), detail=2)))
    h = g.add(g.mul(seg, 0.5), g.mul(lip, 0.18))
    h = g.sub(h, g.mul(groove, 0.35))
    h = g.add(h, g.mul(g.sub(fib, 0.5), 0.22))
    h = g.add(h, g.mul(g.sub(fib2, 0.5), 0.08))
    h = g.sub(h, g.mul(crack, 0.08))
    col = g.ramp(g.add(g.mul(fib, 0.6), g.mul(fib2, 0.4)),
                 [(0.2, (0.060, 0.056, 0.050)), (0.5, (0.115, 0.108, 0.096)), (0.8, (0.18, 0.17, 0.15))])
    col = g.mixc(col, (0.025, 0.022, 0.020), g.mul(groove, 0.85))
    col = g.mixc(col, (0.22, 0.21, 0.19), g.mul(lip, 0.4))
    alg = g.sstep(0.55, 0.65, g.noise(*T.at(5, 3, seed=94), detail=5))
    col = g.mixc(col, g.mixc(col, (0.55, 0.75, 0.45), 1.0, 'MULTIPLY'), g.mul(alg, 0.7))
    rough = g.add(0.62, g.mul(fib2, 0.2))
    rough = g.lerp(rough, 0.42, groove)
    return dict(albedo=col, rough=rough, height=h)


@tex('wood_planks', tile=1.2, depth=0.010, desc='weathered boat planking: 6 boards, worn grain, chipped paint, rusty nails')
def wood_planks(g, T):
    N = 6.0
    vb = g.mul(T.v, N)
    b = g.floor(vb)
    vl = g.frac(vb)
    rb = per_index_rand(g, b, 1.0)
    rb2 = per_index_rand(g, b, 2.0)
    # butt joint per board
    ju = g.frac(g.sub(T.u, rb2))
    jd = g.mn(ju, g.sub(1.0, ju))
    joint = g.sub(1.0, g.sstep(0.0, 0.004, jd))
    seam = g.sub(1.0, g.sstep(0.0, 0.035, g.mn(vl, g.sub(1.0, vl))))
    bevel = g.sstep(0.0, 0.10, g.mn(vl, g.sub(1.0, vl)))
    # grain: domain shifted per board in w (still periodic along u)
    gv, gw = T.at(2.5, 70, seed=100)
    gw = g.add(gw, g.mul(rb, 37.0))
    gwarp = g.noise(gv, gw, scale=0.6, detail=3)
    gl = g.noise(gv, g.add(gw, g.mul(gwarp, 2.0)), scale=1.0, detail=6, rough=0.6)
    rings = g.frac(g.mul(gl, 9.0))
    ringl = g.sstep(0.75, 1.0, rings)
    fine = g.noise(*T.at(30, 300, seed=101), detail=3)
    h = g.mul(bevel, g.add(0.6, g.mul(rb, 0.1)))
    h = g.add(h, g.mul(ringl, 0.10))
    h = g.add(h, g.mul(g.sub(fine, 0.5), 0.06))
    h = g.sub(h, g.mul(joint, 0.4))
    wood = g.ramp(g.add(g.mul(gl, 0.6), g.mul(rb, 0.4)),
                  [(0.2, (0.050, 0.040, 0.030)), (0.5, (0.095, 0.080, 0.064)), (0.8, (0.15, 0.135, 0.115))])
    wood = g.mixc(wood, g.mixc(wood, (0.6, 0.58, 0.55), 1.0, 'MULTIPLY'), ringl)
    # chipped paint (more of it in the middle of boards, gone near seams)
    pn = g.noise(*T.at(9, 9, seed=102), detail=8, rough=0.62)
    pkeep = g.add(pn, g.mul(g.sub(bevel, 1.0), 0.25))
    paint = g.sstep(0.575, 0.59, pkeep)
    pdirt = g.noise(*T.at(25, 25, seed=103), detail=4)
    pcol = g.ramp(pdirt, [(0.2, (0.15, 0.155, 0.15)), (0.8, (0.26, 0.265, 0.25))])
    col = g.mixc(wood, pcol, paint)
    h = g.add(h, g.mul(paint, 0.05))
    # nails at joints + rust bleed
    nv = g.sub(1.0, g.sstep(0.012, 0.02, g.mn(g.absf(g.sub(vl, 0.3)), g.absf(g.sub(vl, 0.7)))))
    nail = g.mul(nv, g.sub(1.0, g.sstep(0.004, 0.009, g.absf(g.sub(jd, 0.015)))))
    rust = g.mul(g.sub(1.0, g.sstep(0.0, 0.05, jd)), g.sstep(0.45, 0.6, g.noise(*T.at(40, 10, seed=104), detail=3)))
    col = g.mixc(col, (0.09, 0.035, 0.012), g.mul(rust, 0.6))
    col = g.mixc(col, (0.04, 0.025, 0.018), nail)
    col = g.mixc(col, (0.010, 0.009, 0.008), g.mx(seam, joint))
    rough = g.add(0.62, g.mul(fine, 0.2))
    rough = g.lerp(rough, 0.38, paint)
    rough = g.lerp(rough, 0.9, g.mx(seam, joint))
    return dict(albedo=col, rough=rough, height=h)


@tex('wet_fabric', tile=0.25, depth=0.0015, desc='soaked canvas/sailcloth plain weave with stains and mildew')
def wet_fabric(g, T):
    n = 64.0
    un, vn = g.mul(T.u, n), g.mul(T.v, n)
    i, j = g.floor(un), g.floor(vn)
    tu, tv = g.frac(un), g.frac(vn)
    ti = per_index_rand(g, i, 5.0)
    tj = per_index_rand(g, j, 6.0)
    pw = g.pow(g.clamp01(g.sin(g.mul(tu, math.pi))), g.add(0.5, g.mul(ti, 0.3)))
    pf = g.pow(g.clamp01(g.sin(g.mul(tv, math.pi))), g.add(0.5, g.mul(tj, 0.3)))
    mw = g.sin(g.add(g.mul(vn, math.pi), g.mul(i, math.pi)))         # over/under along the warp
    mf = g.sin(g.add(g.mul(un, math.pi), g.mul(j, math.pi)))
    hw = g.mul(pw, g.add(0.55, g.mul(mw, 0.40)))
    hf = g.mul(pf, g.sub(0.55, g.mul(mf, 0.40)))
    top = g.sstep(-0.02, 0.02, g.sub(hw, hf))
    fibw = g.noise(*T.at(n * 6, n * 0.6, seed=110), detail=3)
    fibf = g.noise(*T.at(n * 0.6, n * 6, seed=111), detail=3)
    fib = g.lerp(fibf, fibw, top)
    h = g.add(g.mx(hw, hf), g.mul(g.sub(fib, 0.5), 0.15))
    stain = g.noise(*T.at(2.0, 2.0, seed=112), detail=6, rough=0.6)
    wet = g.sstep(0.42, 0.62, stain)
    mild = g.mul(g.sstep(0.66, 0.7, g.noise(*T.at(12, 12, seed=113), detail=4)), 0.8)
    thread_c = g.ramp(g.add(g.mul(fib, 0.5), g.mul(g.lerp(tj, ti, top), 0.5)),
                      [(0.2, (0.20, 0.18, 0.15)), (0.8, (0.32, 0.29, 0.245))])
    col = g.mixc(thread_c, g.mixc(thread_c, (0.42, 0.40, 0.37), 1.0, 'MULTIPLY'), wet)
    col = g.mixc(col, (0.04, 0.045, 0.035), mild)
    gap = g.sub(1.0, g.sstep(0.05, 0.35, g.mx(hw, hf)))
    col = g.mixc(col, g.mixc(col, (0.3, 0.3, 0.3), 1.0, 'MULTIPLY'), gap)
    rough = g.lerp(0.88, 0.55, wet)
    rough = g.add(rough, g.mul(g.sub(fib, 0.5), 0.1))
    return dict(albedo=col, rough=rough, height=h)


@tex('rope', tile=0.25, depth=0.008, desc='three-strand hemp rope (u along the rope, v around it), wet')
def rope(g, T):
    ph = g.add(g.mul(T.v, 3.0), g.mul(T.u, 5.0))                      # 3 strands around × 5 twists per tile
    f = g.frac(ph)
    strand = g.pow(g.clamp01(g.sin(g.mul(f, math.pi))), 0.35)
    yarn = g.add(g.mul(T.v, 27.0), g.mul(T.u, -16.0))                 # yarns twisted the other way inside strands
    yarnl = g.pow(g.clamp01(g.sin(g.mul(g.frac(yarn), math.pi))), 0.6)
    fib = g.noise(*T.at(220, 90, seed=120), detail=3, rough=0.6)
    hairs = g.sstep(0.62, 0.75, g.noise(*T.at(400, 160, seed=122), detail=2))
    h = g.add(g.mul(strand, 0.7), g.mul(g.mul(yarnl, strand), 0.22))
    h = g.add(h, g.mul(g.sub(fib, 0.5), 0.12))
    stain = g.noise(*T.at(3, 3, seed=121), detail=4)
    col = g.ramp(g.add(g.mul(fib, 0.5), g.mul(stain, 0.5)), [(0.2, (0.07, 0.056, 0.038)), (0.8, (0.19, 0.155, 0.11))])
    col = g.mixc(col, g.mixc(col, (0.25, 0.25, 0.25), 1.0, 'MULTIPLY'), g.sub(1.0, g.sstep(0.0, 0.5, g.mul(strand, g.add(0.6, g.mul(yarnl, 0.4))))))
    col = g.mixc(col, (0.26, 0.23, 0.18), g.mul(hairs, 0.5))
    rough = g.add(0.62, g.mul(fib, 0.2))
    return dict(albedo=col, rough=rough, height=h)

@tex('driftwood', tile=1.0, depth=0.012, desc='sun-bleached, sea-worn driftwood: deep grain grooves and checking cracks')
def driftwood(g, T):
    warp = T.warp(2.0, 6.0, seed=130)
    gv, gw = T.at(2.0, 40, seed=131, warp=warp, warp_amt=0.6)
    gl = g.noise(gv, gw, scale=1.0, detail=6, rough=0.55)
    rings = g.frac(g.mul(gl, 7.0))
    groove = g.sub(1.0, g.sstep(0.0, 0.25, g.mn(rings, g.sub(1.0, rings))))
    cv, cw = T.at(1.6, 9.0, seed=132, warp=warp, warp_amt=0.3)
    ck = g.voronoi(cv, cw, scale=1.0, feature='DISTANCE_TO_EDGE')
    crack = g.mul(g.sub(1.0, g.sstep(0.0, 0.03, ck.outputs['Distance'])), g.sstep(0.4, 0.55, g.noise(*T.at(3, 6, seed=133), detail=2)))
    fine = g.noise(*T.at(20, 260, seed=134), detail=3)
    h = g.sub(0.6, g.mul(groove, 0.25))
    h = g.add(h, g.mul(g.sub(fine, 0.5), 0.1))
    h = g.add(h, g.mul(g.noise(*T.at(2, 3, seed=135), detail=3), 0.2))
    h = g.sub(h, g.mul(crack, 0.45))
    col = g.ramp(g.add(g.mul(gl, 0.5), g.mul(fine, 0.5)),
                 [(0.2, (0.13, 0.125, 0.115)), (0.5, (0.22, 0.21, 0.195)), (0.8, (0.32, 0.31, 0.29))])
    col = g.mixc(col, (0.05, 0.045, 0.04), g.mul(groove, 0.5))
    col = g.mixc(col, (0.012, 0.011, 0.010), crack)
    damp = g.sstep(0.5, 0.7, g.noise(*T.at(2.5, 2.5, seed=136), detail=4))
    col = g.mixc(col, g.mixc(col, (0.45, 0.45, 0.45), 1.0, 'MULTIPLY'), damp)
    rough = g.lerp(0.78, 0.45, damp)
    rough = g.add(rough, g.mul(fine, 0.1))
    return dict(albedo=col, rough=rough, height=h)


# ───────────────────────────────────────────── bake driver ─────────────────────────────────────────
def bake_set(name):
    meta = META[name]
    reset_scene()
    world_color((0, 0, 0), 0)
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    uvl = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        for l in f.loops:
            l[uvl].uv = (l.vert.co.x + 0.5, l.vert.co.y + 0.5)
    ob = mesh_obj('plane_' + name, bm)
    mat, nt, g = new_material('M_' + name)
    T = Torus(g)
    outs = meta['fn'](g, T)
    emi = g.node('ShaderNodeEmission')
    emi.inputs['Strength'].default_value = 1.0
    out = g.node('ShaderNodeOutputMaterial')
    nt.links.new(emi.outputs[0], out.inputs['Surface'])
    ob.data.materials.append(mat)
    for pas in ('albedo', 'rough', 'height'):
        for l in list(emi.inputs['Color'].links):
            nt.links.remove(l)
        g.set(emi.inputs['Color'], outs[pas])
        img = new_float_image(f'{name}_{pas}', RES)
        t0 = time.time()
        bake(ob, img, 'EMIT', samples=1, margin=0)
        dump_raw(img, os.path.join(BUILD, f'tex_{name}_{pas}.f32'))
        log(f'{name}/{pas} baked in {time.time() - t0:.1f}s')
        bpy.data.images.remove(img)
    with open(os.path.join(BUILD, f'tex_{name}.json'), 'w') as f:
        json.dump({k: v for k, v in meta.items() if k != 'fn'} | {'res': RES}, f)


if __name__ == '__main__':
    names = script_args() or list(META)
    T0 = time.time()
    for n in names:
        bake_set(n)
    log(f'all done in {time.time() - T0:.1f}s')
