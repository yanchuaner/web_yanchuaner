"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/apiClient";
import { USERNAME_INPUT_PATTERN } from "@/lib/identity-fields";

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
          className="input w-full text-xs pr-10 focus:border-brand/50 focus:ring-brand/35"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="搜索或输入城市，例如：北京"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-fg/50">
          <Search size={14} />
        </div>
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-brand/15 bg-[#05030e]/95 backdrop-blur-2xl py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none select-none scrollbar-thin scrollbar-thumb-brand/20">
          {filteredCities.length === 0 ? (
            <li className="relative cursor-default select-none py-2 px-3 text-brand-fg/40">
              未找到匹配的城市，可直接保存输入的值
            </li>
          ) : (
            filteredCities.map((city) => (
              <li
                key={city}
                className="relative cursor-pointer select-none py-2 px-3 hover:bg-brand/15 hover:text-brand text-brand-fg transition"
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
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get<{ user: any }>("/api/me/profile").then(({ data }) => {
      if (data?.user) setProfile(data.user);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    // 429/413/5xx 由 apiClient 自动弹出 Toast
    const { data, error: apiError } = await api.patch<{ user: any }>(
      "/api/me/profile",
      payload,
      [409] // 409 冲突由下面的 setMessage 处理
    );

    if (data?.user) {
      setProfile(data.user);
      setMessage("");
      toast.success("资料已更新", { description: "您的个人资料已成功保存。" });
      await refresh();
    } else {
      setMessage(apiError || "更新失败");
    }
  }

  if (!profile) return <p className="p-8 text-center text-brand-fg/60">加载中…</p>;

  // Build graduationClass options dynamically from 2025 to current year
  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  const gradClasses = Array.from(
    { length: Math.max(0, currentYear - startYear + 1) },
    (_, i) => String(startYear + i)
  ).reverse();

  const userGradClass = profile.graduationClass || "";
  const displayedGradClasses = [...gradClasses];
  if (userGradClass && !displayedGradClasses.includes(userGradClass)) {
    displayedGradClasses.unshift(userGradClass);
  }

  // Build className options from 1班 to 20班
  const classNames = Array.from({ length: 20 }, (_, i) => `${i + 1}班`);
  
  const userClassName = profile.className || "";
  const formattedUserClass = userClassName && !userClassName.endsWith("班") && !isNaN(Number(userClassName))
    ? `${userClassName}班`
    : userClassName;

  const displayedClassNames = [...classNames];
  if (formattedUserClass && !displayedClassNames.includes(formattedUserClass)) {
    displayedClassNames.unshift(formattedUserClass);
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-12">
      <Link href="/me" className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand hover:underline transition">
        ← 返回个人中心
      </Link>
      <form onSubmit={submit} className="space-y-5 rounded-card border border-line bg-surface/50 backdrop-blur-xl p-7 shadow-xl">
        <h1 className="text-2xl font-bold font-heading text-brand-fg">编辑资料</h1>

        {/* 基本身份（只读） */}
        <div className="space-y-3 rounded-xl bg-purple-950/10 border border-brand/5 p-4">
          <h3 className="text-xs font-semibold text-brand/80 border-b border-brand/5 pb-1.5 mb-2">基本身份（系统锁定）</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-brand-fg/70">
              姓名
              <input name="name" className="input mt-1 w-full bg-black/10 opacity-70 cursor-not-allowed text-xs" value={profile.name || ""} disabled />
            </label>
            <label className="block text-xs font-medium text-brand-fg/70">
              邮箱
              <input name="email" type="email" className="input mt-1 w-full bg-black/10 opacity-70 cursor-not-allowed text-xs" value={profile.email || ""} disabled />
            </label>
            <label className="block text-xs font-medium text-brand-fg/70">
              届别
              <select
                name="graduationClass"
                className="input mt-1 w-full bg-black/10 opacity-70 cursor-not-allowed text-xs select-none"
                value={userGradClass}
                disabled
              >
                <option value="">未填写</option>
                {displayedGradClasses.map((item) => (
                  <option key={item} value={item}>
                    {item}届
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-brand-fg/70">
              班级
              <select
                name="className"
                className="input mt-1 w-full bg-black/10 opacity-70 cursor-not-allowed text-xs select-none"
                value={formattedUserClass}
                disabled
              >
                <option value="">未填写</option>
                {displayedClassNames.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* 账号设置 */}
        <div className="space-y-3 rounded-xl bg-purple-950/10 border border-brand/5 p-4">
          <h3 className="text-xs font-semibold text-brand/80 border-b border-brand/5 pb-1.5 mb-2">账号设置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-brand-fg">
              用户名
              <input name="username" className="input mt-1 w-full text-xs focus:border-brand/50 focus:ring-brand/35" defaultValue={profile.username || ""} placeholder="用户名" minLength={1} maxLength={32} pattern={USERNAME_INPUT_PATTERN} required />
            </label>
            <label className="block text-xs font-medium text-brand-fg">
              联系方式
              <input name="contact" className="input mt-1 w-full text-xs focus:border-brand/50 focus:ring-brand/35" defaultValue={profile.contact || ""} placeholder="手机号/微信号" />
            </label>
          </div>
        </div>

        {/* 教育轨迹 */}
        <div className="space-y-3 rounded-xl bg-purple-950/10 border border-brand/5 p-4">
          <h3 className="text-xs font-semibold text-brand/80 border-b border-brand/5 pb-1.5 mb-2">教育轨迹</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-brand-fg">
              毕业院校
              <input name="university" className="input mt-1 w-full text-xs focus:border-brand/50 focus:ring-brand/35" defaultValue={profile.university || ""} placeholder="例如：清华大学" maxLength={150} />
            </label>
            <label className="block text-xs font-medium text-brand-fg">
              所学专业
              <input name="major" className="input mt-1 w-full text-xs focus:border-brand/50 focus:ring-brand/35" defaultValue={profile.major || ""} placeholder="例如：计算机科学" maxLength={100} />
            </label>
          </div>
        </div>

        {/* 职业发展 */}
        <div className="space-y-3 rounded-xl bg-purple-950/10 border border-brand/5 p-4">
          <h3 className="text-xs font-semibold text-brand/80 border-b border-brand/5 pb-1.5 mb-2">职业发展</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="block text-xs font-medium text-brand-fg">
              所在城市
              <CityCombobox defaultValue={profile.city || ""} name="city" />
            </div>
            <label className="block text-xs font-medium text-brand-fg">
              从事行业
              <input name="industry" className="input mt-1 w-full text-xs focus:border-brand/50 focus:ring-brand/35" defaultValue={profile.industry || ""} placeholder="例如：互联网/金融" maxLength={100} />
            </label>
          </div>
        </div>

        <button className="btn-primary w-full">保存</button>
        {message ? <p className="text-xs text-rose-500">{message}</p> : null}
      </form>
    </section>
  );
}
