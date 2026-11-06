"""Render the static Moby Mini poster used when WebGL is unavailable, motion is reduced,
or the 3D scene is still loading.

    blender --background --factory-startup --python scripts/render-moby-poster.py -- \
        <dir with moby-mini-assembled.blend> <output.webp>

Transparent background (no floor) so it sits on either page theme. The camera
pose matches the hero pose in src/three/pose.ts (azimuth, elevation, field of view and the
fit-to-bounding-sphere distance), so the live scene replaces the poster without a jump.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
model_dir, out_path = argv
out_path = os.path.abspath(out_path)

AZIMUTH = math.radians(32)     # turns the camera from the front towards +X
ELEVATION = math.radians(14)
FOV = math.radians(26)
FIT = 1.18                     # margin around the bounding sphere
WIDTH, HEIGHT = 1200, 1000

bpy.ops.wm.open_mainfile(filepath=os.path.join(model_dir, "moby-mini-assembled.blend"))
scene = bpy.context.scene

body = [o for o in bpy.data.objects if o.type == "MESH" and o.name != "Studio floor"]
pts = [o.matrix_world @ Vector(c) for o in body for c in o.bound_box]
lo = Vector([min(p[i] for p in pts) for i in range(3)])
hi = Vector([max(p[i] for p in pts) for i in range(3)])
centre = (lo + hi) / 2
radius = (hi - lo).length / 2
dist = radius * FIT / math.sin(FOV / 2)
print("CENTRE", tuple(centre), "RADIUS", radius, "DIST", dist)

direction = Vector((math.sin(AZIMUTH) * math.cos(ELEVATION), -math.cos(AZIMUTH) * math.cos(ELEVATION), math.sin(ELEVATION)))
cam_data = bpy.data.cameras.new("Poster")
cam_data.angle = FOV
cam_data.sensor_fit = "VERTICAL"
cam = bpy.data.objects.new("Poster", cam_data)
scene.collection.objects.link(cam)
cam.location = centre + direction * dist
cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.camera = cam

floor = bpy.data.objects.get("Studio floor")
if floor:
    floor.hide_render = True   # the page draws a soft contact shadow in CSS, so it suits both themes

scene.render.engine = "CYCLES"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x, scene.render.resolution_y = WIDTH, HEIGHT
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.quality = 88
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print("WROTE", out_path, os.path.getsize(out_path))
