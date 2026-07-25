"use client";

import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, FastForward } from "lucide-react";
import { markHomeIntroSeen } from "@/lib/home-intro";
import YanHomecomingSeal from "./YanHomecomingSeal";
import { useThemeAndLocale } from "./ThemeAndLocaleProvider";
import { entranceSystemOrbits } from "@/data/entrance-system";

interface CelestialEntranceProps {
  onReveal: (immediate?: boolean) => void;
  onComplete: () => void;
}

export default function CelestialEntrance({ onReveal, onComplete }: CelestialEntranceProps) {
  const { t } = useThemeAndLocale();
  const dialogRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const systemOrbitsRef = useRef<HTMLDivElement>(null);
  const handoffRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const transitioningRef = useRef(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitRef = useRef<(stamp: boolean) => void>(() => undefined);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [pausedOrbitId, setPausedOrbitId] = useState<string | null>(null);
  const activeOrbit = entranceSystemOrbits.find((orbit) => orbit.id === pausedOrbitId);

  const clearPausedOrbit = (orbitId: string) => {
    setPausedOrbitId((current) => (current === orbitId ? null : current));
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  const beginExit = (stamp: boolean) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setIsTransitioning(true);
    setIsSkipping(!stamp);
    markHomeIntroSeen();

    if (stamp) {
      setIsStamped(true);
      try {
        navigator.vibrate?.(12);
      } catch {
        // Haptic feedback is optional and must never block entry.
      }
    }

    if (reducedMotion || !stamp) {
      onReveal(true);
      completeTimerRef.current = setTimeout(onComplete, reducedMotion ? 40 : 180);
      return;
    }

    revealTimerRef.current = setTimeout(onReveal, 760);
    completeTimerRef.current = setTimeout(onComplete, 2100);
  };
  exitRef.current = beginExit;

  useEffect(() => {
    if (!isTransitioning || isSkipping || reducedMotion) return;
    const visual = visualRef.current;
    const handoff = handoffRef.current;
    const systemOrbits = systemOrbitsRef.current;
    if (!visual || !handoff || !systemOrbits) return;

    const duration = 1800;
    const start = performance.now();
    const smoothstep = (value: number) => value * value * (3 - 2 * value);
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const sourceRect = visual.getBoundingClientRect();
    const target = document.querySelector<HTMLElement>("[data-home-sphere-target]");
    const targetRect = target?.getBoundingClientRect();
    const targetX = targetRect
      ? targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2)
      : 0;
    const targetY = targetRect
      ? targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2)
      : 0;
    const targetScale = targetRect
      ? Math.max(0.6, Math.min(1.6, targetRect.width / sourceRect.width))
      : 1;
    let animationFrame = 0;

    const render = (now: number) => {
      const progress = clamp((now - start) / duration);
      const orbitSpread = smoothstep(clamp(progress / 0.3));
      const orbitFade = 1 - smoothstep(clamp((progress - 0.42) / 0.18));
      systemOrbits.style.transform = `translate(-50%, -50%) scale(${1 + orbitSpread * 0.16})`;
      systemOrbits.style.opacity = String(orbitFade);

      const travel = smoothstep(clamp((progress - 0.28) / 0.62));
      const pulseProgress = clamp(progress / 0.58);
      const pulse = Math.sin(Math.PI * pulseProgress) * 1.15 * (1 - travel);
      const scale = (1 - travel) * (1 + pulse) + travel * targetScale;
      const fade = 1 - smoothstep(clamp((progress - 0.75) / 0.23));
      visual.style.transform = `translate3d(${targetX * travel}px, ${targetY * travel}px, 0) scale(${scale})`;
      visual.style.opacity = String(fade);

      const lineProgress = smoothstep(clamp((progress - 0.08) / 0.72));
      const lineFade = 1 - smoothstep(clamp((progress - 0.8) / 0.2));
      for (const line of handoff.querySelectorAll<HTMLElement>("span")) {
        line.style.setProperty("--handoff-progress", String(lineProgress));
        line.style.opacity = String(lineProgress * lineFade);
      }

      if (progress < 1) animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, [isSkipping, isTransitioning, reducedMotion]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const inertTargets = Array.from(document.body.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== dialog,
    );
    const previousStates = inertTargets.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));
    const previousOverflow = document.body.style.overflow;

    for (const element of inertTargets) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "hidden";

    const focusFrame = requestAnimationFrame(() => primaryRef.current?.focus({ preventScroll: true }));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        exitRef.current(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      for (const { element, inert, ariaHidden } of previousStates) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      if (!transitioningRef.current) previousFocus?.focus({ preventScroll: true });
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, []);

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-intro-title"
      aria-describedby="home-intro-description"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      className={`celestial-entrance ${isTransitioning ? "celestial-entrance--leaving" : ""} ${
        isSkipping ? "celestial-entrance--skipping" : ""
      } ${pageVisible ? "" : "celestial-entrance--paused"}`}
    >
      <div className="celestial-entrance__theme-layer" aria-hidden="true" />
      <div className="celestial-entrance__atlas" aria-hidden="true">
        <span className="celestial-entrance__atlas-node atlas-node-a" />
        <span className="celestial-entrance__atlas-node atlas-node-b" />
        <span className="celestial-entrance__atlas-node atlas-node-c" />
      </div>
      <div ref={handoffRef} className="celestial-entrance__handoff" aria-hidden="true">
        <span className="handoff-a" />
        <span className="handoff-b" />
        <span className="handoff-c" />
      </div>

      <button
        type="button"
        onClick={() => beginExit(false)}
        disabled={isTransitioning}
        className="celestial-entrance__skip"
      >
        <FastForward size={15} aria-hidden="true" />
        {t("home.introSkip")}
      </button>

      <div className="celestial-entrance__content">
        <div className="celestial-entrance__stage">
          <div ref={systemOrbitsRef} className="celestial-entrance__system-orbits">
            {entranceSystemOrbits.map((orbit) => (
              <span
                key={orbit.id}
                className={`celestial-entrance__system-orbit ${orbit.orbitClass}`}
                data-paused={pausedOrbitId === orbit.id ? "true" : undefined}
                style={{
                  "--orbit-duration": orbit.duration,
                  "--orbit-delay": orbit.delay,
                  "--orbit-departure-delay": orbit.departureDelay,
                } as CSSProperties}
              >
                <button
                  type="button"
                  className="celestial-entrance__satellite"
                  aria-label={`${t(orbit.labelKey)}：${t(orbit.descriptionKey)}`}
                  aria-describedby={`entrance-${orbit.id}-tooltip`}
                  aria-pressed={pausedOrbitId === orbit.id}
                  data-active={pausedOrbitId === orbit.id ? "true" : undefined}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setPausedOrbitId(orbit.id);
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === "mouse") clearPausedOrbit(orbit.id);
                  }}
                  onFocus={() => setPausedOrbitId(orbit.id)}
                  onBlur={() => clearPausedOrbit(orbit.id)}
                  onClick={() => setPausedOrbitId(orbit.id)}
                >
                  <i aria-hidden="true" />
                  <b>{t(orbit.labelKey)}</b>
                  <span
                    id={`entrance-${orbit.id}-tooltip`}
                    className="celestial-entrance__satellite-tooltip"
                    role="tooltip"
                    aria-hidden={pausedOrbitId !== orbit.id}
                  >
                    {Array.from(t(orbit.descriptionKey)).map((character, index) => (
                      <span
                        key={`${orbit.id}-${index}`}
                        className="celestial-entrance__tooltip-character"
                        style={{ "--character-index": index } as CSSProperties}
                      >
                        {character === " " ? "\u00a0" : character}
                      </span>
                    ))}
                  </span>
                </button>
              </span>
            ))}
          </div>
          <div ref={visualRef} className="celestial-entrance__visual">
            <YanHomecomingSeal stamped={isStamped || reducedMotion} />
          </div>
          </div>
          <div className="celestial-entrance__mobile-orbit-controls" aria-label={t("home.introOrbitControlsLabel")}>
            {entranceSystemOrbits.map((orbit) => (
              <button
                key={`mobile-${orbit.id}`}
                type="button"
                aria-pressed={pausedOrbitId === orbit.id}
                onClick={() => setPausedOrbitId(orbit.id)}
              >
                <i aria-hidden="true" />
                {t(orbit.labelKey)}
              </button>
            ))}
          </div>
          <div
            className="celestial-entrance__mobile-orbit-note"
            data-visible={activeOrbit ? "true" : undefined}
            aria-live="polite"
          >
            {activeOrbit ? (
              <>
                <strong>{t(activeOrbit.labelKey)}</strong>
                <span>
                  {Array.from(t(activeOrbit.descriptionKey)).map((character, index) => (
                    <i
                      key={`${activeOrbit.id}-mobile-${index}`}
                      style={{ "--character-index": index } as CSSProperties}
                    >
                      {character === " " ? "\u00a0" : character}
                    </i>
                  ))}
                </span>
              </>
            ) : null}
          </div>

        <div className="celestial-entrance__copy">
          <p className="celestial-entrance__eyebrow">{t("home.introEyebrow")}</p>
          <h2 id="home-intro-title" className="celestial-entrance__title">
            {t("nav.brand")}
          </h2>
          <p id="home-intro-description" className="celestial-entrance__description">
            {t("home.introDescription")}
          </p>
          <button
            ref={primaryRef}
            type="button"
            onClick={() => beginExit(true)}
            disabled={isTransitioning}
            className="celestial-entrance__primary"
          >
            {t("home.introEnter")}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
