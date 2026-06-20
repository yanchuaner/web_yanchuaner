"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
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
    const data = await response.json();
    setMessage(response.ok ? data.message || "密码已重置，请重新登录。" : data.error || "操作失败");
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={submit} className="rounded-2xl border border-brand/15 bg-white/75 p-7">
        <h1 className="text-2xl font-bold">{token ? "重置密码" : "忘记密码"}</h1>
        <div className="mt-5 space-y-4">
          {token ? (
            <>
              <input name="password" type="password" className="input w-full" placeholder="新密码（8-64 位）" required minLength={8} maxLength={64} />
              <input name="confirmPassword" type="password" className="input w-full" placeholder="确认新密码" required minLength={8} maxLength={64} />
            </>
          ) : (
            <input name="email" type="email" className="input w-full" placeholder="注册邮箱" required />
          )}
          <button className="btn-primary w-full">{token ? "重置密码" : "发送重置邮件"}</button>
          {message ? <p className="text-sm">{message}</p> : null}
        </div>
      </form>
    </section>
  );
}
