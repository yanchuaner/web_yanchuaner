"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell, GlassCard, Button } from "@/components/ui";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import {
  CLASS_NAME_PATTERN,
  GRADUATION_CLASS_PATTERN,
  USERNAME_INPUT_PATTERN,
} from "@/lib/identity-fields";

export default function RegisterPage() {
  const { t } = useThemeAndLocale();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessCodeEnabled, setAccessCodeEnabled] = useState(false);
  const [accessCodeHint, setAccessCodeHint] = useState("");
  const [fastTrack, setFastTrack] = useState(false);

  useEffect(() => {
    fetch("/api/auth/registration-policy")
      .then((response) => response.json())
      .then((policy) => {
        setAccessCodeEnabled(policy.accessCodeEnabled === true);
        setAccessCodeHint(
          typeof policy.accessCodeHint === "string" ? policy.accessCodeHint : "",
        );
      })
      .catch(() => {
        setAccessCodeEnabled(false);
        setAccessCodeHint("");
      });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    setEmailSent(null);
    setRegisteredEmail("");
    setFastTrack(false);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const payload = Object.fromEntries(form.entries());
    const email = typeof payload.email === "string" ? payload.email : "";
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("auth.register.failed"));
      setEmailSent(data.emailSent === true);
      setRegisteredEmail(email);
      setFastTrack(data.accessCodeAccepted === true);
      setMessage(
        data.emailSent
          ? t("auth.register.successEmail")
          : t("auth.register.successNoEmail"),
      );
      formEl.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.register.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell size="narrow" className="flex min-h-[calc(100dvh-181px)] items-center py-6 md:py-8">
      <GlassCard className="w-full p-5 sm:p-7">
        <h1 className="text-2xl font-bold text-brand-fg">{t("auth.register.title")}</h1>
        <p className="mt-2 text-sm leading-6 text-brand-fg/60">{t("auth.register.description")}</p>
        <form onSubmit={submit} className="mt-5 grid gap-x-4 gap-y-3.5 md:grid-cols-2">
          <label className="text-sm">
            {t("auth.register.username")} <span className="text-xs text-brand-fg/50">{t("auth.register.usernameHint")}</span>
            <input name="username" className="input mt-1 w-full" minLength={1} maxLength={32} pattern={USERNAME_INPUT_PATTERN} required />
          </label>
          <label className="text-sm">{t("auth.register.email")}<input name="email" type="email" className="input mt-1 w-full" required /></label>
          <label className="text-sm">{t("auth.register.password")}<input name="password" type="password" className="input mt-1 w-full" minLength={8} maxLength={64} required /></label>
          <label className="text-sm">{t("auth.register.confirmPassword")}<input name="confirmPassword" type="password" className="input mt-1 w-full" minLength={8} maxLength={64} required /></label>
          <label className="text-sm">{t("auth.register.realName")}<input name="name" defaultValue={searchParams.get("name") || ""} className="input mt-1 w-full" maxLength={64} required /></label>
          <label className="text-sm">
            {t("auth.register.cohort")} <span className="text-xs text-brand-fg/50">{t("auth.register.cohortHint")}</span>
            <input name="graduationClass" defaultValue={searchParams.get("graduationClass") || ""} className="input mt-1 w-full" maxLength={4} pattern={GRADUATION_CLASS_PATTERN.source} placeholder={t("auth.register.cohortPlaceholder")} required />
          </label>
          <label className="text-sm">{t("auth.register.className")}<input name="className" className="input mt-1 w-full" maxLength={2} pattern={CLASS_NAME_PATTERN.source} placeholder={t("auth.register.classPlaceholder")} required /></label>
          <label className="text-sm">{t("auth.register.contact")}<input name="contact" defaultValue={searchParams.get("contact") || ""} className="input mt-1 w-full" maxLength={128} /></label>
          {accessCodeEnabled ? (
            <label className="text-sm md:col-span-2">
              {t("auth.register.internalCode")} {" "}
              <span className="text-xs text-brand-fg/50">
                {t("auth.register.internalCodeOptional")}
              </span>
              <input
                name="internalCode"
                type="password"
                className="input mt-1 w-full"
                minLength={8}
                maxLength={64}
                autoComplete="off"
              />
              <span className="mt-1 block text-xs leading-5 text-brand-fg/50">
                {accessCodeHint || t("auth.register.internalCodeHint")}
              </span>
            </label>
          ) : null}
          {message ? (
            <div className="space-y-1 text-sm text-success md:col-span-2">
              <p>{message}</p>
              <p className="text-brand-fg/60">
                {t(
                  fastTrack
                    ? "auth.register.accessAfterEmail"
                    : "auth.register.reviewAfterEmail",
                )}
              </p>
            </div>
          ) : null}
          {emailSent === false ? (
            <Link
              href={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}
              className="text-sm text-brand underline md:col-span-2"
            >
              {t("auth.register.resendVerification")}
            </Link>
          ) : null}
          {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
          <Button type="submit" variant="primary" className="md:col-span-2 mt-2" disabled={loading}>
            {loading ? t("auth.register.submitting") : t("auth.register.submit")}
          </Button>
        </form>
        <p className="mt-4 flex flex-wrap items-center gap-1 text-sm text-brand-fg/60">
          {t("auth.register.haveAccount")}
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center rounded-full px-3 text-brand transition-colors hover:bg-brand/5 hover:text-brand-fg"
          >
            {t("auth.register.signIn")}
          </Link>
        </p>
      </GlassCard>
    </PageShell>
  );
}
