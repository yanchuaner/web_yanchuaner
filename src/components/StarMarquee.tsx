"use client";

import { memo } from "react";
import { starMessages } from "@/data/starMessages";
import { MessageSquareText } from "lucide-react";

// For an infinite seamless marquee, we'll double the items
const MARQUEE_ITEMS = starMessages.slice(0, 30); // Pick 30 for performance

const StarMarquee = memo(function StarMarquee() {
  return (
    <div className="mt-6 rounded-2xl border border-info/20 bg-surface/60 p-4 relative backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4 text-info">
        <MessageSquareText size={18} />
        <h3 className="text-sm font-semibold tracking-wider font-mono">共鸣星海 · STAR MESSAGES</h3>
      </div>
      
      {/* Marquee viewport */}
      <div className="relative h-64 overflow-hidden rounded-xl bg-surface/60 border border-line mask-image-bottom">
        <div className="animate-marquee flex flex-col gap-3 p-3 hover:[animation-play-state:paused]">
          {/* Duplicate list to make it seamless */}
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((msg, idx) => (
            <div key={idx} className="flex gap-3 items-start bg-surface/60 p-3 rounded-lg border border-line hover:border-info/50 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-info/40 text-info flex items-center justify-center font-bold text-xs font-mono ring-1 ring-info/30">
                {msg.name[0]}
              </div>
              <div>
                <p className="text-xs text-info font-mono mb-1">{msg.name}</p>
                <p className="text-sm text-main/60">&quot;{msg.message}&quot;</p>
              </div>
            </div>
          ))}
        </div>
        {/* Fade gradients for smooth entry/exit */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-surface-strong to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-surface-strong to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
});

export default StarMarquee;
