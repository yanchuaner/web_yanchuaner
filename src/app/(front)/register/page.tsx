"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell, GlassCard, Button } from "@/components/ui";
import {
  CLASS_NAME_PATTERN,
  GRADUATION_CLASS_PATTERN,
  USERNAME_INPUT_PATTERN,
} from "@/lib/identity-fields";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    setEmailSent(null);
    setRegisteredEmail("");
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const payload = Object.fromEntries(form.entries());
    const email = typeof payload.email === "string" ? payload.email : "";
    payload.claimOldProfile = form.get("claimOldProfile") === "on" ? "true" : "";
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          claimOldProfile: form.get("claimOldProfile") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "注册失败");
      setEmailSent(data.emailSent === true);
      setRegisteredEmail(email);
      setMessage(
        data.emailSent
          ? "账号已创建，验证邮件已发送，请查收。"
          : "账号已创建，但验证邮件暂未发送成功，请前往验证页提交重发请求。",
      );
      formEl.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell size="narrow">
      <GlassCard className="p-7">
        <h1 className="text-2xl font-bold text-brand-fg">注册校友账号</h1>
        <p className="mt-2 text-sm text-brand-fg/60">加入数字母港。邮箱验证与校友认证相互独立。</p>
        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            用户名 <span className="text-xs text-brand-fg/50">仅用于登录账号</span>
            <input name="username" className="input mt-1 w-full" minLength={1} maxLength={32} pattern={USERNAME_INPUT_PATTERN} required />
          </label>
          <label className="text-sm">邮箱<input name="email" type="email" className="input mt-1 w-full" required /></label>
          <label className="text-sm">密码<input name="password" type="password" className="input mt-1 w-full" minLength={8} maxLength={64} required /></label>
          <label className="text-sm">确认密码<input name="confirmPassword" type="password" className="input mt-1 w-full" minLength={8} maxLength={64} required /></label>
          <label className="text-sm">真实姓名<input name="name" defaultValue={searchParams.get("name") || ""} className="input mt-1 w-full" maxLength={64} required /></label>
          <label className="text-sm">
            届别 <span className="text-xs text-brand-fg/50">首届为2025届</span>
            <input name="graduationClass" defaultValue={searchParams.get("graduationClass") || ""} className="input mt-1 w-full" maxLength={4} pattern={GRADUATION_CLASS_PATTERN.source} placeholder="例如：2025" required />
          </label>
          <label className="text-sm">班级<input name="className" className="input mt-1 w-full" maxLength={2} pattern={CLASS_NAME_PATTERN.source} placeholder="例如：2" required /></label>
          <label className="text-sm">联系方式（可选）<input name="contact" defaultValue={searchParams.get("contact") || ""} className="input mt-1 w-full" maxLength={128} /></label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input name="claimOldProfile" type="checkbox" />
            我曾通过入轨联络舱提交过申请，需要人工认领旧资料
          </label>
          {message ? <p className="text-sm text-emerald-700 md:col-span-2">{message}</p> : null}
          {emailSent === false ? (
            <Link
              href={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}
              className="text-sm text-brand underline md:col-span-2"
            >
              未收到验证邮件？重新发送
            </Link>
          ) : null}
          {error ? <p className="text-sm text-rose-600 md:col-span-2">{error}</p> : null}
          <Button type="submit" variant="primary" className="md:col-span-2 mt-2" disabled={loading}>
            {loading ? "创建中…" : "创建账号"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-brand-fg/60">已有账号？ <Link href="/login" className="text-brand hover:text-brand-fg transition-colors">去登录</Link></p>
      </GlassCard>
    </PageShell>
  );
}
