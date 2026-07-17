"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import CelestialSphere from "./CelestialSphere";
import { useThemeAndLocale } from "./ThemeAndLocaleProvider";

export default function CelestialEntrance({
  onReveal,
  onComplete,
}: {
  onReveal: () => void;
  onComplete: () => void;
}) {
  const { locale } = useThemeAndLocale();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [text, setText] = useState("");
  const [sphereSize, setSphereSize] = useState(360);

  const fullText = locale === "zh"
    ? "[SIGNAL] 星轨接通。山海虽远，同窗仍在。"
    : "[SIGNAL] Orbit linked. Across every distance, our shared years remain.";

  useEffect(() => {
    setSphereSize(window.innerHeight < 700 ? 300 : 420);
  }, []);

  // Typewriter effect
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, idx + 1));
      idx++;
      if (idx >= fullText.length) {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [fullText]);

  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
  }, []);

  const handleEnter = () => {
    setIsTransitioning(true);
    onReveal();
    // Write seen to session storage
    try {
      sessionStorage.setItem("yz-intro-seen", "1");
    } catch {
      // The transition still completes when storage is unavailable.
    }
    // Complete after transition finishes
    enterTimerRef.current = setTimeout(() => {
      onComplete();
    }, 1050);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={locale === "zh" ? "进入燕中校友数字母港" : "Enter Yan-Zhong Alumni Port"}
      className={`celestial-entrance ${isTransitioning ? "celestial-entrance--leaving" : ""}`}
    >
      <div className="celestial-entrance__content">
        {/* Large sphere */}
        <div className="celestial-entrance__sphere">
          <CelestialSphere size={sphereSize} interactive={!isTransitioning} variant="entrance" />
        </div>

        <div className="celestial-entrance__copy">
          <p className="mt-6 text-2xl font-bold font-heading text-brand">
            {locale === "zh" ? "燕中校友数字母港" : "YAN-ZHONG ALUMNI PORT"}
          </p>
          <div className="mt-3 flex min-h-6 items-center justify-center text-xs font-mono text-main/55">
            <span className="max-w-[84vw] whitespace-normal">{text}</span>
            <span className="ml-1 inline-block h-4 w-1.5 shrink-0 bg-brand animate-pulse" />
          </div>
          <button
            type="button"
            onClick={handleEnter}
            disabled={isTransitioning}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-8 text-sm font-semibold text-contrast shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {locale === "zh" ? "进入星轨" : "ENTER ORBIT"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
