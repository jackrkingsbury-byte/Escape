# tools/blender/vegetation.py — palms, buttress-root rainforest trees, fern/undergrowth clumps, hanging vines.
#
#   blender -b --python tools/blender/vegetation.py -- [name ...] [--preview]
#   needs: textures.py + tex_post.py (palm_bark, tree_bark sets) and leaves.py + leaves_post.py (foliage atlases)
#   → src/real/assets/glb/<name>.glb  (bark/foliage PNGs referenced as ../tex/*.png, shared between models)
#
# Geometry is generated directly (bmesh): swept tubes with parallel-transport frames for trunks/limbs/lianas
# (bark UVs in metres / tile size), a parametric buttress trunk (thin plank fins that decay with height),
# alpha-tested leaf cards mapped onto foliage-atlas cells (V-folded arching palm fronds, crossed canopy cluster
# cards with normals bent outward from the crown centre for soft volumetric shading, arching fern fronds).
# Origins: trees/ferns at the base (y = 0 is the ground), vines at the top anchor.
import os, sys, math, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_common import *

ATLAS = json.load(open(os.path.join(TEX, 'foliage_atlas.json')))
TEXMETA = json.load(open(os.path.join(ASSETS, 'manifest.json')))['textures']


def T(name, k):
    return os.path.join(TEX, f'{name}_{k}.png')


# ───────────────────────────────────────────── materials (shared, cached per scene) ───────────────
_mats = {}


def mat(key):
    if key in _mats:
        return _mats[key]
    if key in ('palm_bark', 'tree_bark', 'driftwood'):
        m = pbr_material('M_' + key, T(key, 'color'), normal=T(key, 'normal'), orm=T(key, 'orm'))
    elif key.startswith('foliage_'):
        atlas = key.split('_')[1]
        m = pbr_material('M_' + key, T('foliage_' + atlas, 'color'), normal=T('foliage_' + atlas, 'normal'), alpha_clip=0.5,
                         double_sided=True, roughness_value=0.5 if atlas != 'palm' else 0.55)
    elif key == 'palm_dead':
        m = pbr_material('M_palm_dead', T('foliage_palm', 'color'), normal=T('foliage_palm', 'normal'), alpha_clip=0.5,
                         double_sided=True, roughness_value=0.7, base_tint=(0.85, 0.55, 0.32))
    elif key == 'coconut':
        m = pbr_material('M_coconut', (0.06, 0.07, 0.025), roughness_value=0.45)
    elif key == 'husk':
        m = pbr_material('M_palm_husk', (0.09, 0.065, 0.04), roughness_value=0.85)
    _mats[key] = m
    return m


# ───────────────────────────────────────────── mesh builder ────────────────────────────────────────
class MB:
    """bmesh with one UV layer and material slots by key; faces carry material index."""

    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new('UVMap')
        self.keys = []
        self.normals = {}          # bm vert → custom normal (foliage)

    def mi(self, key):
        if key not in self.keys:
            self.keys.append(key)
        return self.keys.index(key)

    def quad(self, vs, uvs, key, smooth=True):
        f = self.bm.faces.new(vs)
        f.material_index = self.mi(key)
        f.smooth = smooth
        for lp, uv in zip(f.loops, uvs):
            lp[self.uv].uv = uv
        return f

    def grid(self, rows, uvrows, key, close=False):
        """rows: list of lists of Vector; consecutive rows joined with quads. close → wrap columns."""
        vr = [[self.bm.verts.new(p) for p in row] for row in rows]
        n = len(rows[0])
        for i in range(len(rows) - 1):
            for j in range(n - 1 + (1 if close else 0)):
                j2 = (j + 1) % n
                if close and j == n - 1:
                    # wrap: duplicate seam handled by caller passing n+1 columns instead; unused
                    continue
                self.quad([vr[i][j], vr[i][j2], vr[i + 1][j2], vr[i + 1][j]],
                          [uvrows[i][j], uvrows[i][j2], uvrows[i + 1][j2], uvrows[i + 1][j]], key)
        return vr

    def finish(self, custom_normals=None):
        me = bpy.data.meshes.new(self.name)
        self.bm.normal_update()
        self.bm.to_mesh(me)
        ob = bpy.data.objects.new(self.name, me)
        link_obj(ob)
        for k in self.keys:
            me.materials.append(mat(k))
        if custom_normals is not None:
            custom_normals(ob)
        return ob


