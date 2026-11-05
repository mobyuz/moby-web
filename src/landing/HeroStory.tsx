import { Component, lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { MobyFace } from "@mobyuz/moby-ui";
import { Icon } from "../Icon";
import { useLive3D } from "./hooks";
import { PART_LABELS, POSTER_SIZE, POSTER_URL, clamp01, expressionAt, range, storyProgress, type Expression } from "./story";

const MobyScene = lazy(() => import("./three/MobyScene"));

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.onError(); }
  override render() { return this.state.failed ? null : this.props.children; }
}

function PartLabelList({ live }: { live: boolean }) {
  return (
    <ul className="parts" data-live={live || undefined} aria-label="Parts of Moby Mini">
      {PART_LABELS.map((part) => (
        <li key={part.id} className="part" data-part={part.id} data-side={part.dx < 0 ? "left" : "right"}
          style={{ "--dx": `${part.dx}px`, "--dy": `${part.dy}px` } as CSSProperties}>
          <span className="part-anchor" aria-hidden="true" />
          <svg className="part-leader" width="1" height="1" aria-hidden="true">
            <line x1="0" y1="0" x2={part.dx} y2={part.dy} />
          </svg>
          <span className="part-tag">
            <strong>{part.name}</strong>
            <span>{part.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HeroStory() {
  const live = useLive3D();
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [expression, setExpression] = useState<Expression>("idle");
  const section = useRef<HTMLElement>(null);
  const faceEl = useRef<HTMLDivElement>(null);
  const labelsEl = useRef<HTMLDivElement>(null);
  const boxEl = useRef<HTMLElement>(null);
  const story = live && !failed;

  // Load the 3D chunk only after the poster has painted.
  useEffect(() => {
    if (!story) return;
    const start = () => setMount(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 400);
    return () => window.clearTimeout(id);
  }, [story]);

  // Scroll progress through the tall section drives the scene and the copy.
  useEffect(() => {
    const node = section.current;
    if (!node || !story) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = node.getBoundingClientRect();
      const travel = box.height - window.innerHeight;
      const progress = travel > 0 ? clamp01(-box.top / travel) : 0;
      storyProgress.set(progress);
      const intro = 1 - range(progress, 0.1, 0.22);
      const inside = range(progress, 0.24, 0.36) * (1 - range(progress, 0.66, 0.78));
      node.style.setProperty("--intro", intro.toFixed(3));
      node.style.setProperty("--intro-vis", intro < 0.02 ? "hidden" : "visible");
      node.style.setProperty("--inside", inside.toFixed(3));
      node.style.setProperty("--inside-vis", inside < 0.02 ? "hidden" : "visible");
      node.style.setProperty("--bar", progress.toFixed(3));
      setExpression(expressionAt(progress));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
      storyProgress.set(0);
    };
  }, [story]);

  // Stop drawing when the hero is off screen or the tab is hidden.
  useEffect(() => {
    const node = section.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(Boolean(entry?.isIntersecting)), { rootMargin: "80px" });
    observer.observe(node);
    const visibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  return (
    <section ref={section} id="top-story" className="story" data-story={story || undefined} data-ready={ready || undefined}
      data-expression={expression} aria-labelledby="hero-heading">
      <div className="story-stage">
        <div className="story-glow" aria-hidden="true" />
        {story && (
          <div className="story-view">
            {mount && (
              <SceneBoundary onError={() => setFailed(true)}>
                <Suspense fallback={null}>
                  <MobyScene faceEl={faceEl} labelsEl={labelsEl} boxEl={boxEl} active={onScreen && tabVisible} onReady={() => setReady(true)} />
                </Suspense>
              </SceneBoundary>
            )}
            <div className="face-overlay" ref={faceEl} aria-hidden="true">
              <MobyFace expression={expression} size={256} decorative />
            </div>
            <div ref={labelsEl} className="parts-layer"><PartLabelList live /></div>
          </div>
        )}
        <div className="shell story-grid">
          <div className="story-copy">
            <div className="copy-intro">
              <p className="eyebrow"><span className="dot" aria-hidden="true" /> Open source · early development</p>
              <h1 id="hero-heading">A little robot for your desk.</h1>
              <p className="lead">
                Moby listens in English, Russian and Uzbek, answers with a face on a small OLED screen, and helps with tasks on your
                Windows PC. Local tasks run only with your approval.
              </p>
              <div className="cta-row">
                <a className="button button-primary" href="/app/">Open Moby Web <Icon name="arrow" size={18} /></a>
                <a className="button" href="#demo">Try the demo</a>
              </div>
            </div>
            {story && (
              <div className="copy-inside">
                <p className="eyebrow">Inside Moby Mini</p>
                <h2>Open it up.</h2>
                <p className="lead">
                  A microphone, a speaker, an OLED screen and an ESP32-S3 board fit in a shell 74.8 mm wide. This is the prototype
                  design. The hardware is still being validated.
                </p>
              </div>
            )}
          </div>

          <figure ref={boxEl} className="story-model" aria-labelledby="model-caption">
            <img className="poster" src={POSTER_URL} width={POSTER_SIZE.width} height={POSTER_SIZE.height}
              alt="Moby Mini: a small slate-grey robot with a cream back, coral buttons and feet, and a face on an OLED screen"
              fetchPriority="high" decoding="async" />
            <figcaption id="model-caption">
              <span><strong>Moby Mini</strong> prototype design</span>
              {story && <span className="bar" aria-hidden="true"><i /></span>}
            </figcaption>
          </figure>
        </div>
        {story && <a className="scroll-cue" href="#how-it-works">Scroll to open Moby <span aria-hidden="true">↓</span></a>}
      </div>

      {!story && (
        <div className="shell static-parts">
          <h2 className="section-title">Inside Moby Mini</h2>
          <PartLabelList live={false} />
        </div>
      )}
    </section>
  );
}
