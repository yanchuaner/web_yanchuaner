"use client";

import { AlertTriangle, LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

const ACCESS_KEY = "yc_access_token";
const ACCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type AccessPayload = {
  v: 1;
  exp: number;
};

type GatekeeperProps = {
  children: ReactNode;
  initialIsVerified: boolean;
};

function setTokenCookie(serializedToken: string) {
  document.cookie = `${ACCESS_KEY}=${encodeURIComponent(serializedToken)}; Max-Age=${Math.floor(ACCESS_TTL_MS / 1000)}; Path=/; SameSite=Lax`;
}

export default function Gatekeeper({ children, initialIsVerified }: GatekeeperProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isVerified, setIsVerified] = useState(initialIsVerified);
  const [isChecked, setIsChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 客户端挂载后检查 localStorage 中的 token（快速路径，避免每次刷新调 API）
  useEffect(() => {
    try {
      const serialized = window.localStorage.getItem(ACCESS_KEY);
      if (!serialized) {
        setIsChecked(true);
        return;
      }

      const parsed = JSON.parse(serialized) as AccessPayload;
      const isValid = parsed.v === 1 && typeof parsed.exp === "number" && parsed.exp > Date.now();
      setIsVerified(isValid);
      if (!isValid) {
        window.localStorage.removeItem(ACCESS_KEY);
      }
    } catch {
      window.localStorage.removeItem(ACCESS_KEY);
    } finally {
      setIsChecked(true);
    }
  }, []);

  const inputClassName = !errorText
    ? "w-full rounded-xl border border-cyan-300/35 bg-slate-950/60 px-4 py-3 text-base text-slate-100 outline-none transition placeholder:text-slate-300 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/35"
    : "w-full rounded-xl border gate-shake border-rose-400/80 bg-slate-950/60 px-4 py-3 text-base text-slate-100 outline-none transition placeholder:text-slate-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/35";

  const submitAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password) {
      setErrorText("\u8bf7\u8f93\u5165\u6821\u9a8c\u53e3\u4ee4");
      setPassword("");
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorText("");

    try {
      // 服务端验证口令（密码不再暴露在客户端代码中）
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorText(data.error || "\u53e3\u4ee4\u9519\u8bef\uff0c\u8bf7\u67e5\u9605\u6821\u53cb\u7fa4\u516c\u544a");
        setPassword("");
        inputRef.current?.focus();
        return;
      }

      // 服务端已设置 httpOnly cookie，客户端额外存储一份用于快速检查
      const payload: AccessPayload = {
        v: 1,
        exp: Date.now() + ACCESS_TTL_MS,
      };
      const serialized = JSON.stringify(payload);
      window.localStorage.setItem(ACCESS_KEY, serialized);
      setTokenCookie(serialized);
      setIsVerified(true);
      window.location.reload();
    } catch {
      setErrorText("\u7f51\u7edc\u9519\u8bef\uff0c\u8bf7\u68c0\u67e5\u8fde\u63a5\u540e\u91cd\u8bd5");
      setPassword("");
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 等待客户端 token 检查完成前不渲染任何内容（避免登录表单闪烁）
  if (!isChecked) {
    return null;
  }

  return (
    <>
      {/* Always render children for SEO crawlers. 
          The overlay (z-100) visually blocks access for unverified human users.
          Admin APIs and sensitive routes are protected by middleware and server-side auth. */}
      {children}

      {!isVerified && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-10">
          <div className="absolute inset-0 bg-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(34,211,238,0.18),transparent_42%),radial-gradient(circle_at_82%_85%,rgba(56,189,248,0.16),transparent_46%)]" />
          <div className="pointer-events-none absolute inset-0 starfield opacity-75" />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-cyan-300/25 bg-slate-900/45 p-1 shadow-[0_0_55px_rgba(14,165,233,0.22)] backdrop-blur-xl">
            <div className="rounded-3xl border border-cyan-200/20 bg-slate-900/35 p-6 md:p-7">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-400/10 text-cyan-200">
                {isSubmitting ? <ShieldCheck size={18} /> : <LockKeyhole size={18} />}
              </div>

              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-cyan-300/80">ACCESS CONTROL</p>
              <h2 className="mt-2 text-2xl font-bold text-cyan-100 md:text-3xl">{"\u8eab\u4efd\u6838\u9a8c"}</h2>
              <p className="mt-2 text-sm text-slate-300">{"\u8bf7\u8f93\u5165\u6821\u53cb\u5185\u6d4b\u5bc6\u7801\uff0c\u89e3\u9501\u6b64\u661f\u57df\u5165\u53e3\u3002"}</p>

              <form className="mt-5 space-y-4" onSubmit={submitAccess}>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={"\u5185\u6d4b\u53e3\u4ee4"}
                  autoComplete="off"
                  aria-label="输入内测口令"
                  tabIndex={0}
                  disabled={isSubmitting}
                  className={inputClassName}
                />

                {errorText ? (
                  <div className="inline-flex w-full items-start gap-2 rounded-xl border border-rose-400/45 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{errorText}</span>
                  </div>
                ) : null}

                <button type="submit"
                  disabled={isSubmitting}
                  aria-label="提交身份核验"
                  tabIndex={0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 hover:shadow-[0_0_20px_rgba(103,232,249,0.45)] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
                >
                  <ShieldCheck size={17} />
                  <span>{isSubmitting ? "\u6838\u9a8c\u4e2d..." : "\u63a5\u5165\u6bcd\u6e2f"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
