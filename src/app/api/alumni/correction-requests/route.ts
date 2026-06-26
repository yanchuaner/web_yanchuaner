import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { requireVerifiedAlumni } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;
  const ip = getClientIp(req);
  const limit = await rateLimit(`correction:${ip}`, 5, 5 * 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "提交过于频繁，请稍后再试" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  let formData: FormData;
  try { formData = await req.formData(); } catch { return NextResponse.json({ error: "请求格式错误" }, { status: 400 }); }

  try {
    const honeypot = formData.get("website");
    if (honeypot && typeof honeypot === "string" && honeypot.trim().length > 0) return NextResponse.json({ success: true });

    const rosterId = ((formData.get("rosterId") as string) || "").trim();
    if (!rosterId) return NextResponse.json({ error: "请选择要修改的校友" }, { status: 400 });

    const roster = await prisma.whitelistRoster.findUnique({ where: { id: rosterId } });
    if (!roster) return NextResponse.json({ error: "校友不存在" }, { status: 404 });

    const contact = ((formData.get("contact") as string) || "").trim();
    if (!contact || contact.length > 128) return NextResponse.json({ error: "请填写联系方式（不超过128字）" }, { status: 400 });

    const reason = ((formData.get("reason") as string) || "").trim();
    if (!reason || reason.length < 5 || reason.length > 1000) return NextResponse.json({ error: "修改说明至少5字，不超过1000字" }, { status: 400 });

    const stringField = (key: string, maxLen: number) => {
      const v = ((formData.get(key) as string) || "").trim();
      if (!v) return null;
      if (v.length > maxLen) throw new Error(`${key} 不超过${maxLen}字`);
      return v;
    };

    let requestedName: string | null = null;
    let requestedGraduationClass: string | null = null;
    let requestedClassName: string | null = null;
    let requestedCity: string | null = null;
    let requestedUniversity: string | null = null;
    let requestedMajor: string | null = null;
    let requestedIndustry: string | null = null;
    let requestedContact: string | null = null;

    try {
      requestedName = stringField("requestedName", 50);
      requestedGraduationClass = stringField("requestedGraduationClass", 50);
      requestedClassName = stringField("requestedClassName", 64);
      requestedCity = stringField("requestedCity", 100);
      requestedUniversity = stringField("requestedUniversity", 150);
      requestedMajor = stringField("requestedMajor", 100);
      requestedIndustry = stringField("requestedIndustry", 100);
      requestedContact = stringField("requestedContact", 128);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // 至少有一项修改
    if (!requestedName && !requestedGraduationClass && !requestedClassName &&
        !requestedCity && !requestedUniversity && !requestedMajor && !requestedIndustry && !requestedContact) {
      return NextResponse.json({ error: "请至少填写一项要修改的内容" }, { status: 400 });
    }

    // 检查是否与当前值不同
    const hasDiff =
      (requestedName && requestedName !== roster.name) ||
      (requestedGraduationClass && requestedGraduationClass !== (roster.graduationClass || "")) ||
      (requestedClassName && requestedClassName !== (roster.className || "")) ||
      (requestedCity && requestedCity !== (roster.city || "")) ||
      (requestedUniversity && requestedUniversity !== (roster.university || "")) ||
      (requestedMajor && requestedMajor !== (roster.major || "")) ||
      (requestedIndustry && requestedIndustry !== (roster.industry || "")) ||
      (requestedContact && requestedContact !== (roster.contact || ""));

    if (!hasDiff) return NextResponse.json({ error: "修改内容与当前信息相同，请检查后重新提交" }, { status: 400 });

    // 计算 currentTags 字符串（兼容旧字段）
    const currentTagsStr = [roster.university, roster.major, roster.city].filter(Boolean).join(' | ');

    await prisma.alumniCorrectionRequest.create({
      data: {
        rosterId,
        currentName: roster.name,
        currentGraduationClass: roster.graduationClass,
        currentClassName: roster.className,
        currentTags: currentTagsStr || null,
        requestedName,
        requestedGraduationClass,
        requestedClassName,
        requestedCity,
        requestedUniversity,
        requestedMajor,
        requestedIndustry,
        requestedContact,
        contact,
        reason,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Correction request error:", error);
    return NextResponse.json({ error: "提交失败，请稍后重试" }, { status: 500 });
  }
}
