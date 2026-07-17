"use client";

import Link from "next/link";
import NextImage from "next/image";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, IdCard, ImagePlus, Rocket, X } from "lucide-react";
import { PageShell } from "@/components/ui";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import { themeRgb } from "@/lib/theme-color";
import { toast } from "sonner";

const CANVAS_WIDTH = 2752;
const CANVAS_HEIGHT = 1548;
const PANEL_LEFT = 1740;
const PANEL_RIGHT = 2427;
const PANEL_CENTER_X = Math.round((PANEL_LEFT + PANEL_RIGHT) / 2);
const FALLBACK_CERTIFICATE_NO = "YC-ALUM-PENDING";
const YC_LOGO_SUBTEXT = "YANCHUAN ALUMNI MEMORIAL";
const AVATAR_CENTER_Y = 430;
const AVATAR_RADIUS = 170;

type ParsedClass = {
  year: string;
  classNo: string;
  compact: string;
};

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image not found"));
    img.src = src;
  });
}

function drawDefaultAvatarPlaceholder(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
  const gradient = context.createRadialGradient(centerX - radius * 0.2, centerY - radius * 0.3, radius * 0.25, centerX, centerY, radius);
  gradient.addColorStop(0, themeRgb("--brand-soft-rgb", 0.9));
  gradient.addColorStop(0.5, themeRgb("--brand-rgb", 0.9));
  gradient.addColorStop(1, themeRgb("--surface-strong-rgb", 0.95));

  context.fillStyle = gradient;
  context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  context.strokeStyle = themeRgb("--on-brand-rgb", 0.85);
  context.lineWidth = 10;
  context.beginPath();
  context.arc(centerX, centerY - radius * 0.18, radius * 0.28, 0, Math.PI * 2);
  context.stroke();

  context.beginPath();
  context.arc(centerX, centerY + radius * 0.42, radius * 0.5, Math.PI * 1.05, Math.PI * 1.95);
  context.stroke();

  context.fillStyle = themeRgb("--on-brand-rgb", 0.92);
  context.font = "700 54px 'JetBrains Mono', 'Noto Sans Mono', monospace";
  context.textAlign = "center";
  context.fillText("YC", centerX, centerY + radius * 0.75);
}

function drawCyberAvatarRing(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
  context.save();

  context.strokeStyle = themeRgb("--brand-rgb", 0.95);
  context.lineWidth = 8;
  context.shadowColor = themeRgb("--brand-soft-rgb", 0.8);
  context.shadowBlur = 26;
  context.beginPath();
  context.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
  context.stroke();

  context.shadowBlur = 0;
  context.strokeStyle = themeRgb("--brand-soft-rgb", 0.85);
  context.lineWidth = 3;
  context.beginPath();
  context.arc(centerX, centerY, radius + 24, 0, Math.PI * 2);
  context.stroke();

  for (let i = 0; i < 36; i += 1) {
    const angle = (Math.PI * 2 * i) / 36;
    const tickStart = radius + 24;
    const tickLength = i % 3 === 0 ? 18 : 10;
    const x1 = centerX + Math.cos(angle) * tickStart;
    const y1 = centerY + Math.sin(angle) * tickStart;
    const x2 = centerX + Math.cos(angle) * (tickStart + tickLength);
    const y2 = centerY + Math.sin(angle) * (tickStart + tickLength);

    context.strokeStyle = themeRgb(i % 3 === 0 ? "--brand-rgb" : "--brand-soft-rgb", i % 3 === 0 ? 0.95 : 0.7);
    context.lineWidth = i % 3 === 0 ? 3 : 2;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }

  context.restore();
}

async function drawAvatarArea(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  avatarSource: string
) {
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.clip();

  if (avatarSource) {
    try {
      const avatarImage = await loadCanvasImage(avatarSource);
      const cropSide = Math.min(avatarImage.width, avatarImage.height);
      const cropX = Math.max(0, (avatarImage.width - cropSide) / 2);
      const cropY = Math.max(0, (avatarImage.height - cropSide) / 2);
      context.drawImage(avatarImage, cropX, cropY, cropSide, cropSide, centerX - radius, centerY - radius, radius * 2, radius * 2);
    } catch {
      drawDefaultAvatarPlaceholder(context, centerX, centerY, radius);
    }
  } else {
    drawDefaultAvatarPlaceholder(context, centerX, centerY, radius);
  }

  context.restore();
  drawCyberAvatarRing(context, centerX, centerY, radius);
}

