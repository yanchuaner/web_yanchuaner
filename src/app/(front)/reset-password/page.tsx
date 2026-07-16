"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell, GlassCard, Button } from "@/components/ui";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

export default function ResetPasswordPage() {
  const { t } = useThemeAndLocale();
  const token = useSearchParams().get("token");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const endpoint = token ? "/api/auth/reset-password" : "/api/auth/forgot-password";
    const payload = token
      ? { token, password: form.get("password"), confirmPassword: form.get("confirmPassword") }
      : { email: form.get("email") };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await response.json();
    setMessage(response.ok ? t(token ? "auth.reset.resetSuccess" : "auth.reset.emailSuccess") : t("auth.reset.failed"));
  }

  return (
    <PageShell size="narrow" className="flex min-h-[60vh] items-center">
      <GlassCard className="w-full p-7">
        <form onSubmit={submit}>
          <h1 className="text-2xl font-bold text-brand-fg">{t(token ? "auth.reset.resetTitle" : "auth.reset.forgotTitle")}</h1>
          <div className="mt-5 space-y-4">
            {token ? (
              <>
                <input name="password" type="password" className="input w-full" placeholder={t("auth.reset.newPassword")} required minLength={8} maxLength={64} />
                <input name="confirmPassword" type="password" className="input w-full" placeholder={t("auth.reset.confirmPassword")} required minLength={8} maxLength={64} />
              </>
            ) : (
              <input name="email" type="email" className="input w-full" placeholder={t("auth.reset.email")} required />
            )}
            <Button type="submit" variant="primary" className="w-full mt-2">{t(token ? "auth.reset.resetAction" : "auth.reset.emailAction")}</Button>
            {message ? <p className="mt-4 text-sm text-brand-fg/70">{message}</p> : null}
          </div>
        </form>
      </GlassCard>
    </PageShell>
  );
}
