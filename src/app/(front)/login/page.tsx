"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PageShell, GlassCard, Button } from "@/components/ui";
import { AccountStatusPanel } from "@/components/auth/AccountStatusPanel";
import { api } from "@/lib/apiClient";
import type { WebAccountState } from "@/lib/web-account-state";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

type BlockedAccountState = Exclude<WebAccountState, "ACTIVE">;
type LoginResult = {
  role?: string;
  accountState?: BlockedAccountState;
  account?: {
    name?: string | null;
    graduationClass?: string | null;
    className?: string | null;
  };
};

const BLOCKED_STATES = new Set<BlockedAccountState>([
  "EMAIL_NOT_VERIFIED",
  "REVIEW_PENDING",
  "REVIEW_REJECTED",
  "ACCOUNT_DISABLED",
]);

function safeRedirect(value: string | null, fallback: string) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { t } = useThemeAndLocale();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [accountState, setAccountState] = useState<BlockedAccountState | null>(null);
  const [account, setAccount] = useState<LoginResult["account"]>();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAccountState(null);
    setAccount(undefined);
    try {
      // 429/413/401 等错误会由 apiClient 自动弹出 Toast，这里只处理业务逻辑
      const { data, error: apiError, status, code, raw } = await api.post<LoginResult>(
        "/api/auth/login",
        { username, password },
        [401, 403] // 401/403 由下面的 setError 处理，不重复弹 Toast
      );

      if (apiError || !data) {
        if (status === 403 && code && BLOCKED_STATES.has(code as BlockedAccountState)) {
          const blocked = raw as LoginResult | null;
          setAccountState(code as BlockedAccountState);
          setAccount(blocked?.account);
          return;
        }
        throw new Error(apiError || t("auth.login.failed"));
      }

      const fallback = data.role === "admin" ? "/admin" : "/";
      await refresh();
      router.push(safeRedirect(searchParams.get("redirect"), fallback));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.login.failed"));
    } finally {
      setLoading(false);
    }
  }

  function switchAccount() {
    setAccountState(null);
    setAccount(undefined);
    setPassword("");
    setError("");
  }

  if (accountState) {
    return (
      <PageShell size="narrow" className="flex min-h-[70vh] items-center">
        <AccountStatusPanel
          state={accountState}
          account={account}
          onSwitchAccount={switchAccount}
        />
      </PageShell>
    );
  }

  return (
    <PageShell size="narrow" className="flex min-h-[70vh] items-center">
      <GlassCard className="w-full p-7">
        <h1 className="text-2xl font-bold text-brand-fg">{t("auth.login.title")}</h1>
        <p className="mt-2 text-sm text-brand-fg/60">{t("auth.login.description")}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm">
            {t("auth.login.username")}
            <input className="input mt-1 w-full" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label className="block text-sm">
            {t("auth.login.password")}
            <input className="input mt-1 w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
            {loading ? t("auth.login.submitting") : t("auth.login.submit")}
          </Button>
        </form>
        <div className="mt-6 flex justify-between gap-3 text-sm">
          <Link
            href="/register"
            className="inline-flex min-h-[44px] items-center rounded-full px-3 text-brand transition-colors hover:bg-brand/5 hover:text-brand-fg"
          >
            {t("auth.login.register")}
          </Link>
          <Link
            href="/reset-password"
            className="inline-flex min-h-[44px] items-center rounded-full px-3 text-brand transition-colors hover:bg-brand/5 hover:text-brand-fg"
          >
            {t("auth.login.forgotPassword")}
          </Link>
        </div>
      </GlassCard>
    </PageShell>
  );
}
