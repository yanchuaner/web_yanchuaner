"use client";

import MobileNav from "./MobileNav";
import { SecretStarfieldLink } from "./SecretStarfieldLink";
import { useStickyHeader } from "@/hooks/useStickyHeader";
import { cn } from "@/components/ui/cn";
import ThemeAndLocaleSwitcher from "./ThemeAndLocaleSwitcher";
import { usePathname } from "next/navigation";

export default function Header() {
  const visible = useStickyHeader();
  const pathname = usePathname();
  const isNarrativeHome = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl transition-[transform,background-color,border-color] duration-300",
        isNarrativeHome
          ? "site-header--narrative border-narrative-route/20 bg-narrative/90"
          : "border-line bg-surface/80",
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
