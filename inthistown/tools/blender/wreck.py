# tools/blender/wreck.py — wrecked wooden boat + beach debris (planks, crate, rope coil, driftwood).
#
#   blender -b --python tools/blender/wreck.py -- [wreck_boat] [planks] [crate] [rope_coil] [driftwood_logs] [--preview]
#   → src/real/assets/glb/<name>.glb (tileable sets referenced as ../tex/*.png)
#
# The boat is generated from a hull surface P(x, s) (x along the boat, s keel→sheer): carvel strakes are thick
# strips between s-bounds with board-aligned UVs (one painted board of wood_planks per strake), broken where the
# hull is breached (jagged per-column splinter ends), steam-bent ribs follow the inner section, plus keel/stem,
# transom, gunwales, thwarts, a snapped mast with a splintered top, a draped soaked sail and a rope.
# The finished boat is rolled onto its side and sunk into the sand: origin = ground level (y = 0 in glTF).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_common import *
import vegetation as V

TM = V.TEXMETA


def wood_mats():
    V._mats.clear()
    for k in ('wood_planks', 'driftwood', 'wet_fabric', 'rope', 'palm_bark', 'tree_bark'):
        V._mats[k] = pbr_material('M_' + k, V.T(k, 'color'), normal=V.T(k, 'normal'), orm=V.T(k, 'orm'), double_sided=(k == 'wet_fabric'))
    V._mats['iron'] = pbr_material('M_rust_iron', (0.05, 0.025, 0.012), roughness_value=0.75)


def tube_l(mb, pts, rfn, sides, key, tile, u_tiles=1, rmod=None, cap0=False, cap1=False, jag=None, rng=None):
    """tube whose grain runs along the length (u = length / tile, v around), optional jagged (splintered) ends."""
    fr = V.frames(pts)
    L = [0.0]
    for i in range(1, len(pts)):
        L.append(L[-1] + (pts[i] - pts[i - 1]).length)
    rows, uvr = [], []
    for i, p in enumerate(pts):
        t = L[i] / L[-1]
        _, n, b = fr[i]
        row, uvrow = [], []
        for j in range(sides + 1):
            a = TAU * j / sides
            rr = rfn(i, t) * (rmod(i, t, a) if rmod else 1.0)
            q = p + (n * math.cos(a) + b * math.sin(a)) * rr
            if jag and (i == 0 or i == len(pts) - 1):
                tdir = fr[i][0] * (1 if i else -1)
                q += tdir * jag * rng.uniform(0.0, 1.0) * (0.3 + 0.7 * abs(math.sin(a * 2.5 + i)))
            row.append(q)
            uvrow.append((L[i] / tile, u_tiles * j / sides))
        rows[len(rows):] = [row]
        uvr.append(uvrow)
    for j in range(sides):   # duplicate seam vertex already present (sides+1)
        pass
    vr = mb.grid(rows, uvr, key)
    for end, cap in ((0, cap0), (-1, cap1)):
        if cap:
            c = mb.bm.verts.new(pts[end] + (fr[end][0] * (0.3 * rfn(0, 0) if jag else 0) * (1 if end else -1)))
            for j in range(sides):
                vs = [vr[end][j], vr[end][j + 1], c] if end else [vr[end][j + 1], vr[end][j], c]
                f = mb.bm.faces.new(vs)
                f.material_index = mb.mi(key)
                for lp, uv in zip(f.loops, [(0.0, j / sides * 0.3), (0.0, (j + 1) / sides * 0.3), (0.12, 0.15)]):
                    lp[mb.uv].uv = uv
    return vr


