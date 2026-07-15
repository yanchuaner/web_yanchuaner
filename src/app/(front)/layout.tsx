import Header from "@/components/Header";

export default function FrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* 导航栏 */}
      <Header />

      <main id="main" className="relative z-20 min-h-[calc(100vh-200px)]">
        {children}
      </main>

      {/* 页脚 */}
      <footer className="glass relative z-10 border-t border-[#7C3AED]/10">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
          <div className="flex flex-col items-center justify-between gap-2 text-center text-sm text-brand-fg/65 md:flex-row md:text-left">
            <p>© 2025-2026 燕中校友数字母港</p>
            <p>技术共建：詹勇弟、黄湘林、王俊</p>
          </div>
          <div className="mt-2 flex flex-col items-center justify-between gap-2 text-center text-xs text-brand-fg/45 md:flex-row md:text-left">
            <p>运营维护：燕中校友汇</p>
            <p>校友自主共建 · 非学校官方 · 公益无盈利</p>
          </div>
          <div className="mt-2 flex justify-center">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="访问工信部备案系统"
              tabIndex={0}
              className="text-xs text-[#7C3AED]/40 transition hover:text-[#7C3AED]/60 focus:outline-none"
            >
              {"粤ICP备2026024784号-2"}
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
