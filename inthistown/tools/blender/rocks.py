# tools/blender/rocks.py — rocks, boulders, cliff chunks, sea stack and a cave mouth (hi-poly → low-poly + bakes).
#
#   blender -b --python tools/blender/rocks.py -- [name ...] [--preview]
#   → src/real/assets/glb/<name>.glb (+ out/blender_preview/glb_<name>.jpg with --preview)
#
# Pipeline per asset (all deterministic, seeded):
#   1. shape: ellipsoid / superellipsoid sampled from an icosphere, macro noise, planar fracture cuts (smooth-
#      clamped → flat facets with rounded edges), strata ledges / notches for cliffs, booleans for the cave;
#   2. voxel remesh → uniform dense hi-poly (~100–400k tris) + detail displacement along normals
#      (ridged fBm, voronoi crackle, strata);
#   3. low-poly = collapse-decimate of the hi-poly to the budget, Smart-UV unwrapped;
#   4. Cycles bakes hi→lo: tangent normal (OpenGL), albedo (diffuse colour), roughness, AO → ORM;
#      the hi-poly carries a procedural material (object-space noise, cavity AO, pointiness edge wear,
#      moss on up-facing surfaces, intertidal algae + barnacles, wet streaks, bump micro-detail);
#   5. glTF: basecolor JPEG + normal PNG + ORM PNG embedded; origin at the base centre, +Y up, metres.
import os, sys, math, time, random, array
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_common import *

N = noise


def fbm(p, oct=4, H=1.0, lac=2.0):
    return N.fractal(p, H, lac, oct, noise_basis='PERLIN_NEW')


def ridged(p, oct=5):
    return N.ridged_multi_fractal(p, 1.0, 2.1, oct, 1.0, 2.0, noise_basis='PERLIN_NEW')


def smooth_relu(s, k):
    return 0.5 * (s + math.sqrt(s * s + k * k)) - 0.5 * k


# ───────────────────────────────────────────── shapes ──────────────────────────────────────────────
def ico(subdiv=6):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=1.0)
    return bm


def shape_rock(S, rng):
    """returns an object with the macro shape (not yet remeshed)."""
    bm = ico(6)
    dims = Vector(S['dims'])
    size = max(dims)
    seed = Vector((rng.uniform(-100, 100), rng.uniform(-100, 100), rng.uniform(-100, 100)))
    cuts = []
    for i in range(S.get('joints', 0)):          # cliffs: vertical joint faces + sloping ledges shaving the surface
        th = rng.uniform(0, TAU)
        ph = rng.uniform(-0.15, 0.15) if rng.random() < 0.75 else rng.uniform(0.35, 0.8)
        n = Vector((math.cos(th) * math.cos(ph), math.sin(th) * math.cos(ph), math.sin(ph))).normalized()
        ext = math.sqrt(sum((n[k] * dims[k]) ** 2 for k in range(3)))
        cuts.append((n, ext * rng.uniform(*S.get('joint_range', (0.86, 0.98)))))
    for i in range(S.get('cuts', 5)):
        th = rng.uniform(0, TAU)
        ph = rng.uniform(-0.35, 0.95)
        n = Vector((math.cos(th) * math.cos(ph), math.sin(th) * math.cos(ph), math.sin(ph))).normalized()
        ext = math.sqrt(sum((n[k] * dims[k]) ** 2 for k in range(3)))
        cuts.append((n, ext * rng.uniform(*S.get('cut_range', (0.62, 0.85)))))
    cuts.append((Vector((0, 0, -1)), dims.z * S.get('bottom', 0.55)))   # flat-ish base
    k = size * S.get('round', 0.05)
    ex = S.get('super', 1.0)
    for v in bm.verts:
        d = v.co.normalized()
        if ex != 1.0:  # superellipsoid-ish (boxier)
            d = Vector([math.copysign(abs(c) ** ex, c) for c in d])
        p = Vector((d.x * dims.x, d.y * dims.y, d.z * dims.z))
        p *= 1.0 + S.get('macro', 0.15) * fbm(d * 1.3 + seed, 3) + 0.05 * fbm(d * 3.7 + seed, 3)
        if 'taper' in S:  # narrower toward the top
            t = (p.z / dims.z + 1) / 2
            p.x *= 1 - S['taper'] * t
            p.y *= 1 - S['taper'] * t
        for n, dist in cuts:
            s = p.dot(n) - dist
            if s > -3 * k:
                p -= n * smooth_relu(s, k)
        v.co = p
    me = bpy.data.meshes.new('shape')
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new('shape', me)
    link_obj(ob)
    return ob


