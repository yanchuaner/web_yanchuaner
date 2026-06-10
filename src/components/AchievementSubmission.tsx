"use client";

import { FormEvent, useState } from "react";
import { Mail, PenSquare, X } from "lucide-react";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_CATEGORY_LABELS,
  type AchievementCategory,
} from "@/lib/achievements";

type AchievementDraft = {
  alumniName: string;
  graduationClass: string;
  title: string;
  category: AchievementCategory;
  yearLabel: string;
  organization: string;
  description: string;
  contact: string;
};

const SUBMISSION_EMAIL = "yanchuan_alumni@163.com";

const INITIAL_DRAFT: AchievementDraft = {
  alumniName: "",
  graduationClass: "",
  title: "",
  category: "ACADEMIC",
  yearLabel: "",
  organization: "",
  description: "",
  contact: "",
};

export default function AchievementSubmission({
  initialOpen = false,
}: {
  initialOpen?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(initialOpen);
  const [draft, setDraft] = useState<AchievementDraft>(INITIAL_DRAFT);
  const [hasTriggeredMail, setHasTriggeredMail] = useState(false);

  const submitByMail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(
      `【校友成就投稿】${draft.title.trim()} - ${draft.alumniName.trim()}`,
    );
    const bodyText = [
      "校友姓名：",
      draft.alumniName.trim(),
      "",
      "届别：",
      draft.graduationClass.trim() || "未填写",
      "",
      "成就标题：",
      draft.title.trim(),
      "",
      "成就类别：",
      ACHIEVEMENT_CATEGORY_LABELS[draft.category],
      "",
      "年份：",
      draft.yearLabel.trim() || "未填写",
      "",
      "机构或单位：",
      draft.organization.trim() || "未填写",
      "",
      "成就简介：",
      draft.description.trim(),
      "",
      "联系方式：",
      draft.contact.trim() || "未填写",
    ].join("\n");

    window.location.href = `mailto:${SUBMISSION_EMAIL}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    setHasTriggeredMail(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsModalOpen(true);
          setHasTriggeredMail(false);
        }}
        className="btn-primary fixed bottom-20 right-4 z-40 px-5 py-3 shadow-lg ring-1 ring-emerald-500/30 hover:ring-emerald-500/50 md:bottom-24 md:right-8"
      >
        <PenSquare size={16} />
        投稿成就
      </button>

      {isModalOpen ? (
        <div className="mobile-modal-shell fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
          <button
            type="button"
            aria-label="关闭校友成就投稿窗口"
            tabIndex={-1}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm focus:outline-none"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="mobile-modal-panel safe-modal-panel relative z-10 w-full max-w-2xl rounded-3xl border border-[#7C3AED]/20 bg-white p-5 shadow-xl md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <h2 className="font-heading text-xl font-semibold text-[#4C1D95] md:text-2xl">
                投稿校友成就
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="关闭"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2"
              >
                <X size={15} aria-hidden="true" />
                <span className="sr-only">关闭</span>
              </button>
            </div>

            <p className="text-sm leading-7 text-gray-600 md:text-base">
              投稿不会直接展示在页面中。点击“以邮件投递”后，将唤起本地邮箱发送给站长。内容审核通过后，才会发布到校友成就墙。
            </p>

            <form className="mt-4 space-y-3" onSubmit={submitByMail}>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  required
                  value={draft.alumniName}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      alumniName: event.target.value,
                    }))
                  }
                  aria-label="校友姓名"
                  placeholder="姓名"
                  className="input w-full"
                />
                <input
                  value={draft.graduationClass}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      graduationClass: event.target.value,
                    }))
                  }
                  aria-label="届别"
                  placeholder="届别"
                  className="input w-full"
                />
              </div>

              <input
                required
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                aria-label="成就标题"
                placeholder="标题"
                className="input w-full"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      category: event.target.value as AchievementCategory,
                    }))
                  }
                  aria-label="成就类别"
                  className="input w-full"
                >
                  {ACHIEVEMENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {ACHIEVEMENT_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
                <input
                  value={draft.yearLabel}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      yearLabel: event.target.value,
                    }))
                  }
                  aria-label="年份"
                  placeholder="年份"
                  className="input w-full"
                />
              </div>

              <input
                value={draft.organization}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    organization: event.target.value,
                  }))
                }
                aria-label="机构或单位"
                placeholder="机构、单位或组织名称（选填）"
                className="input w-full"
              />

              <textarea
                required
                rows={5}
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                aria-label="成就简介"
                placeholder="成就简介"
                className="input w-full resize-y"
              />

              <input
                value={draft.contact}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    contact: event.target.value,
                  }))
                }
                aria-label="联系方式"
                placeholder="联系方式（选填）"
                className="input w-full"
              />

              <button
                type="submit"
                className="btn-primary w-full justify-center"
              >
                <Mail size={17} />
                以邮件投递给站长
              </button>
            </form>

            {hasTriggeredMail ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                如果未成功唤起邮件应用，请将成就资料直接发送至 {SUBMISSION_EMAIL}。内容审核通过后才会发布。
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