def box_beam(mb, a, b, w, h, key, tile, up=Vector((0, 0, 1))):
    """rectangular beam from a to b (w across, h along `up`), UV along the length."""
    d = (b - a)
    L = d.length
    d.normalize()
    side = d.cross(up).normalized()
    u2 = side.cross(d).normalized()
    corners = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
    ra = [a + side * (cx * w / 2) + u2 * (cy * h / 2) for cx, cy in corners]
    rb = [b + side * (cx * w / 2) + u2 * (cy * h / 2) for cx, cy in corners]
    va = [mb.bm.verts.new(p) for p in ra]
    vb = [mb.bm.verts.new(p) for p in rb]
    for k in range(4):
        k2 = (k + 1) % 4
        mb.quad([va[k], va[k2], vb[k2], vb[k]], [(0, k * 0.05), (0, k2 * 0.05 + 0.05 * (k2 == 0) * 4), (L / tile, k2 * 0.05), (L / tile, k * 0.05)], key, smooth=False)
    mb.quad([va[3], va[2], va[1], va[0]], [(0, 0), (0.05, 0), (0.05, 0.05), (0, 0.05)], key, smooth=False)
    mb.quad([vb[0], vb[1], vb[2], vb[3]], [(0, 0), (0.05, 0), (0.05, 0.05), (0, 0.05)], key, smooth=False)


def board(mb, rng, corner_fn, nx, nc, thick, key, u0, u_scale, vband, jag0=0.0, jag1=0.0, normal_fn=None, smooth=True):
    """thick board over a parametric patch corner_fn(a, c) → Vector, a ∈ [0,1] along, c ∈ [0,1] across.
    vband = (v0, v1) texture band across the board; jag0/jag1 = splinter length at the two ends."""
    off0 = [rng.uniform(0, 1) * jag0 * (0.25 + 0.75 * abs(math.sin(k * 2.3 + 1))) for k in range(nc + 1)]
    off1 = [rng.uniform(0, 1) * jag1 * (0.25 + 0.75 * abs(math.sin(k * 1.7 + 2))) for k in range(nc + 1)]
    outer, inner, uvs = [], [], []
    for i in range(nx + 1):
        a = i / nx
        ro, ri, ru = [], [], []
        for k in range(nc + 1):
            c = k / nc
            aa = a
            if jag0 and i == 0:
                aa = a + off0[k] * (1 if k % 2 == 0 else 0.35)
            if jag1 and i == nx:
                aa = a - off1[k] * (1 if k % 2 == 0 else 0.35)
            p = corner_fn(aa, c)
            n = normal_fn(aa, c) if normal_fn else Vector((0, 0, 1))
            ro.append(p)
            ri.append(p - n * thick)
            ru.append((u0 + aa * u_scale, vband[0] + c * (vband[1] - vband[0])))
        outer.append(ro); inner.append(ri); uvs.append(ru)
    vo = [[mb.bm.verts.new(p) for p in r] for r in outer]
    vi = [[mb.bm.verts.new(p) for p in r] for r in inner]
    for i in range(nx):
        for k in range(nc):
            mb.quad([vo[i][k], vo[i + 1][k], vo[i + 1][k + 1], vo[i][k + 1]], [uvs[i][k], uvs[i + 1][k], uvs[i + 1][k + 1], uvs[i][k + 1]], key, smooth)
            mb.quad([vi[i][k + 1], vi[i + 1][k + 1], vi[i + 1][k], vi[i][k]], [uvs[i][k + 1], uvs[i + 1][k + 1], uvs[i + 1][k], uvs[i][k]], key, smooth)
    dv = (vband[1] - vband[0]) * 0.15
    for i in range(nx):   # long edges
        for k, s in ((0, -1), (nc, 1)):
            q = [vo[i][k], vi[i][k], vi[i + 1][k], vo[i + 1][k]] if s < 0 else [vo[i + 1][k], vi[i + 1][k], vi[i][k], vo[i][k]]
            uu = [uvs[i][k], (uvs[i][k][0], uvs[i][k][1] + dv), (uvs[i + 1][k][0], uvs[i + 1][k][1] + dv), uvs[i + 1][k]]
            mb.quad(q, uu if s < 0 else uu[::-1], key, False)
    for i, s in ((0, -1), (nx, 1)):   # end grain
        for k in range(nc):
            q = [vo[i][k + 1], vi[i][k + 1], vi[i][k], vo[i][k]] if s < 0 else [vo[i][k], vi[i][k], vi[i][k + 1], vo[i][k + 1]]
            mb.quad(q, [(0.3, 0.1), (0.31, 0.1), (0.31, 0.12), (0.3, 0.12)], key, False)


