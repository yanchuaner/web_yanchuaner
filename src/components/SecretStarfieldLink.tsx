"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui/cn";

const CLICK_WINDOW_MS = 900;

export function SecretStarfieldLink() {
  const pathname = usePathname();
  const router = useRouter();
  const clickCountRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;
    event.preventDefault();

    clickCountRef.current += 1;
    setPulse((value) => value + 1);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      router.push("/starfield");
      return;
    }

    resetTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, CLICK_WINDOW_MS);
  };

  return (
    <Link
      href="/"
      onClick={handleClick}
      aria-label="返回首页：燕中数字母港"
      className="group relative inline-flex min-h-[44px] shrink-0 items-center rounded-sm font-heading text-lg font-bold tracking-wide text-brand transition-colors duration-300 hover:text-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted"
    >
      燕中数字母港
      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-brand shadow-[0_0_8px_rgb(var(--brand-rgb)/0.5)] transition-all duration-300 group-hover:w-full" />
      <Sparkles
        key={pulse}
        size={15}
        className={cn(
          "pointer-events-none absolute -right-5 -top-1 text-brand opacity-0",
          pulse > 0 && "animate-starfield-secret-pulse",
        )}
        aria-hidden="true"
      />
    </Link>
  );
}
