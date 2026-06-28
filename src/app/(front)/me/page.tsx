import { PageShell, GlassCard, PageHeader, ButtonLink, Badge } from "@/components/ui";
import { User, Edit, FileText, Lock, PlusCircle, FileEdit } from "lucide-react";
import { requirePageUser } from "@/lib/admin-auth";

export default async function MePage() {
  const user = await requirePageUser();

  const getStatusBadgeTone = (status: string) => {
    if (status === "VERIFIED") return "success";
    if (status === "PENDING") return "warning";
    if (status === "REJECTED") return "danger";
    return "neutral";
  };

  const getStatusText = (status: string) => {
    if (status === "VERIFIED") return "已认证校友";
    if (status === "PENDING") return "身份审核中";
    if (status === "REJECTED") return "已驳回";
    return "未认证";
  };

  return (
    <PageShell size="narrow">
      <PageHeader
        eyebrow="PROFILE"
        eyebrowIcon={User}
        title="个人中心"
        description="管理你的校友资料、发起身份修正申请、提交投稿及查看个人状态"
      />

      <GlassCard className="mt-6 space-y-6 p-5 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-bold text-brand-fg">{user.name || user.username}</h2>
            <p className="mt-1 break-all text-sm text-brand-fg/60">{user.email}</p>
          </div>
          <div className="shrink-0">
            <Badge tone={getStatusBadgeTone(user.status)}>
              {getStatusText(user.status)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ButtonLink href="/me/edit" variant="secondary" size="md" className="flex min-h-[120px] flex-col items-center justify-center p-6 gap-2 text-center rounded-card h-auto border-line hover:border-brand/35">
            <Edit size={20} className="text-brand" />
            <span>编辑资料</span>
          </ButtonLink>
          <ButtonLink href="/alumni/correction" variant="secondary" size="md" className="flex min-h-[120px] flex-col items-center justify-center p-6 gap-2 text-center rounded-card h-auto border-line hover:border-brand/35">
            <FileEdit size={20} className="text-brand" />
            <span>信息修正</span>
          </ButtonLink>
          <ButtonLink href="/me/submit" variant="secondary" size="md" className="flex min-h-[120px] flex-col items-center justify-center p-6 gap-2 text-center rounded-card h-auto border-line hover:border-brand/35">
            <PlusCircle size={20} className="text-brand" />
            <span>我要投稿</span>
          </ButtonLink>
          <ButtonLink href="/me/posts" variant="secondary" size="md" className="flex min-h-[120px] flex-col items-center justify-center p-6 gap-2 text-center rounded-card h-auto border-line hover:border-brand/35">
            <FileText size={20} className="text-brand" />
            <span>我的投稿</span>
          </ButtonLink>
          <ButtonLink href="/me/change-password" variant="secondary" size="md" className="flex min-h-[120px] flex-col items-center justify-center p-6 gap-2 text-center rounded-card h-auto border-line hover:border-brand/35">
            <Lock size={20} className="text-brand" />
            <span>修改密码</span>
          </ButtonLink>
        </div>
      </GlassCard>
    </PageShell>
  );
}