# ───────────────────────────────────────────── boat ────────────────────────────────────────────────
LB, B0, D = 5.0, 0.80, 0.72     # length, half beam, depth amidships


def hull_P(x, s, side):
    xn = x / (LB / 2)
    if xn >= 0:
        B = B0 * max(0.0, 1 - xn ** 2) ** 0.55
    else:
        B = B0 * (1 - 0.33 * xn ** 2)
    zk = 0.22 * max(0.0, xn) ** 2.6 + 0.05 * max(0.0, -xn) ** 2
    zs = D + 0.16 * xn ** 2 + 0.05 * max(0.0, xn) ** 3
    y = B * math.sin(math.pi / 2 * s) ** 0.85
    z = zk + (zs - zk) * (1 - math.cos(math.pi / 2 * s)) ** 0.95
    return Vector((x, side * y, z))


def hull_N(x, s, side):
    e = 1e-3
    px = hull_P(x + e, s, side) - hull_P(x - e, s, side)
    ps = hull_P(x, min(1, s + e), side) - hull_P(x, max(0, s - e), side)
    n = px.cross(ps).normalized() * side
    return n if n.y * side >= -0.2 else -n


def wreck_boat(name='wreck_boat', seed=501):
    rng = random.Random(seed)
    wood_mats()
    mb = V.MB(name)
    tile = TM['wood_planks']['tile_m']
    NS = 9
    x0, x1 = -LB / 2 + 0.02, LB / 2 - 0.06
    # breach on the starboard (upper, exposed) side; a smaller one on port
    breach = {1: (-0.6, 1.1, 3, 7), -1: (0.4, 1.0, 2, 4)}
    for side in (-1, 1):
        for k in range(NS):
            s0, s1 = k / NS, (k + 1) / NS - 0.004
            vb = rng.randint(0, 5)
            vband = (vb / 6 + 0.01, (vb + 1) / 6 - 0.01)
            segs = [(x0, x1, 0.0, 0.0)]
            bx0, bx1, k0, k1 = breach[side]
            if k0 <= k <= k1:
                cut0 = bx0 + rng.uniform(-0.25, 0.25)
                cut1 = bx1 + rng.uniform(-0.25, 0.25)
                segs = [(x0, cut0, 0.0, 0.14), (cut1, x1, 0.14, 0.0)]
                if side == 1 and k in (k0 + 1, k1 - 1) and rng.random() < 0.6:   # a dangling broken plank
                    segs.append((cut0 + 0.25, cut0 + 0.25 + rng.uniform(0.5, 0.9), 0.12, 0.16))
            for (a0, a1, j0, j1) in segs:
                if a1 - a0 < 0.15:
                    continue
                nx = max(3, int((a1 - a0) / 0.2))
                droop = 0.0
                if j0 > 0 and j1 > 0:
                    droop = rng.uniform(0.08, 0.2)

                def cf(a, c, a0=a0, a1=a1, s0=s0, s1=s1, side=side, droop=droop):
                    x = a0 + (a1 - a0) * a
                    p = hull_P(x, s0 + (s1 - s0) * c, side)
                    if droop:
                        p += hull_N(x, s0, side) * droop * a * a
                    return p

                def nf(a, c, a0=a0, a1=a1, s0=s0, s1=s1, side=side):
                    return hull_N(a0 + (a1 - a0) * a, s0 + (s1 - s0) * c, side)
                key = 'wood_planks' if k >= 5 else 'driftwood'          # paint remnants only on the upper strakes
                if key == 'driftwood':
                    vband = (rng.uniform(0, 0.8), 0.0)
                    vband = (vband[0], vband[0] + 0.12)
                board(mb, rng, cf, nx, 2, 0.022, key, a0 / tile, (a1 - a0) / tile, vband,
                      jag0=j0 / max(0.3, a1 - a0), jag1=j1 / max(0.3, a1 - a0), normal_fn=nf)
    # transom (stern board) with a cracked corner
    def tcf(a, c):
        s = a
        p = hull_P(-LB / 2 + 0.02, s, -1 + 2 * c)
        return p
    for half in (-1, 1):
        def tcf2(a, c, half=half):
            pl = hull_P(-LB / 2 + 0.02, a, half)
            return Vector((pl.x, pl.y * c, pl.z))
        board(mb, rng, tcf2, 6, 2, 0.04, 'wood_planks', 0.2, 0.5, (0.34, 0.49), normal_fn=lambda a, c: Vector((1, 0, 0)))
    # keel + stem post
    kp = [hull_P(x, 0.0, 1) - Vector((0, 0, 0.05)) for x in [x0 + (x1 + 0.12 - x0) * i / 18 for i in range(19)]]
    kp += [hull_P(x1 + 0.06, 0.0, 1) + Vector((0.05 * i, 0, 0.11 * i + 0.1)) for i in range(1, 8)]
    tube_l(mb, kp, lambda i, t: 0.055, 4, 'driftwood', TM['driftwood']['tile_m'], rmod=lambda i, t, a: 1.0)
    # ribs (frames) every ~0.36 m, some broken
    for xi in range(12):
        x = -LB / 2 + 0.35 + xi * 0.36
        if x > LB / 2 - 0.4:
            break
        for side in (-1, 1):
            smax = 1.0
            if side == 1 and -0.6 < x < 1.1 and rng.random() < 0.7:
                smax = rng.uniform(0.25, 0.6)          # snapped rib in the breach
            pts = [hull_P(x, s, side) - hull_N(x, s, side) * 0.045 for s in [smax * i / 10 for i in range(11)]]
            tube_l(mb, pts, lambda i, t: 0.028, 4, 'driftwood', TM['driftwood']['tile_m'], jag=0.04 if smax < 1 else None,
                   rng=rng, rmod=lambda i, t, a: 1.0 + 0.25 * math.cos(2 * a))
    # gunwales (rails)
    for side in (-1, 1):
        rp = [hull_P(x, 1.0, side) + Vector((0, 0, 0.02)) for x in [x0 + (x1 - x0) * i / 24 for i in range(25)]]
        if side == 1:
            rp = rp[:9] + rp[15:]
            tube_l(mb, rp[:9], lambda i, t: 0.035, 4, 'driftwood', 1.0, jag=0.08, rng=rng, cap1=True)
            tube_l(mb, rp[9:], lambda i, t: 0.035, 4, 'driftwood', 1.0, jag=0.08, rng=rng, cap0=True)
        else:
            tube_l(mb, rp, lambda i, t: 0.035, 4, 'driftwood', 1.0)
    # thwarts (seats): forward one intact (mast step), aft one broken & tilted
    for x, broken in ((0.9, False), (-0.9, True)):
        pl, pr = hull_P(x, 0.78, -1), hull_P(x, 0.78, 1)
        if broken:
            pr = pr.lerp(pl, 0.45) + Vector((0.05, 0, -0.22))
        def cf(a, c, pl=pl, pr=pr, x=x):
            p = pl.lerp(pr, a)
            return p + Vector((c * 0.22 - 0.11, 0, 0))
        board(mb, rng, cf, 4, 1, 0.035, 'wood_planks', 0.1, 0.9, (0.0, 0.16), jag1=0.12 if broken else 0.0,
              normal_fn=lambda a, c: Vector((0, 0, 1)))
    # snapped mast stub at the forward thwart, splintered top
    mbase = hull_P(0.9, 0.0, 1)
    mtop = Vector((0.9, 0.0, D + 0.75))
    mp = [mbase.lerp(mtop, i / 8) for i in range(9)]
    tube_l(mb, mp, lambda i, t: 0.06 * (1 - 0.1 * t), 8, 'driftwood', 1.0, jag=0.22, rng=rng, cap1=True)
    # soaked sail draped over the starboard gunwale (fabric with folds)
    sail_rows, sail_uv = [], []
    for i in range(13):
        a = i / 12
        row, ur = [], []
        for j in range(11):
            c = j / 10
            x = -0.3 + 1.6 * a
            base = hull_P(x, 1.0, 1) + Vector((0, 0, 0.04))
            # inside the boat for c<0.45, over the rail and hanging outside for c>0.45
            if c < 0.45:
                p = base + Vector((0, -(0.45 - c) * 1.3, -(0.45 - c) * 0.55))
            else:
                p = base + Vector((0, (c - 0.45) * 0.35, -(c - 0.45) * 1.25))
            fold = 0.05 * math.sin(a * 13 + c * 3) + 0.03 * noise.noise(Vector((a * 4, c * 4, 2.0)))
            p += Vector((0.0, fold, fold * 0.5))
            row.append(p)
            ur.append((a * 1.6 / 0.25 * 0.25, c * 1.4 / 0.25 * 0.25))
        sail_rows.append(row); sail_uv.append(ur)
    mb.grid(sail_rows, sail_uv, 'wet_fabric')
    # rope from the mast stub over the side into the sand
    rp = [mtop - Vector((0, 0, 0.25)), mtop + Vector((0.1, 0.3, -0.35)), hull_P(1.4, 1.0, 1) + Vector((0, 0.05, 0.06)),
          hull_P(1.5, 1.0, 1) + Vector((0, 0.35, -0.4)), hull_P(1.6, 1.0, 1) + Vector((0, 0.7, -0.75))]
    rp = [rp[0].lerp(rp[1], t) for t in (0, .5)] + [rp[1].lerp(rp[2], t) for t in (0, .33, .66)] + [rp[2].lerp(rp[3], t) for t in (0, .5)] + [rp[3].lerp(rp[4], t) for t in (0, .5, 1)]
    for i in range(1, len(rp) - 1):
        rp[i] = rp[i] + Vector((0, 0, -0.04 * math.sin(i)))
    tube_l(mb, rp, lambda i, t: 0.014, 6, 'rope', TM['rope']['tile_m'])
    ob = mb.finish()
    shade_smooth(ob, True, auto_angle=40)
    # roll onto its port side (breached starboard side facing the sky), slight pitch, sink into the sand
    ob.rotation_euler = (math.radians(56), math.radians(-5), math.radians(0))   # starboard (breached) side up
    apply_transform(ob)
    zs = [v.co.z for v in ob.data.vertices]
    for v in ob.data.vertices:
        v.co.z -= min(zs) + 0.42                                                  # port side half-buried
    # broken mast piece lying in the sand beside the boat (separate node)
    mb2 = V.MB('wreck_mast')
    mp2 = [Vector((0, 0, 0)) + Vector((2.9 * i / 10, 0.04 * math.sin(i), 0)) for i in range(11)]
    tube_l(mb2, mp2, lambda i, t: 0.058 * (1 - 0.15 * t), 8, 'driftwood', 1.0, jag=0.25, rng=rng, cap0=True, cap1=True)
    box_beam(mb2, Vector((2.2, -0.05, 0.05)), Vector((2.25, -0.65, 0.07)), 0.05, 0.04, 'driftwood', 1.0)  # cleat/spar stub
    mast = mb2.finish()
    shade_smooth(mast, True, auto_angle=40)
    mast.location = (-1.2, 1.55, 0.035)
    mast.rotation_euler = (0, 0, math.radians(-18))
    apply_transform(mast, loc=True)
    return [ob, mast]


