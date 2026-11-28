# tools/blender/sky.py — stormy-sky environment maps rendered with Cycles (world shader only, no volumes).
#
#   blender -b --python tools/blender/sky.py -- [storm_day] [storm_night] [--res 2048] [--samples 16]
#   → src/real/assets/env/<name>.hdr (Radiance RGBE, equirectangular 2:1) + out/blender_preview/env_<name>.jpg
#
# Orientation = three.js equirect convention (RGBELoader + EquirectangularReflectionMapping):
#   image centre column = +X, u=0.25 = −Z, u=0.75 = +Z, top row = +Y. The camera rotation below was verified
#   with direction markers. The shader works in three.js space (x, y-up, z): t = (bx, bz, −by).
# Clouds: a planar cloud deck (direction / (y + ε)) filled with warped fBm; fake single-scatter lighting from
# the density gradient toward the (hidden) sun/moon; coverage thins near the horizon in the sun's azimuth to
# open a bright break. Luminance is scene-linear (ACES at exposure 1: clouds ≈ 0.1–0.5, break ≈ 3–8, sun glow ≈ 30).
import os, sys, math, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_common import *

PRESETS = {
    # az: azimuth of the bright break in three.js space, measured from +X toward +Z (−90° = −Z = "in front of"
    # a camera at +Z looking at the origin). el: elevation of the hidden sun/moon.
    'storm_day': dict(az=-90.0, el=7.0, cover=0.9, break_w=0.62, sky_zen=(0.15, 0.17, 0.20), sky_hor=(0.50, 0.53, 0.58),
                      break_col=(1.7, 1.75, 1.8), edge_w=0.15,
                      sun=(9.0, 9.2, 9.5), glow=(0.55, 0.57, 0.6), cloud_dark=(0.032, 0.037, 0.045), cloud_lit=(0.22, 0.24, 0.27),
                      scud=(0.03, 0.034, 0.04), ground=(0.030, 0.031, 0.032), sea_sheen=0.5, scale=1.0, seed=3.0),
    'storm_night': dict(az=-60.0, el=32.0, cover=0.92, break_w=0.0, sky_zen=(0.0025, 0.0032, 0.005), sky_hor=(0.006, 0.0075, 0.010),
                        break_col=(0, 0, 0), edge_w=0.1,
                        sun=(0.16, 0.175, 0.2), glow=(0.016, 0.019, 0.025), cloud_dark=(0.0012, 0.0014, 0.0019), cloud_lit=(0.007, 0.0082, 0.0105),
                        scud=(0.0012, 0.0014, 0.0018), ground=(0.0012, 0.0013, 0.0015), sea_sheen=0.25, scale=1.0, seed=11.0,
                        moon_patch=True),
}


