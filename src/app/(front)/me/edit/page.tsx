"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Search, ArrowLeft, User, FileEdit } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/apiClient";
import { PageShell, GlassCard, PageHeader, Button, ButtonLink, FormStatus } from "@/components/ui";
import { formatClassName, formatGraduationClass, USERNAME_INPUT_PATTERN } from "@/lib/identity-fields";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

const MAJOR_CITIES = [
  "北京", "上海", "广州", "深圳", "天津", "重庆", "杭州", "南京", "武汉", "成都", 
  "西安", "厦门", "苏州", "无锡", "常州", "宁波", "温州", "绍兴", "金华", "台州", 
  "嘉兴", "湖州", "合肥", "芜湖", "福州", "泉州", "南昌", "九江", "赣州", "济南", 
  "青岛", "烟台", "潍坊", "临沂", "郑州", "洛阳", "新乡", "许昌", "长沙", "株洲", 
  "湘潭", "衡阳", "岳阳", "常德", "东莞", "佛山", "珠海", "惠州", "中山", "汕头", 
  "江门", "湛江", "肇庆", "南宁", "柳州", "桂林", "海口", "三亚", "绵阳", "德阳", 
  "宜宾", "南充", "达州", "贵阳", "遵义", "昆明", "曲靖", "拉萨", "咸阳", "宝鸡", 
  "榆林", "兰州", "天水", "西宁", "银川", "乌鲁木齐", "石河子", "哈尔滨", "大庆", 
  "齐齐哈尔", "长春", "吉林", "沈阳", "大连", "鞍山", "抚顺", "呼和浩特", "包头", 
  "鄂尔多斯", "石家庄", "唐山", "秦皇岛", "邯郸", "保定", "张家口", "太原", "大同", 
  "临汾", "运城"
];

