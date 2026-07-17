import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function AdminQuickAction({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm font-medium text-brand shadow-sm transition hover:-translate-y-0.5 hover:border-brand/35 hover:bg-brand/10 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <Icon size={16} aria-hidden="true" />
      {children}
    </Link>
  );
}