function normalizeYear(raw: string) {
  const source = raw.replace(/\s+/g, "");
  if (source.includes("高三")) {
    return "2022";
  }
  if (source.includes("高二")) {
    return "2024";
  }
  if (source.includes("高一")) {
    return "2025";
  }

  const fullYear = source.match(/(20\d{2})\s*级?/);
  if (fullYear) {
    return fullYear[1];
  }

  const shortYear = source.match(/(^|\D)(\d{2})\s*级/);
  if (shortYear) {
    return `20${shortYear[2]}`;
  }

  return "";
}

function normalizeClassNo(raw: string) {
  const source = raw.replace(/\s+/g, "");
  const explicitClass = source.match(/[（(]?(\d{1,2})[）)]?班/);
  if (explicitClass) {
    return String(Number(explicitClass[1]));
  }
  return "";
}

function parseClassText(raw: string): ParsedClass {
  const compact = raw.replace(/[\s（()）【】\[\]{}<>《》,，、._-]/g, "").toLowerCase();
  return {
    year: normalizeYear(raw),
    classNo: normalizeClassNo(raw),
    compact,
  };
}

function isClassMatch(inputClass: string, standardClass: string) {
  const input = parseClassText(inputClass);
  const standard = parseClassText(standardClass);

  if (!input.compact || !standard.compact) {
    return false;
  }

  if (input.year && input.classNo && standard.year && standard.classNo) {
    return input.year === standard.year && input.classNo === standard.classNo;
  }

  if (input.classNo && standard.classNo && input.classNo === standard.classNo) {
    if (!input.year || !standard.year) {
      return true;
    }
    if (input.year === standard.year) {
      return true;
    }
  }

  return standard.compact.includes(input.compact) || input.compact.includes(standard.compact);
}

const CORE_MEMBERS = ["黄湘林", "左佳维", "张正朋", "吴桐", "杨菁", "赖盈燕", "朱国震", "张一鸣"];

function getHonorLevel(name: string): "core" | null {
  if (CORE_MEMBERS.includes(name)) {
    return "core";
  }
  return null;
}

function drawHonorBadge(context: CanvasRenderingContext2D, type: "founder" | "core", label: string) {
  context.save();
  const badgeX = PANEL_RIGHT - 180;
  const badgeY = 180;
  const size = 65;

  if (type === "founder") {
    context.beginPath();
    context.arc(badgeX, badgeY, size + 20, 0, Math.PI * 2);
    context.strokeStyle = themeRgb("--warning-rgb", 0.4);
    context.lineWidth = 4;
    context.stroke();

    context.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = badgeX + Math.cos(angle) * size;
        const y = badgeY + Math.sin(angle) * size;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
    }
    context.closePath();

    const grad = context.createLinearGradient(badgeX, badgeY - size, badgeX, badgeY + size);
    grad.addColorStop(0, themeRgb("--warning-rgb", 0.7));
    grad.addColorStop(1, themeRgb("--warning-rgb"));

    context.fillStyle = grad;
    context.shadowColor = themeRgb("--warning-rgb", 0.6);
    context.shadowBlur = 20;
    context.fill();

    context.strokeStyle = themeRgb("--on-brand-rgb", 0.75);
    context.lineWidth = 4;
    context.stroke();

    context.shadowBlur = 0;
    context.fillStyle = themeRgb("--overlay-rgb", 0.9);
    context.font = "800 22px 'JetBrains Mono', 'Noto Sans Mono', monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, badgeX, badgeY + 2);

  } else if (type === "core") {
    context.beginPath();
    context.arc(badgeX, badgeY, size + 15, 0, Math.PI * 2);
    context.strokeStyle = themeRgb("--brand-rgb", 0.4);
    context.lineWidth = 4;
    context.stroke();

    context.beginPath();
    context.arc(badgeX, badgeY, size, 0, Math.PI * 2);

    const grad = context.createLinearGradient(badgeX, badgeY - size, badgeX, badgeY + size);
    grad.addColorStop(0, themeRgb("--brand-soft-rgb"));
    grad.addColorStop(1, themeRgb("--brand-rgb"));

    context.fillStyle = grad;
    context.shadowColor = themeRgb("--brand-rgb", 0.6);
    context.shadowBlur = 20;
    context.fill();

    context.strokeStyle = themeRgb("--brand-soft-rgb");
    context.lineWidth = 4;
    context.stroke();

    context.shadowBlur = 0;
    context.save();
    context.clip();
    context.beginPath();
    for (let i = badgeY - size; i < badgeY + size; i += 6) {
       context.moveTo(badgeX - size, i);
       context.lineTo(badgeX + size, i);
    }
    context.strokeStyle = themeRgb("--on-brand-rgb", 0.15);
    context.lineWidth = 1;
    context.stroke();
    context.restore();

    context.beginPath();
    context.arc(badgeX, badgeY, size - 12, 0, Math.PI * 2);
    context.strokeStyle = themeRgb("--brand-soft-rgb", 0.6);
    context.setLineDash([5, 5]);
    context.lineWidth = 2;
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = themeRgb("--on-brand-rgb");
    context.font = "800 20px 'JetBrains Mono', 'Noto Sans Mono', monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, badgeX, badgeY + 2);
  }

  context.restore();
}

