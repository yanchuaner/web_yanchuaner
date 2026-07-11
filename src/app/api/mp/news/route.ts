import { NextRequest } from "next/server";
import { authenticateMpRequest } from "@/lib/mp-auth";
import { MP_ERROR_CODES, mpError, mpSuccess } from "@/lib/mp-api";
import { parseMpPagination, toMpPagination } from "@/lib/mp-pagination";
import { listPublishedNews } from "@/lib/published-content";

export async function GET(req: NextRequest) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const { page, pageSize } = parseMpPagination(
      new URL(req.url).searchParams,
    );
    const { items, total } = await listPublishedNews(page, pageSize);

    return mpSuccess({
      items: items.map((item) => ({
        ...item,
        publishedAt: item.publishedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
      pagination: toMpPagination(page, pageSize, total),
    });
  } catch {
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "新闻列表加载失败，请稍后再试",
      500,
    );
  }
}