# ───────────────────────────────────────────── debris ──────────────────────────────────────────────
def plank_piece(mb, rng, L, W, T_, ox, oy, rotz, jag0=0.0, jag1=0.0, warp=0.02, vb=None, key='wood_planks'):
    tile = TM['wood_planks']['tile_m']
    vb = rng.randint(0, 5) if vb is None else vb
    c, s_ = math.cos(rotz), math.sin(rotz)

    def cf(a, cc):
        x = (a - 0.5) * L
        y = (cc - 0.5) * W
        z = T_ + warp * math.sin(a * math.pi) + 0.01 * noise.noise(Vector((a * 3, cc * 2, ox)))
        return Vector((ox + x * c - y * s_, oy + x * s_ + y * c, z))
    board(mb, rng, cf, max(3, int(L / 0.25)), 2, T_, key, rng.uniform(0, 2), L / (tile * 0.6), (vb / 6 + 0.01, (vb + 1) / 6 - 0.01),
          jag0=jag0 / L, jag1=jag1 / L)


def planks(seed=601):
    rng = random.Random(seed)
    wood_mats()
    objs = []
    for nm, args in (('plank_long', (2.4, 0.2, 0.025, 0, 0, 0.0, 0.0, 0.0, 0.03)),
                     ('plank_broken', (1.3, 0.19, 0.025, 0, 0, 0.0, 0.0, 0.18, 0.02)),
                     ('plank_splintered', (0.9, 0.18, 0.022, 0, 0, 0.0, 0.16, 0.2, 0.01)),
                     ('plank_short', (0.65, 0.2, 0.025, 0, 0, 0.0, 0.05, 0.0, 0.0))):
        mb = V.MB(nm)
        L, W, T_, ox, oy, rz, j0, j1, wp = args
        plank_piece(mb, rng, L, W, T_, ox, oy, rz, j0, j1, wp)
        objs.append(mb.finish())
    # hull fragment: 3 planks still nailed to two rib stubs
    mb = V.MB('hull_fragment')
    for k in range(3):
        plank_piece(mb, rng, 1.25 + rng.uniform(-0.2, 0.2), 0.14, 0.022, rng.uniform(-0.08, 0.08), k * 0.142, 0.0,
                    rng.uniform(0, 0.15), rng.uniform(0.05, 0.2), 0.04)
    for x in (-0.35, 0.3):
        box_beam(mb, Vector((x, -0.12, 0.012)), Vector((x + 0.02, 0.45, 0.012)), 0.045, 0.03, 'driftwood', 1.0)
    objs.append(mb.finish())
    # spread them out side by side (each keeps its own origin at its centre)
    for i, o in enumerate(objs):
        shade_smooth(o, True, auto_angle=40)
        cx = sum((v.co for v in o.data.vertices), Vector()) / len(o.data.vertices)
        for v in o.data.vertices:
            v.co -= Vector((cx.x, cx.y, 0))
        o.location = (0, i * 0.6, 0)
    return objs


