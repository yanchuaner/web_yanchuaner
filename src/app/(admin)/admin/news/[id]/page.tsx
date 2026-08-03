"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { NewsEditorForm, type NewsEditorValue } from "@/components/admin/NewsEditorForm";
import { useAdminLocalize } from "@/components/admin/AdminLocalizedText";

export default function AdminNewsEditPage() {
  const localize = useAdminLocalize();
  const params = useParams<{ id: string }>();
  const [initialValue, setInitialValue] = useState<NewsEditorValue | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/news/${params.id}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || localize("获取新闻失败"));
        const article = result.news;
        setInitialValue({
          title: article.title || "",
          summary: article.summary || "",
          content: article.content || "",
          imageUrl: article.imageUrl || "",
          category: article.category || "ALUMNI_UPDATE",
          sourceName: article.sourceName || "",
          sourceUrl: article.sourceUrl || "",
          contentFormat: article.contentFormat === "MARKDOWN" ? "MARKDOWN" : "PLAIN",
          status: article.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
          visibility: article.visibility === "PUBLIC" ? "PUBLIC" : "MEMBER",
        });
      })
      .catch((fetchError) => setError(fetchError instanceof Error ? fetchError.message : localize("获取新闻失败")));
  }, [localize, params.id]);

  return (
    <AdminPageShell
      title="编辑新闻"
      description="修改新闻标题、正文与发布状态"
      actions={<Link href="/admin/news" className="btn-secondary min-h-11"><ArrowLeft size={16} />{localize("返回列表")}</Link>}
    >
      {error ? <div className="rounded-card border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}
      {!error && !initialValue ? <div className="py-16 text-center text-main/60">{localize("加载中...")}</div> : null}
      {initialValue ? <NewsEditorForm endpoint={`/api/admin/news/${params.id}`} method="PUT" initialValue={initialValue} /> : null}
    </AdminPageShell>
  );
}