def build_world(name, P):
    w = bpy.data.worlds.new('W_' + name)
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    g = G(nt)
    bg = nt.nodes['Background']
    tc = g.node('ShaderNodeTexCoord')
    bd = g.sep(g.vm('NORMALIZE', tc.outputs['Generated']))
    tx, ty, tz = bd[0], bd[2], g.mul(bd[1], -1.0)
    az, el = math.radians(P['az']), math.radians(P['el'])
    s = (math.cos(az) * math.cos(el), math.sin(el), math.sin(az) * math.cos(el))
    sh = (math.cos(az), math.sin(az))
    cosang = g.add(g.add(g.mul(tx, s[0]), g.mul(ty, s[1])), g.mul(tz, s[2]))       # cos(angle to sun)
    up = g.mx(ty, 0.0)
    # horizontal azimuth closeness to the break
    hl = g.sqrt(g.add(g.add(g.mul(tx, tx), g.mul(tz, tz)), 1e-6))
    azc = g.div(g.add(g.mul(tx, sh[0]), g.mul(tz, sh[1])), hl)
    # cloud-deck projection (planar), ε keeps the horizon finite
    inv = g.div(1.0, g.add(up, 0.09))
    px, pz = g.mul(tx, inv), g.mul(tz, inv)
    seed = P['seed']

    def dens(ox, oz, sc, det, sd):
        vec = g.comb(g.add(g.mul(px, sc), ox), g.add(g.mul(pz, sc), oz), sd)
        wv = g.noise(vec, None, scale=0.35, detail=3, rough=0.5, out='Color')
        wvs = g.sep(wv)
        vec2 = g.comb(g.add(g.add(g.mul(px, sc), ox), g.mul(g.sub(wvs[0], 0.5), 1.6)),
                      g.add(g.add(g.mul(pz, sc), oz), g.mul(g.sub(wvs[1], 0.5), 1.6)), sd)
        return g.noise(vec2, None, scale=0.9, detail=det, rough=0.53, lac=2.1)

    # coverage: overcast, opening into a break near the horizon toward the sun (and thinning round the moon)
    cov = P['cover']
    brk = 0.0
    if P['break_w'] > 0:
        brk = g.mul(g.sstep(1.0 - P['break_w'], 0.985, azc), g.sub(1.0, g.sstep(0.015, 0.22, up)))
        cov = g.sub(cov, g.mul(brk, 0.8))
    if P.get('moon_patch'):
        mp = g.sstep(0.93, 0.995, cosang)
        cov = g.sub(cov, g.mul(mp, 0.35))
    SC = 2.6
    n0 = dens(0.0, 0.0, SC, 10.0, seed)
    off = 0.05
    n1 = dens(sh[0] * off, sh[1] * off, SC, 10.0, seed)               # sampled a little toward the light
    lo = g.sub(0.64, g.mul(cov, 0.46))
    hi = g.sub(0.92, g.mul(cov, 0.36))
    thick = g.sstep(lo, hi, n0)
    thick1 = g.sstep(lo, hi, n1)
    relief = g.mul(g.sub(thick, thick1), 6.0)                         # >0: slope facing the light
    # big dark storm cores and lighter thin zones
    core = g.noise(g.comb(g.mul(px, 0.5), g.mul(pz, 0.5), seed + 9.0), None, scale=1.0, detail=4, rough=0.5)
    core = g.sstep(0.45, 0.68, core)
    # sky behind the clouds (+ a faint high deck)
    hor = g.sub(1.0, g.sstep(0.0, 0.45, up))
    sky = g.mixc(P['sky_zen'], P['sky_hor'], g.pow(hor, 1.5))
    glow1 = g.pow(g.mx(cosang, 0.0), 6.0)
    glow2 = g.pow(g.mx(cosang, 0.0), 60.0)
    glow3 = g.pow(g.mx(cosang, 0.0), 2500.0)
    glow = g.add(g.add(g.mul(glow1, 1.0), g.mul(glow2, 3.0)), g.mul(glow3, 40.0))
    if P['break_w'] > 0:
        sky = g.mixc(sky, P['break_col'], g.mul(brk, g.sub(1.0, g.sstep(0.0, 0.2, up))))
    sky = g.mixc(sky, g.mixc(sky, P['sun'], 1.0, 'ADD'), g.mul(glow, 0.25))
    # cloud radiance
    cc = g.mixc(P['cloud_lit'], P['cloud_dark'], g.pow(thick, 1.4))
    cc = g.mixc(cc, g.mixc(cc, (0.45, 0.45, 0.48), 1.0, 'MULTIPLY'), g.mul(core, 0.8))
    fwd = g.add(g.mul(glow1, 1.2), g.mul(glow2, 2.5))
    edge = g.clamp01(g.add(relief, g.mul(g.sub(1.0, thick), 0.6)))
    cc = g.mixc(cc, g.mixc(cc, P['glow'], 1.0, 'ADD'), g.clamp01(g.mul(edge, g.add(P['edge_w'], fwd))))
    cc = g.mixc(cc, g.mixc(cc, (0.6, 0.6, 0.62), 1.0, 'MULTIPLY'), g.clamp01(g.mul(relief, -0.8)))
    # haze toward the horizon (clouds fade into the bright distance)
    haze = g.sub(1.0, g.sstep(0.0, 0.12, up))
    alpha = g.clamp01(g.mul(thick, 1.8))
    cc = g.mixc(cc, g.mixc(P['cloud_dark'], P['cloud_lit'], 0.55), g.mul(haze, 0.7))
    col = g.mixc(sky, cc, alpha)
    # low fast scud fragments (darker, lower deck)
    inv2 = g.div(1.0, g.add(up, 0.03))
    vec_s = g.comb(g.add(g.mul(g.mul(tx, inv2), 5.0), 7.0), g.add(g.mul(g.mul(tz, inv2), 5.0), 3.0), seed + 5.0)
    scud_n = g.noise(vec_s, None, scale=1.0, detail=7, rough=0.62)
    scud = g.mul(g.sstep(0.56, 0.7, scud_n), g.sstep(0.0, 0.06, up))
    col = g.mixc(col, P['scud'], g.mul(scud, 0.8))
    # rain curtains: vertical streaky veils under the deck
    rv = g.noise(g.comb(g.mul(g.m('ARCTAN2', tz, tx), 14.0), g.mul(ty, 0.5), seed + 2.0), None, scale=1.0, detail=3)
    rain = g.mul(g.mul(g.sstep(0.52, 0.72, rv), g.sub(1.0, g.sstep(0.0, 0.18, up))), 0.4)
    col = g.mixc(col, g.mixc(col, (1.45, 1.45, 1.5), 1.0, 'MULTIPLY'), rain)
    # below the horizon: dark sea/ground, a sheen under the break
    below = g.sstep(0.0, -0.02, ty)
    dn = g.mx(g.mul(ty, -1.0), 0.0)
    sheen = g.mul(g.pow(g.mx(azc, 0.0), 8.0), g.sub(1.0, g.sstep(0.0, 0.35, dn)))
    gcol = g.mixc(P['ground'], P['sky_hor'], g.mul(sheen, P['sea_sheen'] * 0.25))
    col = g.mixc(col, gcol, below)
    nt.links.new(col, bg.inputs['Color'])
    bg.inputs['Strength'].default_value = 1.0
    return w


