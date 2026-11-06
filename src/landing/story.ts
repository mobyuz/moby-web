import type { ComponentProps } from "react";
import type { MobyFace } from "@mobyuz/moby-ui";

export type Expression = NonNullable<ComponentProps<typeof MobyFace>["expression"]>;

/** Hero camera, in degrees. The poster in public/models is rendered from the same pose
 * (scripts/render-moby-poster.py), so the live scene replaces it without a jump. */
export const POSE = { azimuth: 32, elevation: 14, fov: 26, fit: 1.18 } as const;

export const MODEL_URL = "/models/moby-mini.glb";
export const POSTER_URL = "/models/moby-mini-poster.webp";
export const POSTER_SIZE = { width: 1200, height: 1000 } as const;

/** What the page says about each part that is labelled while Moby is open. All of it
 * comes from the model repo's component list. `dx`/`dy` place the tag from its anchor. */
export const PART_LABELS = [
  { id: "screen", name: "Screen", detail: "0.96-inch OLED, 128 × 64. Shows Moby’s face.", dx: -96, dy: -74 },
  { id: "microphone", name: "Microphone", detail: "INMP441 digital MEMS microphone.", dx: 84, dy: -92 },
  { id: "speaker", name: "Speaker", detail: "28 mm, 8 Ω. Sounds through the rear grille.", dx: 92, dy: -22 },
  { id: "board", name: "Board", detail: "ESP32-S3 with native USB-C.", dx: -92, dy: 58 },
  { id: "controls", name: "Mute switch and talk button", detail: "The switch cuts the microphone line in hardware.", dx: -92, dy: 22 },
  { id: "servo", name: "Servo", detail: "SG90, intended to tilt the shell.", dx: 8, dy: -104 },
] as const;

export type LabelledPart = (typeof PART_LABELS)[number]["id"];

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const range = (value: number, from: number, to: number) => clamp01((value - from) / (to - from));
export const smooth = (value: number) => value * value * (3 - 2 * value);

/** Scroll story, 0 to 1: still, opens, holds open, closes. */
export const explodeAt = (progress: number) =>
  smooth(range(progress, 0.14, 0.46)) * (1 - smooth(range(progress, 0.7, 0.92)));

export function expressionAt(progress: number): Expression {
  if (progress < 0.12) return "idle";
  if (progress < 0.38) return "listening";
  if (progress < 0.58) return "thinking";
  if (progress < 0.76) return "speaking";
  return "happy";
}

/** One shared value so the scroll handler can drive the 3D scene without React renders. */
export const storyProgress = {
  value: 0,
  changedAt: 0,
  listeners: new Set<() => void>(),
  set(next: number) {
    if (next === this.value) return;
    this.value = next;
    this.changedAt = performance.now();
    this.listeners.forEach((listener) => listener());
  },
};