def crate(seed=701):
    rng = random.Random(seed)
    wood_mats()
    mb = V.MB('crate')
    W_, Dp, H = 0.62, 0.46, 0.44
    t = 0.018
    nb = 3
    # side boards
    for face, (ax, n) in enumerate(((Vector((1, 0, 0)), Vector((0, -1, 0))), (Vector((1, 0, 0)), Vector((0, 1, 0))),
                                    (Vector((0, 1, 0)), Vector((-1, 0, 0))), (Vector((0, 1, 0)), Vector((1, 0, 0))))):
        span = W_ if face < 2 else Dp
        off = (Dp if face < 2 else W_) / 2
        for k in range(nb):
            if face == 1 and k == 2:
                continue                                    # missing board
            z0 = k * (H / nb) + 0.008
            z1 = (k + 1) * (H / nb) - 0.008
            broken = face == 0 and k == 1
            def cf(a, c, ax=ax, n=n, span=span, off=off, z0=z0, z1=z1):
                return ax * ((a - 0.5) * span) + n * off + Vector((0, 0, z0 + (z1 - z0) * c))
            board(mb, rng, cf, 3, 1, t, 'wood_planks', rng.uniform(0, 2), span / 0.72, ((k + 1) / 6 + 0.01, (k + 2) / 6 - 0.01),
                  jag1=0.22 if broken else 0.0, normal_fn=lambda a, c, n=n: n)
    # lid boards (one ajar)
    for k in range(4):
        y0 = -Dp / 2 + k * Dp / 4 + 0.006
        y1 = y0 + Dp / 4 - 0.012
        lift = 0.0 if k != 3 else 1.0
        def cf(a, c, y0=y0, y1=y1, lift=lift):
            return Vector(((a - 0.5) * (W_ + 0.02), y0 + (y1 - y0) * c, H + 0.005 + lift * (0.06 + a * 0.12)))
        board(mb, rng, cf, 3, 1, t, 'wood_planks', rng.uniform(0, 2), W_ / 0.72, (0.5 + 0.01, 0.666 - 0.01),
              normal_fn=lambda a, c: Vector((0, 0, 1)))
    # corner posts + base battens
    for sx in (-1, 1):
        for sy in (-1, 1):
            box_beam(mb, Vector((sx * (W_ / 2 - 0.025), sy * (Dp / 2 - 0.025), 0)), Vector((sx * (W_ / 2 - 0.025), sy * (Dp / 2 - 0.025), H)),
                     0.04, 0.04, 'driftwood', 1.0, up=Vector((1, 0, 0)))
    for sy in (-1, 1):
        box_beam(mb, Vector((-W_ / 2, sy * (Dp / 2 - 0.04), 0.0)), Vector((W_ / 2, sy * (Dp / 2 - 0.04), 0.0)), 0.06, 0.03, 'driftwood', 1.0)
    ob = mb.finish()
    shade_smooth(ob, False)
    ob.rotation_euler = (math.radians(4), math.radians(-6), math.radians(20))
    apply_transform(ob)
    zs = [v.co.z for v in ob.data.vertices]
    for v in ob.data.vertices:
        v.co.z -= min(zs) + 0.04
    return [ob]


