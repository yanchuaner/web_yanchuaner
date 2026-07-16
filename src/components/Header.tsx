"use client";

import MobileNav from "./MobileNav";
import { SecretStarfieldLink } from "./SecretStarfieldLink";
import { useStickyHeader } from "@/hooks/useStickyHeader";
import { cn } from "@/components/ui/cn";
import ThemeAndLocaleSwitcher from "./ThemeAndLocaleSwitcher";

export default function Header() {
  const visible = useStickyHeader();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur-xl transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between px-5 md:px-8 lg:px-10">
        <SecretStarfieldLink />
        <div className="flex items-center gap-2 xl:gap-4">
          <ThemeAndLocaleSwitcher />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
