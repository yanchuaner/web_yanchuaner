"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { EmptyState } from "@/components/ui";
import { toast } from "sonner";
import { Users, Loader2 } from "lucide-react";

export default function UserClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/user-claims");
      if (!response.ok) throw new Error("加载数据失败");
      const data = await response.json();
      setClaims(data.claims || []);
      setCandidates(data.candidates || []);
    } catch (err: any) {
      toast.error(err.message || "加载数据失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, action: "approve-claim" | "reject-claim") {
    const candidate = candidates.find((item) => item.id === selected[id]);
    if (
      action === "approve-claim" &&
      !window.confirm(`确认批准并转移该旧资料关联的 ${candidate?._count?.posts || 0} 篇投稿吗？`)
    ) return;

    setActing(true);
    try {
      const response = await fetch(`/api/admin/user-claims/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          oldUserId: selected[id] || null,
          adminNote: notes[id] || "",
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "操作失败");
      }
      toast.success(action === "approve-claim" ? "批准成功，已转移关联投稿" : "拒绝成功");
      // 清空当前行状态
      setSelected((old) => {
        const copy = { ...old };
        delete copy[id];
        return copy;
      });
      setNotes((old) => {
        const copy = { ...old };
        delete copy[id];
        return copy;
      });
      await load();
    } catch (err: any) {
      toast.error(err.message || "操作失败");
    } finally {
      setActing(false);
    }
  }

  return (
    <AdminPageShell
      title="旧资料认领审核"
      description="审核注册账号与历史遗留名册资料的关联与投稿转移"
    >
      {loading ? (
        <div className="flex items-center justify-center py-20 text-brand-fg/60">
          <Loader2 size={24} className="animate-spin text-brand mr-2" />
          <span>数据加载中...</span>
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          icon={Users}
          title="暂无待审核认领申请"
          description="当新注册校友申请认领旧资料时，会在此处显示"
        />
      ) : (
        <div className="space-y-6">
          {claims.map((claim) => (
            <section
              key={claim.id}
              className="rounded-card border border-line bg-surface/50 p-6 backdrop-blur-xl shadow-sm"
            >
              <h3 className="font-heading text-lg font-semibold text-brand-fg">
                {claim.claimant.name}（{claim.claimant.username}）
              </h3>
              <p className="mt-1.5 text-sm text-brand-fg/60">
                {claim.claimant.email} · {claim.claimant.graduationClass || "届别未填"} · {claim.claimant.contact || "无联系方式"}
              </p>

              <div className="mt-4">
                <label htmlFor={`select-old-${claim.id}`} className="block text-xs font-semibold text-brand-fg/50 uppercase tracking-wider mb-2">
                  匹配历史旧资料
                </label>
                <select
                  id={`select-old-${claim.id}`}
                  className="input w-full rounded-btn bg-surface-muted/50 border-line text-brand-fg"
                  value={selected[claim.id] || ""}
                  onChange={(e) => setSelected((old) => ({ ...old, [claim.id]: e.target.value }))}
                >
                  <option value="" className="bg-surface-muted">选择可认领的旧资料</option>
                  {candidates.map((item) => (
                    <option key={item.id} value={item.id} className="bg-surface-muted">
                      {item.name || "未命名"} · {item.contact || "无联系方式"} · {item.identityCode || "无说明"} · {item._count.posts} 篇投稿
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3">
                <textarea
                  id={`note-${claim.id}`}
                  className="input w-full min-h-[80px] rounded-btn bg-surface-muted/50 border-line text-brand-fg"
                  placeholder="可在此输入管理员备注说明"
                  value={notes[claim.id] || ""}
                  onChange={(e) => setNotes((old) => ({ ...old, [claim.id]: e.target.value }))}
                />
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  className="btn-primary rounded-btn cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!selected[claim.id] || acting}
                  onClick={() => void act(claim.id, "approve-claim")}
                >
                  批准认领并转移投稿
                </button>
                <button
                  className="btn-secondary rounded-btn cursor-pointer"
                  disabled={acting}
                  onClick={() => void act(claim.id, "reject-claim")}
                >
                  拒绝申请
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
