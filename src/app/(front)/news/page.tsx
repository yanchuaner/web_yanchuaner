export const revalidate = 60;

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Newspaper } from "lucide-react";
import { EmptyState, PageHeader, PageShell } from "@/components/ui";
import { LocalizedDate } from "@/components/LocalizedDate";
import { LocalizedText } from "@/components/LocalizedText";
import { getPageUser } from "@/lib/admin-auth";
import { canViewMemberNews, getNewsCategory, isPreoptimizedNewsImage, NEWS_CATEGORIES } from "@/lib/news";
import { listPublishedNews } from "@/lib/published-content";

export const metadata: Metadata = {
  title: "燕中资讯",
  description: "燕川中学校友会动态、在校生指南、校园记忆、校友故事与师长声音",
};

export default async function NewsPage() {
  const user = await getPageUser();
  const { items: news } = await listPublishedNews(1, 100, { includeMember: canViewMemberNews(user) });
  const groups = NEWS_CATEGORIES.map((category) => ({
    ...category,
    items: news.filter((item) => getNewsCategory(item.category).value === category.value),
  })).filter((group) => group.items.length > 0);

  return (
    <PageShell size="wide">
      <header className="border-b border-line pb-7">
        <PageHeader
          eyebrow="YANCHUAN STORIES"
          eyebrowIcon={Newspaper}
          title={<LocalizedText translationKey="contentPages.news.title" />}
          description={<LocalizedText translationKey="contentPages.news.description" />}
        />
        {groups.length > 1 ? (
          <nav aria-label="News categories" className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {groups.map((group) => (
              <a key={group.value} href={`#${group.value.toLowerCase()}`} className="min-h-10 shrink-0 rounded-btn border border-line bg-surface/55 px-3 py-2 text-sm text-main/65 transition hover:border-brand/35 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <LocalizedText translationKey={group.labelKey} />
                <span className="ml-1.5 text-xs text-main/40">{group.items.length}</span>
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      {news.length === 0 ? (
        <EmptyState className="mt-8" title={<LocalizedText translationKey="contentPages.news.empty" />} />
      ) : (
        <div className="space-y-12 py-8">
          {groups.map((group) => (
            <section key={group.value} id={group.value.toLowerCase()} className="scroll-mt-24">
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="font-heading text-xl font-semibold text-main md:text-2xl"><LocalizedText translationKey={group.labelKey} /></h2>
                <span className="text-xs text-main/45">{group.items.length} <LocalizedText translationKey="contentPages.news.articles" /></span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => (
                  <article key={item.id} className="group flex min-h-full flex-col overflow-hidden rounded-card border border-line bg-surface/45 transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:bg-surface/70 hover:shadow-md">
                    {item.imageUrl ? (
                      <Link href={`/news/${item.id}`} className="relative block aspect-video overflow-hidden border-b border-line bg-surface-muted">
                        <Image src={item.imageUrl} alt={item.title} fill unoptimized={isPreoptimizedNewsImage(item.imageUrl)} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                      </Link>
                    ) : null}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs text-main/45">
                        <Calendar size={13} />
                        {item.publishedAt ? <LocalizedDate value={item.publishedAt} /> : null}
                      </div>
                      <h3 className="font-heading text-lg font-semibold leading-7 text-main">
                        <Link href={`/news/${item.id}`} className="transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">{item.title}</Link>
                      </h3>
                      {item.summary ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-main/60">{item.summary}</p> : null}
                      <Link href={`/news/${item.id}`} className="mt-auto inline-flex min-h-10 items-center gap-1.5 pt-4 text-sm font-medium text-brand transition group-hover:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                        <LocalizedText translationKey="contentPages.news.readAction" /> <ArrowRight size={15} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
