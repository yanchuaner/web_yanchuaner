import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bot, ExternalLink, Image as ImageIcon, ShieldCheck } from "lucide-react";
import { Badge, ButtonLink, GlassCard, PageHeader, PageShell } from "@/components/ui";
import { requirePageUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "燕中 AI",
  description: "燕中生态内部 AI 工作台入口",
};

export default async function AiWorkspacePage() {
  const user = await requirePageUser();
  const rootAdminEmail = (
    process.env.ROOT_ADMIN_EMAIL || "yanchuaner@yanchuaner.cn"
  ).toLowerCase();
  const userEmail = user.email?.toLowerCase();

  if (user.role !== "ADMIN" || userEmail !== rootAdminEmail) {
    redirect("/me");
  }

  const workspaceUrl =
    process.env.AI_WORKSPACE_URL?.trim() ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");

  return (
    <PageShell size="narrow">
      <PageHeader
        eyebrow="YANZHONG AI"
        eyebrowIcon={Bot}
        title="燕中 AI 工作台"
        description="面向燕中生态内部成员的统一 AI 服务入口。"
      />

      <GlassCard className="mt-6 p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-brand-fg">内部测试工作台</h2>
              <Badge tone={workspaceUrl ? "success" : "warning"}>
                {workspaceUrl ? "可用" : "待配置"}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-brand-fg/70">
              当前支持通用对话与 GPT Image 2 图片生成。网站账号与工作台账号暂未统一，访问权限由管理员单独开通。
            </p>
          </div>

          {workspaceUrl ? (
            <ButtonLink
              href={workspaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              icon={ExternalLink}
              className="shrink-0"
            >
              进入工作台
            </ButtonLink>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
          <div className="flex items-center gap-3 text-sm text-brand-fg/75">
            <ImageIcon size={18} className="shrink-0 text-brand" aria-hidden="true" />
            <span>生成并下载活动配图</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-brand-fg/75">
            <ShieldCheck size={18} className="shrink-0 text-accent" aria-hidden="true" />
            <span>密钥由服务端统一保管</span>
          </div>
        </div>
      </GlassCard>
    </PageShell>
  );
}