export default function AlumniCertificatePage() {
  const { theme, t } = useThemeAndLocale();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [certificateNo, setCertificateNo] = useState(FALLBACK_CERTIFICATE_NO);
  const [avatarDataUrl, setAvatarDataUrl] = useState("");
  const [avatarFileName, setAvatarFileName] = useState("");
  const [bgUrl, setBgUrl] = useState("");
  const [bgFileName, setBgFileName] = useState("");
  const [previewDataUrl, setPreviewDataUrl] = useState("");
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAvatarUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      toast.error(t("certificate.errors.imageType"));
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextDataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!nextDataUrl) {
        toast.error(t("certificate.errors.avatarRead"));
        return;
      }

      setAvatarDataUrl(nextDataUrl);
      setAvatarFileName(selectedFile.name);
    };
    reader.onerror = () => {
      toast.error(t("certificate.errors.avatarRead"));
    };
    reader.readAsDataURL(selectedFile);
    event.target.value = "";
  }, [t]);

  const clearAvatar = useCallback(() => {
    setAvatarDataUrl("");
    setAvatarFileName("");
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }, []);

  const handleBgUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      toast.error(t("certificate.errors.imageType"));
      event.target.value = "";
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error(t("certificate.errors.backgroundSize"));
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextDataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!nextDataUrl) {
        toast.error(t("certificate.errors.backgroundRead"));
        return;
      }

      setBgUrl(nextDataUrl);
      setBgFileName(selectedFile.name);
    };
    reader.onerror = () => {
      toast.error(t("certificate.errors.backgroundRead"));
      event.target.value = "";
    };
    reader.readAsDataURL(selectedFile);
    event.target.value = "";
  }, [t]);

  const clearBg = useCallback(() => {
    setBgUrl("");
    setBgFileName("");
    if (bgInputRef.current) {
      bgInputRef.current.value = "";
    }
  }, []);

  const drawCertificate = useCallback(async (inputName: string, inputClassName: string, serialNo: string, avatarSource: string, bgSource: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    try {
      const bgImage = await loadCanvasImage(bgSource || "/card.jpg");
      context.drawImage(bgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } catch {
      const fallbackBg = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      fallbackBg.addColorStop(0, themeRgb("--surface-rgb"));
      fallbackBg.addColorStop(1, themeRgb("--surface-muted-rgb"));
      context.fillStyle = fallbackBg;
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    const overlay = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    const overlayAlpha = theme === "dark" ? [0.25, 0.5, 0.78] : [0.4, 0.7, 0.95];
    overlay.addColorStop(0, themeRgb("--surface-rgb", overlayAlpha[0]));
    overlay.addColorStop(0.6, themeRgb("--surface-rgb", overlayAlpha[1]));
    overlay.addColorStop(1, themeRgb("--surface-rgb", overlayAlpha[2]));
    context.fillStyle = overlay;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.textAlign = "center";

    context.shadowBlur = 0;
    context.fillStyle = themeRgb("--brand-fg-rgb");
    context.font = "700 52px 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    context.fillText(t("certificate.canvasTitle"), PANEL_CENTER_X, 176);

    context.fillStyle = themeRgb("--brand-rgb");
    context.font = "500 30px 'JetBrains Mono', 'Noto Sans Mono', monospace";
    context.fillText(YC_LOGO_SUBTEXT, PANEL_CENTER_X, 236);

    await drawAvatarArea(context, PANEL_CENTER_X, AVATAR_CENTER_Y, AVATAR_RADIUS, avatarSource);

    context.shadowColor = themeRgb("--brand-rgb", 0.25);
    context.shadowBlur = 15;
    context.fillStyle = themeRgb("--brand-fg-rgb");
    context.font = "700 108px 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    context.fillText(inputName || t("certificate.fallbackName"), PANEL_CENTER_X, 760);

    context.shadowBlur = 4;
    context.fillStyle = themeRgb("--brand-rgb", 0.9);
    context.font = "600 66px 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    context.fillText(inputClassName || t("certificate.fallbackClass"), PANEL_CENTER_X, 874);

    context.shadowBlur = 0;
    context.fillStyle = themeRgb("--brand-rgb");
    context.font = "500 42px 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    context.fillText(t("certificate.promise"), PANEL_CENTER_X, 1012);

    context.fillStyle = themeRgb("--brand-rgb");
    context.font = "500 50px 'JetBrains Mono', 'Noto Sans Mono', monospace";
    context.fillText(serialNo, PANEL_CENTER_X, 1158);

    const honorLevel = getHonorLevel(inputName);
    if (honorLevel) {
      drawHonorBadge(context, honorLevel, t("certificate.alumniBadge"));
    }

    setPreviewDataUrl(canvas.toDataURL("image/jpeg", 0.92));
  }, [theme, t]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return "";
    }

    const base64Data = canvas.toDataURL("image/jpeg", 0.92);
    setPreviewDataUrl(base64Data);
    return base64Data;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncPreview = async () => {
      const activeName = name.trim() || t("certificate.fallbackName");
      const activeClassName = className.trim() || t("certificate.fallbackClass");
      await drawCertificate(activeName, activeClassName, certificateNo, avatarDataUrl, bgUrl);
      if (isMounted) {
        setIsPreviewVisible(true);
      }
    };

    void syncPreview();

    return () => {
      isMounted = false;
    };
  }, [name, className, certificateNo, avatarDataUrl, bgUrl, drawCertificate, t]);

  const handleGenerate = async () => {
    const trimmedName = name.trim();
    const trimmedClass = className.trim();

    if (!trimmedName || !trimmedClass) {
      toast.error(t("certificate.errors.incomplete"));
      return;
    }

    try {
      const res = await fetch(`/api/alumni/verify?name=${encodeURIComponent(trimmedName)}`);
      const data = await res.json();

      if (!data.found || !data.match) {
        toast.error(t("certificate.errors.notFound"));
        return;
      }

      const match = data.match;
      if (!isClassMatch(trimmedClass, match.graduationClass)) {
        toast.error(t("certificate.errors.classMismatch"));
        return;
      }

      const verifiedName = match.name;
      const verifiedClassName = match.graduationClass;
      const verifiedFixedID = match.certificateNo || match.id;

      setIsRendering(true);
      setIsSuccess(false);
      setIsPreviewVisible(false);
      setName(verifiedName);
      setClassName(verifiedClassName);
      setCertificateNo(verifiedFixedID);
      await drawCertificate(verifiedName, verifiedClassName, verifiedFixedID, avatarDataUrl, bgUrl);
      handleDownload();
      // 身份核验完成（不记录用户敏感信息到控制台）
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      setIsPreviewVisible(true);
      setIsRendering(false);
      setIsSuccess(true);
      window.setTimeout(() => {
        setIsSuccess(false);
      }, 1200);
    } catch {
      toast.error(t("certificate.errors.service"));
    }
  };

  return (
    <PageShell size="wide">
      {/* Hero — 仪式感顶部 */}
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-line bg-surface/50 p-4 shadow-lg backdrop-blur-xl md:mb-8 md:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-28 h-52 w-52 rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-36 -left-20 h-56 w-56 rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-2 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 bottom-2 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent"
        />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-brand shadow-sm backdrop-blur">
              <IdCard size={12} aria-hidden="true" />
              {t("certificate.eyebrow")}
            </span>
            <h1 className="font-heading mt-3 text-[2rem] font-bold leading-tight text-main md:text-[36px] md:leading-[1.12]">
              {t("certificate.titlePrefix")}
              <span className="text-brand">
                {t("certificate.titleSuffix")}
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-brand-fg/70 md:text-[14px] md:leading-7">
              {t("certificate.descriptionLine1")}
              <br className="hidden md:inline" />
              {t("certificate.descriptionLine2")}
            </p>
            <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-brand/18 bg-surface/50 px-3.5 py-1.25 text-[11px] text-brand-fg/80 shadow-sm backdrop-blur md:text-sm">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              {t("certificate.promise")}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 md:flex-col md:items-end md:gap-2">
            <div className="rounded-2xl border border-brand/18 bg-surface/50 px-3.5 py-2.5 text-right shadow-sm backdrop-blur">
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-brand-fg/60">
                {t("certificate.badgeLabel")}
              </p>
              <p className="font-heading mt-0.5 text-sm font-semibold text-brand-fg md:text-base">
                {t("certificate.badgeValue")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {/* 预览区 — 放到上方居中展示 */}
        <div className="rounded-card border border-line bg-surface/50 backdrop-blur-xl p-5 md:p-6 shadow-2xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-brand/70">
                {t("certificate.previewLabel")}
              </p>
              <p className="mt-0.5 text-sm font-medium text-brand-fg/70 md:text-[15px]">
                {isSuccess
                  ? t("certificate.previewSuccess")
                  : t("certificate.previewIdle")}
              </p>
            </div>
            <span className="hidden rounded-full border border-line bg-surface/30 px-3 py-1 text-[11px] font-medium tracking-wide text-brand md:inline-flex">
              16 : 9 · 2752 × 1548
            </span>
          </div>

          <div
            className={`relative mx-auto w-full max-w-[920px] overflow-hidden rounded-2xl border border-line bg-surface/30 p-2 shadow-inner transition-opacity duration-500 md:p-3 ${
              isPreviewVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="overflow-hidden rounded-xl border border-line bg-surface/30">
              {previewDataUrl ? (
                <NextImage
                  src={previewDataUrl}
                  alt={t("certificate.previewAlt")}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 840px"
                  className={`mx-auto block aspect-video h-auto w-full max-w-[840px] transition duration-500 ${isSuccess ? "scale-[1.02]" : "scale-100"}`}
                />
              ) : (
                <div className="mx-auto aspect-video w-full max-w-[840px] animate-pulse bg-surface/30" />
              )}
            </div>
          </div>

        </div>

        {/* 输入区 — 左侧信息 + 校验，右侧上传 */}
        <aside className="rounded-card border border-line bg-surface/50 backdrop-blur-xl p-5 md:p-6 shadow-2xl">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start">
            <div className="space-y-6">
              <fieldset className="space-y-4 rounded-2xl border border-line bg-surface/20 p-5">
                <legend className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                  {t("certificate.basicInfo")}
                </legend>
                <div>
                  <label htmlFor="alumni-name" className="block text-sm font-medium text-brand-fg">
                    {t("certificate.name")}
                  </label>
                  <input
                    id="alumni-name"
                    type="text"
                    tabIndex={0}
                    aria-label={t("certificate.name")}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("certificate.namePlaceholder")}
                    className="input mt-2 w-full !rounded-2xl"
                  />
                </div>

                <div>
                  <label htmlFor="alumni-class" className="block text-sm font-medium text-brand-fg">
                    {t("certificate.className")}
                  </label>
                  <input
                    id="alumni-class"
                    type="text"
                    tabIndex={0}
                    aria-label={t("certificate.className")}
                    value={className}
                    onChange={(event) => setClassName(event.target.value)}
                    placeholder={t("certificate.classPlaceholder")}
                    className="input mt-2 w-full !rounded-2xl"
                  />
                </div>

                <div className="rounded-2xl border border-line bg-surface/30 px-4 py-3 text-sm">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand-fg/50">
                    {t("certificate.numberLabel")}
                  </p>
                  <p className="font-heading mt-1 truncate text-base font-semibold text-brand-fg">
                    {certificateNo}
                  </p>
                </div>
              </fieldset>
            </div>

            <div className="space-y-6">
              <fieldset className="space-y-4 rounded-2xl border border-line bg-surface/20 p-5">
                <legend className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                  {t("certificate.mediaTitle")}
                </legend>

                <input
                  ref={avatarInputRef}
                  id="alumni-avatar"
                  type="file"
                  accept="image/*"
                  aria-label={t("certificate.uploadAvatar")}
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface/30 px-4 py-3 text-sm font-medium text-brand shadow-sm transition hover:border-brand hover:bg-surface/50"
                >
                  <ImagePlus size={16} aria-hidden="true" />
                  <span>{t("certificate.uploadAvatar")}</span>
                </button>

                <div className="space-y-2">
                  {avatarDataUrl ? (
                    <div className="flex items-center gap-3">
                      <NextImage
                        src={avatarDataUrl}
                        alt={t("certificate.avatarPreview")}
                        width={44}
                        height={44}
                        unoptimized
                        className="h-11 w-11 rounded-full border border-line object-cover shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-brand-fg">{avatarFileName || t("certificate.avatarLoaded")}</p>
                        <p className="text-xs leading-5 text-brand-fg/50">{t("certificate.avatarDescription")}</p>
                      </div>
                      <button type="button"
                        onClick={clearAvatar}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-danger/30 text-danger transition hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                        aria-label={t("certificate.removeAvatar")}
                        tabIndex={0}
                      >
                        <X size={14} aria-hidden="true" />
                        <span className="sr-only">{t("certificate.removeAvatar")}</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs leading-6 text-brand-fg/40 md:text-[13px]">{t("certificate.avatarDefault")}</p>
                  )}
                </div>

                <input
                  ref={bgInputRef}
                  id="alumni-bg"
                  type="file"
                  accept="image/*"
                  aria-label={t("certificate.uploadBackground")}
                  className="hidden"
                  onChange={handleBgUpload}
                />
                <button
                  type="button"
                  onClick={() => bgInputRef.current?.click()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface/30 px-4 py-3 text-sm font-medium text-brand shadow-sm transition hover:border-brand hover:bg-surface/50"
                >
                  <ImagePlus size={16} aria-hidden="true" />
                  <span>{t("certificate.uploadBackground")}</span>
                </button>
                <div className="space-y-2">
                  {bgUrl ? (
                    <div className="flex items-center gap-3">
                      <NextImage
                        src={bgUrl}
                        alt={t("certificate.backgroundPreview")}
                        width={56}
                        height={32}
                        unoptimized
                        className="h-8 w-14 rounded border border-line object-cover shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-brand-fg">{bgFileName || t("certificate.backgroundLoaded")}</p>
                        <p className="text-xs leading-5 text-brand-fg/50">{t("certificate.backgroundDescription")}</p>
                      </div>
                      <button type="button"
                        onClick={clearBg}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-danger/30 text-danger transition hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                        aria-label={t("certificate.removeBackground")}
                        tabIndex={0}
                      >
                        <X size={14} aria-hidden="true" />
                        <span className="sr-only">{t("certificate.removeBackground")}</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs leading-6 text-brand-fg/40 md:text-[13px]">{t("certificate.backgroundDefault")}</p>
                  )}
                </div>
              </fieldset>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center gap-3 border-t border-brand/10 pt-4 pb-safe md:flex-row">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isRendering}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-soft via-brand to-brand px-5 py-3.5 text-sm font-semibold text-contrast shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:min-w-[240px] ${
                isSuccess ? "scale-[1.02] ring-2 ring-brand-soft" : ""
              } ${isRendering ? "animate-pulse" : ""}`}
            >
              {isSuccess ? <CheckCircle2 size={18} /> : <Rocket size={18} />}
              <span>
                {isRendering
                  ? t("certificate.verifying")
                  : isSuccess
                    ? t("certificate.generated")
                    : t("certificate.generate")}
              </span>
            </button>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-line bg-surface/30 px-5 py-3.5 text-sm font-medium text-brand transition hover:border-brand/50 hover:bg-brand/5 md:w-auto md:min-w-[160px]"
            >
              {t("common.backHome")}
            </Link>
          </div>
        </aside>
      </div>

      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="hidden" />
    </PageShell>
  );
}
