"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Feather, Filter, Mail, PenSquare, X } from "lucide-react";
import storiesData from "@/data/stories.json";

type StoryRecord = {
  id: string;
  title: string;
  author: string;
  tags: string[];
  body: string;
  date: string;
};

type DraftState = {
  title: string;
  author: string;
  tag: string;
  content: string;
  contact: string;
};

const STORY_EMAIL = "alumni@aeroschool.edu.cn";

const initialDraft: DraftState = {
  title: "",
  author: "",
  tag: "\u4e13\u4e1a\u771f\u76f8",
  content: "",
  contact: "",
};

function formatDate(isoDate: string) {
  const [year = "", month = "", day = ""] = isoDate.split("-");
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${year}.${month}.${day}`;
}

export default function AlumniStoriesPage() {
  const stories = storiesData as StoryRecord[];
  const [activeTag, setActiveTag] = useState("\u5168\u90e8");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const [hasTriggeredMail, setHasTriggeredMail] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const story of stories) {
      for (const tag of story.tags) {
        tagSet.add(tag);
      }
    }
    return ["\u5168\u90e8", ...Array.from(tagSet)];
  }, [stories]);

  const filteredStories = useMemo(() => {
    if (activeTag === "\u5168\u90e8") {
      return stories;
    }
    return stories.filter((story) => story.tags.includes(activeTag));
  }, [activeTag, stories]);

  const submitByMail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(
      `[\u71d5\u5ddd\u6545\u4e8b\u6295\u7a3f] ${draft.title.trim() || "\u672a\u547d\u540d\u7a3f\u4ef6"}`
    );

    const bodyText = [
      "\u3010\u6295\u7a3f\u4eba\u3011",
      draft.author.trim() || "\u672a\u586b\u5199",
      "",
      "\u3010\u6807\u7b7e\u3011",
      draft.tag.trim() || "\u672a\u586b\u5199",
      "",
      "\u3010\u8054\u7cfb\u65b9\u5f0f\u3011",
      draft.contact.trim() || "\u672a\u586b\u5199",
      "",
      "\u3010\u7a3f\u4ef6\u6b63\u6587\u3011",
      draft.content.trim() || "\u672a\u586b\u5199",
      "",
      "\u3010\u5907\u6ce8\u3011",
      "\u672c\u7a3f\u4ef6\u4ec5\u5728\u7ad9\u957f\u4eba\u5de5\u5ba1\u6838\u540e\u624d\u4f1a\u53d1\u5e03\u5230\u9759\u6001\u7ad9\u70b9\u3002",
    ].join("\n");

    const mailtoUrl = `mailto:${STORY_EMAIL}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailtoUrl;
    setHasTriggeredMail(true);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-12">
      <div className="glass-card-base p-5 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
              <Feather size={14} />
              STORY COLUMN
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">{"\u71d5\u5ddd\u6545\u4e8b\u00a0\u00b7\u00a0\u8f7b\u8bba\u575b\u4e13\u680f"}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
              {"\u6240\u6709\u7a3f\u4ef6\u5747\u4e3a\u524d\u7aef\u9759\u6001\u5c55\u793a\uff0c\u53ea\u901a\u8fc7\u201c\u90ae\u4ef6\u6295\u9012 + \u4eba\u5de5\u5ba1\u6838\u201d\u4e0a\u7ebf\u3002\u4e0d\u8bbe\u767b\u5f55\u3001\u4e0d\u8bbe\u7ad9\u5185\u53d1\u5e03\uff0c\u5b8c\u5168\u5408\u89c4\u3002"}
            </p>
          </div>

          <Link href="/" className="btn-secondary">
            {"\u8fd4\u56de\u6307\u6325\u4e2d\u5fc3"}
          </Link>
        </header>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-3 md:p-4">
          <div className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#7C3AED]">
            <Filter size={14} />
            TAG FILTER
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isActive = tag === activeTag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition md:text-sm ${
                    isActive
                      ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#4C1D95]"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#7C3AED]/40 hover:bg-white"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="story-waterfall mt-6">
          {filteredStories.map((story) => (
            <article
              key={story.id}
              className="story-waterfall-item card p-4 transition hover:-translate-y-1 hover:shadow-md md:p-5"
            >
              <div className="mb-3 flex items-center justify-between gap-2 text-xs text-[#7C3AED]">
                <span className="rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-2.5 py-1">{formatDate(story.date)}</span>
                <span className="text-gray-500">{story.author}</span>
              </div>

              <h2 className="font-heading text-lg font-semibold leading-7 text-[#4C1D95] md:text-xl">{story.title}</h2>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {story.tags.map((tag) => (
                  <span
                    key={`${story.id}-${tag}`}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700 md:text-[15px]">{story.body}</p>
            </article>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setIsModalOpen(true);
          setHasTriggeredMail(false);
        }}
        className="btn-primary fixed bottom-6 right-4 z-40 px-5 py-3 shadow-lg md:bottom-8 md:right-8"
      >
        <PenSquare size={16} />
        {"\u5199\u4fe1\u7ed9\u6bcd\u6e2f"}
      </button>

      {isModalOpen ? (
        <div className="mobile-modal-shell fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
          <button type="button"
            aria-label={"\u5173\u95ed\u6295\u7a3f\u7a97\u53e3"}
            tabIndex={-1}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm focus:outline-none"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="mobile-modal-panel safe-modal-panel relative z-10 w-full max-w-2xl rounded-3xl border border-[#7C3AED]/20 bg-white p-5 shadow-xl md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <h3 className="font-heading text-xl font-semibold text-[#4C1D95] md:text-2xl">{"\u6295\u7a3f\u6295\u9012\u8231"}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="关闭"
                tabIndex={0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2"
              >
                <X size={15} aria-hidden="true" />
                <span className="sr-only">关闭</span>
              </button>
            </div>

            <p className="text-sm leading-7 text-gray-600 md:text-base">
              {"\u6295\u7a3f\u4e0d\u4f1a\u5199\u5165\u4efb\u4f55\u6570\u636e\u5e93\u3002\u70b9\u51fb\u201c\u4ee5\u90ae\u4ef6\u6295\u9012\u201d\u540e\uff0c\u5c06\u8c03\u8d77\u672c\u5730\u90ae\u7bb1\u53d1\u9001\u7ed9\u7ad9\u957f\u3002\u7a3f\u4ef6\u4ec5\u5728\u5ba1\u6838\u5408\u89c4\u540e\u624d\u4f1a\u6536\u5f55\u3002"}
            </p>

            <form className="mt-4 space-y-3" onSubmit={submitByMail}>
              <input
                required
                aria-label="稿件标题"
                tabIndex={0}
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder={"\u6807\u9898\uff08\u4f8b\uff1a\u5927\u5b66\u907f\u5751\u6307\u5357\uff09"}
                className="input w-full"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  required
                  aria-label="作者"
                  tabIndex={0}
                  value={draft.author}
                  onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
                  placeholder={"\u4f5c\u8005\uff08\u59d3\u540d / \u5c4a\u522b\uff09"}
                  className="input w-full"
                />

                <select
                  value={draft.tag}
                  aria-label="选择标签"
                  tabIndex={0}
                  onChange={(event) => setDraft((prev) => ({ ...prev, tag: event.target.value }))}
                  className="input w-full"
                >
                  <option value="\u4e13\u4e1a\u771f\u76f8">{"\u4e13\u4e1a\u771f\u76f8"}</option>
                  <option value="\u907f\u5751\u6307\u5357">{"\u907f\u5751\u6307\u5357"}</option>
                  <option value="\u6821\u56ed\u56de\u5fc6">{"\u6821\u56ed\u56de\u5fc6"}</option>
                  <option value="\u9752\u6625\u5bc4\u8bed">{"\u9752\u6625\u5bc4\u8bed"}</option>
                </select>
              </div>

              <textarea
                required
                rows={7}
                aria-label="稿件正文"
                tabIndex={0}
                value={draft.content}
                onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
                placeholder={"\u8bf7\u8f93\u5165\u7a3f\u4ef6\u6b63\u6587"}
                className="input w-full resize-y"
              />

              <input
                value={draft.contact}
                aria-label="联系方式"
                tabIndex={0}
                onChange={(event) => setDraft((prev) => ({ ...prev, contact: event.target.value }))}
                placeholder={"\u8054\u7cfb\u65b9\u5f0f\uff08\u53ef\u9009\uff09"}
                className="input w-full"
              />

              <button type="submit"
                className="btn-primary w-full justify-center"
              >
                <Mail size={17} />
                {"\u4ee5\u90ae\u4ef6\u6295\u9012\u7ed9\u7ad9\u957f"}
              </button>
            </form>

            {hasTriggeredMail ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                {`\u5982\u679c\u672a\u6210\u529f\u5524\u8d77\u90ae\u4ef6\u5e94\u7528\uff0c\u8bf7\u5c06\u7a3f\u4ef6\u76f4\u63a5\u53d1\u9001\u81f3 ${STORY_EMAIL}\u3002\u6240\u6709\u7a3f\u4ef6\u5747\u4f1a\u7ecf\u7ad9\u957f\u4eba\u5de5\u5ba1\u6838\u540e\u518d\u5c55\u793a\u3002`}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
