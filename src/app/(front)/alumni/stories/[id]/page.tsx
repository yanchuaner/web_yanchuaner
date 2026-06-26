export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ArrowLeft, Feather } from "lucide-react";
import { PageShell, GlassCard, ButtonLink } from "@/components/ui";
import prisma from "@/lib/db";

type StoryDetail = {
  id: string;
  title: string;
  author: string;
  tags: string[];
  body: string;
  date: string;
};

async function getStory(id: string): Promise<StoryDetail | null> {
  try {
    const story = await prisma.story.findUnique({
      where: { id, status: "PUBLISHED" },
      select: { id: true, title: true, author: true, tags: true, body: true, date: true },
    });
    if (!story) return null;
    let tags: string[] = [];
    try { tags = JSON.parse(story.tags || "[]"); } catch {}
    return { ...story, tags };
  } catch {
    return null;
  }
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${year}.${month}.${day}`;
}

export default async function StoryDetailPage({ params }: { params: { id: string } }) {
  const story = await getStory(params.id);
  if (!story) notFound();

  return (
    <PageShell size="narrow" className="pb-32">
      <GlassCard className="p-6 md:p-8">
        <ButtonLink href="/alumni/stories" variant="secondary" size="sm" className="mb-6">
          <ArrowLeft size={16} />
          返回故事列表
        </ButtonLink>

        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs text-brand mb-4">
          <Feather size={14} />
          STORY COLUMN
        </div>

        <h1 className="font-heading text-2xl font-bold text-brand-fg md:text-3xl">{story.title}</h1>

        <div className="mt-3 flex items-center gap-3 text-sm text-brand-fg/50">
          <span>{story.author || '匿名校友'}</span>
          <span>·</span>
          <span>{formatDate(story.date)}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {story.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs text-accent">
              #{tag}
            </span>
          ))}
        </div>

        <hr className="my-6 border-line" />

        <div className="whitespace-pre-wrap text-sm leading-7 text-brand-fg/80 md:text-[15px]">{story.body}</div>
      </GlassCard>
    </PageShell>
  );
}
