"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useAdminLocalize } from "@/components/admin/AdminLocalizedText";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import { DEFAULT_NEWS_CATEGORY, NEWS_CATEGORIES } from "@/lib/news";

export type NewsEditorValue = {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  contentFormat: "PLAIN" | "MARKDOWN";
  status: "DRAFT" | "PUBLISHED";
};

const EMPTY_VALUE: NewsEditorValue = {
  title: "",
  summary: "",
  content: "",
  imageUrl: "",
  category: DEFAULT_NEWS_CATEGORY,
  sourceName: "",
  sourceUrl: "",
  contentFormat: "PLAIN",
  status: "DRAFT",
};

export function NewsEditorForm({
  endpoint,
  method,
  initialValue = EMPTY_VALUE,
}: {
  endpoint: string;
  method: "POST" | "PUT";
  initialValue?: NewsEditorValue;
}) {
  const localize = useAdminLocalize();
  const { t } = useThemeAndLocale();
  const router = useRouter();
  const [form, setForm] = useState(initialValue);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = method === "PUT";

  const update = <K extends keyof NewsEditorValue>(key: K, value: NewsEditorValue[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || localize("上传失败"));
      update("imageUrl", result.url);
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : localize("上传失败"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError(localize("标题和正文不能为空"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || localize(editing ? "更新失败" : "创建失败"));
      toast.success(localize(editing ? "新闻已更新" : "新闻发布成功"));
      router.push("/admin/news");
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : localize("操作失败");
      setError(message);
      toast.error(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-card border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-card border border-line bg-surface/50 p-5 backdrop-blur-md md:p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-main">{localize("标题")} *</span>
            <input value={form.title} onChange={(event) => update("title", event.target.value)} className="input w-full" maxLength={120} />
          </label>
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-main">{localize("摘要")}</span>
            <textarea value={form.summary} onChange={(event) => update("summary", event.target.value)} className="input w-full" rows={3} maxLength={500} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-main">{localize("分类")}</span>
            <select value={form.category} onChange={(event) => update("category", event.target.value)} className="input w-full">
              {NEWS_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{t(category.labelKey)}</option>)}
            </select>
          </label>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-main">{localize("正文格式")}</legend>
            <div className="grid grid-cols-2 rounded-btn border border-line bg-surface p-1">
              {(["PLAIN", "MARKDOWN"] as const).map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => update("contentFormat", format)}
                  className={`min-h-10 rounded-btn px-3 text-sm transition ${form.contentFormat === format ? "bg-brand text-contrast" : "text-main/65 hover:text-main"}`}
                >
                  {format === "MARKDOWN" ? "Markdown" : localize("纯文本")}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-main">{localize("来源名称")}</span>
            <input value={form.sourceName} onChange={(event) => update("sourceName", event.target.value)} className="input w-full" maxLength={100} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-main">{localize("原文链接")}</span>
            <input type="url" value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} className="input w-full" maxLength={500} />
          </label>
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-main">{localize("正文")} *</span>
            <textarea value={form.content} onChange={(event) => update("content", event.target.value)} className="input min-h-80 w-full font-mono text-sm leading-6" maxLength={20000} />
          </label>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-main">{localize("封面图片")}</span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-btn border border-brand/20 bg-brand/5 px-4 text-sm text-brand transition hover:bg-brand/10">
              <Upload size={16} /> {localize(uploading ? "上传中..." : "选择图片")}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
            {form.imageUrl ? <span className="break-all text-sm text-main/60">{form.imageUrl}</span> : null}
          </div>
          {form.imageUrl ? (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="relative aspect-video w-full max-w-60 overflow-hidden rounded-card border border-line">
                <Image src={form.imageUrl} alt={localize("封面预览")} fill sizes="240px" className="object-cover" />
              </div>
              <button type="button" onClick={() => update("imageUrl", "")} className="min-h-10 rounded-btn border border-danger/25 bg-danger/10 px-3 text-xs text-danger transition hover:bg-danger/20">
                {localize("移除封面")}
              </button>
            </div>
          ) : null}
        </div>

        <label className="block max-w-sm">
          <span className="mb-1.5 block text-sm font-medium text-main">{localize("状态")}</span>
          <select value={form.status} onChange={(event) => update("status", event.target.value as NewsEditorValue["status"])} className="input w-full">
            <option value="DRAFT">{localize("草稿")}</option>
            <option value="PUBLISHED">{localize("已发布")}</option>
          </select>
        </label>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={submitting} className="btn-primary min-h-11 disabled:opacity-50">
            {localize(submitting ? "提交中..." : editing ? "保存修改" : "发布新闻")}
          </button>
          <Link href="/admin/news" className="btn-secondary min-h-11">{localize("取消")}</Link>
        </div>
      </form>
    </div>
  );
}
