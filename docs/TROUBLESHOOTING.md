# TROUBLESHOOTING（故障排查知识库）

本文档记录本项目实战中反复出现的关键故障与标准修复方案。

## 1. UTF-8 编码报错（构建失败）

### 常见现象
- `npm run build` 失败。
- 错误信息包含 `stream did not contain valid UTF-8`。

### 根因
- 新建或拷贝的 TS/TSX 文件中混入非 UTF-8 字节。

### 解决方案
1. 将异常文件重写为安全 UTF-8。
2. 中文文案可使用 Unicode 转义（例如 `\u4f60\u597d`）降低编码不一致风险。
3. 重新执行 `npm run build` 验证。

---

## 2. SSR 水合冲突（JoinRequestModal 导致白屏）

### 常见现象
- 首页白屏或 500。
- 交互组件引入后更容易触发。

### 根因
- 交互组件在 SSR 和客户端水合阶段执行时机不一致。

### 解决方案
1. 在组件中增加 mounted 守卫：
   - `const [mounted, setMounted] = useState(false)`
   - `useEffect(() => setMounted(true), [])`
   - `if (!mounted) return null`
2. 使用 dynamic 并关闭 SSR：
   - `dynamic(() => import('...'), { ssr: false })`
3. 重新构建验证。

---

## 3. Tailwind 扫描失效（样式变纯文字）

### 常见现象
- 页面只有文字，无 Tailwind 样式。

### 根因
- `tailwind.config.ts` 的 `content` 未覆盖 `src/app`、`src/components` 等目录。
- 缓存残留导致 CSS 产物失效。

### 解决方案
1. 确保 `content` 至少包含：
   - `./src/pages/**/*.{js,ts,jsx,tsx,mdx}`
   - `./src/components/**/*.{js,ts,jsx,tsx,mdx}`
   - `./src/app/**/*.{js,ts,jsx,tsx,mdx}`
2. 检查 `postcss.config.mjs` 是否启用 `tailwindcss` 与 `autoprefixer`。
3. 清缓存并重启开发服务。

---

## 4. Webpack 模块索引冲突（webpack_modules 报错）

### 常见现象
- 运行时报 `webpack_modules` 相关错误。
- 可能伴随 `moduleId is not a function` 等异常。

### 根因
- `.next` 里旧产物与当前编译结果冲突，模块索引映射失配。

### 解决方案
1. 物理删除 `.next`。
2. 重启 dev 或重新 build。
3. 若仍异常，连同 `node_modules/.cache` 一并清理。

---

## 5. WSL 端口与缓存残余（404 资源丢失）

### 常见现象
- `/_next/static/...` 返回 404。
- 页面偶发无样式、热更新失败。

### 根因
- 残留 Node/Next 进程占用端口。
- 多实例并存，浏览器命中到旧实例或旧缓存路径。

### 解决方案
1. 清理残留进程（如 `killall -9 node`）。
2. 删除 `.next` 与 `node_modules/.cache`。
3. 固定端口重新启动（必要时更换新端口验证）。

---

## 推荐恢复流程

1. `bash scripts/clean.sh`
2. `npm run dev`
3. 浏览器强制刷新（Ctrl+Shift+R）