def render_sky(name, res=2048, samples=24):
    reset_scene()
    P = PRESETS[name]
    build_world(name, P)
    sc = bpy.context.scene
    cd = bpy.data.cameras.new('pano')
    cd.type = 'PANO'
    try:
        cd.panorama_type = 'EQUIRECTANGULAR'
    except Exception:
        cd.cycles.panorama_type = 'EQUIRECTANGULAR'
    cam = bpy.data.objects.new('pano', cd)
    link_obj(cam)
    cam.rotation_euler = (math.radians(90), 0, math.radians(-90))   # → three.js equirect convention
    sc.camera = cam
    sc.render.resolution_x, sc.render.resolution_y = res, res // 2
    sc.render.resolution_percentage = 100
    sc.cycles.samples = samples
    sc.cycles.pixel_filter_type = 'BLACKMAN_HARRIS'
    sc.cycles.filter_width = 1.5
    sc.render.film_transparent = False
    t0 = time.time()
    bpy.ops.render.render()
    log(f'{name}: rendered {res}x{res // 2} @{samples}spp in {time.time() - t0:.1f}s')
    rr = bpy.data.images['Render Result']
    s = sc.render.image_settings
    s.file_format = 'HDR'
    s.color_mode = 'RGB'
    out = os.path.join(ENV, f'{name}.hdr')
    rr.save_render(out, scene=sc)
    s.file_format = 'JPEG'
    s.quality = 88
    sc.view_settings.view_transform = 'Filmic' if name == 'storm_day' else 'Standard'
    sc.view_settings.exposure = 0.0 if name == 'storm_day' else 4.0
    rr.save_render(os.path.join(PREVIEW, f'env_{name}.jpg'), scene=sc)
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.exposure = 0.0
    write_manifest_entry(name, {'_cat': 'env', 'file': f'env/{name}.hdr', 'size': [res, res // 2], 'bytes': os.path.getsize(out),
                                'break_azimuth_deg': PRESETS[name]['az'], 'light_elevation_deg': PRESETS[name]['el'],
                                'note': 'azimuth measured in three.js space from +X toward +Z; -90 = -Z'})
    log('wrote', out, os.path.getsize(out))


if __name__ == '__main__':
    a = script_args()
    res = int(a[a.index('--res') + 1]) if '--res' in a else 2048
    spp = int(a[a.index('--samples') + 1]) if '--samples' in a else 16
    names = [x for x in a if x in PRESETS] or list(PRESETS)
    for n in names:
        render_sky(n, res, spp)
