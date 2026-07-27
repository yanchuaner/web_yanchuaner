import type { Metadata } from "next";
import Image from "next/image";
import { Camera, House, Landmark, LibraryBig, Mountain, Trees } from "lucide-react";
import prisma from "@/lib/db";
import fs from "node:fs";
import path from "node:path";
import { PageShell, GlassCard, EmptyState, ButtonLink } from "@/components/ui";
import { LocalizedText } from "@/components/LocalizedText";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "燕中记忆 | Yan-Zhong Memories",
  description: "燕川中学校园风景、毕业合影与时代记录 — 燕中校友数字母港文化记忆展区",
};

type MemoryIcon = "house" | "landmark" | "library" | "mountain" | "trees" | "camera";

type MemoryItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imagePath: string;
  imageAlt: string;
  icon: MemoryIcon;
  hasImage: boolean;
};

function pickIcon(iconName: MemoryIcon) {
  if (iconName === "house") return House;
  if (iconName === "landmark") return Landmark;
  if (iconName === "library") return LibraryBig;
  if (iconName === "mountain") return Mountain;
  if (iconName === "trees") return Trees;
  return Camera;
}

async function getMemories(): Promise<MemoryItem[]> {
  try {
    const items = await prisma.memoryItem.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return items.map((item) => {
      let hasImage = false;
      if (item.imagePath && item.imagePath.startsWith('/')) {
        const absPath = path.join(process.cwd(), 'public', item.imagePath.replace(/^\/+/, ''));
        hasImage = fs.existsSync(absPath);
      }
      return { ...item, hasImage, icon: item.icon as MemoryIcon };
    });
  } catch {
    return [];
  }
}

export default async function AlumniMemoriesPage() {
  const memoryItems = await getMemories();

  return (
    <PageShell size="wide">
      <GlassCard className="p-5 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-brand/10 px-3 py-1 text-xs text-brand">
              <Camera size={14} />
              <LocalizedText translationKey="contentPages.memories.eyebrow" />
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-brand-fg md:text-4xl"><LocalizedText translationKey="contentPages.memories.title" /></h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-fg/70 md:text-base">
              <LocalizedText translationKey="contentPages.memories.description" />
            </p>
          </div>

          <ButtonLink href="/" variant="secondary">
            <LocalizedText translationKey="contentPages.memories.back" />
          </ButtonLink>
        </header>

        {memoryItems.length === 0 ? (
          <EmptyState
            icon={Camera}
            title={<LocalizedText translationKey="contentPages.memories.empty" />}
            description={<LocalizedText translationKey="contentPages.memories.emptyDescription" />}
            className="mt-8"
          />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {memoryItems.map((item) => {
              const Icon = pickIcon(item.icon as MemoryIcon);
              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-card border border-line bg-surface/40 backdrop-blur-md transition hover:-translate-y-1 hover:bg-surface/60 hover:shadow-md"
                >
                  <div className="relative aspect-video overflow-hidden border-b border-line bg-brand/5">
                    {item.hasImage ? (
                      <Image
                        src={item.imagePath}
                        alt={item.imageAlt || item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                      />
                    ) : null}

                    <div className="absolute inset-0 bg-gradient-to-t from-overlay/60 via-transparent to-transparent opacity-80" />

                    {!item.hasImage ? (
                      <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs font-semibold text-brand/70">
                        <LocalizedText translationKey="contentPages.memories.imagePending" />
                      </div>
                    ) : null}

                    <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-2.5 py-1 text-xs text-brand shadow-sm backdrop-blur-sm">
                      <Icon size={13} />
                      {item.subtitle}
                    </div>

                    {!item.hasImage && (
                      <div className="absolute bottom-3 left-3 right-3 rounded-btn border border-line bg-surface/90 px-3 py-2 text-[11px] text-brand-fg/50 shadow-sm backdrop-blur-sm">
                        <LocalizedText translationKey="contentPages.memories.noImage" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 md:p-5">
                    <h2 className="font-heading text-lg font-semibold text-brand">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-brand-fg/70">{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </GlassCard>
    </PageShell>
  );
}
