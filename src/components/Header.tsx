"use client";

import MobileNav from "./MobileNav";
import { SecretStarfieldLink } from "./SecretStarfieldLink";
import { useStickyHeader } from "@/hooks/useStickyHeader";
import { cn } from "@/components/ui/cn";

export default function Header() {
  const visible = useStickyHeader();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-[#7C3AED]/5 bg-white/60 backdrop-blur-xl transition-transform duration-300 hover:border-[#7C3AED]/10",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between px-5 md:px-8 lg:px-10">
        <SecretStarfieldLink />
        <MobileNav />
      </div>
    </header>
  );
}
