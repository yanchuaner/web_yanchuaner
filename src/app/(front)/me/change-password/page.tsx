"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PageShell, GlassCard, PageHeader, Button, ButtonLink } from "@/components/ui";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { refresh } = useAuth();
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
        toast.success("密码修改成功", { description: "即将跳转登录页面，请重新登录。" });
        await refresh();
        setCountdown(3);
      } else {
        setMessage(data.error || "修改失败");
        toast.error(data.error || "修改密码失败");
      }
    } catch {
      toast.error("网络异常，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell size="narrow" className="pb-24">
      <ButtonLink href="/me" variant="secondary" size="sm" className="mb-6">
        <ArrowLeft size={14} />
        返回个人中心
      </ButtonLink>

      <PageHeader
        eyebrow="SECURITY"
        eyebrowIcon={Lock}
        title="修改密码"
        description="保障账户安全，密码长度须为 8 至 64 位"
      />

      <GlassCard className="p-7 mt-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-fg mb-1.5">
              当前密码
            </label>
            <input name="currentPassword" type="password" className="input w-full" placeholder="请输入当前密码" required disabled={submitting} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-fg mb-1.5">
              新密码
            </label>
            <input name="newPassword" type="password" className="input w-full" placeholder="新密码（8-64 位）" minLength={8} maxLength={64} required disabled={submitting} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-fg mb-1.5">
              确认新密码
            </label>
            <input name="confirmPassword" type="password" className="input w-full" placeholder="请再次输入新密码" minLength={8} maxLength={64} required disabled={submitting} />
          </div>

          {message && (
            <div className="rounded-card border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {message}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "修改中..." : "修改密码"}
          </Button>
        </form>
      </GlassCard>

      {countdown !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-modal border border-line bg-surface p-7 text-center shadow-lg backdrop-blur-md">
            <p className="text-lg font-semibold text-brand-fg">
              密码修改成功，即将返回登录页面…
            </p>
            <p className="mt-3 text-3xl font-bold text-brand">{countdown}</p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
