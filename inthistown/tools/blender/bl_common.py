# tools/blender/bl_common.py — shared helpers for the Blender asset scripts (Blender 4.0, headless).
#
#   blender -b --python tools/blender/<script>.py -- [args]
#
# Everything is deterministic: geometry randomness comes from random.Random(seed) / mathutils.noise with fixed
# offsets, shader randomness from fixed seed offsets, Cycles uses a fixed sampling seed.
# Blender's bundled Python has no numpy, so pixel post-processing lives in tex_post.py (system python3).
import bpy, bmesh, math, random, os, sys, array, json, struct, shutil
from mathutils import Vector, Matrix, Euler, noise

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ASSETS = os.path.join(ROOT, 'src', 'real', 'assets')
TEX = os.path.join(ASSETS, 'tex')        # tileable PBR sets + alpha atlases (PNG)
GLB = os.path.join(ASSETS, 'glb')        # models (NOT "models/": that name is in .gitignore)
ENV = os.path.join(ASSETS, 'env')        # Radiance .hdr skies
BUILD = os.path.join(ROOT, 'out', 'blender_build')   # intermediates (gitignored)
PREVIEW = os.path.join(ROOT, 'out', 'blender_preview')
for d in (TEX, GLB, ENV, BUILD, PREVIEW):
    os.makedirs(d, exist_ok=True)

TAU = math.tau


def script_args():
    return sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def log(*a):
    print('[bl]', *a, flush=True)


# ───────────────────────────────────────────── scene ─────────────────────────────────────────────
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    cy = sc.cycles
    cy.device = 'CPU'
    cy.seed = 1
    cy.use_animated_seed = False
    cy.use_denoising = False
    try:
        cy.use_adaptive_sampling = False
    except Exception:
        pass
    sc.render.threads_mode = 'FIXED'
    sc.render.threads = 4
    vs = sc.view_settings
    vs.view_transform = 'Standard'
    vs.look = 'None'
    vs.exposure = 0
    vs.gamma = 1
    sc.display_settings.display_device = 'sRGB'
    sc.sequencer_colorspace_settings.name = 'sRGB'
    sc.unit_settings.system = 'METRIC'
    sc.unit_settings.scale_length = 1.0
    return sc


def world_color(rgb=(0.05, 0.05, 0.05), strength=1.0):
    sc = bpy.context.scene
    w = bpy.data.worlds.new('World')
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (*rgb, 1)
    bg.inputs[1].default_value = strength
    return w


def link_obj(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def mesh_obj(name, bm_or_mesh):
    if isinstance(bm_or_mesh, bmesh.types.BMesh):
        me = bpy.data.meshes.new(name)
        bm_or_mesh.to_mesh(me)
        bm_or_mesh.free()
    else:
        me = bm_or_mesh
    ob = bpy.data.objects.new(name, me)
    link_obj(ob)
    return ob


def select_only(*objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0] if objs else None


def apply_modifiers(ob):
    select_only(ob)
    for m in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)


def apply_transform(ob, loc=False, rot=True, scale=True):
    select_only(ob)
    bpy.ops.object.transform_apply(location=loc, rotation=rot, scale=scale)


