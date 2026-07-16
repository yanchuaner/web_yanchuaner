import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

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

      <SiteFooter />
    </>
  );
}
