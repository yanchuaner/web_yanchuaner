import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import UUIDCompat from "@/components/UUIDCompat";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const SITE_URL = process.env.SITE_URL || "https://yanchuaner.cn";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "燕中校友数字母港",
    template: "%s | 燕中校友数字母港",
  },
  description:
    "深圳市燕川中学校友会官网 — 连接毕业校友、在校学生与老师的公益数字平台。提供校友通讯录、校园记忆、校友故事、活动公告等服务。",
  keywords: [
    "燕川中学",
    "校友会",
    "校友网",
    "深圳校友",
    "燕中校友",
    "毕业校友",
    "校友通讯录",
  ],
  authors: [{ name: "燕中校友数字母港" }],
  creator: "燕中校友数字母港",
  publisher: "燕中校友数字母港",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "燕中校友数字母港",
    title: "燕中校友数字母港",
    description:
      "深圳市燕川中学校友会官网 — 连接毕业校友、在校学生与老师的公益数字平台",
    images: [
      {
        url: `${SITE_URL}/card.jpg`,
        width: 2752,
        height: 1548,
        alt: "燕中校友数字母港",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "燕中校友数字母港",
    description: "深圳市燕川中学校友会官网 — 连接毕业校友、在校学生与老师的公益数字平台",
    images: [`${SITE_URL}/card.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import { ThemeAndLocaleProvider } from "@/components/ThemeAndLocaleProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  theme = theme === 'light' || theme === 'dark' ? theme : 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  var locale = localStorage.getItem('locale');
                  document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="overflow-x-hidden font-sans antialiased text-main bg-app">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-contrast focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-muted"
        >
          <span className="lang-zh">跳到正文</span>
          <span className="lang-en">Skip to content</span>
        </a>
        <ThemeAndLocaleProvider>
          <AuthProvider>
            <UUIDCompat />
            <div className="relative min-h-[100dvh] overflow-hidden bg-app">
              {children}
            </div>
            {/* Theme-aware system notification surface. */}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "rgb(var(--surface-rgb) / 0.92)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgb(var(--brand-rgb) / 0.30)",
                  color: "var(--color-text)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgb(var(--brand-rgb) / 0.20)",
                  fontSize: "14px",
                },
                classNames: {
                  title: "text-brand-fg font-semibold",
                  description: "text-brand-fg/70 text-xs mt-0.5",
                  actionButton: "bg-brand text-surface-muted hover:bg-brand/85",
                  cancelButton: "bg-surface-muted/70 text-brand-fg",
                },
              }}
            />
          </AuthProvider>
        </ThemeAndLocaleProvider>
      </body>
    </html>
  );
}
