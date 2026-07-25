"use client";

import { memo, useEffect, useState } from "react";
import { starMessages } from "@/data/starMessages";
import { useThemeAndLocale } from "./ThemeAndLocaleProvider";

const ORBIT_STARS = [
  { id: "north-star", zh: "北辰", en: "North Star", meaningZh: "燕中 · 共同起点", meaningEn: "Yanzhong · shared origin", duration: 68, offset: 6 },
  { id: "return-star", zh: "归舟", en: "Homeward", meaningZh: "归途 · 再次相逢", meaningEn: "Return · meeting again", duration: 52, offset: -18 },
  { id: "rings-star", zh: "年轮", en: "Rings", meaningZh: "年轮 · 时间与成长", meaningEn: "Years · time and growth", duration: 78, offset: 28 },
  { id: "mountain-star", zh: "远行", en: "Wayfarer", meaningZh: "山海 · 去往远方", meaningEn: "Distance · toward far places", duration: 61, offset: -42 },
  { id: "lantern-star", zh: "灯火", en: "Lantern", meaningZh: "灯火 · 仍在参与", meaningEn: "Light · still contributing", duration: 46, offset: 14 },
  { id: "sprout-star", zh: "新芽", en: "New Sprout", meaningZh: "新芽 · 尚未写完的未来", meaningEn: "Future · still being written", duration: 88, offset: -31 },
].map((meaning, index) => ({
  ...meaning,
  ...starMessages[index % starMessages.length],
}));

const MessageOrbit = memo(function MessageOrbit() {
  const { locale } = useThemeAndLocale();
  const [activeStar, setActiveStar] = useState<string | null>(null);
  const [revealedChars, setRevealedChars] = useState(0);
  const active = ORBIT_STARS.find((star) => star.id === activeStar) ?? null;

  useEffect(() => {
    if (!active) {
      setRevealedChars(0);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setRevealedChars(active.message.length);
      return;
    }

    setRevealedChars(0);
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setRevealedChars(count);
      if (count >= active.message.length) window.clearInterval(timer);
    }, 58);
    return () => window.clearInterval(timer);
  }, [active]);

  const selectStar = (id: string) => setActiveStar((current) => (current === id ? null : id));

  return (
    <div className="message-orbit pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-label={locale === "zh" ? "燕中星图" : "Yanzhong star map"}>
      {ORBIT_STARS.map((star, index) => {
        const title = locale === "zh" ? star.zh : star.en;
        const meaning = locale === "zh" ? star.meaningZh : star.meaningEn;
        const isActive = activeStar === star.id;
        const message = locale === "zh" ? star.message : "Wherever we go, Yanzhong remains a shared light.";

        return (
          <div
            key={star.id}
            className={`message-orbit__track message-orbit__track--${index + 1}`}
            style={{ animationDuration: `${star.duration}s`, animationDelay: `${star.offset}s` }}
          >
            <button
              type="button"
              className={`message-orbit-star pointer-events-auto group ${isActive ? "message-orbit-star--active" : ""}`}
              onClick={() => selectStar(star.id)}
              aria-expanded={isActive}
              aria-label={locale === "zh" ? `查看${title}星：${meaning}` : `View ${title} star: ${meaning}`}
            >
              <span className="message-orbit-node" />
              <span className="message-orbit__card" aria-hidden={!isActive}>
                <span className="message-orbit__card-title">{title}</span>
                <span className="message-orbit__card-meaning">{meaning}</span>
                <span className="message-orbit__card-rule" />
                <span className="message-orbit__card-message">
                  {isActive ? message.slice(0, revealedChars) : ""}
                  {isActive && revealedChars < message.length ? <i aria-hidden="true" /> : null}
                </span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
});

export default MessageOrbit;
