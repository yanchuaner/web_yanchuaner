"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { NewsEditorForm } from "@/components/admin/NewsEditorForm";
import { useAdminLocalize } from "@/components/admin/AdminLocalizedText";

export default function AdminNewsNewPage() {
  const localize = useAdminLocalize();
  return (
    <AdminPageShell
      title="发布新闻"
      description="发布新闻动态或公告"
      actions={<Link href="/admin/news" className="btn-secondary min-h-11"><ArrowLeft size={16} />{localize("返回列表")}</Link>}
    >
      <NewsEditorForm endpoint="/api/admin/news" method="POST" />
    </AdminPageShell>
  );
}