def frames(pts):
    """parallel-transport frames along a polyline: list of (tangent, normal, binormal)."""
    out = []
    t0 = (pts[1] - pts[0]).normalized()
    ref = Vector((0, 0, 1)) if abs(t0.z) < 0.9 else Vector((1, 0, 0))
    n = t0.cross(ref).normalized()
    for i in range(len(pts)):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        n = (n - t * n.dot(t)).normalized()
        out.append((t, n, t.cross(n)))
    return out


def tube(mb, pts, radius_fn, sides, key, tile, u_tiles=None, rmod=None, v0=0.0, cap=False):
    """sweep a circle along pts. radius_fn(i, t) → radius; rmod(i, t, ang) → radius multiplier.
    UV: u = 0..u_tiles around (seam duplicated), v = arc length / tile."""
    fr = frames(pts)
    L = [0.0]
    for i in range(1, len(pts)):
        L.append(L[-1] + (pts[i] - pts[i - 1]).length)
    if u_tiles is None:
        u_tiles = max(1, round(2 * math.pi * radius_fn(0, 0.0) / tile))
    rows, uvr = [], []
    for i, p in enumerate(pts):
        t = L[i] / L[-1] if L[-1] > 0 else 0
        r = radius_fn(i, t)
        _, n, b = fr[i]
        row, uvrow = [], []
        for j in range(sides + 1):
            a = TAU * j / sides
            rr = r * (rmod(i, t, a) if rmod else 1.0)
            row.append(p + (n * math.cos(a) + b * math.sin(a)) * rr)
            uvrow.append((u_tiles * j / sides, v0 + L[i] / tile))
        rows.append(row)
        uvr.append(uvrow)
    vr = mb.grid(rows, uvr, key)
    if cap:
        c = mb.bm.verts.new(pts[-1])
        for j in range(sides):
            f = mb.bm.faces.new([vr[-1][j], vr[-1][j + 1], c])
            f.material_index = mb.mi(key)
            for lp, uv in zip(f.loops, [uvr[-1][j], uvr[-1][j + 1], (u_tiles * (j + 0.5) / sides, uvr[-1][j][1] + 0.05)]):
                lp[mb.uv].uv = uv
    return vr


def cell_uv(atlas, cell):
    c = ATLAS[atlas]['cells'][cell]
    u0, v0, uw, vh = c['rect']
    return c, u0, v0, uw, vh


def strip_card(mb, key, atlas, cell, centre_fn, side_fn, nseg, ncol=3, fold_fn=None, length=None, droop_cols=None):
    """generic leaf card along a spine. centre_fn(t) → point, side_fn(t) → (lateral unit vector, up unit vector).
    UV: the atlas cell; the spine runs from the cell anchor to anchor + length/m_per_uv (or the cell top)."""
    c, u0, v0, uw, vh = cell_uv(atlas, cell)
    au, av = c['anchor']
    mpu = c['m_per_uv']
    L = length or c['length_m']
    half_w_phys = uw / 2 * mpu * (L / c['length_m'])        # longer frond → proportionally wider
    vt = av + c['length_m'] / mpu          # UV range is always the cell's own frond (physical L may be scaled)
    rows, uvr = [], []
    for i in range(nseg + 1):
        t = i / nseg
        p = centre_fn(t)
        lat, up = side_fn(t)
        fold = fold_fn(t) if fold_fn else 0.0
        row, uvrow = [], []
        for j in range(ncol):
            s = -1 + 2 * j / (ncol - 1)
            w = s * half_w_phys
            off = lat * (w * math.cos(fold)) - up * (abs(w) * math.sin(fold))
            row.append(p + off)
            uvrow.append((au + s * uw / 2, av + t * (vt - av)))
        rows.append(row)
        uvr.append(uvrow)
    return mb.grid(rows, uvr, key)


