import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Box3, MathUtils, Mesh, NeutralToneMapping, Object3D, PerspectiveCamera, Raycaster, Vector3, type Material } from "three";
import { MODEL_URL, PART_LABELS, POSE, explodeAt, range, smooth, storyProgress } from "../story";

useGLTF.setDecoderPath("/draco/");

type Props = {
  /** The DOM element that shows the real MobyFace. This scene pins it to the model's screen. */
  faceEl: RefObject<HTMLElement | null>;
  /** The list of part labels. This scene moves each one to its part. */
  labelsEl: RefObject<HTMLElement | null>;
  /** The poster frame. The closed model is placed exactly over it, so poster and scene line up. */
  boxEl: RefObject<HTMLElement | null>;
  active: boolean;
  onReady: () => void;
};

type Part = {
  object: Object3D;
  offset: Vector3;
  delay: number;
  box: Box3;
  meshes: Mesh[];
};

const deg = MathUtils.degToRad;
const FACE_W = 256;
const FACE_H = 128;

function isSolid(material: Material | Material[]) {
  const first = Array.isArray(material) ? material[0] : material;
  return Boolean(first) && !first!.transparent && first!.opacity >= 1;
}

function readParts(root: Object3D): Part[] {
  root.updateMatrixWorld(true);
  const parts: Part[] = [];
  for (const object of root.children) {
    const explode = object.userData.moby_explode as number[] | undefined;
    if (!explode) continue;
    const meshes: Mesh[] = [];
    object.traverse((child) => { if ((child as Mesh).isMesh) meshes.push(child as Mesh); });
    parts.push({
      object,
      offset: new Vector3(explode[0], explode[1], explode[2]),
      delay: parts.length * 0.02,
      box: new Box3().setFromObject(object),
      meshes,
    });
  }
  return parts;
}

/** Distance at which the opened model fits a screen region of this many CSS pixels. */
function openDistance(box: Box3, half: number, region: { w: number; h: number }, canvasHeight: number) {
  const size = box.getSize(new Vector3());
  const hx = size.x / 2, hy = size.y / 2, hz = size.z / 2;
  const vertical = (hy + hz * 0.55) / (half * (region.h / canvasHeight));
  const horizontal = (hx + hz * 0.45) / (half * (region.w / canvasHeight));
  return Math.max(vertical, horizontal) * 1.08 + hz;
}

/** Distance at which the closed model fills the poster the way the Blender render does. */
function closedDistance(box: Box3) {
  return (box.getSize(new Vector3()).length() / 2) * POSE.fit / Math.sin(deg(POSE.fov) / 2);
}

