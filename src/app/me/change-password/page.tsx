"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/me/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("密码已修改，请重新登录。");
      setTimeout(() => router.push("/login"), 2500);
    } else {
      setMessage(data.error || "修改失败");
    }
  }
  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <Link href="/me" className="mb-4 inline-flex text-sm text-brand hover:underline">
        ← 返回个人中心
      </Link>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-brand/15 bg-white/75 p-7">
        <h1 className="text-2xl font-bold">修改密码</h1>
        <input name="currentPassword" type="password" className="input w-full" placeholder="当前密码" required />
        <input name="newPassword" type="password" className="input w-full" placeholder="新密码（8-64 位）" minLength={8} maxLength={64} required />
        <input name="confirmPassword" type="password" className="input w-full" placeholder="确认新密码" minLength={8} maxLength={64} required />
        <button className="btn-primary w-full">修改密码</button>
        {message ? <p className="text-sm">{message}</p> : null}
      </form>
    </section>
  );
}
