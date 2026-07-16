export const revalidate = 60;

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Newspaper, Calendar, ArrowRight } from "lucide-react";
import prisma from "@/lib/db";
import { PageShell, GlassCard, PageHeader, ButtonLink, EmptyState } from "@/components/ui";
import { LocalizedText } from "@/components/LocalizedText";
import { LocalizedDate } from "@/components/LocalizedDate";

export const metadata: Metadata = {
  title: "新闻公告",
  description: "燕川中学校友会新闻公告 — 了解母校与校友会的最新动态与通知",
};

export default async function NewsPage() {
  const news = await prisma.news.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      imageUrl: true,
      publishedAt: true,
    },
  });

  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="NEWS"
          eyebrowIcon={Newspaper}
          title={<LocalizedText translationKey="contentPages.news.title" />}
          description={<LocalizedText translationKey="contentPages.news.description" />}
          action={<ButtonLink href="/" variant="secondary"><LocalizedText translationKey="common.backHome" /></ButtonLink>}
        />

        <div className="mt-8">
          {news.length === 0 ? (
            <EmptyState title={<LocalizedText translationKey="contentPages.news.empty" />} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {news.map((item) => (
                <GlassCard key={item.id} as="article" className="p-5">
                  {item.imageUrl ? (
                    <div className="relative -mx-5 -mt-5 mb-4 aspect-video overflow-hidden border-b border-line">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-xs text-brand">
                    <Calendar size={12} />
                    {item.publishedAt ? <LocalizedDate value={item.publishedAt} /> : ""}
                  </div>
                  <h2 className="font-heading text-lg font-semibold text-brand-fg transition group-hover/card:text-brand">{item.title}</h2>
                  {item.summary && <p className="mt-2 text-sm leading-6 text-main/60 line-clamp-2">{item.summary}</p>}
                  <Link href={`/news/${item.id}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm text-brand transition hover:text-brand-fg focus-visible:ring-2 focus-visible:ring-brand focus:outline-none rounded"
                  >
                    <LocalizedText translationKey="contentPages.news.readAction" /> <ArrowRight size={14} />
                  </Link>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </PageShell>
  );
}
