import { useEffect, useState } from "react";

function useMedia(query: string, initial = false) {
  const [matches, setMatches] = useState(() => (typeof matchMedia === "function" ? matchMedia(query).matches : initial));
  useEffect(() => {
    const list = matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");

type Hints = { deviceMemory?: number; hardwareConcurrency?: number; connection?: { saveData?: boolean } };

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

/** True when the live 3D scene should run: WebGL works, motion is allowed, and the device is not
 * asking to save data or reporting very little memory or very few cores. */
export function useLive3D() {
  const reduced = useReducedMotion();
  const [capable, setCapable] = useState(false);
  useEffect(() => {
    const hints = navigator as Navigator & Hints;
    const slow = (hints.deviceMemory ?? 8) <= 2 || (hints.hardwareConcurrency ?? 4) <= 2 || hints.connection?.saveData === true;
    setCapable(!slow && webglAvailable());
  }, []);
  return capable && !reduced;
}