def flat_card(mb, key, atlas, cell, origin, xdir, ydir, scale=1.0, bend=0.0, nseg=1):
    """whole atlas cell as a (slightly bent) quad strip: xdir/ydir unit vectors, physical size from the atlas."""
    c, u0, v0, uw, vh = cell_uv(atlas, cell)
    mpu = c['m_per_uv'] * scale
    au, av = c['anchor']
    zdir = xdir.cross(ydir)
    rows, uvr = [], []
    for i in range(nseg + 1):
        t = i / nseg
        vv = v0 + t * vh
        y = (vv - av) * mpu
        row, uvrow = [], []
        for uu in (u0, u0 + uw / 2, u0 + uw):
            x = (uu - au) * mpu
            z = bend * (y / (vh * mpu)) ** 2 * vh * mpu - 0.15 * abs(x) * (1 if bend >= 0 else -1)
            row.append(origin + xdir * x + ydir * y + zdir * z)
            uvrow.append((uu, vv))
        rows.append(row)
        uvr.append(uvrow)
    return mb.grid(rows, uvr, key)


def bend_normals_outward(ob, centre, keys_prefix='foliage', amount=0.75, squash=(1, 1, 1)):
    """foliage cards: (1) re-wind every card so its front face points away from `centre` (three.js DoubleSide
    flips the normal on back faces, so normals must agree with the winding), (2) custom split normals blended
    toward (p − centre) for soft, volumetric canopy shading."""
    me = ob.data
    fol = {i for i, m in enumerate(me.materials) if m and m.name.startswith('M_' + keys_prefix)}

    def outdir(p):
        d = Vector(((p.x - centre.x) / squash[0], (p.y - centre.y) / squash[1], (p.z - centre.z) / squash[2]))
        return d.normalized() if d.length > 1e-6 else Vector((0, 0, 1))
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.normal_update()
    flip = [f for f in bm.faces if f.material_index in fol and f.normal.dot(outdir(f.calc_center_median())) < 0]
    bmesh.ops.reverse_faces(bm, faces=flip, flip_multires=False)
    bm.to_mesh(me)
    bm.free()
    me.use_auto_smooth = True
    me.auto_smooth_angle = math.radians(180)
    me.calc_normals_split()
    out = []
    for poly in me.polygons:
        for li in poly.loop_indices:
            n = me.loops[li].normal.copy()
            if poly.material_index in fol:
                d = outdir(me.vertices[me.loops[li].vertex_index].co)
                fn = poly.normal
                n = (fn * (1 - amount) + d * amount).normalized()
                if n.dot(fn) < 0.15:          # keep it on the front side of the card
                    n = (n + fn * (0.15 - n.dot(fn) + 0.05)).normalized()
            out.append(n)
    me.normals_split_custom_set(out)


