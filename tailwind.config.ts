import type { Config } from "tailwindcss";

/**
 * 设计令牌单一来源（Single Source of Truth）。
 *
 * 颜色统一引用 globals.css 中的 CSS 变量（--color-*），
 * 这样改主题色只需动一个文件。请优先使用语义令牌（如 text-brand、
 * border-line、bg-surface），不要在页面里裸写十六进制色值。
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Open Sans'", "'Noto Sans SC'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        heading: ["'Poppins'", "'Noto Sans SC'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        heritage: ["'STSong'", "'Songti SC'", "'SimSun'", "'Noto Serif SC'", "Georgia", "serif"],
      },
      colors: {
        // ── 语义令牌（推荐使用，支持透明度修饰符如 bg-brand/10）──
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          soft: "rgb(var(--brand-soft-rgb) / <alpha-value>)",
          fg: "rgb(var(--brand-fg-rgb) / <alpha-value>)",
        },
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          muted: "rgb(var(--surface-muted-rgb) / <alpha-value>)",
          strong: "rgb(var(--surface-strong-rgb) / <alpha-value>)",
        },
        contrast: "rgb(var(--on-brand-rgb) / <alpha-value>)",
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        info: "rgb(var(--info-rgb) / <alpha-value>)",
        overlay: "rgb(var(--overlay-rgb) / <alpha-value>)",
        device: {
          bg: "rgb(var(--device-bg-rgb) / <alpha-value>)",
          fg: "rgb(var(--device-fg-rgb) / <alpha-value>)",
          signal: "rgb(var(--device-signal-rgb) / <alpha-value>)",
        },
        map: {
          bg: "rgb(var(--map-bg-rgb) / <alpha-value>)",
          fill: "rgb(var(--map-fill-rgb) / <alpha-value>)",
          stroke: "rgb(var(--map-stroke-rgb) / <alpha-value>)",
          fg: "rgb(var(--map-fg-rgb) / <alpha-value>)",
        },
        line: "var(--color-line)",           // 统一描边色（固定透明度）
        app: "var(--color-background)",      // 页面自适应背景色
        main: "rgb(var(--brand-fg-rgb) / <alpha-value>)", // 支持 text-main/70
      },
      boxShadow: {
        // 自适应阴影
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      borderRadius: {
        btn: "12px",      // 按钮
        card: "16px",     // 卡片（rounded-2xl 同值）
        modal: "20px",    // 浮层
      },
      transitionTimingFunction: {
        "soft-bounce": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    }
  },
  plugins: []
};

export default config;
