"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/me/profile").then((res) => res.json()).then((data) => setProfile(data.user));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setMessage(response.ok ? "资料已更新" : data.error || "更新失败");
    if (data.reauthenticationRequired) {
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1000);
    }
  }
  if (!profile) return <p className="p-8">加载中…</p>;
  return (
    <section className="mx-auto max-w-xl px-4 py-12">
      <Link href="/me" className="mb-4 inline-flex text-sm text-brand hover:underline">
        ← 返回个人中心
      </Link>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-brand/15 bg-white/75 p-7">
        <h1 className="text-2xl font-bold">编辑资料</h1>
        <p className="text-sm text-brand-fg/60">用户名和邮箱暂不支持修改。姓名或届别变化会重新进入校友认证。</p>
        <input name="name" className="input w-full" defaultValue={profile.name || ""} placeholder="姓名" required />
        <input name="graduationClass" className="input w-full" defaultValue={profile.graduationClass || ""} placeholder="届别" />
        <input name="className" className="input w-full" defaultValue={profile.className || ""} placeholder="班级" />
        <input name="contact" className="input w-full" defaultValue={profile.contact || ""} placeholder="联系方式" />
        <button className="btn-primary w-full">保存</button>
        {message ? <p className="text-sm">{message}</p> : null}
      </form>
    </section>
  );
}
