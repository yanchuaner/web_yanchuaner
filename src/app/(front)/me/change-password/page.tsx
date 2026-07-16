"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PageShell, GlassCard, PageHeader, Button, ButtonLink } from "@/components/ui";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { t } = useThemeAndLocale();
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      router.push("/login");
      router.refresh();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("");
        toast.success(t("me.password.success"), { description: t("me.password.successDescription") });
        await refresh();
        setCountdown(3);
      } else {
        setMessage(data.error || t("me.password.failed"));
        toast.error(data.error || t("me.password.failed"));
      }
    } catch {
      toast.error(t("me.password.network"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell size="narrow" className="pb-24">
      <ButtonLink href="/me" variant="secondary" size="sm" className="mb-6">
        <ArrowLeft size={14} />
        {t("me.password.back")}
      </ButtonLink>

      <PageHeader
        eyebrow={t("me.password.eyebrow")}
        eyebrowIcon={Lock}
        title={t("me.password.title")}
        description={t("me.password.description")}
      />

      <GlassCard className="p-7 mt-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-fg mb-1.5">
              {t("me.password.current")}
            </label>
            <input name="currentPassword" type="password" className="input w-full" placeholder={t("me.password.currentPlaceholder")} required disabled={submitting} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-fg mb-1.5">
              {t("me.password.next")}
            </label>
            <input name="newPassword" type="password" className="input w-full" placeholder={t("me.password.nextPlaceholder")} minLength={8} maxLength={64} required disabled={submitting} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-fg mb-1.5">
              {t("me.password.confirm")}
            </label>
            <input name="confirmPassword" type="password" className="input w-full" placeholder={t("me.password.confirmPlaceholder")} minLength={8} maxLength={64} required disabled={submitting} />
          </div>

          {message && (
            <div className="rounded-card border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {message}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? t("me.password.submitting") : t("me.password.submit")}
          </Button>
        </form>
      </GlassCard>

      {countdown !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-overlay/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-modal border border-line bg-surface p-7 text-center shadow-lg backdrop-blur-md">
            <p className="text-lg font-semibold text-brand-fg">
              {t("me.password.redirecting")}
            </p>
            <p className="mt-3 text-3xl font-bold text-brand">{countdown}</p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
