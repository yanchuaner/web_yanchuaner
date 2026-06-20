"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerification(false);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNeedsVerification(data.code === "EMAIL_NOT_VERIFIED");
        throw new Error(data.error || "登录失败");
      }
      const fallback = data.role === "admin" ? "/admin" : "/";
      await refresh();
      router.push(safeRedirect(searchParams.get("redirect"), fallback));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-brand/15 bg-white/75 p-7 shadow-sm backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-brand-fg">登录</h1>
        <p className="mt-2 text-sm text-brand-fg/60">使用个人账号进入燕中数字母港。</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm">
            用户名
            <input className="input mt-1 w-full" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label className="block text-sm">
            密码
            <input className="input mt-1 w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {needsVerification ? (
            <Link className="text-sm text-brand underline" href="/verify-email">
              重发验证邮件
            </Link>
          ) : null}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "登录中…" : "登录"}
          </button>
        </form>
        <div className="mt-5 flex justify-between text-sm">
          <Link href="/register" className="text-brand">注册账号</Link>
          <Link href="/reset-password" className="text-brand">忘记密码</Link>
        </div>
      </div>
    </section>
  );
}