/** Maps an element of w by h pixels onto four screen points: a CSS matrix3d (Heckbert's projective map). */
function quadMatrix(points: number[][], w: number, h: number) {
  const [[x0 = 0, y0 = 0], [x1 = 0, y1 = 0], [x2 = 0, y2 = 0], [x3 = 0, y3 = 0]] = points as [number[], number[], number[], number[]];
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  let g = 0, k = 0;
  if (sx !== 0 || sy !== 0) {
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    k = (dx1 * sy - sx * dy1) / den;
  }
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3;
  const d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`;
}

function Rig({ faceEl, labelsEl, boxEl, onReady }: Omit<Props, "active">) {
  const { scene } = useGLTF(MODEL_URL);
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);

  const model = useMemo(() => {
    const parts = readParts(scene);
    const assembled = new Box3();
    const opened = new Box3();
    parts.forEach((part) => {
      assembled.union(part.box);
      opened.union(part.box.clone().translate(part.offset));
    });
    const byName = new Map(parts.map((part) => [part.object.name, part]));
    const face = byName.get("screen-face");
    const faceGeometry = face?.meshes[0]?.geometry;
    faceGeometry?.computeBoundingBox();
    for (const part of parts) {
      for (const mesh of part.meshes) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) if (material.transparent) material.depthWrite = false;
      }
    }
    return { parts, byName, assembled, opened, face, faceBox: faceGeometry?.boundingBox ?? null };
  }, [scene]);

  const clock = useRef(0);
  const home = useRef({ x: 0, y: 0, h: 1 });
  const ready = useRef(false);
  const timer = useRef(0);
  const labels = useRef(new Map<string, HTMLElement>());
  const raycaster = useMemo(() => new Raycaster(), []);
  const tmp = useMemo(() => ({
    v: new Vector3(), target: new Vector3(), c0: new Vector3(), c1: new Vector3(), box: new Box3(),
  }), []);

  useEffect(() => {
    const listener = () => invalidate();
    storyProgress.listeners.add(listener);
    return () => { storyProgress.listeners.delete(listener); window.clearTimeout(timer.current); };
  }, [invalidate]);

  // Where the poster frame sits inside the canvas.
  useEffect(() => {
    const frame = boxEl.current?.getBoundingClientRect();
    const view = gl.domElement.getBoundingClientRect();
    if (!frame) return;
    home.current = { x: frame.left - view.left + frame.width / 2, y: frame.top - view.top + frame.height / 2, h: Math.max(1, frame.height) };
    invalidate();
  }, [boxEl, gl, invalidate, size.width, size.height]);

  useEffect(() => {
    labels.current = new Map(
      [...(labelsEl.current?.querySelectorAll<HTMLElement>("[data-part]") ?? [])].map((el) => [el.dataset.part ?? "", el]),
    );
  }, [labelsEl]);

  useFrame((_state, delta) => {
    clock.current += Math.min(delta, 0.05);
    const open = explodeAt(storyProgress.value);

    // Parts slide to their exploded poses, slightly staggered.
    for (const part of model.parts) {
      const own = smooth(range(open, part.delay, part.delay + 0.6));
      part.object.position.copy(part.offset).multiplyScalar(own);
    }
    scene.updateMatrixWorld(true);

    // Where the closed model sits (the poster frame) and where the opened model should sit, in canvas pixels.
    const narrow = size.width < 900;
    const region = narrow
      ? { x: size.width / 2, y: size.height * 0.62, w: size.width * 0.96, h: size.height * 0.6 }
      : { x: size.width * 0.66, y: size.height * 0.52, w: size.width * 0.64, h: size.height * 0.84 };

    // The canvas covers the whole stage. Its field of view is widened so the closed model is exactly poster-sized.
    const half = Math.tan(deg(POSE.fov) / 2) * (size.height / home.current.h);
    camera.fov = MathUtils.radToDeg(2 * Math.atan(half));
    camera.aspect = size.width / size.height;
    camera.setViewOffset(
      size.width, size.height,
      -(MathUtils.lerp(home.current.x, region.x, open) - size.width / 2),
      -(MathUtils.lerp(home.current.y, region.y, open) - size.height / 2),
      size.width, size.height,
    );
    camera.updateProjectionMatrix();

    // Slow sway while closed, a wider and higher view while open.
    const azimuth = deg(POSE.azimuth) + Math.sin(clock.current * 0.3) * deg(50) * (1 - open) - open * deg(10);
    const elevation = deg(POSE.elevation + open * 16);
    const distance = MathUtils.lerp(closedDistance(model.assembled), openDistance(model.opened, half, region, size.height), open);
    model.assembled.getCenter(tmp.c0);
    model.opened.getCenter(tmp.c1);
    tmp.target.lerpVectors(tmp.c0, tmp.c1, open);
    camera.position.set(
      tmp.target.x + Math.sin(azimuth) * Math.cos(elevation) * distance,
      tmp.target.y + Math.sin(elevation) * distance,
      tmp.target.z + Math.cos(azimuth) * Math.cos(elevation) * distance,
    );
    camera.lookAt(tmp.target);
    camera.updateMatrixWorld(true);

    // Part labels follow their parts.
    const labelAlpha = smooth(range(open, 0.78, 1));
    for (const label of PART_LABELS) {
      const el = labels.current.get(label.id);
      const part = model.byName.get(label.id);
      if (!el || !part) continue;
      part.box.getCenter(tmp.v).add(part.object.position);
      tmp.v.project(camera);
      el.style.transform = `translate3d(${((tmp.v.x * 0.5 + 0.5) * size.width).toFixed(1)}px,${((-tmp.v.y * 0.5 + 0.5) * size.height).toFixed(1)}px,0)`;
      el.style.opacity = labelAlpha.toFixed(2);
    }

    // The real MobyFace is pinned onto the screen quad with a perspective transform.
    const face = faceEl.current;
    if (face && model.faceBox && model.face) {
      const { min, max } = model.faceBox;
      const matrix = model.face.object.matrixWorld;
      const corners = [[min.x, min.y], [max.x, min.y], [max.x, max.y], [min.x, max.y]].map(([x = 0, y = 0]) => {
        const point = tmp.v.set(x, y, min.z).applyMatrix4(matrix).project(camera);
        return [(point.x * 0.5 + 0.5) * size.width, (-point.y * 0.5 + 0.5) * size.height];
      });
      face.style.transform = quadMatrix(corners, FACE_W, FACE_H);

      const centre = new Vector3((min.x + max.x) / 2, (min.y + max.y) / 2, min.z).applyMatrix4(matrix);
      const toCamera = camera.position.clone().sub(centre);
      const distanceToFace = toCamera.length();
      const direction = toCamera.normalize();
      let visible = direction.z > 0.25;
      if (visible) {
        raycaster.set(camera.position, direction.clone().negate());
        raycaster.far = distanceToFace - 0.0004;
        for (const part of model.parts) {
          if (part.object.name === "screen-face") continue;
          for (const mesh of part.meshes) {
            if (!isSolid(mesh.material)) continue;
            if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
            tmp.box.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld);
            if (!raycaster.ray.intersectsBox(tmp.box)) continue;
            if (raycaster.intersectObject(mesh, false).length) { visible = false; break; }
          }
          if (!visible) break;
        }
      }
      face.style.opacity = visible ? "1" : "0";
    }

    if (!ready.current) {
      ready.current = true;
      onReady();
    }
    // About 30 fps while closed, full rate while the page scrolls.
    if (performance.now() - storyProgress.changedAt < 400) invalidate();
    else if (!timer.current) timer.current = window.setTimeout(() => { timer.current = 0; invalidate(); }, 33);
  });

  return <primitive object={scene} />;
}

export default function MobyScene({ faceEl, labelsEl, boxEl, active, onReady }: Props) {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);
  return (
    <Canvas
      frameloop={active ? "demand" : "never"}
      dpr={dpr}
      camera={{ fov: POSE.fov, near: 0.02, far: 4 }}
      gl={{ alpha: true, antialias: true, powerPreference: "default" }}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor(0x000000, 0);
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr([1, 1])} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[2.5, 2.5, 3]} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-3, 1, 1]} scale={[3, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[0, 3, -3]} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={0.8} position={[0, -2, 2]} scale={4} />
      </Environment>
      <ambientLight intensity={0.35} />
      <directionalLight position={[1.5, 3, 2.5]} intensity={1.4} />
      <Rig faceEl={faceEl} labelsEl={labelsEl} boxEl={boxEl} onReady={onReady} />
    </Canvas>
  );
}
