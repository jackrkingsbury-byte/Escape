# tools/blender/leaves.py — foliage alpha atlases rendered with Cycles (orthographic, top-down, transparent film).
#
#   blender -b --python tools/blender/leaves.py -- [palm] [canopy] [under]
#   python3 tools/blender/leaves_post.py          (downsample, colour dilation into transparent texels)
#   → src/real/assets/tex/foliage_<atlas>_color.png (sRGB albedo + alpha), foliage_<atlas>_normal.png (OpenGL)
#     src/real/assets/tex/foliage_atlas.json (cell rects in UV, anchor, metres per UV unit)
#
# Leaves are real geometry (folded/curled blades with midribs, tears, browning), so the albedo is unlit
# (emission = albedo) and a second render with a material override writes world normals → with the camera
# looking down −Z this IS the tangent space of a card mapped u=+X, v=+Y.
import os, sys, math, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_common import *

RES = 2048
ATLAS_JSON = os.path.join(TEX, 'foliage_atlas.json')


# ───────────────────────────────────────────── geometry ────────────────────────────────────────────
class LeafBuilder:
    def __init__(self, name):
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new('LeafUV')     # (s across 0..1, t along 0..1)
        self.rnd = self.bm.loops.layers.uv.new('Rand')      # per-blade random (r1, r2)
        self.kind = self.bm.loops.layers.uv.new('Kind')     # (kind id, dead flag)
        self.name = name

    def blade(self, M, L, W, shape, nseg=10, nside=2, fold=0.25, droop=0.0, curl=0.0, r=(0.5, 0.5), kind=0.0,
              skip=None, twist=0.0, notch=0.0):
        rows = []
        for i in range(nseg + 1):
            t = i / nseg
            w = W * max(0.0, shape(t))
            row = []
            for j in range(-nside, nside + 1):
                s = j / nside
                x = s * w
                z = fold * abs(s) * w + droop * t * t * L + curl * s * s * w + twist * s * w * t
                y = t * L + notch * L * (1 - abs(s)) ** 1.6 * max(0.0, 1 - t / 0.35) ** 2
                row.append((self.bm.verts.new(M @ Vector((x, y, z))), (s * 0.5 + 0.5, t)))
            rows.append(row)
        for i in range(nseg):
            for j in range(2 * nside):
                if skip and skip(i / nseg, (j + 0.5) / nside - 1.0):
                    continue
                q = [rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]]
                f = self.bm.faces.new([v for v, _ in q])
                for lp, (_, uvv) in zip(f.loops, q):
                    lp[self.uv].uv = uvv
                    lp[self.rnd].uv = r
                    lp[self.kind].uv = (kind, 0)

    def stem(self, pts, w0, w1, r=(0.5, 0.5), kind=9.0, z=0.0):
        """flat tapered ribbon along a 2D polyline (rachis / twig), slightly raised."""
        n = len(pts)
        prev = None
        for i, p in enumerate(pts):
            t = i / (n - 1)
            a = Vector(pts[min(i + 1, n - 1)]) - Vector(pts[max(i - 1, 0)])
            a.normalize()
            nrm = Vector((-a.y, a.x))
            w = w0 + (w1 - w0) * t
            l = self.bm.verts.new((p[0] - nrm.x * w, p[1] - nrm.y * w, z))
            c = self.bm.verts.new((p[0], p[1], z + w * 0.6))
            rr = self.bm.verts.new((p[0] + nrm.x * w, p[1] + nrm.y * w, z))
            cur = (l, c, rr, t)
            if prev:
                for a_, b_, sa, sb in ((0, 1, 0.0, 0.5), (1, 2, 0.5, 1.0)):
                    f = self.bm.faces.new([prev[a_], prev[b_], cur[b_], cur[a_]])
                    for lp, uvv in zip(f.loops, [(sa, prev[3]), (sb, prev[3]), (sb, t), (sa, t)]):
                        lp[self.uv].uv = uvv
                        lp[self.rnd].uv = r
                        lp[self.kind].uv = (kind, 0)
            prev = cur

    def finish(self):
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        ob = mesh_obj(self.name, self.bm)
        for p in ob.data.polygons:
            p.use_smooth = True
        return ob