def remesh(ob, voxel):
    m = ob.modifiers.new('rm', 'REMESH')
    m.mode = 'VOXEL'
    m.voxel_size = voxel
    m.adaptivity = 0.0
    m.use_smooth_shade = True
    apply_modifiers(ob)


def displace_detail(ob, S, rng, size):
    """detail displacement along vertex normals (Python, mathutils.noise)."""
    me = ob.data
    seed = Vector((rng.uniform(-100, 100), rng.uniform(-100, 100), rng.uniform(-100, 100)))
    a_r, a_f, a_c = S.get('detail', (0.012, 0.005, 0.008))
    fr = S.get('freq', 1.0) / size
    strata = S.get('strata', 0.0)
    sk = S.get('strata_k', 6.0)
    ledge = S.get('ledge', 0.0)
    blocky = S.get('blocky', 0.0)
    me.calc_normals_split() if False else None
    nrm = [v.normal.copy() for v in me.vertices]
    for v, n in zip(me.vertices, nrm):
        p = v.co
        q = p * fr * 3.0 + seed
        h = a_r * size * (ridged(q, 5) - 0.8) * 0.5
        h += a_f * size * fbm(p * fr * 18.0 + seed, 4)
        # crackle: thin cracks along voronoi cell borders
        dists, _ = N.voronoi(p * fr * 5.0 + seed, distance_metric='DISTANCE')
        e = dists[1] - dists[0]
        cm = fbm(p * fr * 1.7 + seed * 1.3, 2)
        if cm > 0.22:
            h -= a_c * size * max(0.0, 1.0 - e / 0.05) ** 2 * min(1.0, (cm - 0.05) * 5)
        if strata > 0:
            z = p.z * sk / size + 0.9 * fbm(p * fr * 1.2 + seed, 3) + 0.25 * fbm(p * fr * 4.0 + seed, 2)
            f = z - math.floor(z)
            vis = min(1.0, max(0.0, 0.5 + 1.5 * fbm(p * fr * 0.9 + seed * 0.7, 2)))
            h += strata * size * vis * (min(1.0, f / 0.85) - (0.0 if f < 0.85 else (f - 0.85) / 0.15))
        if blocky > 0:  # stepped (quantized) fields → sharp ledges (z-biased) and vertical joint blocks
            for kk, scl, wgt in ((5.0, Vector((0.35, 0.35, 1.4)), 1.0), (3.0, Vector((1.3, 1.3, 0.25)), 0.7)):
                q = fbm(Vector((p.x * scl.x, p.y * scl.y, p.z * scl.z)) * fr * 1.1 + seed * 0.5, 3) * kk
                fq = q - math.floor(q)
                stp = (math.floor(q) + (0.0 if fq < 0.82 else (fq - 0.82) / 0.18)) / kk
                h += blocky * size * wgt * stp
        if ledge > 0:   # horizontal ledges/overhangs pushed outward on side walls only
            side = 1.0 - abs(n.z)
            z = p.z * S.get('ledge_k', 2.0) / size + 0.8 * fbm(p * fr * 0.8 + seed * 0.3, 2)
            f = z - math.floor(z)
            vis = min(1.0, max(0.0, 0.4 + 1.5 * fbm(p * fr * 0.6 + seed * 0.4, 2)))
            h += ledge * size * side * vis * (f ** 3)
        v.co = p + n * h


