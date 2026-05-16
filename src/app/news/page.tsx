export const revalidate = 60;

import Link from "next/link";
import { Newspaper, Calendar, ArrowRight } from "lucide-react";
import prisma from "@/lib/db";

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
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-6 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
              <Newspaper size={14} /> NEWS
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">新闻公告</h1>
            <p className="mt-2 text-sm leading-7 text-gray-700 md:text-base">
              学校动态、校友会公告与平台资讯
            </p>
          </div>
          <Link href="/" className="btn-secondary">
            返回首页
          </Link>
        </header>

        <div className="mt-8">
          {news.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center text-gray-500">
              暂无公告
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {news.map((item) => (
                <article key={item.id} className="card group p-5 transition hover:border-[#7C3AED]/30 hover:shadow-md hover:-translate-y-1">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-2.5 py-1 text-xs text-[#7C3AED]">
                    <Calendar size={12} />
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("zh-CN") : ""}
                  </div>
                  <h2 className="font-heading text-lg font-semibold text-[#4C1D95] transition group-hover:text-[#7C3AED]">{item.title}</h2>
                  {item.summary && <p className="mt-2 text-sm leading-6 text-gray-700 line-clamp-2">{item.summary}</p>}
                  <Link href={`/news/${item.id}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm text-[#7C3AED] transition hover:text-[#4C1D95] focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus:outline-none rounded"
                  >
                    阅读全文 <ArrowRight size={14} />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
