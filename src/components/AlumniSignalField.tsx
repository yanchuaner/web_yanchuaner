"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import { themeRgb } from "@/lib/theme-color";

type SignalNode = {
  x: number;
  y: number;
  size: number;
  phase: number;
  tone: "neutral" | "cyan" | "amber";
};

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seededRandom(0x59435f53);
const SIGNAL_NODES: SignalNode[] = Array.from({ length: 18 }, (_, index) => ({
  x: 0.08 + random() * 0.84,
  y: 0.1 + random() * 0.8,
  size: 1.4 + random() * 1.8,
  phase: random(),
  tone: index % 7 === 0 ? "amber" : index % 4 === 0 ? "cyan" : "neutral",
}));

const SIGNAL_EDGES = SIGNAL_NODES.map((_, index) => [index, (index + 1) % SIGNAL_NODES.length] as const);

export default function AlumniSignalField({ active = true }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme, t } = useThemeAndLocale();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rawContext = canvas.getContext("2d");
    if (!rawContext) return;
    const context: CanvasRenderingContext2D = rawContext;

    let width = 0;
    let height = 0;
    let animationId: number | null = null;
    let pageVisible = !document.hidden;
    let inViewport = false;
    const isDark = theme === "dark";

    const stop = () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const canAnimate = () => active && !reducedMotion && pageVisible && inViewport;

    const requestNext = () => {
      if (canAnimate() && animationId === null) {
        animationId = requestAnimationFrame(render);
      }
    };

    function render(now: number, scheduleNext = true) {
      animationId = null;
      if (width <= 0 || height <= 0 || !pageVisible || !inViewport) return;
      context.clearRect(0, 0, width, height);

      const center = { x: width * 0.52, y: height * 0.5 };
      const points = SIGNAL_NODES.map((node) => ({
        ...node,
        px: node.x * width,
        py: node.y * height,
      }));

      context.lineWidth = 0.7;
      context.strokeStyle = themeRgb(isDark ? "--space-cyan-rgb" : "--brand-rgb", isDark ? 0.14 : 0.1);
      for (const [from, to] of SIGNAL_EDGES) {
        context.beginPath();
        context.moveTo(points[from].px, points[from].py);
        context.lineTo(points[to].px, points[to].py);
        context.stroke();
      }

      context.strokeStyle = themeRgb(isDark ? "--on-brand-rgb" : "--heritage-rgb", isDark ? 0.09 : 0.08);
      for (let index = 0; index < points.length; index += 3) {
        context.beginPath();
        context.moveTo(points[index].px, points[index].py);
        context.lineTo(center.x, center.y);
        context.stroke();
      }

      points.forEach((point) => {
        const variable = point.tone === "amber"
          ? (isDark ? "--space-amber-rgb" : "--heritage-rgb")
          : point.tone === "cyan"
            ? "--space-cyan-rgb"
            : (isDark ? "--on-brand-rgb" : "--brand-rgb");
        const pulse = reducedMotion ? 1 : 0.82 + Math.sin(now / 1100 + point.phase * Math.PI * 2) * 0.18;
        context.fillStyle = themeRgb(variable, (isDark ? 0.78 : 0.54) * pulse);
        context.beginPath();
        context.arc(point.px, point.py, point.size, 0, Math.PI * 2);
        context.fill();
      });

      if (!reducedMotion) {
        for (let index = 0; index < points.length; index += 4) {
          const point = points[index];
          const progress = (now / 3600 + point.phase) % 1;
          const x = point.px + (center.x - point.px) * progress;
          const y = point.py + (center.y - point.py) * progress;
          context.fillStyle = themeRgb(index % 8 === 0 ? "--space-amber-rgb" : "--space-cyan-rgb", isDark ? 0.9 : 0.58);
          context.beginPath();
          context.arc(x, y, isDark ? 1.8 : 1.5, 0, Math.PI * 2);
          context.fill();
        }
      }

      context.save();
      context.translate(center.x, center.y);
      context.strokeStyle = themeRgb(isDark ? "--space-amber-rgb" : "--heritage-rgb", isDark ? 0.34 : 0.26);
      context.lineWidth = 1;
      context.beginPath();
      context.arc(0, 0, Math.min(width, height) * 0.12, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = themeRgb(isDark ? "--space-amber-rgb" : "--heritage-rgb", isDark ? 0.72 : 0.62);
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `700 ${Math.max(16, Math.min(width, height) * 0.07)}px 'STSong', 'Songti SC', 'SimSun', serif`;
      context.fillText(t("home.signalCenterLabel"), 0, 1);
      context.restore();

      if (scheduleNext) requestNext();
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(performance.now(), false);
      requestNext();
    };

    const handleVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) {
        render(performance.now(), false);
        requestNext();
      } else {
        stop();
      }
    };

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      if (inViewport) {
        render(performance.now(), false);
        requestNext();
      } else {
        stop();
      }
    }, { threshold: 0.05 });
    const resizeObserver = new ResizeObserver(resize);

    document.addEventListener("visibilitychange", handleVisibility);
    intersectionObserver.observe(container);
    resizeObserver.observe(container);
    resize();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [active, reducedMotion, t, theme]);

  return (
    <div
      ref={containerRef}
      data-alumni-signal-field=""
      data-active={active ? "true" : "false"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      className="relative h-[260px] min-w-0 overflow-hidden sm:h-[320px]"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
