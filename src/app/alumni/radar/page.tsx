"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Search, UsersRound } from "lucide-react";
import AlumniSearch from "@/components/AlumniSearch";

/** Shape returned by /api/alumni/search */
interface SearchResultItem {
  id: string;
  name: string;
  graduationClass: string;
  tags: string;
  university: string;
  major: string;
  city: string;
}

const CORE_MEMBERS = new Set([
  "\u9ec4\u6e58\u6797",
  "\u5de6\u4f73\u7ef4",
  "\u5f20\u6b63\u670b",
  "\u5434\u6850",
  "\u6768\u83c1",
  "\u8d56\u76c8\u71d5",
  "\u6731\u56fd\u9707",
  "\u5f20\u4e00\u9e23",
]);

function safeMeta(value?: string) {
  const text = (value || "").trim();
  return text || "\u5f85\u5b8c\u5584";
}

function maskName(name: string) {
  const chars = Array.from(name.trim());

  if (chars.length === 0) {
    return "*";
  }

  if (chars.length === 1) {
    return `${chars[0]}*`;
  }

  if (chars.length === 2) {
    return `${chars[0]}*`;
  }

  if (chars.length === 3) {
    return `${chars[0]}*${chars[2]}`;
  }

  return `${chars[0]}**${chars[chars.length - 1]}`;
}

function parseIdentity(record: SearchResultItem) {
  if (CORE_MEMBERS.has(record.name)) {
    return {
      label: "\u6781\u5149\u84dd \u00b7 \u9aa8\u5e72",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  return {
    label: "\u661f\u6e2f\u6210\u5458",
    className: "border-purple-200 bg-purple-50 text-purple-700",
  };
}

export default function AlumniRadarPage() {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [scannedKeyword, setScannedKeyword] = useState("");

  const statusText = (() => {
    if (!scannedKeyword.trim()) {
      return "\u8f93\u5165\u59d3\u540d\u3001\u73ed\u7ea7\u3001\u5927\u5b66\u3001\u4e13\u4e1a\u6216\u57ce\u5e02\uff0c\u5f00\u542f\u661f\u7a7a\u901a\u8baf\u5f55\u68c0\u7d22\u3002";
    }

    if (loading) {
      return "\u6b63\u5728\u68c0\u7d22\u4e2d...";
    }

    if (results.length === 0) {
      return "\u672a\u627e\u5230\u5339\u914d\u7ed3\u679c\uff0c\u8bf7\u5c1d\u8bd5\u66f4\u77ed\u5173\u952e\u8bcd\u6216\u7ec4\u5408\u641c\u7d22\u3002";
    }

    return `\u5df2\u5b8c\u6210\u591a\u7ef4\u626b\u63cf\uff1a${results.length} \u4f4d\u6821\u53cb\u4e0e\u5173\u952e\u8bcd\u201c${scannedKeyword}\u201d\u5339\u914d\u3002`;
  })();

  const handleScan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = keyword.trim();
    setScannedKeyword(q);

    if (!q) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/alumni/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults((data.results || []) as SearchResultItem[]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-5 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#7C3AED]/80">STAR DIRECTORY</p>
            <h1 className="font-heading mt-2 text-3xl font-bold text-[#4C1D95] md:text-4xl">{"\u661f\u7a7a\u901a\u8baf\u5f55\u00a0/\u00a0\u591a\u7ef4\u68c0\u7d22\u5f15\u64ce"}</h1>
          </div>
          <Link href="/" className="btn-secondary">
            {"\u8fd4\u56de\u9996\u9875"}
          </Link>
        </div>

        <p className="mt-3 text-sm leading-6 text-gray-700 md:text-base">
          {"该模块仅用于前端信息匹配与联系线索展示，不提供数据导出功能。"}
        </p>

        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#7C3AED]/60">白名单智能检索</p>
          <AlumniSearch />
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-500">服务端多维检索</p>
        <form onSubmit={handleScan} className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={keyword}
            aria-label="多维检索引擎"
            tabIndex={0}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="\u4f8b\uff1a\u5f20\u4e00\u9e23 / 2022\u7ea73\u73ed / \u6df1\u5733 / \u8ba1\u7b97\u673a"
            className="input w-full"
          />
          <button type="submit"
            aria-label="开启通讯录扫描"
            tabIndex={0}
            disabled={loading}
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold"
          >
            <Search size={18} />
            {loading ? "\u641c\u7d22\u4e2d..." : "\u5f00\u542f\u901a\u8baf\u5f55\u626b\u63cf"}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-[#7C3AED]/20 bg-[#FAF5FF] px-4 py-3 text-sm text-[#4C1D95] md:text-base">
          {statusText}
        </div>

        <p className="mt-3 text-xs leading-6 text-gray-500 md:text-sm">
          {"合规说明：该通讯录仅提供匹配参考，不代表任何官方认证或身份证明效力。"}
        </p>
        </div>

        {results.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((record) => {
              const identity = parseIdentity(record);
              return (
                <article
                  key={record.id}
                  className="card p-4 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs text-[#7C3AED]">
                    <UsersRound size={13} />
                    {"\u5df2\u5bf9\u63a5"}
                  </div>

                  <div className="mt-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${identity.className}`}>
                      {identity.label}
                    </span>
                  </div>

                  <p className="font-heading mt-3 text-xl font-semibold tracking-wide text-[#4C1D95]">{maskName(record.name)}</p>
                  <p className="mt-1 text-sm text-gray-600">{record.graduationClass}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                      {`\ud83d\udccd ${safeMeta(record.city)}`}
                    </span>
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
                      {`\ud83c\udfdb\ufe0f ${safeMeta(record.university)}`}
                    </span>
                    <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs text-purple-700">
                      {`\ud83d\udcbb ${safeMeta(record.major)}`}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
