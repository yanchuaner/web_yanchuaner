export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Feather } from "lucide-react";
import { GlassCard } from "@/components/ui";

type StoryDetail = {
  id: string;
  title: string;
  author: string;
  tags: string[];
  body: string;
  date: string;
  status: string;
};

async function getStory(id: string) {
  try {
    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/stories/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.story as StoryDetail;
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
    <section className="mx-auto w-full max-w-3xl px-4 py-10 pb-32 md:px-8 md:py-12">
      <GlassCard className="p-6 md:p-8">
        <Link href="/alumni/stories" className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-fg transition-colors mb-6">
          <ArrowLeft size={16} />
          返回故事列表
        </Link>

        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs text-brand mb-4">
          <Feather size={14} />
          STORY COLUMN
        </div>

        <h1 className="font-heading text-2xl font-bold text-brand-fg md:text-3xl">{story.title}</h1>

        <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
          <span>{story.author}</span>
          <span>·</span>
          <span>{formatDate(story.date)}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {story.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
              #{tag}
            </span>
          ))}
        </div>

        <hr className="my-6 border-line" />

        <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700 md:text-[15px]">{story.body}</div>
      </GlassCard>
    </section>
  );
}
