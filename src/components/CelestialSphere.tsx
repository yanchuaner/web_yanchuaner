"use client";

import React, { useRef, useEffect, useState } from "react";
import { useThemeAndLocale } from "./ThemeAndLocaleProvider";
import { themeRgb } from "@/lib/theme-color";

interface CelestialSphereProps {
  size?: number; // visual size of canvas container
  interactive?: boolean;
  active?: boolean;
  variant?: "entrance" | "hero" | "ambient";
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  color?: string;
  size?: number;
}

interface ProjectedPoint {
  index: number;
  sx: number;
  sy: number;
  sz: number;
  original: Point3D;
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export default function CelestialSphere({
  size = 320,
  interactive = true,
  active = true,
  variant = "ambient",
}: CelestialSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useThemeAndLocale();
  const [reducedMotion, setReducedMotion] = useState(false);

  const rotationX = useRef(0.2); // Current rotation angles
  const rotationY = useRef(0.5);
  const targetRotationX = useRef(0.2); // Targets for smooth damping
  const targetRotationY = useRef(0.5);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI screens (cap at 2 for performance)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // Generate points on sphere using Fibonacci Sphere algorithm
    const numPoints = 100; // slightly reduced for performance
    const points: Point3D[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const random = createSeededRandom(0x59414e); // "YAN" keeps the constellation stable.

    for (let i = 0; i < numPoints; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / numPoints);

      const x = Math.cos(theta) * Math.sin(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(phi);

      const sizeVal = 1 + random() * 1.5;
      points.push({ x, y, z, size: sizeVal });
    }

    // Precompute stable nearest-neighbour edges in unit-sphere space.
    const edgeKeys = new Set<string>();
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < points.length; i++) {
      const neighbours = points
        .map((point, index) => ({
          index,
          distance: Math.hypot(
            points[i].x - point.x,
            points[i].y - point.y,
            points[i].z - point.z,
          ),
        }))
        .filter(({ index }) => index !== i)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);

      for (const { index } of neighbours) {
        const from = Math.min(i, index);
        const to = Math.max(i, index);
        const key = `${from}:${to}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push([from, to]);
        }
      }
    }

    // Elliptical satellite orbit data
    let satelliteAngle = 0;
    let animationId: number | null = null;
    let lastTime = performance.now();
    let pageVisible = !document.hidden;
    let inViewport = false;

    const stopAnimation = () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const startAnimation = () => {
      if (active && !reducedMotion && pageVisible && inViewport && animationId === null) {
        lastTime = performance.now();
        animationId = requestAnimationFrame(render);
      }
    };

    // Visibility Change Listener
    const handleVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) {
        if (active && !reducedMotion) startAnimation();
        else render(performance.now(), false);
      }
      else stopAnimation();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Intersection Observer to stop animation when not in viewport
    const ob = new IntersectionObserver((entries) => {
      const entry = entries[0];
      inViewport = entry.isIntersecting;
      if (inViewport) {
        if (active && !reducedMotion) startAnimation();
        else render(performance.now(), false);
      }
      else stopAnimation();
    }, { threshold: 0.05 });

    ob.observe(canvas);

    const render = (now: number, scheduleNext = true) => {
      animationId = null;
      if (!pageVisible || !inViewport) return;

      // Time delta for frame-rate independence
      const dt = Math.min(now - lastTime, 50); // cap at 50ms (20fps) to prevent huge jumps
      lastTime = now;

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Interpolate rotations smoothly
      rotationX.current += (targetRotationX.current - rotationX.current) * 0.08;
      rotationY.current += (targetRotationY.current - rotationY.current) * 0.08;

      // Automatically rotate over time when not dragging (speed scaled by dt)
      if (active && !reducedMotion && !isDragging.current) {
        targetRotationY.current += 0.002 * (dt / 16.67);
      }

      const cosX = Math.cos(rotationX.current);
      const sinX = Math.sin(rotationX.current);
      const cosY = Math.cos(rotationY.current);
      const sinY = Math.sin(rotationY.current);

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size * 0.35; // Sphere radius is 35% of container size

      // Draw glowing background glow in dark mode
      const isDark = theme === "dark";
      const glowGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius * 1.2);
      if (isDark) {
        glowGrad.addColorStop(0, themeRgb("--brand-rgb", 0.08));
        glowGrad.addColorStop(1, themeRgb("--brand-rgb", 0));
      } else {
        glowGrad.addColorStop(0, themeRgb("--brand-rgb", 0.04));
        glowGrad.addColorStop(1, themeRgb("--brand-rgb", 0));
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Transform all points to 3D and project to 2D
      const projectedByIndex: ProjectedPoint[] = points.map((p, index) => {
        // Rotate Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;

        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        // Correct Perspective Projection (positive z is closer to viewer)
        const fov = 300;
        const scale = fov / Math.max(1, fov - z2 * radius);
        const sx = centerX + x1 * radius * scale;
        const sy = centerY + y2 * radius * scale;

        return { index, sx, sy, sz: z2, original: p };
      });

      // Sort by depth (z-index) so we draw back-to-front
      const projected = [...projectedByIndex].sort((a, b) => a.sz - b.sz);

      // Draw constellation mesh lines
      ctx.lineWidth = 0.5;
      const lineColor = themeRgb("--brand-rgb", isDark ? 0.12 : 0.08);
      ctx.strokeStyle = lineColor;

      for (const [from, to] of edges) {
        const p1 = projectedByIndex[from];
        const p2 = projectedByIndex[to];
        ctx.globalAlpha = Math.max(0.2, (p1.sz + p2.sz + 2) / 4);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // The upright glyph is the sphere's fixed core; mesh sits behind it and
      // the equator plus foreground stars pass in front to preserve depth.
      const glyphSizeRatio = variant === "entrance" ? 0.22 : variant === "hero" ? 0.2 : 0.18;
      const glyphAlpha = isDark
        ? variant === "entrance" ? 0.58 : variant === "hero" ? 0.46 : 0.34
        : variant === "entrance" ? 0.48 : variant === "hero" ? 0.4 : 0.3;
      const glyphPulse = active && !reducedMotion && variant === "entrance"
        ? 0.94 + Math.sin(now / 900) * 0.06
        : 1;

      ctx.save();
      const sealSize = size * (variant === "entrance" ? 0.245 : 0.225);
      if (isDark) {
        ctx.strokeStyle = themeRgb("--space-amber-rgb", 0.2);
        ctx.lineWidth = Math.max(0.6, size * 0.002);
        for (let index = 0; index < 8; index++) {
          const angle = (Math.PI * 2 * index) / 8;
          const inner = sealSize * 0.56;
          const outer = sealSize * (index % 2 === 0 ? 0.64 : 0.61);
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
          ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
          ctx.stroke();
        }
      } else {
        ctx.translate(centerX, centerY);
        ctx.rotate(-0.025);
        ctx.strokeStyle = themeRgb("--heritage-rgb", 0.22);
        ctx.lineWidth = Math.max(0.8, size * 0.003);
        ctx.strokeRect(-sealSize / 2, -sealSize / 2, sealSize, sealSize);
        ctx.translate(-centerX, -centerY);
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.round(size * glyphSizeRatio)}px 'STSong', 'Songti SC', 'SimSun', 'Noto Serif SC', serif`;
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(0.8, size * 0.0045);
      ctx.strokeStyle = themeRgb("--surface-muted-rgb", isDark ? 0.66 : 0.72);
      ctx.strokeText("燕", centerX, centerY + size * 0.008);
      ctx.fillStyle = themeRgb(isDark ? "--space-amber-rgb" : "--heritage-rgb", glyphAlpha * glyphPulse);
      if (isDark) {
        ctx.shadowBlur = variant === "entrance" ? 16 : 10;
        ctx.shadowColor = themeRgb("--space-amber-rgb", 0.45);
      }
      ctx.fillText("燕", centerX, centerY + size * 0.008);
      ctx.restore();

      // Draw grid outline ring (space equator / latitude circle)
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius, radius * Math.abs(sinX), rotationY.current, 0, Math.PI * 2);
      ctx.strokeStyle = themeRgb("--brand-rgb", isDark ? 0.18 : 0.12);
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Draw stars (points)
      projected.forEach((p) => {
        const opacity = (p.sz + 1.2) / 2.2; // depth-based opacity
        const color = themeRgb(isDark ? "--brand-soft-rgb" : "--brand-rgb", opacity * (isDark ? 0.9 : 0.8));

        ctx.fillStyle = color;
        ctx.beginPath();
        const sizeMultiplier = p.sz > 0 ? 1.4 : 0.8;
        ctx.arc(p.sx, p.sy, (p.original.size || 1) * sizeMultiplier, 0, Math.PI * 2);
        ctx.fill();

        // Give close stars a neon glow
        if (p.sz > 0.6 && isDark) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = themeRgb("--brand-rgb", 0.8);
          ctx.fillStyle = themeRgb("--on-brand-rgb", 0.9);
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      });

      // Update and draw satellite orbit (Aerospace element)
      satelliteAngle += 0.015 * (dt / 16.67);
      const satX = Math.cos(satelliteAngle) * radius * 1.35;
      const satZ = Math.sin(satelliteAngle) * radius * 1.35;
      const satY = Math.sin(satelliteAngle) * radius * 0.4;

      // Rotate Y
      const satRotX1 = satX * cosY - satZ * sinY;
      const satRotZ1 = satZ * cosY + satX * sinY;

      // Rotate X
      const satRotY2 = satY * cosX - satRotZ1 * sinX;
      const satRotZ2 = satRotZ1 * cosX + satY * sinX;

      const satScale = 300 / Math.max(1, 300 - satRotZ2);
      const satScreenX = centerX + satRotX1 * satScale;
      const satScreenY = centerY + satRotY2 * satScale;

      // Draw satellite orbit path (thin ring)
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * 1.35, radius * 0.5 * Math.abs(cosX), -0.3, 0, Math.PI * 2);
      ctx.strokeStyle = themeRgb("--device-signal-rgb", isDark ? 0.08 : 0.05);
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Draw satellite dot with glowing lens flare
      ctx.fillStyle = themeRgb("--device-signal-rgb");
      ctx.beginPath();
      ctx.arc(satScreenX, satScreenY, 3, 0, Math.PI * 2);
      ctx.fill();

