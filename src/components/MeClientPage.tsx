"use client";

import { CalendarCheck, Edit, FileEdit, FileText, Lock, PlusCircle, User } from "lucide-react";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import { Badge, ButtonLink, GlassCard, PageHeader, PageShell } from "@/components/ui";

type MeUser = {
  name: string | null;
  username: string | null;
  email: string | null;
  status: string;
};

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "VERIFIED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "danger";
  return "neutral";
}

export default function MeClientPage({ user }: { user: MeUser }) {
  const { t } = useThemeAndLocale();
  const statusKey = ["VERIFIED", "PENDING", "REJECTED"].includes(user.status)
    ? user.status.toLowerCase()
    : "unverified";
  const actions = [
    { href: "/me/edit", icon: Edit, label: t("me.actions.edit") },
    { href: "/alumni/correction", icon: FileEdit, label: t("me.actions.correction") },
    { href: "/me/submit", icon: PlusCircle, label: t("me.actions.submit") },
    { href: "/me/posts", icon: FileText, label: t("me.actions.posts") },
    { href: "/me/events", icon: CalendarCheck, label: t("me.actions.events") },
    { href: "/me/change-password", icon: Lock, label: t("me.actions.password") },
  ];

  return (
    <PageShell size="narrow">
      <PageHeader
        eyebrow={t("me.eyebrow")}
        eyebrowIcon={User}
        title={t("me.title")}
        description={t("me.description")}
      />

      <GlassCard className="mt-6 space-y-6 p-5 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-bold text-brand-fg">{user.name || user.username || t("common.notAvailable")}</h2>
            <p className="mt-1 break-all text-sm text-brand-fg/60">{user.email || t("common.notAvailable")}</p>
          </div>
          <Badge tone={statusTone(user.status)}>{t(`me.status.${statusKey}`)}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map(({ href, icon: Icon, label }) => (
            <ButtonLink
              key={href}
              href={href}
              variant="secondary"
              size="md"
              className="flex h-auto min-h-[112px] flex-col items-center justify-center gap-2 rounded-card border-line p-5 text-center hover:border-brand/35"
            >
              <Icon size={20} className="text-brand" aria-hidden="true" />
              <span>{label}</span>
            </ButtonLink>
          ))}
        </div>
      </GlassCard>
    </PageShell>
  );
}
