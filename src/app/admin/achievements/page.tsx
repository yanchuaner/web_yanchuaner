"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  CheckCircle2,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_CATEGORY_LABELS,
  type AchievementCategory,
} from "@/lib/achievements";

type Achievement = {
  id: string;
  alumniName: string;
  graduationClass: string | null;
  title: string;
  category: AchievementCategory;
  description: string;
  organization: string | null;
  yearLabel: string | null;
  status: "DRAFT" | "PUBLISHED";
  sortOrder: number;
};

type AchievementForm = {
  alumniName: string;
  graduationClass: string;
  title: string;
  category: AchievementCategory;
  description: string;
  organization: string;
  yearLabel: string;
  status: "DRAFT" | "PUBLISHED";
  sortOrder: string;
};

const EMPTY_FORM: AchievementForm = {
  alumniName: "",
  graduationClass: "",
  title: "",
  category: "ACADEMIC",
  description: "",
  organization: "",
  yearLabel: "",
  status: "DRAFT",
  sortOrder: "0",
};

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [form, setForm] = useState<AchievementForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/achievements");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "加载失败");
      setAchievements(data.achievements || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const openEdit = (achievement: Achievement) => {
    setEditingId(achievement.id);
    setForm({
      alumniName: achievement.alumniName,
      graduationClass: achievement.graduationClass || "",
      title: achievement.title,
      category: achievement.category,
      description: achievement.description,
      organization: achievement.organization || "",
      yearLabel: achievement.yearLabel || "",
      status: achievement.status,
      sortOrder: String(achievement.sortOrder),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveAchievement = async () => {
    if (!form.alumniName.trim() || !form.title.trim()) {
      setError("校友姓名和成就标题不能为空");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        editingId
          ? `/api/admin/achievements/${editingId}`
          : "/api/admin/achievements",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            sortOrder: Number(form.sortOrder) || 0,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      resetForm();
      await fetchAchievements();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const deleteAchievement = async (achievement: Achievement) => {
    if (!confirm(`确定删除“${achievement.title}”吗？`)) return;

    try {
      const res = await fetch(`/api/admin/achievements/${achievement.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "删除失败");
      if (editingId === achievement.id) resetForm();
      await fetchAchievements();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "删除失败");
    }
  };

  const updateField = <K extends keyof AchievementForm>(
    key: K,
    value: AchievementForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <Award size={28} className="text-[#7C3AED]" />
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#4C1D95]">
            校友成就墙管理
          </h1>
          <p className="mt-1 text-sm text-[#4C1D95]/60">
            新增、编辑并发布校友成就记录
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-2 cursor-pointer underline"
          >
            关闭
          </button>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-[#7C3AED]/10 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-[#4C1D95]">
          {editingId ? "编辑成就" : "新增成就"}
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-[#4C1D95]">
            校友姓名 *
            <input
              value={form.alumniName}
              onChange={(event) =>
                updateField("alumniName", event.target.value)
              }
              className="input mt-1 w-full"
              maxLength={50}
              disabled={saving}
            />
          </label>
          <label className="text-sm font-medium text-[#4C1D95]">
            届别
            <input
              value={form.graduationClass}
              onChange={(event) =>
                updateField("graduationClass", event.target.value)
              }
              className="input mt-1 w-full"
              placeholder="例：2020届"
              disabled={saving}
            />
          </label>
          <label className="text-sm font-medium text-[#4C1D95] md:col-span-2">
            成就标题 *
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="input mt-1 w-full"
              maxLength={120}
              disabled={saving}
            />
          </label>
          <label className="text-sm font-medium text-[#4C1D95]">
            类别
            <select
              value={form.category}
              onChange={(event) =>
                updateField(
                  "category",
                  event.target.value as AchievementCategory,
                )
              }
              className="input mt-1 w-full"
              disabled={saving}
            >
              {ACHIEVEMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {ACHIEVEMENT_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-[#4C1D95]">
            年份
            <input
              value={form.yearLabel}
              onChange={(event) =>
                updateField("yearLabel", event.target.value)
              }
              className="input mt-1 w-full"
              placeholder="例：2026"
              disabled={saving}
            />
          </label>
          <label className="text-sm font-medium text-[#4C1D95]">
            机构或单位
            <input
              value={form.organization}
              onChange={(event) =>
                updateField("organization", event.target.value)
              }
              className="input mt-1 w-full"
              placeholder="学校、单位或组织名称"
              disabled={saving}
            />
          </label>
          <label className="text-sm font-medium text-[#4C1D95]">
            排序
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) =>
                updateField("sortOrder", event.target.value)
              }
              className="input mt-1 w-full"
              disabled={saving}
            />
          </label>
          <label className="text-sm font-medium text-[#4C1D95]">
            发布状态
            <select
              value={form.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value as "DRAFT" | "PUBLISHED",
                )
              }
              className="input mt-1 w-full"
              disabled={saving}
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">已发布</option>
            </select>
          </label>
          <label className="text-sm font-medium text-[#4C1D95] md:col-span-2">
            成就简介
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              className="input mt-1 min-h-32 w-full resize-y"
              maxLength={2000}
              disabled={saving}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveAchievement}
            disabled={saving}
            className="btn-primary cursor-pointer"
          >
            {editingId ? <CheckCircle2 size={16} /> : null}
            {saving ? "保存中..." : editingId ? "保存修改" : "新增"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="btn-secondary cursor-pointer"
            >
              取消编辑
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400">加载中...</p>
        ) : achievements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 py-12 text-center text-sm text-gray-400">
            暂无成就记录，请使用上方表单新增。
          </div>
        ) : (
          achievements.map((achievement) => (
            <article
              key={achievement.id}
              className="flex flex-wrap items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading font-semibold text-[#4C1D95]">
                    {achievement.title}
                  </h3>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      achievement.status === "PUBLISHED"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}
                  >
                    {achievement.status === "PUBLISHED" ? "已发布" : "草稿"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {achievement.alumniName}
                  {achievement.graduationClass
                    ? ` · ${achievement.graduationClass}`
                    : ""}
                  {" · "}
                  {ACHIEVEMENT_CATEGORY_LABELS[achievement.category]}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                  {achievement.description || "暂无简介"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(achievement)}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
                  aria-label={`编辑 ${achievement.title}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteAchievement(achievement)}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`删除 ${achievement.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
