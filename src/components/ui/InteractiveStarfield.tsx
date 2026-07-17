"use client";

import React, { useEffect, useRef } from "react";
import { useThemeAndLocale } from "../ThemeAndLocaleProvider";
import { themeRgb } from "@/lib/theme-color";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
}

export function InteractiveStarfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useThemeAndLocale();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number | undefined;
    let particles: Particle[] = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compactMode = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
    const particleCount = reducedMotion ? 18 : compactMode ? 24 : 45;
    const connectDistance = compactMode ? 90 : 120;
    const repelRadius = 130;
    const mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // 初始化粒子
    const init = () => {
      particles = Array.from({ length: particleCount }, () => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25 - 0.05,
          baseX: x,
          baseY: y,
          size: Math.random() * 1.2 + 0.4,
          opacity: Math.random() * 0.4 + 0.15,
        };
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("resize", resize);
    if (!compactMode && !reducedMotion) {
      window.addEventListener("mousemove", handleMouseMove);
    }
    document.addEventListener("mouseleave", handleMouseLeave);
    
    resize();
    init();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 主题自适应粒子颜色设定
      const colorVariable = theme === "dark" ? "--brand-fg-rgb" : "--brand-rgb";

      particles.forEach((p) => {
        // 1. 基础物理漂移
        p.x += p.vx;
        p.y += p.vy;

        // 2. 鼠标排斥躲避 (Repel) 逻辑
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (!compactMode && !reducedMotion && dist > 0 && dist < repelRadius) {
          const force = (repelRadius - dist) / repelRadius;
          // 平滑向外排开
          p.x += (dx / dist) * force * 1.5;
          p.y += (dy / dist) * force * 1.5;
        }

        // 3. 边界回弹/循环
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // 4. 绘制星点
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = themeRgb(colorVariable, p.opacity);
        ctx.fill();
      });

      // 5. 粒子连线 (隐喻校友联结)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectDistance) {
            const alpha = (1 - dist / connectDistance) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = themeRgb(colorVariable, alpha);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

    };

    const animate = () => {
      animationFrameId = undefined;
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameId !== undefined) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = undefined;
        }
        return;
      }
      if (!reducedMotion && animationFrameId === undefined) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (reducedMotion) {
      draw();
    } else {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId !== undefined) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 block"
      style={{ mixBlendMode: theme === "dark" ? "screen" : "multiply" }}
    />
  );
}
