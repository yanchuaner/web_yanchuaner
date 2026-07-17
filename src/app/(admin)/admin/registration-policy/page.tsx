"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Badge, Button } from "@/components/ui";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

type PolicyResponse = {
  accessCodeEnabled: boolean;
  accessCodeHint: string;
  hasAccessCode: boolean;
  updatedAt: string | null;
  error?: string;
};

export default function RegistrationPolicyPage() {
  const { locale, t } = useThemeAndLocale();
  const [enabled, setEnabled] = useState(false);
  const [hasAccessCode, setHasAccessCode] = useState(false);
  const [hint, setHint] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPolicy = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/registration-policy");
      const data = (await response.json()) as PolicyResponse;
      if (!response.ok) throw new Error(data.error || t("admin.registrationPolicy.loadFailed"));
      setEnabled(data.accessCodeEnabled);
      setHasAccessCode(data.hasAccessCode);
      setHint(data.accessCodeHint);
      setUpdatedAt(data.updatedAt);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("admin.registrationPolicy.loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/registration-policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCodeEnabled: enabled,
          accessCode,
          accessCodeHint: hint,
        }),
      });
      const data = (await response.json()) as PolicyResponse;
      if (!response.ok) throw new Error(data.error || t("admin.registrationPolicy.saveFailed"));
      setEnabled(data.accessCodeEnabled);
      setHasAccessCode(data.hasAccessCode);
      setHint(data.accessCodeHint);
      setUpdatedAt(data.updatedAt);
      setAccessCode("");
      toast.success(t("admin.registrationPolicy.saved"));
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : t("admin.registrationPolicy.saveFailed");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      title={t("admin.registrationPolicy.title")}
      description={t("admin.registrationPolicy.description")}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form
          onSubmit={save}
          className="rounded-card border border-line bg-surface/60 p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound size={20} className="text-brand" aria-hidden="true" />
                <h2 className="font-heading text-lg font-semibold text-brand-fg">
                  {t("admin.registrationPolicy.codeTitle")}
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-brand-fg/60">
                {t("admin.registrationPolicy.codeDescription")}
              </p>
            </div>
            <Badge tone={enabled ? "success" : "neutral"}>
              {t(
                enabled
                  ? "admin.registrationPolicy.enabled"
                  : "admin.registrationPolicy.disabled",
              )}
            </Badge>
          </div>

          {loading ? (
            <div className="mt-6 space-y-3 animate-pulse">
              <div className="h-12 rounded-lg bg-brand/10" />
              <div className="h-12 rounded-lg bg-brand/10" />
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <label className="flex min-h-11 items-center justify-between gap-4 rounded-lg border border-line bg-surface-muted/50 px-4 py-3 text-sm">
                <span>
                  <span className="block font-medium text-brand-fg">
                    {t("admin.registrationPolicy.enableLabel")}
                  </span>
                  <span className="mt-1 block text-xs text-brand-fg/50">
                    {t("admin.registrationPolicy.enableHint")}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                  className="h-5 w-5 shrink-0"
                />
              </label>

              <label className="block text-sm text-brand-fg">
                {hasAccessCode
                  ? t("admin.registrationPolicy.rotateCode")
                  : t("admin.registrationPolicy.setCode")}
                <input
                  type="password"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  className="input mt-1 w-full"
                  minLength={8}
                  maxLength={64}
                  autoComplete="new-password"
                  placeholder={
                    hasAccessCode
                      ? t("admin.registrationPolicy.keepCodePlaceholder")
                      : t("admin.registrationPolicy.codePlaceholder")
                  }
                />
              </label>

              <label className="block text-sm text-brand-fg">
                {t("admin.registrationPolicy.hintLabel")}
                <input
                  value={hint}
                  onChange={(event) => setHint(event.target.value)}
                  className="input mt-1 w-full"
                  maxLength={120}
                  placeholder={t("admin.registrationPolicy.hintPlaceholder")}
                />
              </label>

              {error ? (
                <p className="rounded-lg border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <p className="text-xs text-brand-fg/45">
                  {updatedAt
                    ? `${t("admin.registrationPolicy.updatedAt")} ${new Date(updatedAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN")}`
                    : t("admin.registrationPolicy.notConfigured")}
                </p>
                <Button type="submit" icon={Save} disabled={saving}>
                  {t(
                    saving
                      ? "admin.registrationPolicy.saving"
                      : "admin.registrationPolicy.save",
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>

        <aside className="rounded-card border border-brand/15 bg-brand/5 p-5 sm:p-6">
          <ShieldCheck size={24} className="text-brand" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-lg font-semibold text-brand-fg">
            {t("admin.registrationPolicy.flowTitle")}
          </h2>
          <ol className="mt-4 space-y-4 text-sm leading-6 text-brand-fg/65">
            <li>{t("admin.registrationPolicy.flowEmail")}</li>
            <li>{t("admin.registrationPolicy.flowCode")}</li>
            <li>{t("admin.registrationPolicy.flowReview")}</li>
          </ol>
          <p className="mt-5 border-t border-brand/15 pt-5 text-xs leading-5 text-brand-fg/50">
            {t("admin.registrationPolicy.securityNote")}
          </p>
        </aside>
      </div>
    </AdminPageShell>
  );
}
