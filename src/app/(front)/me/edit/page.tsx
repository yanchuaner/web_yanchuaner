"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/apiClient";

export default function EditProfilePage() {
  const { refresh } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get<{ user: any }>("/api/me/profile").then(({ data }) => {
      if (data?.user) setProfile(data.user);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    // 429/413/5xx 由 apiClient 自动弹出 Toast
    const { data, error: apiError } = await api.patch<{ user: any }>(
      "/api/me/profile",
      payload,
      [409] // 409 冲突由下面的 setMessage 处理
    );

    if (data?.user) {
      setProfile(data.user);
      setMessage("");
      toast.success("资料已更新", { description: "您的个人资料已成功保存。" });
      await refresh();
    } else {
      setMessage(apiError || "更新失败");
    }
  }

  if (!profile) return <p className="p-8">加载中…</p>;
  return (
    <section className="mx-auto max-w-xl px-4 py-12">
      <Link href="/me" className="mb-4 inline-flex text-sm text-brand hover:underline">
        ← 返回个人中心
      </Link>
      <form onSubmit={submit} className="space-y-5 rounded-card border border-line bg-surface/50 backdrop-blur-xl p-7">
        <h1 className="text-2xl font-bold">编辑资料</h1>

        {/* 基本身份（只读） */}
        <div className="space-y-3 rounded-xl bg-purple-950/10 border border-brand/5 p-4">
          <h3 className="text-xs font-semibold text-brand/80 border-b border-brand/5 pb-1.5 mb-2">基本身份（系统锁定）</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-brand-fg/70">
              姓名
              <input name="name" className="input mt-1 w-full bg-black/10 opacity-70 cursor-not-allowed text-xs" value={profile.name || ""} disabled />
            </label>
            <label className="block text-xs font-medium text-brand-fg/70">
              邮箱
              <input name="email" type="email" className="input mt-1 w-full bg-black/10 opacity-70 cursor-not-allowed text-xs" value={profile.email || ""} disabled />
            </label>
            <label className="block text-xs font-medium text-brand-fg/70">
              届别
              <input name="graduationClass" className="input mt-1 w-full bg-black/10 opacity-70 cursor-not-allowed text-xs" value={profile.graduationClass || ""} disabled />
            </label>
            <label className="block text-xs font-medium text-brand-fg/70">
              班级
              <input name="className" className="input mt-1 w-full bg-black/10 opacity-70 cursor-not-allowed text-xs" value={profile.className || ""} disabled />
            </label>
          </div>
        </div>

        {/* 账号设置 */}
        <div className="space-y-3 rounded-xl bg-purple-950/10 border border-brand/5 p-4">
          <h3 className="text-xs font-semibold text-brand/80 border-b border-brand/5 pb-1.5 mb-2">账号设置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-brand-fg">
              用户名
              <input name="username" className="input mt-1 w-full text-xs" defaultValue={profile.username || ""} placeholder="用户名" minLength={3} maxLength={32} required />
            </label>
            <label className="block text-xs font-medium text-brand-fg">
              联系方式
              <input name="contact" className="input mt-1 w-full text-xs" defaultValue={profile.contact || ""} placeholder="手机号/微信号" />
            </label>
          </div>
        </div>

        {/* 教育轨迹 */}
        <div className="space-y-3 rounded-xl bg-purple-950/10 border border-brand/5 p-4">
          <h3 className="text-xs font-semibold text-brand/80 border-b border-brand/5 pb-1.5 mb-2">教育轨迹</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-brand-fg">
              毕业院校
              <input name="university" className="input mt-1 w-full text-xs" defaultValue={profile.university || ""} placeholder="例如：清华大学" maxLength={150} />
            </label>
            <label className="block text-xs font-medium text-brand-fg">
              所学专业
              <input name="major" className="input mt-1 w-full text-xs" defaultValue={profile.major || ""} placeholder="例如：计算机科学" maxLength={100} />
            </label>
          </div>
        </div>

        {/* 职业发展 */}
        <div className="space-y-3 rounded-xl bg-purple-950/10 border border-brand/5 p-4">
          <h3 className="text-xs font-semibold text-brand/80 border-b border-brand/5 pb-1.5 mb-2">职业发展</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-brand-fg">
              所在城市
              <input name="city" className="input mt-1 w-full text-xs" defaultValue={profile.city || ""} placeholder="例如：深圳" maxLength={100} />
            </label>
            <label className="block text-xs font-medium text-brand-fg">
              从事行业
              <input name="industry" className="input mt-1 w-full text-xs" defaultValue={profile.industry || ""} placeholder="例如：互联网/金融" maxLength={100} />
            </label>
          </div>
        </div>

        <button className="btn-primary w-full">保存</button>
        {message ? <p className="text-xs text-rose-500">{message}</p> : null}
      </form>
    </section>
  );
}
