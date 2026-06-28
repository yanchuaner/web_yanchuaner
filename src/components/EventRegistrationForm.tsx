"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button, ButtonLink, FormStatus } from "@/components/ui";

export default function EventRegistrationForm({
  eventId,
  registrationCount,
  maxAttendees,
}: {
  eventId: string;
  registrationCount: number;
  maxAttendees: number | null;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [formError, setFormError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("请填写姓名");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "报名失败，请稍后重试");
        return;
      }
      setRegistered(true);
    } catch {
      setFormError("网络错误，请检查连接后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (registered) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-6 text-center">
        <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
        <p className="mt-3 text-lg font-semibold text-emerald-700">报名成功</p>
        <p className="mt-1 text-sm leading-6 text-emerald-700/80">
          活动详情将通过您预留的联系方式发送，也可以返回活动列表继续查看其他安排。
        </p>
        <div className="mt-5">
          <ButtonLink href="/events" variant="secondary" className="w-full sm:w-auto">
            返回活动列表
          </ButtonLink>
        </div>
      </div>
    );
  }

  const isFull = maxAttendees != null && registrationCount >= maxAttendees;

  return (
    <div className="mt-8 rounded-2xl border border-[#7C3AED]/10 bg-[#FAF5FF] p-6">
      <h3 className="font-heading text-lg font-semibold text-[#4C1D95]">活动报名</h3>
      {isFull ? (
        <FormStatus
          tone="warning"
          title="名额已满"
          description="感谢关注，可以继续查看其他校友活动。"
          className="mt-4"
        />
      ) : (
        <form className="mt-4 space-y-4" onSubmit={handleRegister}>
          <label className="block text-sm font-medium text-brand-fg">
            姓名 *
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入姓名"
              className="input mt-1 w-full"
              disabled={submitting}
            />
          </label>
          <label className="block text-sm font-medium text-brand-fg">
            联系方式（可选）
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="手机号、微信号或邮箱"
              className="input mt-1 w-full"
              disabled={submitting}
            />
          </label>
          <label className="block text-sm font-medium text-brand-fg">
            留言（可选）
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="可填写同行人数、到场说明等"
              className="input mt-1 w-full resize-y"
              disabled={submitting}
            />
          </label>
          {formError && (
            <FormStatus tone="danger" title="报名未提交" description={formError} />
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? "提交中..." : "提交报名"}
          </Button>
        </form>
      )}
    </div>
  );
}
