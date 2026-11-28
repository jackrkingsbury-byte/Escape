#!/usr/bin/env bash
# tools/blender/build_all.sh — rebuild every Blender-made asset in src/real/assets/ from scratch.
# Deterministic (fixed seeds everywhere). ≈ 30 min on 4 CPU cores, no GPU needed.
#
#   bash tools/blender/build_all.sh            # everything
#   bash tools/blender/build_all.sh models     # skip textures/sky/atlases (they must already exist)
#
# Needs: Blender 4.0 (`blender` on PATH), system python3 with numpy, Pillow, scipy.
# Blender's own Python here has no numpy (its glTF exporter needs it): bl_common.ensure_numpy() installs a private
# cp312 wheel into out/blender_build/pylib on first use (gitignored, nothing system-wide).
# Intermediates → out/blender_build/, QA renders → out/blender_preview/ (both gitignored).
set -euo pipefail
cd "$(dirname "$0")/../.."
B=(blender -b --factory-startup --python)
q() { grep -E '^\[bl\]|Error|Traceback' || true; }

if [[ "${1:-all}" != "models" ]]; then
  "${B[@]}" tools/blender/textures.py 2>&1 | q                       # 11 tileable sets (float bakes)
  python3 tools/blender/tex_post.py                                   # → tex/<set>_{color,normal,rough,ao,height,orm}.png
  python3 tools/blender/tex_preview.py                                # → out/blender_preview/tex_*.jpg
  "${B[@]}" tools/blender/sky.py -- --res 2048 --samples 16 2>&1 | q  # → env/storm_day.hdr, env/storm_night.hdr
  "${B[@]}" tools/blender/leaves.py 2>&1 | q                          # foliage atlases (raw renders)
  python3 tools/blender/leaves_post.py                                # → tex/foliage_{palm,canopy,under}_{color,normal}.png
fi
"${B[@]}" tools/blender/rocks.py -- --preview 2>&1 | q                # rocks, cliff_wall, sea_stack, cave_arch (baked maps)
"${B[@]}" tools/blender/vegetation.py -- --preview 2>&1 | q           # palms, rainforest trees, ferns, vines
"${B[@]}" tools/blender/wreck.py -- --preview 2>&1 | q                # wreck_boat, planks, crate, rope_coil, driftwood_logs
echo "done → src/real/assets/{tex,glb,env}/ + manifest.json"
