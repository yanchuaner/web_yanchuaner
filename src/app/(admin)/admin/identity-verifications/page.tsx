"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserRoundCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Badge, Button, EmptyState, ResponsiveTabs } from "@/components/ui";
import { useAdminLocalize } from "@/components/admin/AdminLocalizedText";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

type VerificationRequest = {
  id: string;
  identityType: "ALUMNI" | "STUDENT" | "TEACHER";
  name: string;
  graduationClass: string | null;
  className: string | null;
  teacherPosition: string | null;
  matchResult: "MATCHED" | "CONFLICT" | "NOT_FOUND" | "NOT_APPLICABLE";
  status: "PENDING" | "VERIFIED" | "REJECTED";
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string | null;
    role: string;
    status: string;
    verificationStatus: string;
    identityType: string | null;
  };
  reviewedBy: {
    id: string;
    name: string | null;
    username: string | null;
  } | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const FILTERS = ["PENDING", "VERIFIED", "REJECTED", "ALL"] as const;
type Filter = (typeof FILTERS)[number];

const IDENTITY_LABELS = {
  ALUMNI: "毕业校友",
  STUDENT: "在校生",
  TEACHER: "教师",
} as const;

const STATUS_BADGES = {
  PENDING: { label: "待审核", tone: "warning" },
  VERIFIED: { label: "已通过", tone: "success" },
  REJECTED: { label: "已驳回", tone: "danger" },
} as const;

const MATCH_BADGES = {
  MATCHED: { label: "名单唯一匹配", tone: "success" },
  CONFLICT: { label: "存在同名冲突", tone: "warning" },
  NOT_FOUND: { label: "名单未匹配", tone: "danger" },
  NOT_APPLICABLE: { label: "无需名单匹配", tone: "neutral" },
} as const;

async function responseError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value: string | null, locale: "zh" | "en") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function IdentityVerificationsPage() {
  const localize = useAdminLocalize();
  const { locale } = useThemeAndLocale();
  const [status, setStatus] = useState<Filter>("PENDING");
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        status,
        page: String(page),
        pageSize: "20",
      });
      const response = await fetch(
        `/api/admin/identity-verifications?${params.toString()}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error(await responseError(response, localize("请求失败")));
      const body = (await response.json()) as {
        requests?: VerificationRequest[];
        pagination?: Pagination;
      };
      setRequests(body.requests || []);
      setPagination(
        body.pagination || { page, pageSize: 20, total: 0, totalPages: 0 },
      );
    } catch (loadError) {
      setError(localize(loadError instanceof Error ? loadError.message : "加载失败"));
    } finally {
      setLoading(false);
    }
  }, [localize, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (
    request: VerificationRequest,
    action: "approve" | "reject",
  ) => {
    const actionLabel = action === "approve" ? "通过" : "驳回";
    const confirmMessage = locale === "en"
      ? `${action === "approve" ? "Approve" : "Reject"} the identity verification request from ${request.name}?`
      : `确认${actionLabel}${request.name}的身份认证申请吗？`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActingId(request.id);
    try {
      const response = await fetch(
        `/api/admin/identity-verifications/${request.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            adminNote: notes[request.id] || "",
          }),
        },
      );
      if (!response.ok) throw new Error(await responseError(response, localize("请求失败")));
      toast.success(locale === "en" ? `Identity verification ${action === "approve" ? "approved" : "rejected"}.` : `已${actionLabel}身份认证申请`);
      setNotes((current) => {
        const next = { ...current };
        delete next[request.id];
        return next;
      });
      if (requests.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await load();
      }
    } catch (reviewError) {
      toast.error(
        localize(reviewError instanceof Error ? reviewError.message : "审核操作失败"),
      );
      await load();
    } finally {
      setActingId(null);
    }
  };

  return (
    <AdminPageShell title="身份认证审核" description="身份申请与审核记录">
      <ResponsiveTabs
        tabs={FILTERS.map((filter) => ({
          id: filter,
          label:
            filter === "PENDING"
              ? localize("待审核")
              : filter === "VERIFIED"
                ? localize("已通过")
                : filter === "REJECTED"
                  ? localize("已驳回")
                  : localize("全部"),
        }))}
        activeTab={status}
        onChange={(value) => {
          setStatus(value as Filter);
          setPage(1);
        }}
        className="mb-5"
      />

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-btn border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-brand-fg/60">
          <Loader2 size={20} className="animate-spin text-brand" />
          {localize("正在加载")}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={UserRoundCheck}
          title={localize("暂无身份认证申请")}
          description={localize("当前筛选条件下没有记录")}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const statusBadge = STATUS_BADGES[request.status];
            const matchBadge = MATCH_BADGES[request.matchResult];
            const isActing = actingId === request.id;
            return (
              <article
                key={request.id}
                className="rounded-card border border-line bg-surface/50 p-4 shadow-sm md:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-base font-semibold text-brand-fg">
                        {request.name}
                      </h2>
                      <Badge tone={statusBadge.tone}>{localize(statusBadge.label)}</Badge>
                      <Badge tone={matchBadge.tone}>{localize(matchBadge.label)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-brand-fg/50">
                      {request.user.username || localize("微信用户")} · {localize("提交于")} {formatDate(request.createdAt, locale)}
                    </p>
                  </div>
                  <Badge icon={BadgeCheck} tone="brand">
                    {localize(IDENTITY_LABELS[request.identityType])}
                  </Badge>
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-line pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs text-brand-fg/45">{localize("毕业或预计毕业年份")}</dt>
                    <dd className="mt-1 text-brand-fg">
                      {request.graduationClass || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brand-fg/45">{localize("班级")}</dt>
                    <dd className="mt-1 text-brand-fg">{request.className || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brand-fg/45">{localize("教师职位")}</dt>
                    <dd className="mt-1 text-brand-fg">
                      {request.teacherPosition || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brand-fg/45">{localize("当前角色")}</dt>
                    <dd className="mt-1 text-brand-fg">{request.user.role}</dd>
                  </div>
                </dl>

                {request.status === "PENDING" ? (
                  <div className="mt-4 border-t border-line pt-4">
                    <label
                      htmlFor={`review-note-${request.id}`}
                      className="mb-2 block text-xs font-medium text-brand-fg/60"
                    >
                      {localize("审核备注（选填）")}
                    </label>
                    <textarea
                      id={`review-note-${request.id}`}
                      value={notes[request.id] || ""}
                      maxLength={500}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                      className="input min-h-20 w-full resize-y"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        icon={Check}
                        disabled={Boolean(actingId)}
                        onClick={() => void review(request, "approve")}
                      >
                        {localize(isActing ? "处理中" : "通过")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        icon={X}
                        disabled={Boolean(actingId)}
                        onClick={() => void review(request, "reject")}
                      >
                        {localize(isActing ? "处理中" : "驳回")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 border-t border-line pt-4 text-xs text-brand-fg/50">
                    {request.reviewedBy?.name ||
                      request.reviewedBy?.username ||
                      localize("管理员")}
                    {" · "}
                    {formatDate(request.reviewedAt, locale)}
                    {request.adminNote ? ` · ${request.adminNote}` : ""}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {!loading && pagination.total > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-brand-fg/55">
          <span>{localize("共")} {pagination.total} {localize("条")}</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={ChevronLeft}
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {localize("上一页")}
            </Button>
            <span className="min-w-16 text-center">
              {page} / {Math.max(1, pagination.totalPages)}
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={ChevronRight}
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              {localize("下一页")}
            </Button>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