# ───────────────────────────────────────────── palms ───────────────────────────────────────────────
def palm(name, seed, H=10.0, lean=2.2, n_fronds=17, torn_share=0.3, dead=3, curve=0.25, frond_len=4.2):
    rng = random.Random(seed)
    mb = MB(name)
    # trunk centreline: lean grows with height, slight S-curve (storm bent)
    nseg = 110
    az = rng.uniform(0, TAU)
    dirh = Vector((math.cos(az), math.sin(az), 0))
    side = Vector((-dirh.y, dirh.x, 0))
    pts = []
    for i in range(nseg + 1):
        t = i / nseg
        off = dirh * (lean * t ** 1.7) + side * (curve * math.sin(t * math.pi * 1.3) * 0.6)
        pts.append(Vector((0, 0, t * H)) + off - Vector((0, 0, 0.25)))
    tile = TEXMETA['palm_bark']['tile_m']
    ring = tile / 12.0

    def rad(i, t):
        base = 0.17 + 0.05 * (1 - t) ** 3 + 0.16 * max(0.0, 1 - t * H / 0.9) ** 2.5   # bole flare at the base
        return base * (1 - 0.18 * t)

    def rmod(i, t, a):
        z = t * H
        f = (z / ring) % 1.0
        return 1.0 + 0.022 * (math.sin(math.pi * f) ** 0.5) - 0.02 * (1 - min(1.0, f / 0.08))

    tube(mb, pts, rad, 18, 'palm_bark', tile, u_tiles=1, rmod=rmod)
    top = pts[-1]
    ttop = (pts[-1] - pts[-4]).normalized()
    # crown: husky leaf bases (short flared cylinder) + coconuts
    cpts = [top - ttop * 0.35 + ttop * (k * 0.12) for k in range(6)]
    tube(mb, cpts, lambda i, t: 0.17 + 0.09 * math.sin(math.pi * t), 12, 'husk', 0.5, u_tiles=1, cap=True)
    for k in range(rng.randint(5, 8)):
        a = rng.uniform(0, TAU)
        c = top - ttop * rng.uniform(0.15, 0.45) + Vector((math.cos(a), math.sin(a), 0)) * 0.24
        bm2 = bmesh.new()
        bmesh.ops.create_uvsphere(bm2, u_segments=8, v_segments=6, radius=rng.uniform(0.11, 0.14))
        for v in bm2.verts:
            v.co = Vector((v.co.x, v.co.y, v.co.z * 1.15)) + c
        verts = {}
        for v in bm2.verts:
            verts[v] = mb.bm.verts.new(v.co)
        for f in bm2.faces:
            mb.quad([verts[v] for v in f.verts], [(0.5, 0.5)] * len(f.verts), 'coconut')
        bm2.free()
    # fronds: golden-angle spiral, young = upright, old = drooping, a few dead hanging
    ga = math.radians(137.5)
    for k in range(n_fronds + dead):
        is_dead = k >= n_fronds
        a = k * ga + rng.uniform(-0.15, 0.15)
        age = k / max(1, n_fronds - 1) if not is_dead else 1.0
        if is_dead:
            e0, droop, L = math.radians(rng.uniform(-78, -62)), 0.2, frond_len * rng.uniform(0.7, 0.85)
        else:
            e0 = math.radians(58 - 70 * age + rng.uniform(-8, 8))
            droop = 0.75 + 0.55 * age + rng.uniform(-0.12, 0.12)
            L = frond_len * rng.uniform(0.88, 1.05) * (0.75 if age < 0.12 else 1.0)
        hdir = Vector((math.cos(a), math.sin(a), 0))
        lat0 = Vector((-hdir.y, hdir.x, 0))
        base = top + hdir * 0.16 - ttop * (0.05 + 0.1 * age)
        # integrate the arching spine
        spine = [base]
        n = 12
        for i in range(n):
            t = (i + 0.5) / n
            e = e0 - droop * t ** 1.4 if not is_dead else e0
            d = hdir * math.cos(e) + Vector((0, 0, math.sin(e)))
            spine.append(spine[-1] + d * (L / n))
        twist = rng.uniform(-0.35, 0.35)

        def centre(t, spine=spine):
            x = t * (len(spine) - 1)
            i = min(int(x), len(spine) - 2)
            return spine[i].lerp(spine[i + 1], x - i)

        def sides(t, spine=spine, lat0=lat0, twist=twist):
            x = t * (len(spine) - 1)
            i = min(int(x), len(spine) - 2)
            d = (spine[i + 1] - spine[i]).normalized()
            lat = (lat0 - d * lat0.dot(d)).normalized()
            up = d.cross(lat).normalized()
            if up.z < 0:
                up = -up
            ang = twist * t
            return (lat * math.cos(ang) + up * math.sin(ang)), (up * math.cos(ang) - lat * math.sin(ang))

        torn = is_dead or rng.random() < torn_share or age > 0.8
        cell = 'frond_b' if torn else 'frond_a'
        key = 'palm_dead' if is_dead else 'foliage_palm'
        fold = (lambda t: math.radians(38 + 18 * t)) if not is_dead else (lambda t: math.radians(65))
        strip_card(mb, key, 'palm', cell, centre, sides, nseg=10, ncol=5, fold_fn=fold, length=L)
    ob = mb.finish()
    return ob


