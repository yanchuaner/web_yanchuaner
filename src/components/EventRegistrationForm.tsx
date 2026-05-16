"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";

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
    if (!name.trim()) { setFormError("请填写姓名"); return; }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "报名失败"); return; }
      setRegistered(true);
    } catch { setFormError("网络错误，请稍后重试"); }
    finally { setSubmitting(false); }
  };

  if (registered) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center">
        <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
        <p className="mt-3 text-lg font-semibold text-emerald-800">报名成功！</p>
        <p className="mt-1 text-sm text-emerald-600">活动详情将通过您预留的联系方式发送。</p>
      </div>
    );
  }

  const isFull = maxAttendees != null && registrationCount >= maxAttendees;

  return (
    <div className="mt-8 rounded-2xl border border-[#7C3AED]/10 bg-[#FAF5FF] p-6">
      <h3 className="font-heading text-lg font-semibold text-[#4C1D95]">活动报名</h3>
      {isFull ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">名额已满，感谢关注。</p>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={handleRegister}>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="姓名 *"
            className="input w-full"
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="联系方式（可选）"
            className="input w-full"
          />
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="留言（可选）"
            className="input w-full resize-none"
          />
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div>
          )}
          <button type="submit"
            disabled={submitting}
            className="btn-primary w-full justify-center"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? "提交中..." : "提交报名"}
          </button>
        </form>
      )}
    </div>
  );
}