def M2(x, y, ang, z=0.0, sc=1.0, tilt=0.0):
    """2D placement: translate (x,y,z), rotate about Z by ang (0 = blade points +Y), optional tilt about local X."""
    return Matrix.Translation((x, y, z)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Rotation(tilt, 4, 'X') @ Matrix.Scale(sc, 4)


def lanceolate(t):
    return (t / 0.22) ** 0.55 if t < 0.22 else ((1 - t) / 0.78) ** 1.1


def elliptic(t):
    return math.sin(math.pi * min(1, t)) ** 0.75 * (1 - 0.35 * t ** 3)


def ovate_acuminate(t):
    b = math.sin(math.pi * min(1.0, t * 0.92)) ** 0.65
    return b * (1.0 - 0.55 * max(0.0, t - 0.6) / 0.4) if t < 1 else 0.0


def pinnule(t):
    return math.sin(math.pi * t) ** 0.6


# ───────────────────────────────────────────── foliage pieces (physical metres, base at origin, +Y) ──
def palm_frond(lb, rng, L=3.0, torn=False):
    """coconut-palm frond: rachis + ~2×52 leaflets, leaning toward the tip."""
    pts = [(0.025 * math.sin(i / 20 * 2.0) * (1 if torn else 0.4), i / 20 * L) for i in range(21)]
    lb.stem(pts, 0.035, 0.006, r=(0.3, 0.2), kind=9.0)
    n = 72
    for side in (-1, 1):
        for i in range(n):
            u = (i + rng.uniform(-0.3, 0.3)) / n
            y = (0.10 + 0.88 * u) * L
            lmax = 0.98 * math.sin(math.pi * (0.08 + 0.9 * u)) ** 0.5 + 0.08
            l = lmax * rng.uniform(0.9, 1.06)
            ang = side * math.radians(rng.uniform(58, 70) - 22 * u)    # from +Y toward the side
            r1, r2 = rng.random(), rng.random() * (0.55 if not torn else 1.0)
            if torn:
                if rng.random() < 0.16:
                    continue                                              # missing leaflet
                if rng.random() < 0.25:
                    l *= rng.uniform(0.35, 0.7)                           # snapped
                r2 = min(1.0, r2 + 0.25)
                ang += side * math.radians(rng.uniform(-12, 10))
            lb.blade(M2(pts[0][0], y, -ang, z=0.002 + 0.0001 * i), l, 0.016 + 0.008 * math.sin(math.pi * u), lanceolate,
                     nseg=14, nside=1, fold=0.35, droop=0.0, curl=0.0, r=(r1, r2), kind=0.0,
                     twist=0.0)


def leaf_cluster(lb, rng, size=0.62, n=11, kind=1.0):
    """rainforest twig: alternate broad glossy leaves fanning out, seen from above."""
    pts = []
    for i in range(16):
        t = i / 15
        pts.append((0.03 * math.sin(t * 3.0 + rng.random()), t * size * 0.75))
    lb.stem(pts, 0.006, 0.003, r=(0.2, 0.1), kind=9.0)
    for i in range(n):
        t = 0.12 + 0.88 * i / (n - 1)
        y = t * size * 0.75
        side = -1 if i % 2 else 1
        ang = side * math.radians(rng.uniform(25, 70) * (1.0 - 0.6 * t))
        l = size * rng.uniform(0.30, 0.42) * (0.75 + 0.35 * math.sin(math.pi * min(1, t + 0.2)))
        lb.blade(M2(pts[int(t * 15)][0], y, -ang, z=0.004 + i * 0.001), l, l * rng.uniform(0.17, 0.23), ovate_acuminate,
                 nseg=10, nside=2, fold=0.18, droop=-0.06, curl=-0.08, r=(rng.random(), rng.random() * 0.45), kind=kind)
    # terminal leaf
    lb.blade(M2(pts[-1][0], pts[-1][1] - 0.02, rng.uniform(-0.2, 0.2), z=0.02), size * 0.36, size * 0.075, ovate_acuminate,
             nseg=10, nside=2, fold=0.18, r=(rng.random(), 0.1), kind=kind)


def fern_frond(lb, rng, L=1.3, Wp=0.17, kind=2.0):
    """bipinnate fern frond: rachis + alternate pinnae made of lobed pinnules."""
    pts = [(0.01 * math.sin(i / 24 * 3.0), i / 24 * L) for i in range(25)]
    lb.stem(pts, 0.008, 0.002, r=(0.25, 0.15), kind=9.0)
    n = 30
    for i in range(n):
        u = (i + 0.5) / n
        for side in (-1, 1):
            y = (0.10 + 0.88 * u) * L + (0.012 if side > 0 else 0.0)
            pl = Wp * math.sin(math.pi * (0.06 + 0.94 * u)) ** 0.7 * (1.0 - 0.35 * u) + 0.012
            ang = side * math.radians(78 - 30 * u)
            M = M2(0.0, y, -ang, z=0.003)
            nl = max(3, int(pl / 0.009))
            r1 = rng.random()
            for k in range(nl):
                v = (k + 0.5) / nl
                pw = 0.014 * (1.0 - 0.55 * v)
                for s2 in (-1, 1):
                    Mk = M @ Matrix.Translation((0, v * pl, 0.001)) @ Matrix.Rotation(-s2 * math.radians(58), 4, 'Z')
                    lb.blade(Mk, pw * 1.5, pw * 0.62, pinnule, nseg=4, nside=1, fold=0.2, r=(r1, rng.random() * 0.4), kind=kind)
            lb.blade(M, pl, 0.0025, lambda t: 1 - t, nseg=2, nside=1, fold=0.0, r=(r1, 0.2), kind=9.0)   # pinna rib


def heart_leaf(lb, rng, L=0.85, kind=3.0):
    """elephant-ear (Alocasia/Colocasia): peltate heart blade with a basal sinus."""
    def shape(t):
        return (0.62 + 0.38 * math.sin(math.pi * min(1.0, t * 1.6))) * (1 - t) ** 0.62 if t < 1 else 0.0
    lb.blade(M2(0, 0.0, 0.0, z=0.01), L, L * 0.52, shape, nseg=24, nside=8, fold=0.10, curl=-0.12, r=(0.55, 0.15),
             kind=kind, notch=0.2)


def banana_leaf(lb, rng, L=1.25, W=0.2, kind=4.0):
    """wind-torn banana/heliconia blade: oblong, split into strips perpendicular to the midrib."""
    lb.stem([(0, 0), (0, L)], 0.012, 0.004, r=(0.3, 0.2), kind=9.0, z=0.004)
    y = 0.03
    while y < L * 0.97:
        h = rng.choice((rng.uniform(0.015, 0.04), rng.uniform(0.04, 0.10), rng.uniform(0.1, 0.18)))
        t0, t1 = y / L, min(1.0, (y + h) / L)
        for side in (-1, 1):
            if rng.random() < 0.06:
                continue
            w0 = W * math.sin(math.pi * min(1, t0 * 1.15 + 0.02)) ** 0.35
            # each strip: a narrow "blade" pointing outward, its width = segment height
            ang = side * math.radians(rng.uniform(62, 84))
            wl = w0 * rng.uniform(0.8, 1.0) * (0.6 if rng.random() < 0.15 else 1.0)
            lb.blade(M2(0.0, y + h * 0.5, -ang, z=0.002), wl, h * 0.47, lambda t: 1.0 - 0.15 * t ** 2, nseg=4, nside=1,
                     fold=0.0, droop=-0.05, r=(0.45 + 0.1 * rng.random(), 0.25 + 0.5 * t0 * rng.random()), kind=kind)
        y += h + rng.uniform(0.0, 0.006)


def vine_strip(lb, rng, L=1.0, kind=5.0):
    """hanging liana: wavy stem + alternate small heart-shaped leaves (pothos-like)."""
    pts = [(0.025 * math.sin(i / 30 * 9.0 + rng.random() * 0.3), i / 30 * L) for i in range(31)]
    lb.stem(pts, 0.005, 0.004, r=(0.2, 0.3), kind=9.0)
    n = 14
    for i in range(n):
        t = (i + 0.5) / n
        side = 1 if i % 2 else -1
        p = pts[int(t * 30)]
        l = rng.uniform(0.07, 0.11)
        ang = side * math.radians(rng.uniform(110, 150))       # leaves hang downward-ish
        lb.blade(M2(p[0], p[1], -ang, z=0.003), l, l * 0.42, lambda t: (0.75 + 0.25 * math.sin(math.pi * min(1, t * 1.5))) * (1 - t) ** 0.7,
                 nseg=8, nside=2, fold=0.15, r=(rng.random(), rng.random() * 0.5), kind=kind)


# ───────────────────────────────────────────── materials ───────────────────────────────────────────
def foliage_albedo_material():
    mat, nt, g = new_material('M_foliage')
    uv = g.node('ShaderNodeUVMap', uv_map='LeafUV').outputs[0]
    rn = g.node('ShaderNodeUVMap', uv_map='Rand').outputs[0]
    kd = g.node('ShaderNodeUVMap', uv_map='Kind').outputs[0]
    su = g.sep(uv); s, t = su[0], su[1]
    sr = g.sep(rn); r1, r2 = sr[0], sr[1]
    kind = g.sep(kd)[0]
    co = g.node('ShaderNodeTexCoord').outputs['Object']
    mott = g.noise(co, None, scale=60.0, detail=4, rough=0.6)
    mott2 = g.noise(co, None, scale=8.0, detail=3)
    ds = g.absf(g.sub(s, 0.5))
    # green palette per kind (palm = yellower, canopy = deep glossy, fern = fresh, under = dark, vine = mid)
    base = g.ramp(g.add(g.mul(r1, 0.75), g.mul(mott2, 0.25)),
                  [(0.0, (0.024, 0.052, 0.013)), (0.35, (0.042, 0.080, 0.021)), (0.65, (0.065, 0.105, 0.026)), (0.9, (0.105, 0.125, 0.038)), (1.0, (0.135, 0.135, 0.045))])
    palm_t = g.sub(1.0, g.sstep(0.5, 0.6, kind))                                # kind 0
    base = g.mixc(base, g.mixc(base, (1.25, 1.18, 0.85), 1.0, 'MULTIPLY'), palm_t)
    fern_t = g.mul(g.sstep(1.5, 1.6, kind), g.sub(1.0, g.sstep(2.5, 2.6, kind)))  # kind 2
    base = g.mixc(base, g.mixc(base, (1.1, 1.25, 0.9), 1.0, 'MULTIPLY'), fern_t)
    base = g.mixc(base, g.mixc(base, (0.8, 0.85, 1.0), 1.0, 'MULTIPLY'), g.sub(mott, 0.5))
    # midrib + veins
    midrib = g.sub(1.0, g.sstep(0.0, 0.045, ds))
    pin = g.sstep(0.82, 1.0, g.sin(g.mul(g.add(g.mul(t, 22.0), g.mul(ds, 7.0)), TAU)))    # pinnate (dicots)
    par = g.sstep(0.6, 1.0, g.sin(g.mul(s, 40.0 * TAU)))                                 # parallel (palm, banana)
    mono = g.clamp01(g.add(palm_t, g.sstep(3.5, 3.6, g.mul(kind, g.sub(1.0, g.sstep(4.5, 4.6, kind))))))
    veins = g.lerp(pin, g.mul(par, 0.5), mono)
    col = g.mixc(base, g.mixc(base, (1.7, 1.75, 1.3), 1.0, 'MULTIPLY'), g.mul(midrib, 0.8))
    col = g.mixc(col, g.mixc(col, (1.3, 1.32, 1.15), 1.0, 'MULTIPLY'), g.mul(veins, 0.35))
    # necrosis: brown tips / edges, fully dead blades when r2 is high
    edge = g.add(g.mul(g.sstep(0.35, 0.5, ds), 0.5), g.sstep(0.0, 1.0, t))
    nec = g.sstep(g.sub(1.55, g.mul(r2, 0.8)), g.sub(1.7, g.mul(r2, 0.8)), g.add(edge, g.mul(mott, 0.4)))
    dead = g.sstep(0.88, 0.92, r2)
    brown = g.ramp(mott, [(0.3, (0.10, 0.065, 0.028)), (0.7, (0.16, 0.11, 0.05))])
    col = g.mixc(col, brown, g.clamp01(g.add(nec, dead)))
    # stems
    stem_t = g.sstep(8.5, 8.6, kind)
    stem_c = g.ramp(g.add(g.mul(r1, 0.5), g.mul(mott, 0.5)), [(0.2, (0.05, 0.05, 0.02)), (0.8, (0.11, 0.095, 0.045))])
    col = g.mixc(col, stem_c, stem_t)
    emi = g.node('ShaderNodeEmission')
    g.set(emi.inputs['Color'], col)
    out = g.node('ShaderNodeOutputMaterial')
    nt.links.new(emi.outputs[0], out.inputs[0])
    return mat


def normal_material():
    mat, nt, g = new_material('M_normal_out')
    geo = g.node('ShaderNodeNewGeometry')
    flip = g.sub(1.0, g.mul(geo.outputs['Backfacing'], 2.0))
    n = g.vm('SCALE', geo.outputs['Normal'], scale=flip)
    n = g.vm('MULTIPLY_ADD', n, (0.5, 0.5, 0.5)) if False else g.vm('ADD', g.vm('SCALE', n, scale=0.5), (0.5, 0.5, 0.5))
    emi = g.node('ShaderNodeEmission')
    g.set(emi.inputs['Color'], n)
    out = g.node('ShaderNodeOutputMaterial')
    nt.links.new(emi.outputs[0], out.inputs[0])
    return mat


# ───────────────────────────────────────────── atlases ─────────────────────────────────────────────
ATLASES = {
    # cell: (u0, v0, uw, vh) in atlas UV; builder(lb, rng) in metres, base at origin growing +Y
    'palm': [
        ('frond_a', (0.0, 0.0, 0.5, 1.0), lambda lb, r: palm_frond(lb, r, 3.0, torn=False), (3.0, 0.9)),
        ('frond_b', (0.5, 0.0, 0.5, 1.0), lambda lb, r: palm_frond(lb, r, 3.0, torn=True), (3.0, 0.9)),
    ],
    'canopy': [
        ('cluster_a', (0.0, 0.5, 0.5, 0.5), lambda lb, r: leaf_cluster(lb, r, 0.62, 11), (0.62, 0.36)),
        ('cluster_b', (0.5, 0.5, 0.5, 0.5), lambda lb, r: leaf_cluster(lb, r, 0.62, 13), (0.62, 0.36)),
        ('cluster_c', (0.0, 0.0, 0.5, 0.5), lambda lb, r: leaf_cluster(lb, r, 0.62, 9), (0.62, 0.36)),
        ('cluster_d', (0.5, 0.0, 0.5, 0.5), lambda lb, r: leaf_cluster(lb, r, 0.62, 12), (0.62, 0.36)),
    ],
    'under': [
        ('fern_a', (0.0, 0.0, 0.25, 1.0), lambda lb, r: fern_frond(lb, r, 1.3, 0.17), (1.3, 0.2)),
        ('fern_b', (0.25, 0.0, 0.25, 1.0), lambda lb, r: fern_frond(lb, r, 1.1, 0.21), (1.1, 0.24)),
        ('heart', (0.5, 0.5, 0.5, 0.5), lambda lb, r: heart_leaf(lb, r, 0.85), (0.85, 0.46)),
        ('banana', (0.5, 0.0, 0.25, 0.5), lambda lb, r: banana_leaf(lb, r, 1.25, 0.21), (1.25, 0.24)),
        ('vine_a', (0.75, 0.0, 0.125, 0.5), lambda lb, r: vine_strip(lb, r, 1.0), (1.0, 0.12)),
        ('vine_b', (0.875, 0.0, 0.125, 0.5), lambda lb, r: vine_strip(lb, r, 1.0), (1.0, 0.12)),
    ],
}


def build_atlas(name, seed=7):
    reset_scene()
    world_color((0, 0, 0), 0.0)
    sc = bpy.context.scene
    mat = foliage_albedo_material()
    info = {}
    for ci, (cell, rect, fn, (L, halfw)) in enumerate(ATLASES[name]):
        rng = random.Random(seed * 1000 + ci * 17)
        lb = LeafBuilder(f'{name}_{cell}')
        fn(lb, rng)
        ob = lb.finish()
        ob.data.materials.append(mat)
        # fit: physical [−halfw, halfw] × [0, L] → cell rect with a small margin
        u0, v0, uw, vh = rect
        m = 0.02
        s = min((uw - 2 * m * uw) / (2 * halfw), (vh - 2 * m * vh) / L)
        ox = u0 + uw / 2
        oy = v0 + (vh - L * s) / 2
        ob.matrix_world = Matrix.Translation((ox, oy, 0)) @ Matrix.Scale(s, 4)
        info[cell] = dict(rect=rect, anchor=[ox, oy], m_per_uv=1.0 / s, length_m=L, halfwidth_m=halfw)
    cd = bpy.data.cameras.new('ortho')
    cd.type = 'ORTHO'
    cd.ortho_scale = 1.0
    cd.clip_start = 0.01
    cd.clip_end = 10
    cam = bpy.data.objects.new('ortho', cd)
    link_obj(cam)
    cam.location = (0.5, 0.5, 3.0)
    sc.camera = cam
    sc.render.resolution_x = sc.render.resolution_y = RES
    sc.render.film_transparent = True
    sc.cycles.samples = 16
    sc.cycles.pixel_filter_type = 'BOX'
    sc.cycles.filter_width = 1.0
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.color_depth = '8'
    sc.view_settings.view_transform = 'Standard'
    sc.render.filepath = os.path.join(BUILD, f'foliage_{name}_color_raw.png')
    bpy.ops.render.render(write_still=True)
    sc.view_layers[0].material_override = normal_material()
    sc.view_settings.view_transform = 'Raw'
    sc.render.filepath = os.path.join(BUILD, f'foliage_{name}_normal_raw.png')
    bpy.ops.render.render(write_still=True)
    sc.view_layers[0].material_override = None
    log(f'atlas {name}: {list(info)}')
    allinfo = json.load(open(ATLAS_JSON)) if os.path.exists(ATLAS_JSON) else {}
    allinfo[name] = dict(cells=info, files={'color': f'tex/foliage_{name}_color.png', 'normal': f'tex/foliage_{name}_normal.png'})
    json.dump(allinfo, open(ATLAS_JSON, 'w'), indent=1)


if __name__ == '__main__':
    names = [a for a in script_args() if a in ATLASES] or list(ATLASES)
    for n in names:
        build_atlas(n)