      if (isDark) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = themeRgb("--device-signal-rgb");
        ctx.fillStyle = themeRgb("--on-brand-rgb");
        ctx.beginPath();
        ctx.arc(satScreenX, satScreenY, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (scheduleNext) startAnimation();
    };

    return () => {
      stopAnimation();
      document.removeEventListener("visibilitychange", handleVisibility);
      ob.disconnect();
    };
  }, [active, reducedMotion, size, theme, variant]);

  const canInteract = active && interactive && !reducedMotion;

  // Touch and drag interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canInteract) return;
    isDragging.current = true;
    lastMouseX.current = e.clientX;
    lastMouseY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !canInteract) return;
    const deltaX = e.clientX - lastMouseX.current;
    const deltaY = e.clientY - lastMouseY.current;

    targetRotationY.current += deltaX * 0.007;
    targetRotationX.current += deltaY * 0.007;

    // Constrain pitch rotation to avoid gimbal lock
    targetRotationX.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotationX.current));

    lastMouseX.current = e.clientX;
    lastMouseY.current = e.clientY;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canInteract || e.touches.length === 0) return;
    isDragging.current = true;
    lastMouseX.current = e.touches[0].clientX;
    lastMouseY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !canInteract || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - lastMouseX.current;
    const deltaY = e.touches[0].clientY - lastMouseY.current;

    targetRotationY.current += deltaX * 0.007;
    targetRotationX.current += deltaY * 0.007;
    targetRotationX.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotationX.current));

    lastMouseX.current = e.touches[0].clientX;
    lastMouseY.current = e.touches[0].clientY;
  };

  return (
    <div
      ref={containerRef}
      data-celestial-sphere=""
      data-glyph="燕"
      data-variant={variant}
      data-active={active ? "true" : "false"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      className="relative flex items-center justify-center select-none touch-none"
      style={{ width: size, maxWidth: "100%", aspectRatio: "1 / 1" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ width: "100%", height: "100%", cursor: canInteract ? "grab" : "default" }}
      />
    </div>
  );
}
