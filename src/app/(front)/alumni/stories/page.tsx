"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Feather, Filter, PenSquare } from "lucide-react";
import { PageShell, GlassCard, ButtonLink, EmptyState, ResponsiveTabs } from "@/components/ui";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

type StoryRecord = {
  id: string;
  title: string;
  author: string;
  tags: string[];
  body: string;
  date: string;
};

const ALL_TAG = "__all__";
const storyTagKeys: Record<string, string> = {
  "专业真相": "storiesPage.tags.major",
  "避坑指南": "storiesPage.tags.guide",
  "校园回忆": "storiesPage.tags.campus",
  "青春寄语": "storiesPage.tags.message",
};

function formatDate(isoDate: string) {
  const [year = "", month = "", day = ""] = isoDate.split("-");
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${year}.${month}.${day}`;
}

export default function AlumniStoriesPage() {
  const { t } = useThemeAndLocale();
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [activeTag, setActiveTag] = useState(ALL_TAG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/stories")
      .then((response) => response.json())
      .then((data) => {
        setStories(data.stories || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const story of stories) {
      for (const tag of story.tags) {
        tagSet.add(tag);
      }
    }
    return [ALL_TAG, ...Array.from(tagSet)];
  }, [stories]);

  const filteredStories = useMemo(() => {
    if (activeTag === ALL_TAG) {
      return stories;
    }
    return stories.filter((story) => story.tags.includes(activeTag));
  }, [activeTag, stories]);

  return (
    <PageShell size="wide">
      <GlassCard className="p-5 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-brand/10 px-3 py-1 text-xs tracking-[0.18em] text-brand">
              <Feather size={14} aria-hidden="true" />
              {t("storiesPage.eyebrow")}
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-brand-fg md:text-4xl">
              {t("storiesPage.title")}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-fg/70 md:text-base">
              {t("storiesPage.description")}
            </p>
          </div>

          <ButtonLink href="/" variant="secondary">
            {t("storiesPage.homeAction")}
          </ButtonLink>
        </header>

        <div className="mt-5 flex flex-col gap-3 border-y border-line py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <PenSquare size={15} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-brand-fg">{t("storiesPage.submitHintTitle")}</p>
              <p className="mt-1 text-xs leading-5 text-brand-fg/60">{t("storiesPage.submitHintDescription")}</p>
            </div>
          </div>
          <ButtonLink href="/me/submit" variant="secondary" size="sm" className="shrink-0 self-start sm:self-auto">
            {t("storiesPage.submitHintAction")}
          </ButtonLink>
        </div>

        <div className="mt-6 rounded-card border border-line bg-surface/30 p-3 md:p-4">
          <div className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand">
            <Filter size={14} aria-hidden="true" />
            {t("storiesPage.filterLabel")}
          </div>
          <ResponsiveTabs
            tabs={allTags.map((tag) => ({
              id: tag,
              label: tag === ALL_TAG ? t("storiesPage.allTags") : storyTagKeys[tag] ? t(storyTagKeys[tag]) : tag,
            }))}
            activeTab={activeTag}
            onChange={setActiveTag}
            className="mb-1 border-none"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-brand-fg/60">{t("common.loading")}</div>
        ) : (
          <div className="story-waterfall mt-6">
            {filteredStories.length === 0 ? (
              <EmptyState
                icon={Feather}
                title={
                  activeTag === ALL_TAG
                    ? t("storiesPage.emptyTitle")
                    : `${t("storiesPage.noTagPrefix")} "${storyTagKeys[activeTag] ? t(storyTagKeys[activeTag]) : activeTag}"`
                }
                description={t("storiesPage.emptyDescription")}
              />
            ) : (
              filteredStories.map((story) => (
                <article
                  key={story.id}
                  className="story-waterfall-item rounded-card border border-line bg-surface/40 p-4 backdrop-blur-md transition hover:-translate-y-1 hover:bg-surface/60 hover:shadow-md md:p-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-2 text-xs">
                    <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 font-medium text-brand">
                      {formatDate(story.date)}
                    </span>
                    <span className="text-brand-fg/50">{story.author || t("storiesPage.anonymous")}</span>
                  </div>

                  <h2 className="font-heading text-lg font-semibold leading-7 text-brand md:text-xl">{story.title}</h2>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {story.tags.map((tag) => (
                      <span
                        key={`${story.id}-${tag}`}
                        className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs text-accent"
                      >
                        #{storyTagKeys[tag] ? t(storyTagKeys[tag]) : tag}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-brand-fg/70">{story.body.slice(0, 150)}……</p>
                  <div className="mt-3 text-right">
                    <Link
                      href={`/alumni/stories/${story.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/20"
                    >
                      {t("storiesPage.readAction")} <span className="text-[10px]">→</span>
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </GlassCard>
    </PageShell>
  );
}
