"use client";

import {
  BadgeCheck,
  CalendarDays,
  FileText,
  History,
  Newspaper,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { AdminPageShell } from "./AdminPageShell";
import { AdminQuickAction } from "./AdminQuickAction";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

export type AdminDashboardStats = {
  pendingUsers: number;
  pendingStories: number;
  pendingCorrections: number;
  pendingIdentityVerifications: number;
  totalAlumni: number;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    targetType: string;
    createdAt: string;
    admin: { name: string | null; username: string | null };
  }>;
};

export function AdminDashboardClient({ stats }: { stats: AdminDashboardStats }) {
  const { locale, t } = useThemeAndLocale();
  const pendingTotal =
    stats.pendingUsers +
    stats.pendingStories +
    stats.pendingCorrections +
    stats.pendingIdentityVerifications;

  const cards = [
    {
      label: t("admin.dashboard.allPending"),
      value: pendingTotal,
      icon: BadgeCheck,
      iconClass: "text-warning",
      surfaceClass: "border-warning/20 bg-warning/10",
    },
    {
      label: t("admin.dashboard.pendingContent"),
      value: stats.pendingStories,
      icon: FileText,
      iconClass: "text-brand",
      surfaceClass: "border-brand/20 bg-brand/5",
    },
    {
      label: t("admin.dashboard.verifiedAlumni"),
      value: stats.totalAlumni,
      icon: TrendingUp,
      iconClass: "text-success",
      surfaceClass: "border-success/20 bg-success/10",
    },
  ];

  return (
    <AdminPageShell
      title={t("admin.dashboard.title")}
      description={t("admin.dashboard.description")}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`cosmic-card rounded-card border p-6 transition hover:-translate-y-0.5 ${card.surfaceClass}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-fg/60">{card.label}</p>
              <card.icon size={22} className={card.iconClass} />
            </div>
            <p className="mt-3 font-heading text-4xl font-bold tracking-tight text-brand-fg">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-card border border-brand/15 bg-surface/50 p-6 backdrop-blur-sm">
        <h2 className="font-heading text-lg font-semibold text-brand-fg">
          {t("admin.dashboard.quickActions")}
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <AdminQuickAction href="/admin/users?status=PENDING" icon={Users}>
            {t("admin.dashboard.reviewUsers")}
          </AdminQuickAction>
          <AdminQuickAction href="/admin/stories/pending" icon={FileText}>
            {t("admin.dashboard.reviewContent")}
          </AdminQuickAction>
          <AdminQuickAction href="/admin/identity-verifications" icon={BadgeCheck}>
            {t("admin.dashboard.identityVerification")} {stats.pendingIdentityVerifications}
          </AdminQuickAction>
          <AdminQuickAction href="/admin/alumni-corrections?status=PENDING" icon={FileText}>
            {t("admin.dashboard.corrections")} {stats.pendingCorrections}
          </AdminQuickAction>
          <AdminQuickAction href="/admin/news" icon={Newspaper}>
            {t("admin.dashboard.manageNews")}
          </AdminQuickAction>
          <AdminQuickAction href="/admin/news/new" icon={Plus}>
            {t("admin.dashboard.publishNews")}
          </AdminQuickAction>
          <AdminQuickAction href="/admin/events" icon={CalendarDays}>
            {t("admin.dashboard.manageEvents")}
          </AdminQuickAction>
          <AdminQuickAction href="/admin/events/new" icon={Plus}>
            {t("admin.dashboard.createEvent")}
          </AdminQuickAction>
        </div>
      </section>

      <section className="mt-8 rounded-card border border-line bg-surface/50 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <History size={18} className="text-brand" />
          <h2 className="font-heading text-lg font-semibold text-brand-fg">
            {t("admin.dashboard.recentOperations")}
          </h2>
        </div>
        {stats.recentAuditLogs.length === 0 ? (
          <p className="mt-4 text-sm text-brand-fg/50">{t("admin.dashboard.noAuditLogs")}</p>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {stats.recentAuditLogs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-brand-fg">{log.action}</span>
                  <span className="ml-2 text-brand-fg/50">{log.targetType}</span>
                </div>
                <div className="text-xs text-brand-fg/45">
                  {log.admin.name || log.admin.username || t("admin.shell.administrator")} ·{" "}
                  {new Date(log.createdAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN")}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
