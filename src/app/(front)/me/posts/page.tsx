"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Clock, ArrowLeft, FileText } from "lucide-react";
import { PageShell, GlassCard, PageHeader, Button, ButtonLink, EmptyState, ErrorState, Badge, Skeleton, SkeletonText } from "@/components/ui";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

type UserPost = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
  createdAt: string;
};

export default function MyPostsPage() {
  const { locale, t } = useThemeAndLocale();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserPost | null>(null);
  const deleteDialogRef = useDialogA11y(!!confirmDelete, () => {
    if (!deletingId) setConfirmDelete(null);
  });

  const fetchPosts = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetch("/api/me/posts")
      .then((res) => {
        if (!res.ok) throw new Error(t("me.posts.loadError"));
        return res.json();
      })
      .then((data) => {
        setPosts(data.posts || []);
      })
      .catch((err) => {
        console.error("Failed to load posts", err);
        const message = err instanceof Error ? err.message : t("me.posts.loadError");
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { id, title } = confirmDelete;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/stories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`${t("me.posts.withdrawSuccessPrefix")} ${title}`);
        setPosts((prev) => prev.filter((post) => post.id !== id));
        setConfirmDelete(null);
      } else {
        toast.error(data.error || t("me.posts.deleteFailed"));
      }
    } catch (err) {
      console.error("Delete story error:", err);
      toast.error(t("me.posts.network"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageShell size="narrow" className="pb-32">
      <ButtonLink
        href="/me"
        variant="secondary"
        size="sm"
        className="mb-6 w-full sm:w-auto"
      >
        <ArrowLeft size={14} />
        {t("me.posts.back")}
      </ButtonLink>
      
      <PageHeader
        eyebrow={t("me.posts.eyebrow")}
        eyebrowIcon={FileText}
        title={t("me.posts.title")}
        description={loading ? t("me.posts.loadingDescription") : `${t("me.posts.countPrefix")} ${posts.length} ${t("me.posts.countSuffix")}`}
      />

      <div className="mt-6">
        {loading ? (
          <div className="space-y-4" aria-busy="true" aria-live="polite">
            {Array.from({ length: 3 }).map((_, index) => (
              <GlassCard key={index} as="article" className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="w-full min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton variant="text" className="h-6 w-44 max-w-full" />
                      <Skeleton variant="text" className="h-6 w-16" />
                    </div>
                    <Skeleton variant="text" className="mt-3 h-3 w-56 max-w-full" />
                  </div>
                  <Skeleton className="h-11 w-full rounded-btn sm:w-24" />
                </div>
                <div className="mt-4 rounded-btn border border-line bg-surface-muted/40 p-4">
                  <SkeletonText lines={3} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : loadError ? (
          <ErrorState
            title={t("me.posts.loadError")}
            description={loadError}
            onRetry={fetchPosts}
            homeHref="/me"
            homeLabel={t("me.posts.back")}
          />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t("me.posts.emptyTitle")}
            description={t("me.posts.emptyDescription")}
            action={
              <ButtonLink href="/me/submit" variant="primary">
                {t("me.posts.submitAction")}
              </ButtonLink>
            }
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const canDelete = post.status === "PENDING" || post.status === "DRAFT";
              
              return (
                <article
                  key={post.id}
                  className="rounded-card border border-line bg-surface/40 p-6 shadow-md backdrop-blur-md transition duration-300 hover:border-brand/50 hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-[240px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-lg font-bold text-brand-fg leading-snug">
                          {post.title}
                        </h2>
                        
                        {/* 状态标签 */}
                        {post.status === "PENDING" && <Badge tone="warning">{t("me.posts.status.pending")}</Badge>}
                        {post.status === "PUBLISHED" && <Badge tone="success">{t("me.posts.status.published")}</Badge>}
                        {post.status === "REJECTED" && <Badge tone="danger">{t("me.posts.status.rejected")}</Badge>}
                        {post.status === "DRAFT" && <Badge tone="neutral">{t("me.posts.status.draft")}</Badge>}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-fg/50">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {t("me.posts.submittedAt")}: {new Date(post.createdAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN")}
                        </span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    {canDelete && (
                      <Button
                        onClick={() => setConfirmDelete(post)}
                        disabled={deletingId === post.id}
                        variant="danger"
                        size="sm"
                        className="w-full shrink-0 sm:w-auto"
                      >
                        <Trash2 size={13} />
                        {post.status === "PENDING" ? t("me.posts.withdraw") : t("me.posts.deleteDraft")}
                      </Button>
                    )}
                  </div>

                  {/* 稿件正文预览 */}
                  <div className="mt-4 rounded-btn border border-line bg-surface-muted/50 p-4 shadow-inner">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-brand-fg/70 select-text max-h-[120px] overflow-y-auto">
                      {post.content}
                    </p>
                  </div>

                  {/* 标签列表 */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-xs text-brand font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {confirmDelete && (
        <div 
          ref={deleteDialogRef}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-overlay/60 backdrop-blur-sm px-4 pb-safe sm:pb-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="w-full max-w-md rounded-modal border border-line bg-surface p-6 shadow-lg backdrop-blur-md mb-4 sm:mb-0 animate-slide-in sm:animate-fade-in">
            <h3 id="delete-confirm-title" className="text-lg font-semibold text-brand font-heading">{t("me.posts.confirmTitle")}</h3>
            <p className="mt-3 text-sm leading-6 text-brand-fg/70">
              {t("me.posts.confirmPrefix")}{confirmDelete.title}{t("me.posts.confirmSuffix")}
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId === confirmDelete.id}
                variant="secondary"
                className="w-full sm:w-auto min-h-[44px] cursor-pointer"
              >
                {t("me.posts.cancel")}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deletingId === confirmDelete.id}
                variant="danger"
                className="w-full sm:w-auto min-h-[44px] cursor-pointer"
              >
                {deletingId === confirmDelete.id ? t("me.posts.processing") : t("me.posts.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
