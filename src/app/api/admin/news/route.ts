import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser, requireAdmin } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";
import { isSafeArticleSourceUrl, isSafeLocalImagePath, normalizeOptionalText } from "@/lib/content-safety";
import { invalidateCachePrefix } from "@/lib/cache";
import { DEFAULT_NEWS_CATEGORY, DEFAULT_NEWS_VISIBILITY, isNewsCategory, isNewsContentFormat, isNewsVisibility } from "@/lib/news";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const visibility = searchParams.get("visibility");

    // 强校验分页参数，防御 NaN / 负数
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;

    const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
    const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    const where: { status?: string; category?: string; visibility?: string } = {};
    if (status && ["DRAFT", "PUBLISHED"].includes(status)) where.status = status;
    if (category && isNewsCategory(category)) where.category = category;
    if (visibility && isNewsVisibility(visibility)) where.visibility = visibility;

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.news.count({ where }),
    ]);

    return NextResponse.json({ news, total, limit, offset });
  } catch (error) {
    console.error("Admin news GET error:", error);
    return NextResponse.json({ error: "获取新闻列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const admin = await getAuthenticatedUser(req);
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await readJsonBody<{
      title?: unknown;
      summary?: unknown;
      content?: unknown;
      imageUrl?: unknown;
      category?: unknown;
      sourceName?: unknown;
      sourceUrl?: unknown;
      contentFormat?: unknown;
      status?: unknown;
      visibility?: unknown;
      publishedAt?: unknown;
    }>(req, 524288); // 512KB limit

    const title = normalizeOptionalText(body.title);
    const summary = normalizeOptionalText(body.summary);
    const content = normalizeOptionalText(body.content);
    const imageUrl = normalizeOptionalText(body.imageUrl);
    const category = normalizeOptionalText(body.category) || DEFAULT_NEWS_CATEGORY;
    const sourceName = normalizeOptionalText(body.sourceName);
    const sourceUrl = normalizeOptionalText(body.sourceUrl);
    const contentFormat = normalizeOptionalText(body.contentFormat) || "PLAIN";
    const status = normalizeOptionalText(body.status);
    const visibility = normalizeOptionalText(body.visibility) || DEFAULT_NEWS_VISIBILITY;

    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (title.length > 120) {
      return NextResponse.json({ error: "标题长度不超过120字" }, { status: 400 });
    }
    if (summary.length > 500) {
      return NextResponse.json({ error: "摘要长度不超过500字" }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: "正文不能为空" }, { status: 400 });
    }
    if (content.length > 20000) {
      return NextResponse.json({ error: "正文长度不超过20000字" }, { status: 400 });
    }
    if (imageUrl.length > 254) {
      return NextResponse.json({ error: "封面图片链接长度不超过254字" }, { status: 400 });
    }
    if (!isSafeLocalImagePath(imageUrl)) {
      return NextResponse.json({ error: "封面图片仅支持站内上传路径" }, { status: 400 });
    }
    if (!isNewsCategory(category)) {
      return NextResponse.json({ error: "无效的新闻分类" }, { status: 400 });
    }
    if (sourceName.length > 100) {
      return NextResponse.json({ error: "来源名称不超过100字" }, { status: 400 });
    }
    if (!isSafeArticleSourceUrl(sourceUrl)) {
      return NextResponse.json({ error: "原文链接仅支持微信公众号文章" }, { status: 400 });
    }
    if (!isNewsContentFormat(contentFormat)) {
      return NextResponse.json({ error: "无效的正文格式" }, { status: 400 });
    }
    if (status && !["DRAFT", "PUBLISHED"].includes(status)) {
      return NextResponse.json({ error: "无效的状态值" }, { status: 400 });
    }
    if (!isNewsVisibility(visibility)) {
      return NextResponse.json({ error: "无效的可见范围" }, { status: 400 });
    }

    let publishedAt = body.publishedAt ? new Date(String(body.publishedAt)) : null;
    if (publishedAt && Number.isNaN(publishedAt.getTime())) {
      return NextResponse.json({ error: "无效的发布时间" }, { status: 400 });
    }
    if (status === "PUBLISHED" && !publishedAt) {
      publishedAt = new Date();
    }

    const news = await prisma.$transaction(async (tx) => {
      const created = await tx.news.create({
        data: {
          title,
          summary: summary || null,
          content,
          imageUrl: imageUrl || null,
          category,
          sourceName: sourceName || null,
          sourceUrl: sourceUrl || null,
          contentFormat,
          status: status || "DRAFT",
          visibility,
          publishedAt,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "news-create",
          targetType: "News",
          targetId: created.id,
          adminId: admin.id,
          after: JSON.stringify({
            title: created.title,
            status: created.status,
            visibility: created.visibility,
            publishedAt: created.publishedAt,
          }),
        },
      });
      return created;
    });
    await invalidateCachePrefix("published:news:");

    return NextResponse.json({ news }, { status: 201 });
  } catch (error: any) {
    console.error("Admin news POST error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: "创建新闻失败" }, { status: 500 });
  }
}
