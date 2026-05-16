import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-open-sans)", "var(--font-noto-sans-sc)", "sans-serif"],
        heading: ["var(--font-poppins)", "var(--font-noto-sans-sc)", "sans-serif"],
      },
      colors: {
        // MASTER.md 设计规范色板
        brand: {
          primary: "#7C3AED",    // 主色 - 紫色
          secondary: "#A78BFA",  // 辅色 - 淡紫
          cta: "#22C55E",        // CTA - 绿色
          background: "#FAF5FF", // 背景 - 浅紫
          text: "#4C1D95",       // 文本 - 深紫
        },
        // 保留深色模式色板 (用于 Gatekeeper 等暗色场景)
        slate: {
          950: "#020617",
          900: "#0f172a",
          800: "#1e293b",
        },
      },
      boxShadow: {
        // MASTER.md 阴影层级
        "sm": "0 1px 2px rgba(0,0,0,0.05)",
        "md": "0 4px 6px rgba(0,0,0,0.1)",
        "lg": "0 10px 15px rgba(0,0,0,0.1)",
        "xl": "0 20px 25px rgba(0,0,0,0.15)",
      },
      spacing: {
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      transitionTimingFunction: {
        "soft-bounce": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      borderRadius: {
        "btn": "8px",
        "card": "12px",
        "modal": "16px",
      },
    }
  },
  plugins: []
};

export default config;