function CityCombobox({ defaultValue, name }: { defaultValue: string; name: string }) {
  const { t } = useThemeAndLocale();
  const [query, setQuery] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const filteredCities = query.trim() === ""
    ? MAJOR_CITIES
    : MAJOR_CITIES.filter((city) =>
        city.toLowerCase().includes(query.toLowerCase().trim())
      );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative mt-1" ref={containerRef}>
      <input
        type="hidden"
        name={name}
        value={query}
      />
      <div className="relative">
        <input
          type="text"
          className="input w-full text-xs pr-10 touch-manipulation"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t("me.edit.cityPlaceholder")}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-fg/50">
          <Search size={14} />
        </div>
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-card border border-line bg-surface py-1 text-xs shadow-lg ring-1 ring-line ring-opacity-5 focus:outline-none select-none scrollbar-thin scrollbar-thumb-brand/20">
          {filteredCities.length === 0 ? (
            <li className="relative cursor-default select-none px-3 py-3 text-brand-fg/40">
              {t("me.edit.cityEmpty")}
            </li>
          ) : (
            filteredCities.map((city) => (
              <li
                key={city}
                className="relative cursor-pointer select-none px-3 py-3 text-brand-fg transition hover:bg-brand/15 hover:text-brand touch-manipulation"
                onClick={() => {
                  setQuery(city);
                  setIsOpen(false);
                }}
              >
                {city}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function EditProfilePage() {
  const { refresh } = useAuth();
  const { locale, t } = useThemeAndLocale();
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ user: any }>("/api/me/profile").then(({ data }) => {
      if (data?.user) setProfile(data.user);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    // 429/413/5xx 由 apiClient 自动弹出 Toast
    const { data, error: apiError } = await api.patch<{ user: any }>(
      "/api/me/profile",
      payload,
      [409] // 409 冲突由下面的 setMessage 处理
    );

    setSaving(false);
    if (data?.user) {
      setProfile(data.user);
      setMessage("");
      toast.success(t("me.edit.success"), { description: t("me.edit.successDescription") });
      await refresh();
    } else {
      setMessage(apiError || t("me.edit.failed"));
      toast.error(apiError || t("me.edit.failed"));
    }
  }

  if (!profile) {
    return (
      <PageShell size="narrow">
        <div className="flex items-center justify-center py-20 text-brand-fg/60">{t("common.loading")}</div>
      </PageShell>
    );
  }

  const identityItems = [
    { label: t("me.edit.name"), value: profile.name || t("me.edit.empty") },
    { label: t("me.edit.email"), value: profile.email || t("me.edit.empty") },
    {
      label: t("me.edit.cohort"),
      value: profile.graduationClass
        ? locale === "en" ? `Class of ${profile.graduationClass}` : formatGraduationClass(profile.graduationClass)
        : t("me.edit.empty"),
    },
    {
      label: t("me.edit.className"),
      value: profile.className
        ? locale === "en" ? `Class ${profile.className}` : formatClassName(profile.className)
        : t("me.edit.empty"),
    },
  ];

  return (
    <PageShell size="narrow" className="pb-28 md:pb-32">
      <ButtonLink href="/me" variant="secondary" size="sm" className="mb-6">
        <ArrowLeft size={14} />
        {t("me.edit.back")}
      </ButtonLink>

      <PageHeader
        eyebrow={t("me.edit.eyebrow")}
        eyebrowIcon={User}
        title={t("me.edit.title")}
        description={t("me.edit.description")}
      />

      <GlassCard className="p-7 mt-6 space-y-6">
        <div className="space-y-4 rounded-card border border-line bg-brand/5 p-4">
          <FormStatus
            tone="info"
            title={t("me.edit.identityTitle")}
            description={t("me.edit.identityDescription")}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-fg">{t("me.edit.currentIdentity")}</p>
              <p className="mt-1 text-xs leading-6 text-brand-fg/60">{t("me.edit.readOnly")}</p>
            </div>
            <ButtonLink href="/alumni/correction" variant="secondary" size="sm" className="w-full sm:w-auto">
              <FileEdit size={14} />
              {t("me.edit.correctionAction")}
            </ButtonLink>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {identityItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-surface px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-brand-fg/45">{item.label}</p>
                <p className="mt-1 text-sm font-medium text-brand-fg">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-6 text-brand-fg/55">
            {t("me.edit.identityNote")}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* 账号设置 */}
          <div className="space-y-3 rounded-card bg-brand/5 border border-line p-4">
            <h3 className="text-xs font-semibold text-brand border-b border-line pb-1.5 mb-2">{t("me.edit.accountSection")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-brand-fg">
                {t("me.edit.username")}
                <input name="username" className="input mt-1.5 w-full text-xs" defaultValue={profile.username || ""} placeholder={t("me.edit.usernamePlaceholder")} minLength={1} maxLength={32} pattern={USERNAME_INPUT_PATTERN} required disabled={saving} />
              </label>
              <label className="block text-xs font-medium text-brand-fg">
                {t("me.edit.contact")}
                <input name="contact" className="input mt-1.5 w-full text-xs" defaultValue={profile.contact || ""} placeholder={t("me.edit.contactPlaceholder")} disabled={saving} />
              </label>
            </div>
          </div>

          {/* 教育轨迹 */}
          <div className="space-y-3 rounded-card bg-brand/5 border border-line p-4">
            <h3 className="text-xs font-semibold text-brand border-b border-line pb-1.5 mb-2">{t("me.edit.educationSection")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-brand-fg">
                {t("me.edit.university")}
                <input name="university" className="input mt-1.5 w-full text-xs" defaultValue={profile.university || ""} placeholder={t("me.edit.universityPlaceholder")} maxLength={150} disabled={saving} />
              </label>
              <label className="block text-xs font-medium text-brand-fg">
                {t("me.edit.major")}
                <input name="major" className="input mt-1.5 w-full text-xs" defaultValue={profile.major || ""} placeholder={t("me.edit.majorPlaceholder")} maxLength={100} disabled={saving} />
              </label>
            </div>
          </div>

          {/* 职业发展 */}
          <div className="space-y-3 rounded-card bg-brand/5 border border-line p-4">
            <h3 className="text-xs font-semibold text-brand border-b border-line pb-1.5 mb-2">{t("me.edit.careerSection")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="block text-xs font-medium text-brand-fg">
                {t("me.edit.city")}
                <CityCombobox defaultValue={profile.city || ""} name="city" />
              </div>
              <label className="block text-xs font-medium text-brand-fg">
                {t("me.edit.industry")}
                <input name="industry" className="input mt-1.5 w-full text-xs" defaultValue={profile.industry || ""} placeholder={t("me.edit.industryPlaceholder")} maxLength={100} disabled={saving} />
              </label>
            </div>
          </div>

          {message && (
            <div className="rounded-card border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {message}
            </div>
          )}

          <Button type="submit" disabled={saving} className="w-full touch-manipulation">
            {saving ? t("me.edit.saving") : t("me.edit.save")}
          </Button>
        </form>
      </GlassCard>
    </PageShell>
  );
}