# ───────────────────────────────────────────── rainforest trees ────────────────────────────────────
def buttress_trunk(mb, rng, H, r_top, r_base, fins, sides=60, rings=46, tile=1.5):
    """parametric trunk ring stack; fins = [(angle, reach_m, height_m, thickness_m)]."""
    rows, uvr = [], []
    zs = [-0.4] + [H * (i / (rings - 1)) ** 1.6 for i in range(rings)]
    lean = Vector((rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), 0))
    seed = Vector((rng.uniform(-50, 50), rng.uniform(-50, 50), rng.uniform(-50, 50)))
    for z in zs:
        h = max(0.0, z)
        t = h / H
        rc = r_base + (r_top - r_base) * t ** 0.6
        c = lean * t ** 2
        pts = []
        for j in range(sides):
            a = TAU * j / sides
            r = rc * (1 + 0.06 * noise.noise(Vector((math.cos(a) * 2, math.sin(a) * 2, h * 0.3)) + seed))
            for (fa, reach, fh, th) in fins:
                if h < fh:
                    k = (1 - h / fh) ** 1.8
                    R = rc + reach * k
                    da = math.atan2(math.sin(a - fa), math.cos(a - fa))
                    halfang = (th * 0.5) / max(R, 0.3) + 0.04
                    w = max(0.0, 1 - abs(da) / (halfang * (1 + 2.5 * (1 - k))))
                    if w > 0:
                        prof = w ** 0.6 if abs(da) < halfang else w ** 2
                        r = max(r, rc + reach * k * prof + 0.05 * noise.noise(Vector((fa, h * 0.8, reach)) + seed))
            pts.append(Vector((c.x + math.cos(a) * r, c.y + math.sin(a) * r, z)))
        pts.append(pts[0].copy())
        # u by arc length (continuous, seam at a = 0), v = height / tile
        arc = [0.0]
        for j in range(1, len(pts)):
            arc.append(arc[-1] + (pts[j] - pts[j - 1]).length)
        k_t = arc[-1] / tile
        rows.append(pts)
        uvr.append([(arc[j] / arc[-1] * max(1, round(2 * math.pi * rc / tile)) + 0.0 * k_t, z / tile) for j in range(len(pts))])
    mb.grid(rows, uvr, 'tree_bark')
    return lean


def branch_path(start, d0, length, rng, up_bias=0.25, n=10, wobble=0.25):
    pts = [start]
    d = d0.normalized()
    for i in range(n):
        d = (d + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.5, 0.8) + up_bias)) * wobble).normalized()
        pts.append(pts[-1] + d * (length / n))
    return pts


