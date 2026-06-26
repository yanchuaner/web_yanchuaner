"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Feather, Send, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/apiClient";
import { PageShell, GlassCard, PageHeader, Button, ButtonLink } from "@/components/ui";

export default function UserStorySubmitPage() {
  const { user, isLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [storyDate, setStoryDate] = useState("");

  const isAllowed = user && (user.role === 'ADMIN' || (user.role === 'ALUMNI' && user.status === 'VERIFIED'));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("标题和正文不能为空");
      return;
    }

    setSubmitting(true);

    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      body: body.trim(),
      author: author.trim() || undefined,
      tags,
      date: storyDate || undefined,
    };

    const { data, error } = await api.post<{ story: any }>("/api/stories", payload);

    setSubmitting(false);

    if (data?.story) {
      setSubmitted(true);
      setTitle("");
      setBody("");
      setAuthor("");
      setTagsInput("");
      setStoryDate("");
      toast.success("投稿提交成功！");
    } else {
      toast.error(error || "提交失败，请稍后重试");
    }
  }

  if (isLoading) {
    return (
      <PageShell size="narrow">
        <div className="flex items-center justify-center py-20 text-brand-fg/60">加载中…</div>
      </PageShell>
    );
  }

  return (
    <PageShell size="narrow" className="pb-24 md:pb-32">
      <ButtonLink
        href="/me"
        variant="secondary"
        size="sm"
        className="mb-6"
      >
        <ArrowLeft size={14} />
        返回个人中心
      </ButtonLink>

      <PageHeader
        eyebrow="SUBMIT"
        eyebrowIcon={Feather}
        title="我要投稿"
        description="撰写校友故事，分享您的大学体验、备考心路或行业洞察"
      />

      <div className="mt-6">
        {!isAllowed ? (
          <div className="rounded-card border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-7 text-center space-y-4">
            <h2 className="text-xl font-bold text-amber-400">⚠️ 投稿权限受限</h2>
            <p className="text-sm leading-6 text-brand-fg/70 max-w-md mx-auto">
              只有通过校友身份认证的用户才能在此提交故事投稿。您当前的认证状态为：
              <strong className="text-brand font-semibold">{user?.status || "未知"}</strong>。
            </p>
            <div className="pt-2">
              <ButtonLink href="/me" variant="primary">
                返回个人中心查看状态
              </ButtonLink>
            </div>
          </div>
        ) : submitted ? (
          <div className="rounded-card border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl p-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shadow-inner">
              <CheckCircle size={28} />
            </div>
            <h2 className="text-xl font-bold text-emerald-400">✅ 提交成功！</h2>
            <p className="text-sm leading-6 text-brand-fg/70 max-w-md mx-auto">
              您的文章已进入审核队列，请耐心等待管理员批阅。审核通过后将正式发布到“燕中故事”板块。
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <Button
                onClick={() => setSubmitted(false)}
                variant="primary"
                size="sm"
              >
                再次投稿
              </Button>
              <ButtonLink href="/me" variant="secondary" size="sm">
                回到个人中心
              </ButtonLink>
            </div>
          </div>
        ) : (
          <GlassCard className="p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-fg mb-1.5">
                    文章标题 *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    placeholder="例如：大学避坑指南——计算机专业真相"
                    className="input w-full text-sm focus:border-brand/50 focus:ring-brand/35"
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-fg mb-1.5">
                      署名作者 (默认显示您的名字)
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      maxLength={50}
                      placeholder={user?.name || user?.username || "匿名"}
                      className="input w-full text-sm focus:border-brand/50 focus:ring-brand/35"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-fg mb-1.5">
                      故事发生日期
                    </label>
                    <input
                      type="date"
                      value={storyDate}
                      onChange={(e) => setStoryDate(e.target.value)}
                      className="input w-full text-sm focus:border-brand/50 focus:ring-brand/35"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-fg mb-1.5">
                    文章分类标签 (英文或中文逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="例如：专业真相, 避坑指南, 校园回忆"
                    className="input w-full text-sm focus:border-brand/50 focus:ring-brand/35"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-fg mb-1.5">
                    稿件正文 * (字数不超过20,000字)
                  </label>
                  <textarea
                    required
                    rows={12}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={20000}
                    placeholder="请输入稿件正文内容，支持换行..."
                    className="input w-full text-sm focus:border-brand/50 focus:ring-brand/35 resize-y min-h-[240px]"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={15} />
                  {submitting ? "提交中..." : "提交审核"}
                </Button>
              </div>
            </form>
          </GlassCard>
        )}
      </div>
    </PageShell>
  );
}
