"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Feather, Filter, Mail, PenSquare, X, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

type StoryRecord = {
  id: string;
  title: string;
  author: string;
  tags: string[];
  body: string;
  date: string;
};

type DraftState = {
  title: string;
  author: string;
  tag: string;
  content: string;
  contact: string;
};

const initialDraft: DraftState = {
  title: "",
  author: "",
  tag: "专业真相",
  content: "",
  contact: "",
};

function formatDate(isoDate: string) {
  const [year = "", month = "", day = ""] = isoDate.split("-");
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${year}.${month}.${day}`;
}

export default function AlumniStoriesPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("全部");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stories')
      .then(r => r.json())
      .then(d => setStories(d.stories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const story of stories) {
      for (const tag of story.tags) {
        tagSet.add(tag);
      }
    }
    return ["全部", ...Array.from(tagSet)];
  }, [stories]);

  const filteredStories = useMemo(() => {
    if (activeTag === "全部") {
      return stories;
    }
    return stories.filter((story) => story.tags.includes(activeTag));
  }, [activeTag, stories]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.content.trim()) {
      toast.error("标题和正文不能为空");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const bodyText = draft.content.trim() + (draft.contact.trim() ? `\n\n【联系方式】\n${draft.contact.trim()}` : "");

    const payload = {
      title: draft.title.trim(),
      body: bodyText,
      author: draft.author.trim() || undefined,
      tags: [draft.tag],
      date: new Date().toISOString().slice(0, 10),
    };

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.story) {
        setSubmitSuccess(true);
        setDraft(initialDraft);
        toast.success("投稿提交成功，已进入审核队列！");
      } else {
        const errMsg = data.error || "提交失败，请稍后重试";
        setSubmitError(errMsg);
        toast.error(errMsg);
      }
    } catch (error) {
      console.error("Story submission error:", error);
      setSubmitError("网络请求失败，请稍后重试");
      toast.error("网络请求失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 pb-32 md:px-8 md:py-12 md:pb-36">
      <div className="glass-card-base p-5 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
              <Feather size={14} />
              STORY COLUMN
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">{"燕川故事 · 轻论坛专栏"}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
              {"燕中校友的真实故事与经历分享。每一篇投稿经审核后公开发布，欢迎你的来稿。"}
            </p>
          </div>

          <Link href="/" className="btn-secondary">
            {"返回指挥中心"}
          </Link>
        </header>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-3 md:p-4">
          <div className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#7C3AED]">
            <Filter size={14} />
            TAG FILTER
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isActive = tag === activeTag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition md:text-sm ${
                    isActive
                      ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#4C1D95]"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#7C3AED]/40 hover:bg-white"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="story-waterfall mt-6">
          {filteredStories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
              <p className="text-sm text-gray-400">
                {activeTag === "全部" ? "暂无故事，敬请期待。" : `没有找到标签为"${activeTag}"的故事`}
              </p>
            </div>
          ) : (
            filteredStories.map((story) => (
            <article
              key={story.id}
              className="story-waterfall-item card p-4 transition hover:-translate-y-1 hover:shadow-md md:p-5"
            >
              <div className="mb-3 flex items-center justify-between gap-2 text-xs text-[#7C3AED]">
                <span className="rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-2.5 py-1">{formatDate(story.date)}</span>
                <span className="text-gray-500">{story.author}</span>
              </div>

              <h2 className="font-heading text-lg font-semibold leading-7 text-[#4C1D95] md:text-xl">{story.title}</h2>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {story.tags.map((tag) => (
                  <span
                    key={`${story.id}-${tag}`}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-7 text-gray-600">{story.body.slice(0, 150)}……</p>
              <div className="mt-3 text-right">
                <Link
                  href={`/alumni/stories/${story.id}`}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/20"
                >
                  {"阅读全文"} <span className="text-[10px]">→</span>
                </Link>
              </div>
            </article>
          )))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setIsModalOpen(true);
          setSubmitSuccess(false);
          setSubmitError(null);
        }}
        className="btn-primary fixed bottom-20 right-4 z-40 px-5 py-3 shadow-lg ring-1 ring-emerald-500/30 hover:ring-emerald-500/50 md:bottom-24 md:right-8"
      >
        <PenSquare size={16} />
        {"我要投稿"}
      </button>

      {isModalOpen ? (
        <div className="mobile-modal-shell fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
          <button type="button"
            aria-label={"关闭投稿窗口"}
            tabIndex={-1}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm focus:outline-none"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="mobile-modal-panel safe-modal-panel relative z-10 w-full max-w-2xl rounded-3xl border border-[#7C3AED]/20 bg-white p-5 shadow-xl md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <h3 className="font-heading text-xl font-semibold text-[#4C1D95] md:text-2xl">{"投稿投递舱"}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="关闭"
                tabIndex={0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2"
              >
                <X size={15} aria-hidden="true" />
                <span className="sr-only">关闭</span>
              </button>
            </div>

            <p className="text-sm leading-7 text-gray-600 md:text-base">
              {"您的投稿在经管理员审核合规后，将会正式收录并展示在“燕中故事”板块中。"}
            </p>

            {!(user && (user.role === 'ADMIN' || (user.role === 'ALUMNI' && user.status === 'VERIFIED'))) ? (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-center space-y-3">
                <div className="flex justify-center text-amber-500">
                  <AlertTriangle size={32} />
                </div>
                <h4 className="font-semibold text-amber-600">投稿权限受限</h4>
                <p className="text-xs leading-5 text-gray-600">
                  只有通过校友身份认证的用户才能在此提交故事投稿。您当前处于未认证状态。
                </p>
                <div className="pt-1">
                  <Link href="/me" className="btn-secondary py-1 px-4 text-xs">
                    前往个人中心申请认证
                  </Link>
                </div>
              </div>
            ) : submitSuccess ? (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center space-y-4">
                <div className="flex justify-center text-emerald-500">
                  <CheckCircle2 size={40} className="animate-in zoom-in duration-300" />
                </div>
                <h4 className="font-bold text-emerald-600">投递成功！</h4>
                <p className="text-xs leading-5 text-gray-600">
                  您的文章已进入审核队列，请等待管理员审核。
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitSuccess(false);
                      setDraft(initialDraft);
                    }}
                    className="btn-secondary text-xs"
                  >
                    再写一篇
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-primary text-xs"
                  >
                    返回列表
                  </button>
                </div>
              </div>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <input
                  required
                  aria-label="稿件标题"
                  tabIndex={0}
                  value={draft.title}
                  onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder={"标题（例：大学避坑指南）"}
                  className="input w-full"
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    required
                    aria-label="作者"
                    tabIndex={0}
                    value={draft.author}
                    onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
                    placeholder={"作者（姓名 / 届别）"}
                    className="input w-full"
                  />

                  <select
                    value={draft.tag}
                    aria-label="选择标签"
                    tabIndex={0}
                    onChange={(event) => setDraft((prev) => ({ ...prev, tag: event.target.value }))}
                    className="input w-full"
                  >
                    <option value="专业真相">{"专业真相"}</option>
                    <option value="避坑指南">{"避坑指南"}</option>
                    <option value="校园回忆">{"校园回忆"}</option>
                    <option value="青春寄语">{"青春寄语"}</option>
                  </select>
                </div>

                <textarea
                  required
                  rows={7}
                  aria-label="稿件正文"
                  tabIndex={0}
                  value={draft.content}
                  onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder={"请输入稿件正文"}
                  className="input w-full resize-y"
                />

                <input
                  value={draft.contact}
                  aria-label="联系方式"
                  tabIndex={0}
                  onChange={(event) => setDraft((prev) => ({ ...prev, contact: event.target.value }))}
                  placeholder={"联系方式（可选）"}
                  className="input w-full"
                />

                {submitError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
                    ⚠️ {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center disabled:opacity-50"
                >
                  <Send size={17} />
                  {submitting ? "投递中..." : "提交投稿到母港"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
