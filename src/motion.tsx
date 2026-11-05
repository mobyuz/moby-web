import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fades and lifts its children into view the first time they scroll on screen. */
export function Reveal({ as: Tag = "div", delay = 0, className, children, ...rest }: {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setSeen(true);
        observer.disconnect();
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag {...rest} ref={ref} className={className} data-reveal="" data-in={seen ? "" : undefined}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** Counts up to a number once, easing out. Falls back to the final value for reduced motion. */
export function CountUp({ value, locale = "en" }: { value: number; locale?: string }) {
  const [shown, setShown] = useState(() => reducedMotion() ? value : 0);

  useEffect(() => {
    if (reducedMotion()) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{shown.toLocaleString(locale)}</>;
}

/** Tracks whether the page has scrolled, for header elevation. */
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > offset);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [offset]);
  return scrolled;
}

/** Sets --mx/--my on hover so CSS can draw a light that follows the pointer. */
export function trackPointer(event: { currentTarget: HTMLElement; clientX: number; clientY: number }) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
}

/** Tilts an element toward the pointer. */
export function tiltPointer(event: { currentTarget: HTMLElement; clientX: number; clientY: number }) {
  if (reducedMotion()) return;
  const box = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width - 0.5;
  const y = (event.clientY - box.top) / box.height - 0.5;
  event.currentTarget.style.setProperty("--tilt-x", `${(-y * 6).toFixed(2)}deg`);
  event.currentTarget.style.setProperty("--tilt-y", `${(x * 8).toFixed(2)}deg`);
}

export function resetTilt(event: { currentTarget: HTMLElement }) {
  event.currentTarget.style.setProperty("--tilt-x", "0deg");
  event.currentTarget.style.setProperty("--tilt-y", "0deg");
}
