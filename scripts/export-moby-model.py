"""Export the Moby Mini Blender scenes to one compressed GLB for the website.

Run with Blender 5.x (headless):

    blender --background --factory-startup --python scripts/export-moby-model.py -- \
        <dir with moby-mini-assembled.blend and moby-mini-exploded.blend> <output.glb>

Source: https://github.com/mobyuz/3d-model (CERN-OHL-P-2.0, third-party parts in
THIRD_PARTY.md there; see public/models/README.md here).

How the explode animation is stored
-----------------------------------
Both scenes contain the same objects with the same names. The script reads each
object's world matrix from the exploded scene, then opens the assembled scene and
compares them. Objects that move by the same offset are one rigid part, so they are
joined into one mesh node per part. Every part node keeps the assembled pose and carries
`moby_label` (the part name) and `moby_explode` (the offset to the exploded pose, in
glTF units: metres, Y up) as glTF extras. The page moves the node by that offset.

Left out on purpose: wires (curves, they stretch rather than move), the studio floor,
lights, cameras, the loose diode, and the 44 header-pin objects are kept but merged into
the board part. The OLED's eyes are removed and replaced by a flat `ScreenFace` quad,
because the page draws the real animated MobyFace there.
"""

import json
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(argv) != 2:
    raise SystemExit("usage: blender -b --python export-moby-model.py -- <model dir> <output.glb>")
model_dir, out_path = argv

# (part id, label, test on the object name). First match wins.
PARTS = [
    ("shell-front", "Front shell", lambda n: n.startswith(("H02", "H04", "H05", "Moby marking", "Mute marking", "Talk marking"))),
    ("shell-rear", "Rear shell and speaker grille", lambda n: n.startswith(("H01", "H03"))),
    ("usb-guide", "USB-C guide", lambda n: n.startswith(("H06", "H08"))),
    ("screen", "Screen", lambda n: n.startswith(("M1", "C2"))),
    ("microphone", "Microphone", lambda n: n.startswith(("M2", "C1 ", "C1."))),
    ("speaker", "Speaker", lambda n: n.startswith("LS1")),
    ("amplifier", "Audio amplifier", lambda n: n.startswith("M3")),
    ("board", "ESP32-S3 board", lambda n: n.startswith("U1")),
    ("controls", "Mute switch and talk button", lambda n: n.startswith(("LED1", "LED2", "S1", "SW1"))),
    ("servo", "Servo", lambda n: n.startswith("M4 · ") and "horn" not in n),
    ("uprights", "Internal supports", lambda n: n.startswith(("J01", "J02", "J03", "M4 · SG90 horn"))),
    ("carrier", "Carrier board", lambda n: n.startswith(("P01", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "C4", "C5", "3V3", "5V", "GND"))),
    ("sole-left", "Left sole", lambda n: n.startswith("F02L")),
    ("sole-right", "Right sole", lambda n: n.startswith("F02R")),
    ("foot-left", "Left foot", lambda n: n.startswith(("F01L", "F03L")) or (n.startswith("Toe bumper") and not n.endswith(".001"))),
    ("foot-right", "Right foot", lambda n: n.startswith(("F01R", "F03R")) or n.startswith("Toe bumper.001")),
]
DROP = ("D1 ", "Studio floor")


def part_of(name):
    for pid, _label, test in PARTS:
        if test(name):
            return pid
    return None


# 1. World matrices of the exploded scene.
bpy.ops.wm.open_mainfile(filepath=os.path.join(model_dir, "moby-mini-exploded.blend"))
exploded = {o.name: [list(r) for r in o.matrix_world] for o in bpy.data.objects if o.type in {"MESH", "FONT"}}

# 2. Assembled scene is the base geometry.
bpy.ops.wm.open_mainfile(filepath=os.path.join(model_dir, "moby-mini-assembled.blend"))
scene = bpy.context.scene
bpy.ops.object.select_all(action="DESELECT")

# Text objects become meshes so they can be joined and exported.
for obj in [o for o in bpy.data.objects if o.type == "FONT"]:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
bpy.ops.object.convert(target="MESH")
bpy.ops.object.select_all(action="DESELECT")

offsets = {}   # object name -> rounded world translation delta (metres, Blender axes)
for obj in bpy.data.objects:
    if obj.type == "MESH" and obj.name in exploded:
        delta = Matrix(exploded[obj.name]) @ obj.matrix_world.inverted()
        offsets[obj.name] = tuple(round(v, 5) for v in delta.to_translation())