def rope_coil(seed=801):
    rng = random.Random(seed)
    wood_mats()
    mb = V.MB('rope_coil')
    r = 0.016
    pts = []
    turns = 4.2
    n = 150
    for i in range(n + 1):
        t = i / n
        a = t * turns * TAU
        R = 0.12 + 0.17 * t + 0.01 * math.sin(a * 3.1)
        layer = r * (1.0 + 0.9 * math.sin(a * 0.5) ** 2) if t > 0.5 else r
        pts.append(Vector((math.cos(a) * R, math.sin(a) * R, layer + 0.004 * math.sin(a * 7))))
    # loose tail snaking away
    last = pts[-1]
    d = Vector((-math.sin(turns * TAU), math.cos(turns * TAU), 0))
    for i in range(1, 30):
        p = last + d * (i * 0.04) + Vector((0.08 * math.sin(i * 0.4), 0.05 * math.cos(i * 0.3), 0)) * (i / 30)
        pts.append(Vector((p.x, p.y, r)))
    tube_l(mb, pts, lambda i, t: r, 8, 'rope', TM['rope']['tile_m'], cap1=True)
    ob = mb.finish()
    return [ob]


def driftwood(seed=901):
    rng = random.Random(seed)
    wood_mats()
    objs = []
    tile = TM['driftwood']['tile_m']
    for nm, L, R, bend, stubs in (('driftwood_log', 3.2, 0.14, 0.25, 3), ('driftwood_twisted', 1.9, 0.09, 0.4, 2), ('driftwood_root', 1.3, 0.16, 0.1, 0)):
        mb = V.MB(nm)
        n = 24
        pts = [Vector((L * i / n - L / 2, bend * math.sin(i / n * math.pi) * rng.uniform(0.6, 1.0), 0)) for i in range(n + 1)]
        sd = Vector((rng.uniform(-9, 9), rng.uniform(-9, 9), rng.uniform(-9, 9)))
        rf = lambda i, t, R=R: R * (1.0 - 0.35 * t) * (1 + 0.08 * math.sin(t * 17))
        rm = lambda i, t, a, sd=sd: 1.0 + 0.12 * noise.noise(Vector((t * 6, math.cos(a), math.sin(a))) + sd) - 0.08 * abs(math.sin(a * 3 + t * 4))
        tube_l(mb, pts, rf, 10, 'driftwood', tile, rmod=rm, jag=0.12, rng=rng, cap0=True, cap1=True)
        for k in range(stubs):   # broken branch stubs
            i = rng.randint(5, n - 5)
            a = rng.uniform(0, TAU)
            base = pts[i] + Vector((0, math.cos(a), math.sin(a))) * R * 0.6
            dirv = Vector((rng.uniform(-0.3, 0.6), math.cos(a), math.sin(a))).normalized()
            sp = [base + dirv * (0.07 * j) for j in range(5)]
            tube_l(mb, sp, lambda i, t, R=R: R * 0.35 * (1 - 0.4 * t), 6, 'driftwood', tile, jag=0.05, rng=rng, cap1=True)
        if nm == 'driftwood_root':
            for k in range(7):   # splayed roots
                a = TAU * k / 7 + rng.uniform(-0.2, 0.2)
                base = pts[0]
                sp = [base]
                d = Vector((-0.5, math.cos(a), math.sin(a))).normalized()
                for j in range(7):
                    d = (d + Vector((rng.uniform(-0.3, 0.1), rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3)))).normalized()
                    sp.append(sp[-1] + d * 0.11)
                tube_l(mb, sp, lambda i, t: 0.06 * (1 - 0.8 * t) + 0.01, 6, 'driftwood', tile, cap1=True)
        o = mb.finish()
        # lay it on the ground (lowest point at -2 cm)
        o.rotation_euler = (rng.uniform(0, TAU), 0, 0)
        apply_transform(o)
        zs = [v.co.z for v in o.data.vertices]
        for v in o.data.vertices:
            v.co.z -= min(zs) + 0.02
        shade_smooth(o, True, auto_angle=50)
        objs.append(o)
    for i, o in enumerate(objs):
        o.location = (0, i * 0.9, 0)
    return objs