def rainforest_tree(name, seed, H=17.0, r_top=0.55, r_base=0.85, n_fins=6, reach=(2.2, 3.8), fin_h=(2.5, 4.5),
                    n_limbs=6, limb_len=(7, 10), crown_clusters=560, spread=1.0):
    rng = random.Random(seed)
    mb = MB(name)
    tile = TEXMETA['tree_bark']['tile_m']
    fins = []
    a0 = rng.uniform(0, TAU)
    for i in range(n_fins):
        fins.append((a0 + TAU * i / n_fins + rng.uniform(-0.35, 0.35), rng.uniform(*reach), rng.uniform(*fin_h), rng.uniform(0.22, 0.35)))
    lean = buttress_trunk(mb, rng, H, r_top, r_base, fins, tile=tile)
    top = Vector((lean.x, lean.y, H))
    tips = []
    limbs = []
    for i in range(n_limbs):
        a = a0 + TAU * i / n_limbs + rng.uniform(-0.3, 0.3)
        hz = H * rng.uniform(0.78, 0.98)
        start = Vector((lean.x * (hz / H) ** 2, lean.y * (hz / H) ** 2, hz))
        d0 = Vector((math.cos(a), math.sin(a), rng.uniform(0.35, 0.75)))
        ln = rng.uniform(*limb_len) * spread
        pts = branch_path(start, d0, ln, rng, up_bias=-0.02, n=12, wobble=0.14)
        r0 = r_top * rng.uniform(0.45, 0.6)
        tube(mb, pts, lambda k, t, r0=r0: r0 * (1 - 0.8 * t) + 0.02, 9, 'tree_bark', tile, u_tiles=1)
        limbs.append(pts)
        # sub-branches
        for j in range(rng.randint(3, 4)):
            si = rng.randint(4, 10)
            s0 = pts[si]
            dd = (pts[si + 1] - pts[si]).normalized()
            sd = (dd + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(0.0, 0.5)))).normalized()
            sp = branch_path(s0, sd, rng.uniform(3.5, 6.0) * spread, rng, up_bias=0.0, n=7, wobble=0.2)
            rs = r0 * (1 - 0.8 * si / 12) * 0.6
            tube(mb, sp, lambda k, t, rs=rs: rs * (1 - 0.85 * t) + 0.012, 6, 'tree_bark', tile, u_tiles=1)
            tips += sp[3:]
        tips += pts[5:]
        # extra leafy points between the limb and its sub-branches (fills the crown interior)
        for q in pts[6:]:
            tips.append(q + Vector((rng.gauss(0, 2.0), rng.gauss(0, 2.0), rng.uniform(0.2, 1.2))))
    # crown: leaf-cluster cards around tips, a flattened dome
    cells = ['cluster_a', 'cluster_b', 'cluster_c', 'cluster_d']
    cen = sum(tips, Vector()) / len(tips)
    for k in range(crown_clusters):
        p = rng.choice(tips) + Vector((rng.gauss(0, 1.7), rng.gauss(0, 1.7), rng.gauss(0.5, 0.6))) * spread
        out = (p - cen)
        out.z *= 0.6
        out = out.normalized() if out.length > 1e-4 else Vector((0, 0, 1))
        ydir = (out * 0.7 + Vector((0, 0, 0.25)) + Vector((rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), rng.uniform(-0.3, 0.3)))).normalized()
        tmp = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))).normalized()
        xdir = ydir.cross(tmp).normalized()
        sc = rng.uniform(1.6, 2.4)
        cell = rng.choice(cells)
        flat_card(mb, 'foliage_canopy', 'canopy', cell, p - ydir * 0.3, xdir, ydir, scale=sc, bend=-0.08, nseg=1)
        if rng.random() < 0.6:   # crossed second card for volume
            x2 = ydir.cross(xdir).normalized()
            flat_card(mb, 'foliage_canopy', 'canopy', rng.choice(cells), p - ydir * 0.3, x2, ydir, scale=sc * 0.9, bend=-0.08, nseg=1)
    ob = mb.finish()
    bend_normals_outward(ob, cen - Vector((0, 0, 3.0)), amount=0.7, squash=(1, 1, 0.45))
    return ob


# ───────────────────────────────────────────── undergrowth ─────────────────────────────────────────
def arching_frond(mb, key, atlas, cell, base, az, e0, droop, L, rng, fold=0.35, nseg=6, twist=0.0):
    hdir = Vector((math.cos(az), math.sin(az), 0))
    lat0 = Vector((-hdir.y, hdir.x, 0))
    spine = [base]
    for i in range(nseg):
        t = (i + 0.5) / nseg
        e = e0 - droop * t ** 1.3
        spine.append(spine[-1] + (hdir * math.cos(e) + Vector((0, 0, math.sin(e)))) * (L / nseg))

    def centre(t):
        x = t * nseg
        i = min(int(x), nseg - 1)
        return spine[i].lerp(spine[i + 1], x - i)

    def sides(t):
        x = t * nseg
        i = min(int(x), nseg - 1)
        d = (spine[i + 1] - spine[i]).normalized()
        lat = (lat0 - d * lat0.dot(d)).normalized()
        up = d.cross(lat).normalized()
        if up.z < 0:
            up = -up
        a = twist * t
        return lat * math.cos(a) + up * math.sin(a), up * math.cos(a) - lat * math.sin(a)

    strip_card(mb, key, atlas, cell, centre, sides, nseg=nseg, ncol=3, fold_fn=lambda t: fold, length=L)


