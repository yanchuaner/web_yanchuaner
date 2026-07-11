"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Clock, ArrowLeft, FileText } from "lucide-react";
import { PageShell, GlassCard, PageHeader, Button, ButtonLink, EmptyState, ErrorState, Badge, Skeleton, SkeletonText } from "@/components/ui";
import { useDialogA11y } from "@/hooks/useDialogA11y";

type UserPost = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
  createdAt: string;
};

export default function MyPostsPage() {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserPost | null>(null);
  const deleteDialogRef = useDialogA11y(!!confirmDelete, () => {
    if (!deletingId) setConfirmDelete(null);
  });

  const fetchPosts = () => {
    setLoading(true);
    setLoadError(null);
    fetch("/api/me/posts")
      .then((res) => {
        if (!res.ok) throw new Error("投稿列表加载失败，请稍后重试");
        return res.json();
      })
      .then((data) => {
        setPosts(data.posts || []);
      })
      .catch((err) => {
        console.error("Failed to load posts", err);
        const message = err instanceof Error ? err.message : "投稿列表加载失败，请稍后重试";
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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
        toast.success(`成功撤销投稿《${title}》`);
        setPosts((prev) => prev.filter((post) => post.id !== id));
        setConfirmDelete(null);
      } else {
        toast.error(data.error || "撤销失败，请稍后重试");
      }
    } catch (err) {
      console.error("Delete story error:", err);
      toast.error("网络请求失败，请稍后重试");
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
        返回个人中心
      </ButtonLink>
      
      <PageHeader
        eyebrow="CONTRIBUTIONS"
        eyebrowIcon={FileText}
        title="我的投稿"
        description={loading ? "正在加载已提交的稿件" : `管理已提交的稿件，共 ${posts.length} 篇`}
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
            title="投稿列表暂时无法加载"
            description={loadError}
            onRetry={fetchPosts}
            homeHref="/me"
            homeLabel="返回个人中心"
          />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="暂无投稿"
            description="您还没有发布任何文章，快去写下第一篇吧！"
            action={
              <ButtonLink href="/me/submit" variant="primary">
                立即去投稿
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
                  className="rounded-card border border-line bg-surface/40 backdrop-blur-md p-6 shadow-[0_8px_32px_rgba(124,58,237,0.08)] transition duration-300 hover:border-brand/50 hover:shadow-[0_8px_32px_rgba(124,58,237,0.18)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-[240px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-lg font-bold text-brand-fg leading-snug">
                          {post.title}
                        </h2>
                        
                        {/* 状态标签 */}
                        {post.status === "PENDING" && <Badge tone="warning">审核中</Badge>}
                        {post.status === "PUBLISHED" && <Badge tone="success">已发布</Badge>}
                        {post.status === "REJECTED" && <Badge tone="danger">已驳回</Badge>}
                        {post.status === "DRAFT" && <Badge tone="neutral">草稿</Badge>}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-fg/50">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          提交时间: {new Date(post.createdAt).toLocaleString("zh-CN")}
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
                        {post.status === "PENDING" ? "撤销投稿" : "删除草稿"}
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-safe sm:pb-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="w-full max-w-md rounded-modal border border-line bg-surface p-6 shadow-lg backdrop-blur-md mb-4 sm:mb-0 animate-slide-in sm:animate-fade-in">
            <h3 id="delete-confirm-title" className="text-lg font-semibold text-brand font-heading">确认删除</h3>
            <p className="mt-3 text-sm leading-6 text-brand-fg/70">
              确定要撤销并删除投稿《{confirmDelete.title}》吗？此操作不可撤销。
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId === confirmDelete.id}
                variant="secondary"
                className="w-full sm:w-auto min-h-[44px] cursor-pointer"
              >
                取消
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deletingId === confirmDelete.id}
                variant="danger"
                className="w-full sm:w-auto min-h-[44px] cursor-pointer"
              >
                {deletingId === confirmDelete.id ? '处理中...' : '确认删除'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