def bottom_to_origin(ob, sink=0.0):
    zs = [v.co.z for v in ob.data.vertices]
    xs = [v.co.x for v in ob.data.vertices]
    ys = [v.co.y for v in ob.data.vertices]
    off = Vector(((max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2, min(zs) + sink * (max(zs) - min(zs))))
    for v in ob.data.vertices:
        v.co -= off
    return off


# ───────────────────────────────────────────── procedural hi-poly material ─────────────────────────
ROCK_LOOKS = {
    'beach':   dict(c0=(0.024, 0.024, 0.025), c1=(0.062, 0.059, 0.056), c2=(0.115, 0.108, 0.10), moss=0.0, algae=1.0, lichen=0.4, rough=0.46, strata=0.2),
    'mossy':   dict(c0=(0.022, 0.022, 0.020), c1=(0.060, 0.057, 0.052), c2=(0.11, 0.105, 0.095), moss=1.0, algae=0.0, lichen=0.7, rough=0.42, strata=0.0),
    'granite': dict(c0=(0.05, 0.048, 0.045), c1=(0.12, 0.115, 0.105), c2=(0.22, 0.21, 0.195), moss=0.25, algae=0.4, lichen=0.6, rough=0.45, strata=0.0),
    'cliff':   dict(c0=(0.030, 0.029, 0.028), c1=(0.075, 0.070, 0.064), c2=(0.13, 0.12, 0.108), moss=0.35, algae=1.0, lichen=0.8, rough=0.5, strata=1.0),
}


def rock_material(name, look, size, ground_z):
    L = ROCK_LOOKS[look]
    mat, nt, g = new_material(name)
    co = g.node('ShaderNodeTexCoord').outputs['Object']
    geo = g.node('ShaderNodeNewGeometry')
    nz = g.sep(geo.outputs['Normal'])[2]
    z = g.sep(co)[2]
    s = 1.0 / size
    big = g.noise(co, None, scale=0.8 * s, detail=4, rough=0.55)
    mid = g.noise(co, None, scale=4.0 * s, detail=5, rough=0.55)
    fine = g.noise(co, None, scale=30.0 * s, detail=6, rough=0.6)
    grain = g.noise(co, None, scale=200.0 * s, detail=2, rough=0.6)
    cav = g.sstep(0.35, 0.6, geo.outputs['Pointiness'])                   # cheap concavity proxy (AO is baked separately)
    pt = geo.outputs['Pointiness']
    tone = g.add(g.mul(big, 0.45), g.add(g.mul(mid, 0.35), g.mul(fine, 0.2)))
    if L['strata'] > 0:
        band = g.noise(g.comb(g.mul(g.sep(co)[0], 0.6 * s), g.mul(g.sep(co)[1], 0.6 * s), g.mul(z, 6.0 * s)), None, scale=1.0, detail=4)
        tone = g.lerp(tone, band, 0.22 * L['strata'])
    col = g.ramp(tone, [(0.25, L['c0']), (0.5, L['c1']), (0.75, L['c2'])])
    col = g.mixc(col, g.mixc(col, (1.25, 1.22, 1.18), 1.0, 'MULTIPLY'), g.mul(g.sub(grain, 0.5), 1.2))
    # cavity darkening + edge wear (pointiness)
    col = g.mixc(g.mixc(col, (0.55, 0.55, 0.55), 1.0, 'MULTIPLY'), col, cav)
    col = g.mixc(col, g.mixc(col, (1.6, 1.58, 1.55), 1.0, 'MULTIPLY'), g.mul(g.sstep(0.52, 0.6, pt), 0.6))
    rough = g.add(L['rough'], g.mul(g.sub(fine, 0.5), 0.25))
    rough = g.lerp(rough, g.add(rough, 0.2), g.sstep(0.52, 0.6, pt))
    # dark wet run-off streaks (vertical)
    streak = g.noise(g.comb(g.mul(g.sep(co)[0], 6.0 * s), g.mul(g.sep(co)[1], 6.0 * s), g.mul(z, 0.6 * s)), None, scale=1.0, detail=4)
    streak = g.mul(g.sstep(0.55, 0.68, streak), g.sub(1.0, g.absf(nz)))
    col = g.mixc(col, g.mixc(col, (0.5, 0.5, 0.52), 1.0, 'MULTIPLY'), g.mul(streak, 0.8))
    rough = g.lerp(rough, 0.24, streak)
    # lichen spots on upper, drier faces
    lv = g.voronoi(co, None, scale=14.0 * s, feature='F1')
    lich = g.mul(g.sub(1.0, g.sstep(0.18, 0.42, lv.outputs['Distance'])), g.sstep(0.72, 0.78, g.sepc(lv.outputs['Color'])[0]))
    lich = g.mul(g.mul(lich, g.sstep(0.0, 0.6, nz)), L['lichen'])
    col = g.mixc(col, (0.22, 0.23, 0.19), g.mul(lich, 0.85))
    # moss cushions on up-facing surfaces
    height_n = g.add(0.0, 0.0)
    if L['moss'] > 0:
        mn = g.noise(co, None, scale=2.2 * s, detail=6, rough=0.6)
        fuzz = g.noise(co, None, scale=120.0 * s, detail=3, rough=0.7)
        moss = g.mul(g.sstep(0.25, 0.75, nz), g.sstep(0.42, 0.55, g.add(mn, g.mul(cav, 0.15))))
        moss = g.mul(moss, L['moss'])
        mcol = g.ramp(g.add(g.mul(mn, 0.5), g.mul(fuzz, 0.5)),
                      [(0.25, (0.012, 0.022, 0.006)), (0.5, (0.030, 0.050, 0.012)), (0.75, (0.062, 0.080, 0.020)), (1.0, (0.10, 0.11, 0.035))])
        col = g.mixc(col, mcol, moss)
        rough = g.lerp(rough, g.add(0.65, g.mul(fuzz, 0.2)), moss)
        height_n = g.mul(moss, g.add(0.6, g.mul(fuzz, 0.6)))
    # intertidal band: dark slimy algae + barnacles near the base
    if L['algae'] > 0:
        band_h = 0.16 * size if look != 'cliff' else 1.8
        low = g.sub(1.0, g.sstep(ground_z, g.add(ground_z, band_h), g.add(z, g.mul(g.sub(mid, 0.5), 0.4 * band_h))))
        low = g.mul(low, L['algae'])
        acol = g.ramp(fine, [(0.3, (0.014, 0.016, 0.010)), (0.7, (0.035, 0.038, 0.020))])
        col = g.mixc(col, acol, g.mul(low, 0.75))
        rough = g.lerp(rough, 0.16, low)
        bv = g.voronoi(co, None, scale=90.0 * s if look != 'cliff' else 25.0, feature='F1')
        barn = g.mul(g.sub(1.0, g.sstep(0.15, 0.38, bv.outputs['Distance'])), g.sstep(0.80, 0.84, g.sepc(bv.outputs['Color'])[1]))
        barn = g.mul(barn, g.mul(g.sstep(0.5, 0.9, low), g.sstep(0.5, 0.6, mid)))
        col = g.mixc(col, (0.30, 0.29, 0.27), barn)
        rough = g.lerp(rough, 0.7, barn)
        height_n = g.add(height_n, g.mul(barn, 0.5))
    # micro bump (baked into the normal map)
    crk = g.voronoi(co, None, scale=10.0 * s, feature='DISTANCE_TO_EDGE')
    bump_h = g.add(g.mul(fine, 0.6), g.mul(grain, 0.25))
    crk_m = g.sstep(0.55, 0.65, g.noise(co, None, scale=1.5 * s, detail=2))
    bump_h = g.sub(bump_h, g.mul(g.mul(g.sub(1.0, g.sstep(0.0, 0.025, crk.outputs['Distance'])), crk_m), 0.3))
    bump_h = g.add(bump_h, g.mul(height_n, 0.5))
    bsdf = g.node('ShaderNodeBsdfPrincipled')
    g.set(bsdf.inputs['Base Color'], col)
    g.set(bsdf.inputs['Roughness'], g.clamp01(rough))
    bump = g.node('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.55
    bump.inputs['Distance'].default_value = 0.006 * size
    g.set(bump.inputs['Height'], bump_h)
    nt.links.new(bump.outputs[0], bsdf.inputs['Normal'])
    out = g.node('ShaderNodeOutputMaterial')
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    return mat


# ───────────────────────────────────────────── bake + export ───────────────────────────────────────
def bake_maps(name, hi, lo, res, size, ao_samples=24):
    d = os.path.join(BUILD, 'bake_' + name)
    os.makedirs(d, exist_ok=True)
    ext = (0.05 if size > 8 else 0.03) * size      # stepped cliffs deviate more from their decimated cage
    tmp, tnt, tg = new_material('bake_tmp_' + name)
    o = tg.node('ShaderNodeOutputMaterial'); b = tg.node('ShaderNodeBsdfPrincipled')
    tnt.links.new(b.outputs[0], o.inputs[0])
    lo.data.materials.clear(); lo.data.materials.append(tmp)
    t0 = time.time()
    imgs = {}
    imgs['normal'] = new_byte_image(f'{name}_normal', res, colorspace='Non-Color')
    bake(lo, imgs['normal'], 'NORMAL', samples=2, margin=16, selected_to_active=True, sources=[hi], extrusion=ext, max_ray=ext * 4)
    imgs['color'] = new_byte_image(f'{name}_color', res, colorspace='sRGB')
    log(f'{name}: normal {time.time() - t0:.1f}s')
    bake(lo, imgs['color'], 'DIFFUSE', samples=2, margin=16, selected_to_active=True, sources=[hi], extrusion=ext, max_ray=ext * 4,
         pass_filter={'COLOR'})
    rough = new_byte_image(f'{name}_rough', res, colorspace='Non-Color')
    log(f'{name}: color {time.time() - t0:.1f}s')
    bake(lo, rough, 'ROUGHNESS', samples=2, margin=16, selected_to_active=True, sources=[hi], extrusion=ext, max_ray=ext * 4)
    aoi = new_byte_image(f'{name}_ao', res // 2, colorspace='Non-Color')
    log(f'{name}: rough {time.time() - t0:.1f}s')
    bpy.context.scene.world.light_settings.distance = 0.25 * size
    bake(lo, aoi, 'AO', samples=ao_samples, margin=8, selected_to_active=True, sources=[hi], extrusion=ext, max_ray=ext * 4)
    log(f'{name}: bakes done in {time.time() - t0:.1f}s')
    # ORM: R = AO (half-res bake, bilinear-upscaled), G = roughness, B = 0; mild cavity multiplied into albedo
    ensure_numpy()
    import numpy as np
    a = np.array(image_channels(aoi), dtype=np.float32).reshape(res // 2, res // 2, 4)[..., 0]
    a = np.repeat(np.repeat(a, 2, 0), 2, 1)
    a = (a + np.roll(a, 1, 0) + np.roll(a, 1, 1) + np.roll(np.roll(a, 1, 0), 1, 1)) / 4
    r = np.array(image_channels(rough), dtype=np.float32).reshape(res, res, 4)[..., 0]
    orm = np.zeros((res, res, 4), np.float32)
    orm[..., 0] = 0.25 + 0.75 * a
    orm[..., 1] = r
    orm[..., 3] = 1
    imgs['orm'] = new_byte_image(f'{name}_orm', res, colorspace='Non-Color')
    imgs['orm'].pixels.foreach_set(orm.ravel())
    # clamp residual extreme tangent normals (sliver triangles of the decimated cage) toward +Z
    nm = np.array(image_channels(imgs['normal']), dtype=np.float32).reshape(res, res, 4)
    v = nm[..., :3] * 2 - 1
    zmin = 0.35
    bad = v[..., 2] < zmin
    if bad.any():
        xy = v[..., :2] * (np.sqrt(1 - zmin ** 2) / np.maximum(np.linalg.norm(v[..., :2], axis=-1, keepdims=True), 1e-6))
        v[bad, 0:2] = xy[bad]
        v[bad, 2] = zmin
    nm[..., :3] = v * 0.5 + 0.5
    imgs['normal'].pixels.foreach_set(nm.ravel())
    log(f'{name}: clamped {bad.mean() * 100:.2f}% extreme normal texels')
    c = np.array(image_channels(imgs['color']), dtype=np.float32).reshape(res, res, 4)
    c[..., :3] *= (0.6 + 0.4 * a)[..., None]
    imgs['color'].pixels.foreach_set(c.ravel())
    paths = {}
    for k, img in imgs.items():
        if k == 'color':
            p = os.path.join(d, f'{name}_color.jpg')
            img.filepath_raw = p
            img.file_format = 'JPEG'
            img.save()
        else:
            p = os.path.join(d, f'{name}_{k}.png')
            save_png(img, p)
        paths[k] = p
        bpy.data.images.remove(img)
    bpy.data.images.remove(rough); bpy.data.images.remove(aoi)
    return paths


def finalize_lo(name, lo, paths):
    lo.data.materials.clear()
    mat = pbr_material('M_' + name, paths['color'], normal=paths['normal'], orm=paths['orm'])
    lo.data.materials.append(mat)


# ───────────────────────────────────────────── asset specs ─────────────────────────────────────────
ASSETS_SPEC = {
    'rock_boulder':   dict(kind='rock', dims=(0.70, 0.60, 0.52), cuts=6, macro=0.14, look='beach', tris=3800, res=1024, seed=11, sink=0.06,
                           cut_range=(0.55, 0.8), round=0.04),
    'rock_slab':      dict(kind='rock', dims=(0.95, 0.60, 0.26), cuts=6, macro=0.10, look='beach', tris=3600, res=1024, seed=12, sink=0.08,
                           cut_range=(0.7, 0.9), detail=(0.010, 0.004, 0.010)),
    'rock_spire':     dict(kind='rock', dims=(0.48, 0.42, 1.00), cuts=7, macro=0.18, look='beach', tris=3900, res=1024, seed=13, sink=0.04,
                           taper=0.35, strata=0.005, strata_k=6.0),
    'rock_mossy':     dict(kind='rock', dims=(0.80, 0.68, 0.55), cuts=4, macro=0.14, look='mossy', tris=3800, res=1024, seed=14, sink=0.08, round=0.08),
    'rock_block':     dict(kind='rock', dims=(0.46, 0.40, 0.36), cuts=9, macro=0.08, look='granite', tris=3200, res=1024, seed=15, sink=0.05,
                           cut_range=(0.55, 0.75), round=0.03),
    'rock_mossy_big': dict(kind='rock', dims=(1.45, 1.20, 0.95), cuts=6, macro=0.15, look='mossy', tris=3950, res=1024, seed=16, sink=0.10, round=0.07),
    'cliff_wall':     dict(kind='cliff', dims=(9.0, 3.6, 7.0), cuts=7, macro=0.10, look='cliff', tris=9800, res=2048, seed=21, sink=0.02,
                           super=0.45, cut_range=(0.75, 0.92), detail=(0.016, 0.003, 0.005), strata=0.006, strata_k=9.0,
                           ledge=0.010, ledge_k=3.5, round=0.006, voxel=0.07, joints=46, freq=1.6, blocky=0.045),
    'sea_stack':      dict(kind='cliff', dims=(3.4, 3.0, 9.0), cuts=6, macro=0.12, look='cliff', tris=9600, res=2048, seed=22, sink=0.03,
                           super=0.6, taper=0.28, detail=(0.016, 0.003, 0.005), strata=0.007, strata_k=8.0, ledge=0.012, ledge_k=4.0,
                           round=0.006, voxel=0.06, notch=True, joints=36, freq=1.6, blocky=0.035),
    'cave_arch':      dict(kind='cave', dims=(7.5, 5.5, 4.8), cuts=6, macro=0.10, look='cliff', tris=9900, res=2048, seed=23, sink=0.0,
                           super=0.5, detail=(0.014, 0.003, 0.005), strata=0.008, strata_k=8.0, ledge=0.01, ledge_k=4.0,
                           round=0.01, voxel=0.06, bottom=0.8, joints=30, freq=1.5, blocky=0.03),
}


def notch_base(ob, S, size):
    """wave-cut notch around the base of a sea stack."""
    zs = [v.co.z for v in ob.data.vertices]
    z0 = min(zs)
    for v in ob.data.vertices:
        h = v.co.z - z0
        k = math.exp(-((h - 1.4) / 0.8) ** 2) * 0.55
        r = Vector((v.co.x, v.co.y, 0))
        if r.length > 1e-6:
            v.co -= r.normalized() * k * min(1.0, r.length / 2.0)


def make_cave(S, rng, size):
    """boxy outcrop with an arched tunnel bored in from the front (−Y) that ends in a closed chamber."""
    body = shape_rock(S, rng)
    remesh(body, S['voxel'] * 1.5)
    dims = Vector(S['dims'])
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=40, radius1=1.0, radius2=1.0, depth=1.0)
    me = bpy.data.meshes.new('tunnel'); bm.to_mesh(me); bm.free()
    tun = bpy.data.objects.new('tunnel', me); link_obj(tun)
    # cylinder along Z → along Y; arch cross-section (wide, tall), floor flattened
    floor_z = -dims.z * 0.55
    for v in tun.data.vertices:
        x, y, t = v.co.x, v.co.y, v.co.z + 0.5          # t: 0 = mouth (front), 1 = back
        depth_y = -dims.y * 1.3 + t * (dims.y * 1.55)
        w = 3.1 * (1.0 - 0.45 * t ** 2) * (1 + 0.12 * fbm(Vector((x, t * 3, 1.7)) + Vector((5, 5, 5)), 3))
        hgt = 4.3 * (1.0 - 0.4 * t ** 1.5)
        zz = floor_z + 0.25 + max(0.0, y) * hgt + min(0.0, y) * 0.9
        v.co = Vector((x * w, depth_y, zz))
    bmr = bmesh.new(); bmr.from_mesh(tun.data)
    if bmr.calc_volume(signed=True) < 0:                     # the axis remap above is a mirror → fix winding
        bmesh.ops.reverse_faces(bmr, faces=bmr.faces)
    log('tunnel volume', round(bmr.calc_volume(signed=True), 2))
    bmr.to_mesh(tun.data); bmr.free()
    sub = tun.modifiers.new('sub', 'SUBSURF'); sub.levels = 2
    apply_modifiers(tun)
    for v in tun.data.vertices:
        v.co += v.normal * 0.18 * fbm(v.co * 0.7 + Vector((3, 1, 2)), 3)
    bmb = bmesh.new(); bmb.from_mesh(body.data)
    log('body volume', round(bmb.calc_volume(signed=True), 2)); bmb.free()
    bo = body.modifiers.new('bool', 'BOOLEAN')
    bo.operation = 'DIFFERENCE'; bo.solver = 'EXACT'; bo.object = tun
    bo.use_self = True
    bo.use_hole_tolerant = True
    nb = len(body.data.polygons)
    apply_modifiers(body)
    if len(body.data.polygons) < nb * 0.5:          # exact solver gave up → retry with the fast (BMesh) solver
        log('exact boolean failed, retrying FAST')
        bpy.data.objects.remove(body, do_unlink=True)
        body = shape_rock(S, random.Random(S['seed']))
        remesh(body, S['voxel'] * 1.5)
        bo = body.modifiers.new('bool', 'BOOLEAN')
        bo.operation = 'DIFFERENCE'; bo.solver = 'FAST'; bo.object = tun
        apply_modifiers(body)
    log('cave faces', nb, '→', len(body.data.polygons))
    bpy.data.objects.remove(tun, do_unlink=True)
    return body


def build(name, preview=False):
    S = dict(ASSETS_SPEC[name])
    rng = random.Random(S['seed'])
    reset_scene()
    world_color((0.5, 0.5, 0.5), 1.0)
    t0 = time.time()
    size = max(S['dims']) * 2
    if S['kind'] == 'cave':
        hi = make_cave(S, rng, size)
    else:
        hi = shape_rock(S, rng)
    remesh(hi, S.get('voxel', size * 0.0075))
    if S.get('notch'):
        notch_base(hi, S, size)
    displace_detail(hi, S, rng, size)
    off = bottom_to_origin(hi, S.get('sink', 0.0))
    hi.name = name + '_hi'
    shade_smooth(hi)
    n_hi = len(hi.data.polygons)
    log(f'{name}: hi-poly {n_hi} faces in {time.time() - t0:.1f}s')
    # low-poly
    lo = hi.copy(); lo.data = hi.data.copy(); link_obj(lo)
    lo.name = name
    lo.data.name = name
    ntri = decimate_to(lo, S['tris'])
    shade_smooth(lo, True, auto_angle=60)          # hard edges where Smart UV splits islands → sane tangent normals
    smart_uv(lo, angle=60, margin=0.006 if S['res'] <= 1024 else 0.003, area_weight=0.0)
    log(f'{name}: low-poly {ntri} tris')
    ground_z = -0.0 if True else 0
    hi.data.materials.append(rock_material('M_hi_' + name, S['look'], size, 0.0))
    paths = bake_maps(name, hi, lo, S['res'], size)
    finalize_lo(name, lo, paths)
    # Y-up for glTF happens in the exporter (Blender Z-up → glTF Y-up)
    path = os.path.join(GLB, f'{name}.glb')
    nbytes = export_glb(path, [lo])
    dims = lo.dimensions
    write_manifest_entry(name, {'_cat': 'models', 'file': f'glb/{name}.glb', 'tris': ntri, 'bytes': nbytes,
                                'size_m': [round(dims.x, 2), round(dims.z, 2), round(dims.y, 2)],
                                'textures': 'embedded basecolor(jpg)+normal+ORM, %dpx' % S['res'], 'kind': S['kind']})
    log(f'{name}: {ntri} tris, {nbytes / 1e6:.2f} MB, {time.time() - t0:.1f}s total')
    if preview:
        bpy.data.objects.remove(hi, do_unlink=True)
        preview_render(os.path.join(PREVIEW, f'glb_{name}.jpg'), [lo], size=(640, 480), samples=32)


if __name__ == '__main__':
    a = script_args()
    names = [x for x in a if x in ASSETS_SPEC] or list(ASSETS_SPEC)
    for n in names:
        build(n, preview='--preview' in a)