def fern_clump(name, seed, cell='fern_a', n=14, L=(1.0, 1.35), e=(25, 70), droop=(1.2, 1.8), radius=0.12):
    rng = random.Random(seed)
    mb = MB(name)
    for k in range(n):
        az = k * math.radians(137.5) + rng.uniform(-0.2, 0.2)
        base = Vector((math.cos(az) * radius * rng.random(), math.sin(az) * radius * rng.random(), 0.02))
        c = cell if cell != 'mix' else rng.choice(['fern_a', 'fern_b'])
        arching_frond(mb, 'foliage_under', 'under', c, base, az, math.radians(rng.uniform(*e)), rng.uniform(*droop),
                      rng.uniform(*L), rng, fold=math.radians(rng.uniform(12, 28)), nseg=6, twist=rng.uniform(-0.4, 0.4))
    ob = mb.finish()
    bend_normals_outward(ob, Vector((0, 0, -0.3)), amount=0.55)
    return ob


def broadleaf_clump(name, seed, n_heart=7, n_banana=3):
    """elephant-ear leaves on long petioles + a couple of torn banana/heliconia blades."""
    rng = random.Random(seed)
    mb = MB(name)
    for k in range(n_heart):
        az = k * math.radians(137.5) + rng.uniform(-0.3, 0.3)
        hdir = Vector((math.cos(az), math.sin(az), 0))
        plen = rng.uniform(0.6, 1.2)
        p0 = hdir * rng.uniform(0.0, 0.1)
        p1 = p0 + hdir * plen * 0.35 + Vector((0, 0, plen))
        pts = [p0.lerp(p1, i / 6) + Vector((0, 0, -0.08 * math.sin(math.pi * i / 6))) for i in range(7)]
        # petiole: thin 4-sided tube (bark material)
        tube(mb, pts, lambda i, t: 0.016 * (1 - 0.5 * t), 4, 'tree_bark', 1.5, u_tiles=1)
        # blade: tip pointing outward & down, base (sinus) at the petiole top
        c, u0, v0, uw, vh = cell_uv('under', 'heart')
        tilt = math.radians(rng.uniform(25, 55))
        ydir = (hdir * math.cos(tilt) - Vector((0, 0, math.sin(tilt)))).normalized()
        xdir = Vector((0, 0, 1)).cross(hdir).normalized()
        sc = rng.uniform(0.8, 1.25)
        flat_card(mb, 'foliage_under', 'under', 'heart', p1 - ydir * 0.05 * sc, xdir, ydir, scale=sc, bend=-0.12, nseg=4)
    for k in range(n_banana):
        az = rng.uniform(0, TAU)
        arching_frond(mb, 'foliage_under', 'under', 'banana', Vector((0, 0, 0.0)), az, math.radians(rng.uniform(55, 75)),
                      rng.uniform(1.4, 2.0), rng.uniform(1.4, 1.9), rng, fold=math.radians(10), nseg=6, twist=rng.uniform(-0.5, 0.5))
    ob = mb.finish()
    bend_normals_outward(ob, Vector((0, 0, -0.2)), amount=0.4)
    return ob


def vines(name, seed, n=12, span=3.0, length=(3.0, 7.5)):
    """hanging vine curtain: crossed strip cards (1 m atlas cell repeated per metre) + 3 woody lianas.
    origin = top anchor plane (vines hang down to −length)."""
    rng = random.Random(seed)
    mb = MB(name)
    for k in range(n):
        x, y = rng.uniform(-span / 2, span / 2), rng.uniform(-span / 4, span / 4)
        Lk = rng.uniform(*length)
        sway = Vector((rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), 0))
        cell = rng.choice(['vine_a', 'vine_b'])
        c, u0, v0, uw, vh = cell_uv('under', cell)
        mpu = c['m_per_uv']
        segL = c['length_m']
        nseg = int(math.ceil(Lk / segL))
        rot = rng.uniform(0, math.pi)
        for cross in (0, 1):
            a = rot + cross * math.pi / 2
            xd = Vector((math.cos(a), math.sin(a), 0))
            half = uw / 2 * mpu
            for s in range(nseg):
                z0, z1 = -s * segL, -min(Lk, (s + 1) * segL)
                frac = (z0 - z1) / segL
                pa = Vector((x, y, z0)) + sway * (s / nseg) ** 2
                pb = Vector((x, y, z1)) + sway * ((s + 1) / nseg) ** 2
                # cell runs bottom (anchor) → top: hang it upside down so the leaves point down
                vt = c['anchor'][1] + segL / mpu
                vb = vt - frac * (segL / mpu)
                vs = [mb.bm.verts.new(pa - xd * half), mb.bm.verts.new(pa + xd * half), mb.bm.verts.new(pb + xd * half), mb.bm.verts.new(pb - xd * half)]
                mb.quad(vs, [(u0, vt), (u0 + uw, vt), (u0 + uw, vb), (u0, vb)], 'foliage_under')
    for k in range(3):
        x0 = rng.uniform(-span / 2, span / 2)
        Lk = rng.uniform(4, 8)
        pts = [Vector((x0 + 0.3 * math.sin(i * 0.7 + k), 0.2 * math.cos(i * 0.5), -Lk * i / 16)) for i in range(17)]
        tube(mb, pts, lambda i, t: 0.035 * (1 - 0.4 * t), 6, 'tree_bark', 1.5, u_tiles=1)
    return mb.finish()


