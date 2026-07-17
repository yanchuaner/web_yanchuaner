"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { PageShell, GlassCard, Button, ButtonLink } from "@/components/ui";
import { AccountStatusPanel } from "@/components/auth/AccountStatusPanel";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import type { WebAccountState } from "@/lib/web-account-state";

type VerificationResult = {
  error?: string;
  message?: string;
  accountState?: WebAccountState;
  account?: {
    name?: string | null;
    graduationClass?: string | null;
    className?: string | null;
  };
};

export default function VerifyEmailPage() {
  const { t } = useThemeAndLocale();
  const params = useSearchParams();
  const token = params.get("token");
  const initialEmail = params.get("email") || "";
  
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "sent" | "error">(
    token ? "verifying" : "idle"
  );
  const [messageKey, setMessageKey] = useState(token ? "auth.verify.verifyingMessage" : "");
  const [accountState, setAccountState] = useState<WebAccountState | null>(null);
  const [account, setAccount] = useState<VerificationResult["account"]>();

  useEffect(() => {
    if (!token) return;
    
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() as VerificationResult }))
      .then(({ ok, data }) => {
        if (ok) {
          setAccountState(data.accountState || "ACTIVE");
          setAccount(data.account);
          setStatus("success");
          setMessageKey(
            data.accountState === "REVIEW_PENDING"
              ? "auth.verify.reviewPendingMessage"
              : "auth.verify.successMessage",
          );
        } else {
          setStatus("error");
          setMessageKey("auth.verify.invalidMessage");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessageKey("auth.verify.networkMessage");
      });
  }, [token]);

  async function resend(event: FormEvent) {
    event.preventDefault();
    setStatus("verifying");
    setMessageKey("auth.verify.sendingMessage");
    
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus("sent");
        setMessageKey("auth.verify.sentMessage");
      } else {
        setStatus("error");
        setMessageKey("auth.verify.sendFailedMessage");
      }
    } catch {
      setStatus("error");
      setMessageKey("auth.verify.networkMessage");
    }
  }

  if (status === "success" && accountState === "REVIEW_PENDING") {
    return (
      <PageShell size="narrow" className="flex min-h-[60vh] items-center justify-center">
        <AccountStatusPanel state="REVIEW_PENDING" account={account} />
      </PageShell>
    );
  }

  if (
    status === "success" &&
    (accountState === "REVIEW_REJECTED" || accountState === "ACCOUNT_DISABLED")
  ) {
    return (
      <PageShell size="narrow" className="flex min-h-[60vh] items-center justify-center">
        <AccountStatusPanel state={accountState} account={account} />
      </PageShell>
    );
  }

  return (
    <PageShell size="narrow" className="flex items-center justify-center min-h-[60vh]">
      <GlassCard className="w-full max-w-md p-8 text-center flex flex-col items-center justify-center select-none">
        {/* 状态图标 */}
        <div className="flex justify-center mb-6">
          {status === "verifying" && (
            <Loader2 className="icon-glow h-16 w-16 animate-spin text-brand" />
          )}
          {status === "success" && (
            <CheckCircle2 className="icon-glow h-16 w-16 text-accent" />
          )}
          {status === "sent" && (
            <Mail className="icon-glow h-16 w-16 text-brand" />
          )}
          {status === "error" && (
            <XCircle className="icon-glow h-16 w-16 text-danger" />
          )}
          {status === "idle" && (
            <Mail className="icon-glow h-16 w-16 text-brand" />
          )}
        </div>

        {/* 渐变标题 */}
        <h1 className="text-3xl font-bold text-brand-fg font-heading bg-gradient-to-r from-brand-soft via-brand-fg to-brand bg-clip-text text-transparent">
          {t(`auth.verify.title.${status}`)}
        </h1>

        {/* 柔和说明文字 */}
        {messageKey && (
          <p className="text-brand-fg/70 mt-4 max-w-sm leading-relaxed text-sm">
            {t(messageKey)}
          </p>
        )}

        {/* 验证重发单栏表单 */}
        {status === "idle" && (
          <form onSubmit={resend} className="mt-8 w-full space-y-4">
            <input
              type="email"
              className="input w-full text-center"
              placeholder={t("auth.verify.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              {t("auth.verify.resend")}
            </Button>
            <ButtonLink
              href="/login"
              variant="secondary"
              className="w-full"
            >
              {t("auth.verify.backToLogin")}
            </ButtonLink>
          </form>
        )}

        {/* 交互闭环导航 (登录/重试) */}
        {(status === "success" || status === "sent" || status === "error") && (
          <div className="flex flex-col items-center gap-4 mt-6 w-full">
            <ButtonLink
              href="/login"
              variant="primary"
              className="w-full"
            >
              {t("auth.verify.goToLogin")}
            </ButtonLink>
            {status === "error" && (
              <Button
                onClick={() => {
                  setStatus("idle");
                  setMessageKey("");
                }}
                variant="secondary"
                className="w-full"
              >
                {t("auth.verify.resend")}
              </Button>
            )}
          </div>
        )}
      </GlassCard>
    </PageShell>
  );
}
