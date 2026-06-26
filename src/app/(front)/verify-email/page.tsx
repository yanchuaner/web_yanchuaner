"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { PageShell, GlassCard, Button, ButtonLink } from "@/components/ui";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token");
  
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    token ? "verifying" : "idle"
  );
  const [message, setMessage] = useState(token ? "正在验证您的邮箱凭证，请稍候…" : "");

  useEffect(() => {
    if (!token) return;
    
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (ok) {
          setStatus("success");
          setMessage("您的邮箱已成功验证，现在可以登录并开始探索我们的校友网络。");
        } else {
          setStatus("error");
          setMessage(data.error || "验证链接已失效或无效。");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("网络异常，无法连接到验证服务器，请稍后重试。");
      });
  }, [token]);

  async function resend(event: FormEvent) {
    event.preventDefault();
    setStatus("verifying");
    setMessage("正在发送验证邮件，请稍候…");
    
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "验证邮件已成功发送，请检查您的收件箱。");
      } else {
        setStatus("error");
        setMessage(data.error || "发送验证邮件失败，请检查邮箱地址或稍后重试。");
      }
    } catch {
      setStatus("error");
      setMessage("网络连接失败，请检查网络设置。");
    }
  }

  return (
    <PageShell size="narrow" className="flex items-center justify-center min-h-[60vh]">
      <GlassCard className="w-full max-w-md p-8 text-center flex flex-col items-center justify-center select-none">
        {/* 状态图标 */}
        <div className="flex justify-center mb-6">
          {status === "verifying" && (
            <Loader2 className="w-16 h-16 animate-spin text-brand drop-shadow-[0_0_15px_rgba(167,139,250,0.5)]" />
          )}
          {status === "success" && (
            <CheckCircle2 className="w-16 h-16 text-accent drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          )}
          {status === "error" && (
            <XCircle className="w-16 h-16 text-rose-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          )}
          {status === "idle" && (
            <Mail className="w-16 h-16 text-brand drop-shadow-[0_0_15px_rgba(167,139,250,0.5)]" />
          )}
        </div>

        {/* 渐变标题 */}
        <h1 className="text-3xl font-bold text-brand-fg font-heading bg-gradient-to-r from-brand-soft via-brand-fg to-brand bg-clip-text text-transparent">
          {status === "idle" && "发送验证邮件"}
          {status === "verifying" && "正在验证邮箱"}
          {status === "success" && "邮箱验证成功"}
          {status === "error" && "验证失败"}
        </h1>

        {/* 柔和说明文字 */}
        {message && (
          <p className="text-brand-fg/70 mt-4 max-w-sm leading-relaxed text-sm">
            {message}
          </p>
        )}

        {/* 验证重发单栏表单 */}
        {status === "idle" && (
          <form onSubmit={resend} className="mt-8 w-full space-y-4">
            <input
              type="email"
              className="input w-full text-center"
              placeholder="请输入注册邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              重新发送验证邮件
            </Button>
            <ButtonLink
              href="/login"
              variant="secondary"
              className="w-full"
            >
              返回登录
            </ButtonLink>
          </form>
        )}

        {/* 交互闭环导航 (登录/重试) */}
        {(status === "success" || status === "error") && (
          <div className="flex flex-col items-center gap-4 mt-6 w-full">
            <ButtonLink
              href="/login"
              variant="primary"
              className="w-full"
            >
              前往登录
            </ButtonLink>
            {status === "error" && (
              <Button
                onClick={() => {
                  setStatus("idle");
                  setMessage("");
                }}
                variant="secondary"
                className="w-full"
              >
                重新发送验证邮件
              </Button>
            )}
          </div>
        )}
      </GlassCard>
    </PageShell>
  );
}