# ───────────────────────────────────────────── driver ──────────────────────────────────────────────
SPECS = {
    'palm_a': lambda: palm('palm_a', 101, H=10.5, lean=2.4, n_fronds=18, torn_share=0.25, dead=3, curve=0.2),
    'palm_b': lambda: palm('palm_b', 102, H=7.6, lean=2.0, n_fronds=15, torn_share=0.5, dead=4, curve=0.5, frond_len=3.7),
    'tree_kapok': lambda: rainforest_tree('tree_kapok', 201, H=18.0, r_top=0.6, r_base=0.95, n_fins=6, reach=(2.4, 4.0),
                                          fin_h=(3.0, 5.0), n_limbs=7, limb_len=(10, 13), crown_clusters=1250, spread=1.0),
    'tree_fig': lambda: rainforest_tree('tree_fig', 202, H=12.0, r_top=0.7, r_base=1.0, n_fins=8, reach=(1.6, 3.2),
                                        fin_h=(2.0, 3.5), n_limbs=8, limb_len=(8, 10.5), crown_clusters=1150, spread=0.95),
    'fern_a': lambda: fern_clump('fern_a', 301, 'fern_a', n=14, L=(1.0, 1.35), e=(30, 70), droop=(1.3, 1.9)),
    'fern_b': lambda: fern_clump('fern_b', 302, 'mix', n=18, L=(0.8, 1.15), e=(45, 80), droop=(1.0, 1.6), radius=0.2),
    'undergrowth_broadleaf': lambda: broadleaf_clump('undergrowth_broadleaf', 303, n_heart=7, n_banana=3),
    'vines_hanging': lambda: vines('vines_hanging', 401, n=12, span=3.0),
}
KIND = {'palm_a': 'palm', 'palm_b': 'palm', 'tree_kapok': 'tree', 'tree_fig': 'tree', 'fern_a': 'fern', 'fern_b': 'fern',
        'undergrowth_broadleaf': 'fern', 'vines_hanging': 'vine'}


def build(name, preview=False):
    reset_scene()
    world_color((0.5, 0.5, 0.5), 1.0)
    _mats.clear()
    ob = SPECS[name]()
    ntri = tri_count(ob)
    path = os.path.join(GLB, f'{name}.glb')
    nbytes = export_glb(path, [ob])
    d = ob.dimensions
    write_manifest_entry(name, {'_cat': 'models', 'file': f'glb/{name}.glb', 'tris': ntri, 'bytes': nbytes,
                                'size_m': [round(d.x, 2), round(d.z, 2), round(d.y, 2)], 'kind': KIND[name],
                                'textures': 'referenced ../tex/ (bark sets + foliage atlases)'})
    log(f'{name}: {ntri} tris, {nbytes / 1e3:.0f} KB, dims {tuple(round(x, 2) for x in d)}')
    if preview:
        preview_render(os.path.join(PREVIEW, f'glb_{name}.jpg'), [ob], size=(480, 640), samples=24,
                       cam_dir=(1.0, -1.6, 0.35), fov=40)


if __name__ == '__main__':
    a = script_args()
    names = [x for x in a if x in SPECS] or list(SPECS)
    for n in names:
        build(n, preview='--preview' in a)
