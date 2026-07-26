"use client";

import React, { useState, useEffect, useRef } from "react";
import { useThemeAndLocale } from "../ThemeAndLocaleProvider";
import { Radio, Tv } from "lucide-react";
import { themeRgb } from "@/lib/theme-color";
import { cn } from "./cn";

interface TVChannel {
  id: number;
  nameKey: string;
  contentKey: string;
}

const CHANNELS: TVChannel[] = [
  { id: 1, nameKey: "tv.channels.historyName", contentKey: "tv.channels.historyContent" },
  { id: 2, nameKey: "tv.channels.aerospaceName", contentKey: "tv.channels.aerospaceContent" },
  { id: 3, nameKey: "tv.channels.communityName", contentKey: "tv.channels.communityContent" },
];

export default function ChannelTV({ tone = "default" }: { tone?: "default" | "narrative" }) {
  const { t, theme } = useThemeAndLocale();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const powerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeChannelIdx, setActiveChannelIdx] = useState(0);
  const [showNoise, setShowNoise] = useState(false);
  const [isOn, setIsOn] = useState(true);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
      if (powerTimerRef.current) clearTimeout(powerTimerRef.current);
    };
  }, []);

  // Generate TV Static Noise when transitioning or turned off
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use lower resolution for performance (160x100)
    canvas.width = 160;
    canvas.height = 100;

    // Pre-allocate ImageData to avoid per-frame garbage collection
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    let animationId: number | null = null;
    let lastRenderTime = 0;
    const fpsInterval = 1000 / 20; // limit static noise to 20 FPS
    let pageVisible = !document.hidden;
    let inViewport = false;

    // Draw single frame black when turned off
    if (!isOn) {
      ctx.fillStyle = themeRgb("--device-bg-rgb");
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const stopNoise = () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const startNoise = () => {
      if (pageVisible && inViewport && showNoise && animationId === null) {
        animationId = requestAnimationFrame(renderNoise);
      }
    };

    const handleVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) startNoise();
      else stopNoise();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const ob = new IntersectionObserver((entries) => {
      inViewport = entries[0].isIntersecting;
      if (inViewport) startNoise();
      else stopNoise();
    }, { threshold: 0.05 });
    ob.observe(canvas);

    const renderNoise = (now: number) => {
      animationId = null;
      if (!pageVisible || !inViewport || !isOn || !showNoise) {
        // If turned on but not showing transition noise, clear/do nothing
        if (isOn && !showNoise) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }

      startNoise();

      if (now - lastRenderTime < fpsInterval) return;
      lastRenderTime = now;

      // Fill noise pixels
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.floor(Math.random() * 255);
        data[i] = noise;     // R
        data[i + 1] = noise; // G
        data[i + 2] = noise; // B
        data[i + 3] = 255;   // A
      }

      ctx.putImageData(imgData, 0, 0);

      // Render overlay scanline
      ctx.fillStyle = themeRgb("--overlay-rgb", 0.18);
      const scanlineY = Math.floor(Math.random() * canvas.height);
      ctx.fillRect(0, scanlineY, canvas.width, 3);
    };

    if (!showNoise) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      stopNoise();
      document.removeEventListener("visibilitychange", handleVisibility);
      ob.disconnect();
    };
  }, [showNoise, isOn, theme]);

  const switchChannel = (index: number) => {
    if (!isOn) return;
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);

    setShowNoise(true);
    switchTimerRef.current = setTimeout(() => {
      setActiveChannelIdx(index);
      setShowNoise(false);
    }, 380); // 380ms static transition
  };

  const togglePower = () => {
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    if (powerTimerRef.current) clearTimeout(powerTimerRef.current);

    if (isOn) {
      setIsOn(false);
      setShowNoise(false);
    } else {
      setShowNoise(true);
      setIsOn(true);
      powerTimerRef.current = setTimeout(() => {
        setShowNoise(false);
      }, 500);
    }
  };

  const activeChannel = CHANNELS[activeChannelIdx];
  const narrative = tone === "narrative";

  return (
    <div className={cn(
      "relative mx-auto flex w-full max-w-lg flex-col gap-5 rounded-card border p-5 shadow-lg backdrop-blur-xl md:flex-row",
      narrative
        ? "border-narrative-route/20 bg-narrative-surface/90"
        : "border-line bg-surface-muted/95",
    )}>

      {/* CRT TV Screen Container */}
      <div className="flex-1 aspect-[4/3] rounded-lg border border-line bg-device-bg relative overflow-hidden shadow-inner flex flex-col">

        {/* TV Tube Glass Reflection/Highlight Overlay */}
        <div className="crt-reflection absolute inset-0 z-20 pointer-events-none" />

        {/* CRT Scanline Filter Overlay */}
        <div className="crt-scanlines absolute inset-0 z-20 pointer-events-none opacity-75" />

        {/* Noise Canvas (runs on static noise) */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 z-10 w-full h-full transition-opacity duration-300 ${
            showNoise || !isOn ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />

        {/* Channel Content Frame */}
        <div
          className={`flex-1 p-5 flex flex-col justify-center text-center font-mono leading-relaxed bg-device-bg text-device-fg select-none transition-all duration-300 ${
            isOn && !showNoise ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
        >
          {/* Signal Indicator */}
          <div className="absolute top-3 left-4 flex items-center gap-1.5 text-[9px] text-device-signal/70 uppercase select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-device-signal" />
            <span>{t("tv.signal")}</span>
          </div>

          <h4 className="text-sm font-bold text-accent border-b border-line pb-2 mb-3">
            {t(activeChannel.nameKey)}
          </h4>
          <p className="text-[11px] leading-relaxed text-device-fg/80 text-justify">
            {t(activeChannel.contentKey)}
          </p>
        </div>
      </div>

      {/* Retro TV Control Panel (Knobs, Switchers) */}
      <div className={cn(
        "flex w-full flex-col items-center justify-between gap-4 rounded-lg border p-3 md:w-28",
        narrative
          ? "border-narrative-route/20 bg-narrative/55"
          : "border-line bg-surface/40",
      )}>

        {/* TV Grid Logo */}
        <div className="flex flex-col items-center gap-1">
          <Tv size={20} className={narrative ? "text-narrative-route" : "text-brand"} />
          <span className={cn(
            "select-none font-mono text-[9px] uppercase",
            narrative ? "text-narrative-muted" : "text-main/50",
          )}>YZ-CRT-80</span>
        </div>

        {/* Channels Selector Knobs */}
        <div className="flex flex-col gap-2 w-full">
          <span className={cn(
            "select-none text-center font-mono text-[8px] font-semibold uppercase",
            narrative ? "text-narrative-muted" : "text-main/40",
          )}>
            {t("tv.channelSelector")}
          </span>
          {CHANNELS.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => switchChannel(idx)}
              disabled={!isOn}
              className={`h-8 w-full rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                activeChannelIdx === idx && isOn
                  ? narrative
                    ? "border-narrative-route bg-narrative-route text-contrast shadow-md"
                    : "border-brand bg-brand text-contrast shadow-md shadow-brand/20"
                  : narrative
                    ? "border border-narrative-route/20 bg-narrative text-narrative-muted hover:bg-narrative-route/10 hover:text-narrative-route"
                    : "border border-line bg-surface text-main/60 hover:bg-brand/10 hover:text-brand"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              CH-{ch.id}
            </button>
          ))}
        </div>

        {/* Rotary Switch / Power Button */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          <button
            onClick={togglePower}
            className={`h-10 w-10 rounded-full flex items-center justify-center border shadow-md transition-all active:scale-95 cursor-pointer ${
              isOn
                ? "bg-danger/10 border-danger/30 text-danger hover:bg-danger hover:text-contrast"
                : "bg-success/10 border-success/30 text-success hover:bg-success hover:text-contrast"
            }`}
            title={isOn ? t("tv.powerOff") : t("tv.powerOn")}
            aria-label={isOn ? t("tv.powerOff") : t("tv.powerOn")}
          >
            <Radio size={16} className={isOn ? "animate-spin-slow" : ""} />
          </button>
          <span className={cn(
            "select-none font-mono text-[8px] uppercase",
            narrative ? "text-narrative-muted" : "text-main/40",
          )}>
            {isOn ? t("tv.powerOnStatus") : t("tv.powerOffStatus")}
          </span>
        </div>

      </div>
    </div>
  );
}
