"use client";

import { useState, memo } from "react";
import { starMessages } from "@/data/starMessages";
import { useThemeAndLocale } from "./ThemeAndLocaleProvider";

const ORBIT_COUNT = 15;

function createOrbitStars() {
  let seed = 0x4f524249;
  const random = () => {
    seed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), 61 | seed);
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  };
  const messages = [...starMessages];
  for (let index = messages.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [messages[index], messages[target]] = [messages[target], messages[index]];
  }
  return messages.slice(0, ORBIT_COUNT).map((message, index) => ({
    ...message,
    id: index,
    top: random() * 80 + 10,
    left: random() * 80 + 10,
    duration: random() * 15 + 20,
    delay: random() * -30,
  }));
}

const ORBIT_STARS = createOrbitStars();

const MessageOrbit = memo(function MessageOrbit() {
  const { locale } = useThemeAndLocale();
  const [activeStar, setActiveStar] = useState<number | null>(null);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]">
      {ORBIT_STARS.map((star) => (
        <div
          key={star.id}
          className="message-orbit-star pointer-events-auto absolute flex items-center justify-center cursor-pointer animate-float-star group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-full"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
          onClick={() => setActiveStar(activeStar === star.id ? null : star.id)}
          onMouseLeave={() => setActiveStar(null)}
          tabIndex={0}
          role="button"
          aria-label={
            locale === "zh"
              ? `查看校友寄语: ${star.name}`
              : `Read alumni message from ${star.name}`
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveStar(activeStar === star.id ? null : star.id);
            }
          }}
        >
          <div className="message-orbit-node transition-transform duration-300 group-hover:scale-150" />

          {/* Context Bubble (Toast) — 科幻全息深紫玻璃气泡 */}
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 w-48 p-3 rounded-lg bg-device-bg/90 border border-brand/40 backdrop-blur-md shadow-lg transition-all duration-300 origin-top ${
              activeStar === star.id ? "opacity-100 scale-100 z-50 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-device-bg/90 border-l border-t border-brand/40 rotate-45" />
            <div className="relative z-10 text-center">
              <p className="text-xs font-bold tracking-wider text-brand font-mono">{star.name}</p>
              <div className="mt-1.5 h-px w-full bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
              <p className="mt-2 text-xs text-brand leading-relaxed font-sans">{star.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default MessageOrbit;
