"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(token ? "正在验证…" : "");

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => setMessage(ok ? "邮箱验证成功，现在可以登录。" : data.error || "验证失败"))
      .catch(() => setMessage("验证失败"));
  }, [token]);

  async function resend(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setMessage(data.message);
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-brand/15 bg-white/75 p-7">
        <h1 className="text-2xl font-bold">邮箱验证</h1>
        {message ? <p className="mt-4 text-sm">{message}</p> : null}
        {!token ? (
          <form onSubmit={resend} className="mt-5 space-y-3">
            <input type="email" className="input w-full" placeholder="注册邮箱" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="btn-primary w-full">重新发送验证邮件</button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
