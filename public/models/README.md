# Moby Mini 3D model and poster

`moby-mini.glb` and `moby-mini-poster.webp` are derived from the public
[mobyuz/3d-model](https://github.com/mobyuz/3d-model) repository, commit
`44ddbde` (`moby-mini-assembled.blend`, `moby-mini-exploded.blend`).

## Licence

- The Moby Mini design and Blender scenes are licensed **CERN-OHL-P-2.0** (permissive).
  It allows copying, modification and redistribution, including in a product under another
  licence, as long as the licence notice and attributions stay with the redistributed files.
  That is compatible with this website's **GPL-3.0-only**.
- Third-party geometry inside the model keeps its own licence and credit. The credits are
  reproduced here as the licences require:
  - 0.96" SSD1306 OLED module: PartReel, based on the LCDwiki MC096VX dimensions,
    [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
  - SG90 servo: Gafeju, `Servo-sg90.step` from the FreeCAD Parts Library,
    [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Shape is modified (tessellated, merged).
  - 6 mm tactile switch: KiCad Libraries contributors,
    `SW_PUSH_6mm_h4.3mm.step`, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
    with the KiCad library exception. CC BY-SA 4.0 may be combined into GPL-3.0 works (one-way
    compatible, per the Creative Commons compatibility list). Adaptations of the switch geometry in
    `moby-mini.glb` stay available under CC BY-SA 4.0.
  - Full notices: <https://github.com/mobyuz/3d-model/blob/main/THIRD_PARTY.md>.

## What the files are

`moby-mini.glb` holds 17 rigid parts (front shell, rear shell, screen, microphone, speaker,
amplifier, ESP32-S3 board, controls, servo, supports, carrier board, USB-C guide, two feet and two
soles). Each part node is in the assembled pose and carries two glTF extras: `moby_label` (its name) and
`moby_explode` (offset to the exploded pose in metres, glTF axes). The website moves the node by that
offset as you scroll. Wires are not included. The OLED eyes are replaced by a flat `ScreenFace` quad
where the page shows the animated face from `@mobyuz/moby-ui`.

The mesh is Draco compressed. The decoder (`public/draco/`) is copied from `three` and is licensed
Apache-2.0 (Google Draco).

## Regenerate

With Blender 5.x and a checkout of `mobyuz/3d-model` (the folder holding the two `.blend` files):

```sh
blender --background --factory-startup --python scripts/export-moby-model.py -- <model dir> public/models/moby-mini.glb
blender --background --factory-startup --python scripts/render-moby-poster.py -- <model dir> public/models/moby-mini-poster.webp
```