SPECS = {'wreck_boat': wreck_boat, 'planks': planks, 'crate': crate, 'rope_coil': rope_coil, 'driftwood_logs': driftwood}


def build(name, preview=False):
    reset_scene()
    world_color((0.5, 0.5, 0.5), 1.0)
    objs = SPECS[name]()
    ntri = sum(tri_count(o) for o in objs)
    path = os.path.join(GLB, f'{name}.glb')
    nbytes = export_glb(path, objs)
    mins = Vector((1e9,) * 3); maxs = Vector((-1e9,) * 3)
    for o in objs:
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c)
            mins = Vector(map(min, mins, p)); maxs = Vector(map(max, maxs, p))
    d = maxs - mins
    write_manifest_entry(name, {'_cat': 'models', 'file': f'glb/{name}.glb', 'tris': ntri, 'bytes': nbytes,
                                'size_m': [round(d.x, 2), round(d.z, 2), round(d.y, 2)], 'kind': 'prop',
                                'parts': [o.name for o in objs] if len(objs) > 1 else None,
                                'textures': 'referenced ../tex/ (wood_planks, driftwood, wet_fabric, rope)'})
    log(f'{name}: {ntri} tris, {nbytes / 1e3:.0f} KB, parts {[o.name for o in objs]}')
    if preview:
        preview_render(os.path.join(PREVIEW, f'glb_{name}.jpg'), objs, size=(640, 480), samples=24, cam_dir=(0.9, -1.2, 0.6))


if __name__ == '__main__':
    a = script_args()
    names = [x for x in a if x in SPECS] or list(SPECS)
    for n in names:
        build(n, preview='--preview' in a)