def tri_count(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    me = ob.evaluated_get(dg).to_mesh()
    n = sum(len(p.vertices) - 2 for p in me.polygons)
    ob.evaluated_get(dg).to_mesh_clear()
    return n


def shade_smooth(ob, smooth=True, auto_angle=None):
    for p in ob.data.polygons:
        p.use_smooth = smooth
    if auto_angle is not None:
        ob.data.use_auto_smooth = True
        ob.data.auto_smooth_angle = math.radians(auto_angle)


def join(objs, name=None):
    select_only(*objs)
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    if name:
        ob.name = name
        ob.data.name = name
    return ob


def decimate_to(ob, target_tris):
    n = tri_count(ob)
    if n <= target_tris:
        return n
    m = ob.modifiers.new('dec', 'DECIMATE')
    m.decimate_type = 'COLLAPSE'
    m.use_collapse_triangulate = True
    m.ratio = target_tris / n * 0.985
    apply_modifiers(ob)
    return tri_count(ob)


def triangulate(ob):
    m = ob.modifiers.new('tri', 'TRIANGULATE')
    m.quad_method = 'BEAUTY'
    m.ngon_method = 'BEAUTY'
    apply_modifiers(ob)


def smart_uv(ob, angle=66.0, margin=0.004, area_weight=0.0):
    select_only(ob)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=margin, area_weight=area_weight,
                             correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')


def pack_uv(ob, margin=0.004):
    select_only(ob)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.pack_islands(rotate=True, margin=margin)
    bpy.ops.object.mode_set(mode='OBJECT')


# ───────────────────────────────────────────── shader node DSL ─────────────────────────────────────
class G:
    """Tiny shader-node builder. Values may be numbers/tuples or node sockets."""

    def __init__(self, nt):
        self.nt = nt
        self.n = 0

    def node(self, typ, inputs=None, **attrs):
        nd = self.nt.nodes.new(typ)
        nd.location = ((self.n % 30) * 220, -(self.n // 30) * 300)
        self.n += 1
        for k, v in attrs.items():
            setattr(nd, k, v)
        for k, v in (inputs or {}).items():
            self.set(nd.inputs[k], v)
        return nd

    def set(self, sock, v):
        if v is None:
            return
        if isinstance(v, bpy.types.NodeSocket):
            self.nt.links.new(v, sock)
        elif isinstance(v, bpy.types.Node):
            self.nt.links.new(v.outputs[0], sock)
        else:
            if sock.type in ('RGBA',) and isinstance(v, (int, float)):
                v = (v, v, v, 1)
            elif sock.type == 'RGBA' and len(v) == 3:
                v = (*v, 1)
            elif sock.type == 'VECTOR' and isinstance(v, (int, float)):
                v = (v, v, v)
            sock.default_value = v

    # math ------------------------------------------------------------------------------------
    def m(self, op, a, b=None, c=None, clamp=False):
        nd = self.node('ShaderNodeMath', operation=op, use_clamp=clamp)
        self.set(nd.inputs[0], a)
        if b is not None:
            self.set(nd.inputs[1], b)
        if c is not None:
            self.set(nd.inputs[2], c)
        return nd.outputs[0]

    def add(self, a, b): return self.m('ADD', a, b)
    def sub(self, a, b): return self.m('SUBTRACT', a, b)
    def mul(self, a, b): return self.m('MULTIPLY', a, b)
    def div(self, a, b): return self.m('DIVIDE', a, b)
    def pow(self, a, b): return self.m('POWER', a, b)
    def mx(self, a, b): return self.m('MAXIMUM', a, b)
    def mn(self, a, b): return self.m('MINIMUM', a, b)
    def absf(self, a): return self.m('ABSOLUTE', a)
    def frac(self, a): return self.m('FRACT', a)
    def floor(self, a): return self.m('FLOOR', a)
    def sin(self, a): return self.m('SINE', a)
    def cos(self, a): return self.m('COSINE', a)
    def sqrt(self, a): return self.m('SQRT', a)
    def clamp01(self, a): return self.m('ADD', a, 0.0, clamp=True)
    def madd(self, a, b, c): return self.m('MULTIPLY_ADD', a, b, c)

    def sstep(self, e0, e1, x):
        """smoothstep(e0, e1, x) via Map Range (SMOOTHSTEP)."""
        nd = self.node('ShaderNodeMapRange', interpolation_type='SMOOTHSTEP', clamp=True)
        self.set(nd.inputs[0], x)
        self.set(nd.inputs[1], e0)
        self.set(nd.inputs[2], e1)
        self.set(nd.inputs[3], 0.0)
        self.set(nd.inputs[4], 1.0)
        return nd.outputs[0]

    def remap(self, x, a0, a1, b0=0.0, b1=1.0, clamp=True):
        nd = self.node('ShaderNodeMapRange', interpolation_type='LINEAR', clamp=clamp)
        for i, v in enumerate((x, a0, a1, b0, b1)):
            self.set(nd.inputs[i], v)
        return nd.outputs[0]

    def lerp(self, a, b, t):
        nd = self.node('ShaderNodeMix', data_type='FLOAT', clamp_factor=True)
        self.set(nd.inputs[0], t)
        self.set(nd.inputs[2], a)
        self.set(nd.inputs[3], b)
        return nd.outputs[0]

    def mixc(self, a, b, t, blend='MIX'):
        nd = self.node('ShaderNodeMix', data_type='RGBA', blend_type=blend, clamp_factor=True)
        self.set(nd.inputs[0], t)
        self.set(nd.inputs[6], a)
        self.set(nd.inputs[7], b)
        return nd.outputs[2]

    def ramp(self, x, stops, interp='LINEAR'):
        """stops: [(pos, (r,g,b)), ...] (linear colours)."""
        nd = self.node('ShaderNodeValToRGB')
        cr = nd.color_ramp
        cr.interpolation = interp
        els = cr.elements
        while len(els) < len(stops):
            els.new(0.5)
        for e, (p, c) in zip(els, stops):
            e.position = p
            e.color = (*c, 1) if len(c) == 3 else c
        self.set(nd.inputs[0], x)
        return nd.outputs[0]

    def sep(self, v):
        nd = self.node('ShaderNodeSeparateXYZ')
        self.set(nd.inputs[0], v)
        return nd.outputs

    def comb(self, x, y, z):
        nd = self.node('ShaderNodeCombineXYZ')
        self.set(nd.inputs[0], x)
        self.set(nd.inputs[1], y)
        self.set(nd.inputs[2], z)
        return nd.outputs[0]

    def vm(self, op, a, b=None, scale=None):
        nd = self.node('ShaderNodeVectorMath', operation=op)
        self.set(nd.inputs[0], a)
        if b is not None:
            self.set(nd.inputs[1], b)
        if scale is not None:
            self.set(nd.inputs['Scale'], scale)
        return nd.outputs[1] if op in ('DOT_PRODUCT', 'LENGTH', 'DISTANCE') else nd.outputs[0]

    def sepc(self, c):
        nd = self.node('ShaderNodeSeparateColor')
        self.set(nd.inputs[0], c)
        return nd.outputs

    def gray(self, c):
        nd = self.node('ShaderNodeRGBToBW')
        self.set(nd.inputs[0], c)
        return nd.outputs[0]

    def hsv(self, c, h=0.5, s=1.0, v=1.0):
        nd = self.node('ShaderNodeHueSaturation')
        self.set(nd.inputs['Color'], c)
        self.set(nd.inputs['Hue'], h)
        self.set(nd.inputs['Saturation'], s)
        self.set(nd.inputs['Value'], v)
        return nd.outputs[0]

    # textures --------------------------------------------------------------------------------
    def noise(self, vec, w=None, scale=1.0, detail=4.0, rough=0.5, lac=2.0, dist=0.0, dims=None, out='Fac'):
        dims = dims or ('4D' if w is not None else '3D')
        nd = self.node('ShaderNodeTexNoise', noise_dimensions=dims)
        self.set(nd.inputs['Vector'], vec)
        if w is not None:
            self.set(nd.inputs['W'], w)
        for k, v in (('Scale', scale), ('Detail', detail), ('Roughness', rough), ('Lacunarity', lac), ('Distortion', dist)):
            self.set(nd.inputs[k], v)
        return nd.outputs[out] if out else nd

    def musgrave(self, vec, w=None, kind='FBM', scale=1.0, detail=6.0, dim=2.0, lac=2.0, offset=0.0, gain=1.0):
        nd = self.node('ShaderNodeTexMusgrave', musgrave_dimensions='4D' if w is not None else '3D', musgrave_type=kind)
        self.set(nd.inputs['Vector'], vec)
        if w is not None:
            self.set(nd.inputs['W'], w)
        for k, v in (('Scale', scale), ('Detail', detail), ('Dimension', dim), ('Lacunarity', lac), ('Offset', offset), ('Gain', gain)):
            self.set(nd.inputs[k], v)
        return nd.outputs[0]

    def voronoi(self, vec, w=None, scale=1.0, feature='F1', rand=1.0, smooth=1.0, detail=0.0, rough=0.5, metric='EUCLIDEAN'):
        nd = self.node('ShaderNodeTexVoronoi', voronoi_dimensions='4D' if w is not None else '3D', feature=feature, distance=metric)
        self.set(nd.inputs['Vector'], vec)
        if w is not None:
            self.set(nd.inputs['W'], w)
        self.set(nd.inputs['Scale'], scale)
        self.set(nd.inputs['Randomness'], rand)
        self.set(nd.inputs['Detail'], detail)
        self.set(nd.inputs['Roughness'], rough)
        if feature == 'SMOOTH_F1':
            self.set(nd.inputs['Smoothness'], smooth)
        return nd  # outputs: Distance, Color, Position, W, Radius

    def white(self, vec, w=None):
        nd = self.node('ShaderNodeTexWhiteNoise', noise_dimensions='4D' if w is not None else '3D')
        self.set(nd.inputs['Vector'], vec)
        if w is not None:
            self.set(nd.inputs['W'], w)
        return nd  # Value, Color


class Torus:
    """Seamless tiling: map UV in [0,1)^2 onto a flat (Clifford) torus in 4D. 4D noise sampled there is exactly
    periodic in u and v with no distortion. ku/kv = how many 'unit' features fit across the tile in u/v
    (anisotropy = elongated features)."""

    def __init__(self, g, uv=None):
        self.g = g
        if uv is None:
            uv = g.node('ShaderNodeTexCoord').outputs['UV']
        s = g.sep(uv)
        self.u, self.v = s[0], s[1]
        self.cu, self.su = g.cos(g.mul(self.u, TAU)), g.sin(g.mul(self.u, TAU))
        self.cv, self.sv = g.cos(g.mul(self.v, TAU)), g.sin(g.mul(self.v, TAU))

    def at(self, ku, kv=None, seed=0.0, warp=None, warp_amt=0.0):
        """returns (vector, w) for a 4D texture node. seed shifts the domain; warp = (dx,dy,dz,dw) sockets."""
        g = self.g
        kv = ku if kv is None else kv
        ru, rv = ku / TAU, kv / TAU
        r = random.Random(int(seed * 1000) + 17)
        o = [r.uniform(-50, 50) for _ in range(4)]
        x = g.madd(self.cu, ru, o[0])
        y = g.madd(self.su, ru, o[1])
        z = g.madd(self.cv, rv, o[2])
        w = g.madd(self.sv, rv, o[3])
        if warp is not None:
            x = g.madd(warp[0], warp_amt, x)
            y = g.madd(warp[1], warp_amt, y)
            z = g.madd(warp[2], warp_amt, z)
            w = g.madd(warp[3], warp_amt, w)
        return g.comb(x, y, z), w

    def warp(self, ku, kv=None, seed=0.0, detail=3.0):
        """4 periodic noise channels in [-0.5, 0.5] for domain warping."""
        g = self.g
        out = []
        for i in range(4):
            vec, w = self.at(ku, kv, seed=seed + i * 3.1)
            out.append(g.sub(g.noise(vec, w, scale=1.0, detail=detail), 0.5))
        return out

    def local(self, vor, ku, kv=None):
        """Local 2D offset (in UV units) from a 4D voronoi feature point to the current sample point, by projecting
        the 4D offset onto the torus tangent plane. vor = node returned by G.voronoi with Vector/W from at(ku,kv)."""
        g = self.g
        kv = ku if kv is None else kv
        ru, rv = ku / TAU, kv / TAU
        # current point on torus (without seed offset: the offsets cancel in the difference p - f, so feed the same)
        return ru, rv


# ───────────────────────────────────────────── materials ──────────────────────────────────────────
def new_material(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    return mat, nt, G(nt)


def load_image(path, colorspace='sRGB', name=None):
    img = bpy.data.images.load(path, check_existing=True)
    img.colorspace_settings.name = colorspace
    if name:
        img.name = name
    return img


def pbr_material(name, color, normal=None, orm=None, rough=None, ao=None, uv_map=None, alpha_clip=None,
                 double_sided=False, normal_strength=1.0, roughness_value=0.8, metallic=0.0, base_tint=None,
                 emission=None):
    """Principled material from image files, laid out so the glTF exporter maps it 1:1:
       color → baseColorTexture (+alpha when alpha_clip), normal → normalTexture,
       orm (R=AO, G=rough, B=metal) → occlusion + metallicRoughness (same image)."""
    mat, nt, g = new_material(name)
    out = g.node('ShaderNodeOutputMaterial')
    bsdf = g.node('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    uvn = None
    if uv_map:
        uvn = g.node('ShaderNodeUVMap', uv_map=uv_map)

    def tex(path, cs):
        nd = g.node('ShaderNodeTexImage')
        nd.image = load_image(path, cs)
        nd.interpolation = 'Linear'
        if uvn:
            nt.links.new(uvn.outputs[0], nd.inputs[0])
        return nd

    if isinstance(color, str):
        tc = tex(color, 'sRGB')
        if base_tint:
            mixn = g.node('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY')
            mixn.inputs[0].default_value = 1.0
            nt.links.new(tc.outputs[0], mixn.inputs[6])
            mixn.inputs[7].default_value = (*base_tint, 1)
            nt.links.new(mixn.outputs[2], bsdf.inputs['Base Color'])
        else:
            nt.links.new(tc.outputs['Color'], bsdf.inputs['Base Color'])
        if alpha_clip is not None:
            nt.links.new(tc.outputs['Alpha'], bsdf.inputs['Alpha'])
    else:
        bsdf.inputs['Base Color'].default_value = (*color, 1)
    if normal:
        tn = tex(normal, 'Non-Color')
        nm = g.node('ShaderNodeNormalMap')
        nm.inputs['Strength'].default_value = normal_strength
        nt.links.new(tn.outputs[0], nm.inputs['Color'])
        nt.links.new(nm.outputs[0], bsdf.inputs['Normal'])
    if orm:
        to = tex(orm, 'Non-Color')
        sp = g.node('ShaderNodeSeparateColor')
        nt.links.new(to.outputs[0], sp.inputs[0])
        nt.links.new(sp.outputs[1], bsdf.inputs['Roughness'])
        nt.links.new(sp.outputs[2], bsdf.inputs['Metallic'])
        grp = gltf_settings_group()
        gn = g.node('ShaderNodeGroup')
        gn.node_tree = grp
        nt.links.new(sp.outputs[0], gn.inputs['Occlusion'])
    elif rough:
        tr = tex(rough, 'Non-Color')
        nt.links.new(tr.outputs[0], bsdf.inputs['Roughness'])
        bsdf.inputs['Metallic'].default_value = metallic
    else:
        bsdf.inputs['Roughness'].default_value = roughness_value
        bsdf.inputs['Metallic'].default_value = metallic
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*emission[0], 1)
        bsdf.inputs['Emission Strength'].default_value = emission[1]
    if alpha_clip is not None:
        mat.blend_method = 'CLIP'
        mat.alpha_threshold = alpha_clip
        mat.shadow_method = 'CLIP'
    mat.use_backface_culling = not double_sided
    return mat


_gltf_grp = None


def gltf_settings_group():
    """The custom node group the Blender glTF exporter reads ambient occlusion from."""
    global _gltf_grp
    if _gltf_grp and _gltf_grp.name in bpy.data.node_groups:
        return _gltf_grp
    grp = bpy.data.node_groups.get('glTF Material Output') or bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
    if 'Occlusion' not in grp.interface.items_tree:
        grp.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
        grp.interface.new_socket('Thickness', in_out='INPUT', socket_type='NodeSocketFloat')
    _gltf_grp = grp
    return grp


# ───────────────────────────────────────────── baking ──────────────────────────────────────────────
def new_float_image(name, w, h=None, alpha=False):
    h = h or w
    img = bpy.data.images.new(name, w, h, alpha=alpha, float_buffer=True)
    img.colorspace_settings.name = 'Non-Color'
    return img


def new_byte_image(name, w, h=None, colorspace='sRGB', alpha=False):
    h = h or w
    img = bpy.data.images.new(name, w, h, alpha=alpha, float_buffer=False)
    img.colorspace_settings.name = colorspace
    return img


def dump_raw(img, path):
    """write image pixels as float32 RGBA (rows bottom→top, Blender order) + json header."""
    n = img.size[0] * img.size[1] * 4
    buf = array.array('f', bytes(4 * n))
    img.pixels.foreach_get(buf)
    with open(path, 'wb') as f:
        buf.tofile(f)
    with open(path + '.json', 'w') as f:
        json.dump({'w': img.size[0], 'h': img.size[1]}, f)


def image_channels(img):
    n = img.size[0] * img.size[1] * 4
    buf = array.array('f', bytes(4 * n))
    img.pixels.foreach_get(buf)
    return buf


def set_image_channels(img, buf):
    img.pixels.foreach_set(buf)
    img.update()


def bake(obj, img, typ='EMIT', samples=1, margin=4, selected_to_active=False, sources=None, extrusion=0.05,
         max_ray=0.0, pass_filter=None, normal_space='TANGENT'):
    """Bake into `img` through an Image Texture node made active in every material of obj."""
    sc = bpy.context.scene
    sc.cycles.samples = samples
    sc.cycles.bake_type = typ
    bk = sc.render.bake
    bk.margin = margin
    bk.margin_type = 'EXTEND'
    bk.use_selected_to_active = selected_to_active
    bk.cage_extrusion = extrusion
    bk.max_ray_distance = max_ray
    bk.normal_space = normal_space
    bk.normal_r, bk.normal_g, bk.normal_b = 'POS_X', 'POS_Y', 'POS_Z'
    bk.use_clear = True
    bk.target = 'IMAGE_TEXTURES'
    if pass_filter is not None:
        bk.use_pass_direct = 'DIRECT' in pass_filter
        bk.use_pass_indirect = 'INDIRECT' in pass_filter
        bk.use_pass_color = 'COLOR' in pass_filter
    nodes = []
    for slot in obj.material_slots:
        m = slot.material
        nd = m.node_tree.nodes.new('ShaderNodeTexImage')
        nd.image = img
        nd.name = '__bake__'
        m.node_tree.nodes.active = nd
        nd.select = True
        nodes.append((m, nd))
    if selected_to_active:
        select_only(obj, *(sources or []))
        bpy.context.view_layer.objects.active = obj
    else:
        select_only(obj)
    bpy.ops.object.bake(type=typ)
    for m, nd in nodes:
        m.node_tree.nodes.remove(nd)


def save_png(img, path, colorspace=None):
    """save a BYTE image as PNG exactly as stored."""
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()


def save_jpg(img, path, quality=92):
    sc = bpy.context.scene
    s = sc.render.image_settings
    s.file_format = 'JPEG'
    s.quality = quality
    s.color_mode = 'RGB'
    img.save_render(path, scene=sc)


# ───────────────────────────────────────────── render previews ─────────────────────────────────────
def preview_render(path, objs, size=(640, 640), samples=24, cam_dir=(1.0, -1.4, 0.55), fov=35, sun=True,
                   background=(0.32, 0.34, 0.36), floor=True, engine='CYCLES'):
    """quick turntable-ish still of objs (bbox framed) for QA."""
    sc = bpy.context.scene
    mins = Vector((1e9, 1e9, 1e9)); maxs = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c)
            mins = Vector(map(min, mins, p)); maxs = Vector(map(max, maxs, p))
    ctr = (mins + maxs) / 2
    rad = (maxs - mins).length / 2
    added = []
    camd = bpy.data.cameras.new('pcam'); camd.lens_unit = 'FOV'; camd.angle = math.radians(fov)
    camd.clip_end = 2000
    cam = bpy.data.objects.new('pcam', camd); link_obj(cam); added.append(cam)
    d = Vector(cam_dir).normalized()
    dist = rad / math.sin(math.radians(fov) / 2) * 1.05
    cam.location = ctr + d * dist
    cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
    if sun:
        ld = bpy.data.lights.new('psun', 'SUN'); ld.energy = 3.0; ld.angle = math.radians(8)
        lo = bpy.data.objects.new('psun', ld); link_obj(lo); added.append(lo)
        lo.rotation_euler = Euler((math.radians(50), math.radians(10), math.radians(-40)))
    if floor:
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=rad * 6)
        fo = mesh_obj('pfloor', bm); fo.location = (ctr.x, ctr.y, mins.z)
        fm, fnt, fg = new_material('pfloor')
        o = fg.node('ShaderNodeOutputMaterial'); b = fg.node('ShaderNodeBsdfPrincipled')
        b.inputs['Base Color'].default_value = (0.18, 0.18, 0.18, 1); b.inputs['Roughness'].default_value = 0.9
        fnt.links.new(b.outputs[0], o.inputs[0])
        fo.data.materials.append(fm); added.append(fo)
    w = sc.world or world_color(background, 1.0)
    if sc.world and sc.world.use_nodes:
        sc.world.node_tree.nodes['Background'].inputs[0].default_value = (*background, 1)
    sc.render.engine = engine
    sc.cycles.samples = samples
    sc.render.resolution_x, sc.render.resolution_y = size
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 88
    sc.render.image_settings.color_mode = 'RGB'
    sc.view_settings.view_transform = 'AgX' if 'AgX' in [e.identifier for e in sc.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    sc.view_settings.view_transform = 'Standard'
    for o in added:
        bpy.data.objects.remove(o, do_unlink=True)


# ───────────────────────────────────────────── glTF export ─────────────────────────────────────────
def export_glb(path, objs, external_tex=True):
    """Export objs as glTF-separate into a temp dir, then pack a .glb: images whose file name matches a PNG in
    src/real/assets/tex/ are referenced externally ("../tex/<name>.png", shared between models, deduped by
    assets.js); every other image is embedded. Draco off, no quantization, Y-up, metres."""
    tmp = os.path.join(BUILD, 'gltf_' + os.path.splitext(os.path.basename(path))[0])
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp)
    select_only(*objs)
    for o in objs:
        for c in o.children_recursive:
            c.select_set(True)
    gpath = os.path.join(tmp, 'model.gltf')
    bpy.ops.export_scene.gltf(
        filepath=gpath, export_format='GLTF_SEPARATE', use_selection=True, export_apply=True,
        export_texcoords=True, export_normals=True, export_tangents=False, export_materials='EXPORT',
        export_image_format='AUTO', export_texture_dir='', export_keep_originals=False,
        export_draco_mesh_compression_enable=False, export_yup=True, export_cameras=False, export_lights=False,
        export_animations=False, export_skins=False, export_morph=False, export_extras=False,
        export_attributes=False, export_colors=False)
    with open(gpath) as f:
        gj = json.load(f)
    binp = os.path.join(tmp, gj['buffers'][0]['uri'])
    with open(binp, 'rb') as f:
        bin_data = bytearray(f.read())
    tex_files = set(os.listdir(TEX))
    for im in gj.get('images', []):
        uri = im.get('uri')
        if not uri:
            continue
        base = os.path.basename(uri)
        if external_tex and base in tex_files and _same_png(os.path.join(tmp, uri), os.path.join(TEX, base)):
            im['uri'] = '../tex/' + base
            continue
        with open(os.path.join(tmp, uri), 'rb') as f:
            data = f.read()
        while len(bin_data) % 4:
            bin_data.append(0)
        off = len(bin_data)
        bin_data.extend(data)
        gj.setdefault('bufferViews', []).append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data)})
        del im['uri']
        im['bufferView'] = len(gj['bufferViews']) - 1
        im['mimeType'] = 'image/jpeg' if base.lower().endswith(('.jpg', '.jpeg')) else 'image/png'
    while len(bin_data) % 4:
        bin_data.append(0)
    gj['buffers'][0] = {'byteLength': len(bin_data)}
    js = json.dumps(gj, separators=(',', ':')).encode('utf8')
    while len(js) % 4:
        js += b' '
    total = 12 + 8 + len(js) + 8 + len(bin_data)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(bin_data), 0x004E4942)); f.write(bin_data)
    return os.path.getsize(path)


def _same_png(a, b):
    """the exporter copies untouched source images byte-for-byte; anything it re-encoded must be embedded."""
    try:
        if os.path.getsize(a) == os.path.getsize(b):
            with open(a, 'rb') as fa, open(b, 'rb') as fb:
                return fa.read() == fb.read()
    except OSError:
        pass
    return False


def write_manifest_entry(name, info):
    """merge info into src/real/assets/manifest.json (sorted, stable)."""
    p = os.path.join(ASSETS, 'manifest.json')
    data = {}
    if os.path.exists(p):
        with open(p) as f:
            data = json.load(f)
    cat = info.pop('_cat')
    data.setdefault(cat, {})[name] = info
    data[cat] = dict(sorted(data[cat].items()))
    with open(p, 'w') as f:
        json.dump(dict(sorted(data.items())), f, indent=1)