offsets["ScreenFace"] = offsets["M1 · LCDwiki MC096VX SSD1306 0.96 inch"]   # rides with the OLED module

# 3. The OLED eyes give the screen position and size; remove them and add the face quad.
eyes = [o for o in bpy.data.objects if o.name.startswith("M1 · Eyes")]
corners = [o.matrix_world @ Vector(c) for o in eyes for c in o.bound_box]
cx = sum(v.x for v in corners) / len(corners)
cz = sum(v.z for v in corners) / len(corners)
front_y = min(v.y for v in corners) - 0.00005
half_w, half_h = 0.02174 / 2, 0.01086 / 2   # SSD1306 module active area, 21.74 x 10.86 mm (2:1)
mesh = bpy.data.meshes.new("ScreenFace")
bm = bmesh.new()
verts = [bm.verts.new((cx + sx * half_w, front_y, cz + sz * half_h)) for sz in (-1, 1) for sx in (-1, 1)]
face = bm.faces.new((verts[0], verts[1], verts[3], verts[2]))
uv = bm.loops.layers.uv.new("UVMap")
for loop, (u, v) in zip(face.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
    loop[uv].uv = (u, v)
bm.normal_update()
if face.normal.y > 0:
    bmesh.ops.reverse_faces(bm, faces=[face])
bm.to_mesh(mesh)
bm.free()
screen_face = bpy.data.objects.new("ScreenFace", mesh)
scene.collection.objects.link(screen_face)
black = bpy.data.materials.new("OLED black")
black.diffuse_color = (0, 0, 0, 1)
black.use_nodes = True
black.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.004, 0.004, 0.005, 1)
black.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.25
mesh.materials.append(black)

# 4. The polycarbonate window uses transmission, which is expensive on the web: use alpha.
for mat in bpy.data.materials:
    if mat.name.startswith("Optical polycarbonate") and mat.use_nodes:
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Transmission Weight"].default_value = 0
        bsdf.inputs["Alpha"].default_value = 0.16
        for attr, value in (("surface_render_method", "BLENDED"), ("blend_method", "BLEND")):
            if hasattr(mat, attr):
                setattr(mat, attr, value)

# Web lighting is flatter than the Cycles studio, so the pale shell reads green. Lift and neutralise it.
for mat in bpy.data.materials:
    if mat.name.startswith("Fern") and mat.use_nodes:
        mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.42, 0.44, 0.39, 1)

# 5. Join per part.
groups = {}
for obj in list(bpy.data.objects):
    if obj.type != "MESH":
        continue
    if obj.name.startswith("M1 · Eyes") or obj.name.startswith(DROP):
        bpy.data.objects.remove(obj, do_unlink=True)
        continue
    pid = "screen-face" if obj.name == "ScreenFace" else part_of(obj.name)
    if pid is None:
        print("UNASSIGNED", obj.name)
        bpy.data.objects.remove(obj, do_unlink=True)
        continue
    groups.setdefault(pid, []).append(obj)

for obj in [o for o in bpy.data.objects if o.type != "MESH"]:
    bpy.data.objects.remove(obj, do_unlink=True)   # wires, lights, cameras

labels = {pid: label for pid, label, _ in PARTS}
labels["screen-face"] = "Screen face"   # kept as its own node: the page draws the face over it
manifest = {}
for pid, objs in groups.items():
    deltas = {offsets[o.name] for o in objs if o.name in offsets}
    if len(deltas) > 1:
        raise SystemExit(f"part {pid} is not rigid: {sorted(deltas)}")
    delta = next(iter(deltas)) if deltas else (0, 0, 0)
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(objs) > 1:
        bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = pid
    joined.data.name = pid
    # glTF is Y up: (x, y, z) -> (x, z, -y).
    explode = [delta[0], delta[2], -delta[1]]
    joined["moby_label"] = labels[pid]
    joined["moby_explode"] = explode
    manifest[pid] = {"label": labels[pid], "explode_m": explode, "objects": len(objs)}

for pid in manifest:
    print("PART", pid, manifest[pid])

# 6. Export with Draco.
os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format="GLB",
    export_extras=True,
    export_yup=True,
    export_apply=True,
    export_cameras=False,
    export_lights=False,
    export_animations=False,
    export_materials="EXPORT",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=9,
    export_draco_texcoord_quantization=12,
    export_draco_color_quantization=8,
    export_draco_generic_quantization=8,
)
print("WROTE", out_path, os.path.getsize(out_path), "bytes")
print("MANIFEST", json.dumps(manifest))
