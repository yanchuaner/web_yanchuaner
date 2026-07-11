import { NextRequest } from "next/server";
import { authenticateMpRequest } from "@/lib/mp-auth";
import { MP_ERROR_CODES, mpError, mpSuccess } from "@/lib/mp-api";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";
import { getPublishedNews } from "@/lib/published-content";

export async function GET(
  req: NextRequest,
  { params }: { params: IdRouteParams },
) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const id = await getRouteId(params);
    const news = await getPublishedNews(id);
    if (!news) {
      return mpError(MP_ERROR_CODES.NOT_FOUND, "新闻不存在", 404);
    }
    return mpSuccess({
      news: {
        ...news,
        publishedAt: news.publishedAt?.toISOString() ?? null,
        createdAt: news.createdAt.toISOString(),
        updatedAt: news.updatedAt.toISOString(),
      },
    });
  } catch {
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "新闻详情加载失败，请稍后再试",
      500,
    );
  }
}
