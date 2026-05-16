import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { Camera, House, Landmark, LibraryBig, Mountain, Trees } from "lucide-react";
import memoryItemsData from "@/data/memoriesGallery.json";

export const metadata: Metadata = {
  title: "燕中记忆",
  description: "燕川中学校园风景、毕业合影与时代记录 — 燕中校友数字母港文化记忆展区",
};

type MemoryIcon = "house" | "landmark" | "library" | "mountain" | "trees" | "camera";

type MemoryItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imagePath: string;
  imageAlt?: string;
  icon: MemoryIcon;
};

type MemoryItemWithState = MemoryItem & {
  hasImage: boolean;
};

function hasPublicAsset(imagePath: string) {
  if (!imagePath.startsWith("/")) {
    return false;
  }

  const relativePath = imagePath.replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), "public", relativePath);
  return fs.existsSync(absolutePath);
}

function pickIcon(iconName: MemoryIcon) {
  if (iconName === "house") return House;
  if (iconName === "landmark") return Landmark;
  if (iconName === "library") return LibraryBig;
  if (iconName === "mountain") return Mountain;
  if (iconName === "trees") return Trees;
  return Camera;
}

const memoryItems: MemoryItemWithState[] = (memoryItemsData as MemoryItem[]).map((item) => ({
  ...item,
  hasImage: hasPublicAsset(item.imagePath),
}));

export default function AlumniMemoriesPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-12">
      <div className="glass-card-base p-5 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
              <Camera size={14} />
              MEMORY GALLERY
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">{"\u71d5\u4e2d\u8bb0\u5fc6\u00a0\u00b7\u00a0\u6587\u5316\u957f\u5eca"}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
              {"\u8fd9\u662f\u4e00\u4e2a\u7eaf\u9759\u6001\u6587\u5316\u5c55\u793a\u533a\uff0c\u7528\u4e8e\u5b58\u653e\u6821\u56ed\u98ce\u666f\u3001\u6bd5\u4e1a\u5408\u7167\uff08\u6253\u7801\u7248\uff09\u4e0e\u5e74\u4ee3\u8bb0\u5f55\u3002"}
            </p>
          </div>

          <Link href="/" className="btn-secondary">
            {"\u8fd4\u56de\u6307\u6325\u4e2d\u5fc3"}
          </Link>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {memoryItems.map((item) => {
            const Icon = pickIcon(item.icon);
            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden border-b border-gray-100 bg-[#F3E8FF]/30">
                  {item.hasImage ? (
                    <Image
                      src={item.imagePath}
                      alt={item.imageAlt || item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                    />
                  ) : null}

                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-80" />

                  {!item.hasImage ? (
                    <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs font-semibold tracking-[0.16em] text-[#7C3AED]/70">
                      {"IMAGE PENDING"}
                    </div>
                  ) : null}

                  <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-xs text-[#7C3AED] shadow-sm backdrop-blur-sm">
                    <Icon size={13} />
                    {item.subtitle}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/90 px-3 py-2 text-[11px] text-gray-700 shadow-sm backdrop-blur-sm">
                    {item.hasImage ? "\u5df2\u52a0\u8f7d\u5b9e\u9645\u56fe\u7247" : `\u5f85\u4e0a\u4f20\uff1a${item.imagePath}`}
                  </div>
                </div>

                <div className="p-4 md:p-5">
                  <h2 className="font-heading text-lg font-semibold text-[#4C1D95]">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">
          {"\u5408\u89c4\u63d0\u793a\uff1a\u672c\u5c55\u533a\u4ec5\u7528\u4e8e\u6587\u5316\u8bb0\u5fc6\u5c55\u793a\uff0c\u4e0d\u627f\u8f7d\u4efb\u4f55\u5b98\u65b9\u8ba4\u8bc1\u3001\u4eba\u8eab\u8bc1\u660e\u6216\u5546\u4e1a\u7528\u9014\u3002"}
        </div>
      </div>
    </section>
  );
}
