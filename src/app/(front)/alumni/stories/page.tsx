"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Feather, Filter, PenSquare, X, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { PageShell, GlassCard, Button, ButtonLink, EmptyState } from "@/components/ui";

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
    <PageShell size="wide" className="pb-32 md:pb-36">
      <GlassCard className="p-5 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-brand/10 px-3 py-1 text-xs tracking-[0.18em] text-brand">
              <Feather size={14} />
              STORY COLUMN
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-brand-fg md:text-4xl">燕川故事 · 轻论坛专栏</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-fg/70 md:text-base">
              燕中校友的真实故事与经历分享。每一篇投稿经审核后公开发布，欢迎你的来稿。
            </p>
          </div>

          <ButtonLink href="/" variant="secondary">
            返回指挥中心
          </ButtonLink>
        </header>

        <div className="mt-6 rounded-card border border-line bg-surface/30 p-3 md:p-4">
          <div className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand">
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
                  className={`rounded-full border px-3 py-1.5 text-xs transition md:text-sm cursor-pointer ${
                    isActive
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-line bg-surface/50 text-brand-fg/60 hover:border-brand/40 hover:text-brand"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-brand-fg/60">加载中...</div>
        ) : (
          <div className="story-waterfall mt-6">
            {filteredStories.length === 0 ? (
              <EmptyState
                icon={Feather}
                title={activeTag === "全部" ? "暂无故事" : `没有找到标签为 "${activeTag}" 的故事`}
                description="欢迎点击下方的投稿按钮，留下属于你的精彩故事。"
              />
            ) : (
              filteredStories.map((story) => (
                <article
                  key={story.id}
                  className="story-waterfall-item rounded-card border border-line bg-surface/40 backdrop-blur-md p-4 transition hover:-translate-y-1 hover:bg-surface/60 hover:shadow-md md:p-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-2 text-xs">
                    <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-brand font-medium">{formatDate(story.date)}</span>
                    <span className="text-brand-fg/50">{story.author || '匿名校友'}</span>
                  </div>

                  <h2 className="font-heading text-lg font-semibold leading-7 text-brand md:text-xl">{story.title}</h2>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {story.tags.map((tag) => (
                      <span
                        key={`${story.id}-${tag}`}
                        className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs text-accent"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-brand-fg/70">{story.body.slice(0, 150)}……</p>
                  <div className="mt-3 text-right">
                    <Link
                      href={`/alumni/stories/${story.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/20"
                    >
                      阅读全文 <span className="text-[10px]">→</span>
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </GlassCard>

      <Button
        type="button"
        onClick={() => {
          setIsModalOpen(true);
          setSubmitSuccess(false);
          setSubmitError(null);
        }}
        className="fixed bottom-20 right-4 z-40 shadow-lg md:bottom-24 md:right-8"
        icon={PenSquare}
      >
        我要投稿
      </Button>

      {isModalOpen && (
        <div className="mobile-modal-shell fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8">
          <button
            type="button"
            aria-label="关闭投稿窗口"
            tabIndex={-1}
            className="absolute inset-0 bg-transparent focus:outline-none"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-2xl rounded-modal border border-line bg-surface p-5 shadow-lg backdrop-blur-xl md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
              <h3 className="font-heading text-xl font-semibold text-brand md:text-2xl">投稿投递舱</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="关闭"
                tabIndex={0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/50 text-brand-fg/60 hover:bg-brand/5 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              >
                <X size={15} aria-hidden="true" />
                <span className="sr-only">关闭</span>
              </button>
            </div>

            <p className="text-sm leading-7 text-brand-fg/70 md:text-base">
              您的投稿在经管理员审核合规后，将会正式收录并展示在“燕中故事”板块中。
            </p>

            {!(user && (user.role === 'ADMIN' || (user.role === 'ALUMNI' && user.status === 'VERIFIED'))) ? (
              <div className="mt-4 rounded-card border border-amber-500/20 bg-amber-500/5 p-5 text-center space-y-3">
                <div className="flex justify-center text-amber-500">
                  <AlertTriangle size={32} />
                </div>
                <h4 className="font-semibold text-amber-600">投稿权限受限</h4>
                <p className="text-xs leading-5 text-brand-fg/60">
                  只有通过校友身份认证的用户才能在此提交故事投稿。您当前处于未认证状态。
                </p>
                <div className="pt-1">
                  <ButtonLink href="/me" variant="secondary" size="sm">
                    前往个人中心申请认证
                  </ButtonLink>
                </div>
              </div>
            ) : submitSuccess ? (
              <div className="mt-4 rounded-card border border-emerald-500/20 bg-emerald-500/10 p-6 text-center space-y-4">
                <div className="flex justify-center text-emerald-400">
                  <CheckCircle2 size={40} className="animate-in zoom-in duration-300" />
                </div>
                <h4 className="font-bold text-emerald-400">投递成功！</h4>
                <p className="text-xs leading-5 text-brand-fg/60">
                  您的文章已进入审核队列，请等待管理员审核。
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setSubmitSuccess(false);
                      setDraft(initialDraft);
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    再写一篇
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    variant="primary"
                    size="sm"
                  >
                    返回列表
                  </Button>
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
                  placeholder="标题（例：大学避坑指南）"
                  className="input w-full"
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    required
                    aria-label="作者"
                    tabIndex={0}
                    value={draft.author}
                    onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
                    placeholder="作者（姓名 / 届别）"
                    className="input w-full"
                  />

                  <select
                    value={draft.tag}
                    aria-label="选择标签"
                    tabIndex={0}
                    onChange={(event) => setDraft((prev) => ({ ...prev, tag: event.target.value }))}
                    className="input w-full"
                  >
                    <option value="专业真相">专业真相</option>
                    <option value="避坑指南">避坑指南</option>
                    <option value="校园回忆">校园回忆</option>
                    <option value="青春寄语">青春寄语</option>
                  </select>
                </div>

                <textarea
                  required
                  rows={7}
                  aria-label="稿件正文"
                  tabIndex={0}
                  value={draft.content}
                  onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="请输入稿件正文"
                  className="input w-full resize-y"
                />

                <input
                  value={draft.contact}
                  aria-label="联系方式"
                  tabIndex={0}
                  onChange={(event) => setDraft((prev) => ({ ...prev, contact: event.target.value }))}
                  placeholder="联系方式（可选，微信号/邮箱）"
                  className="input w-full"
                />

                {submitError && (
                  <div className="rounded-card border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-400">
                    ⚠️ {submitError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full justify-center"
                >
                  <Send size={17} />
                  {submitting ? "投递中..." : "提交投稿到母港"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
