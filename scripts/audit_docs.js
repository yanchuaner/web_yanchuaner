const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const packageScripts = new Set(Object.keys(packageJson.scripts || {}));

function listMarkdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(target);
    return entry.isFile() && entry.name.endsWith(".md") ? [target] : [];
  });
}

const files = [path.join(root, "README.md"), ...listMarkdownFiles(path.join(root, "docs"))];
const violations = [];
const stalePatterns = [
  { pattern: /C:\\Dev\\yanchuaner/iu, reason: "旧 Windows 工作区路径" },
  { pattern: /\/mnt\/c\/Dev\/yanchuaner/iu, reason: "旧设备挂载路径" },
  { pattern: /seed_memories\.js/gu, reason: "已删除的记忆馆播种脚本" },
  { pattern: /seed_content_sections\.js/gu, reason: "已迁移为 TypeScript 的播种脚本" },
  { pattern: /fix_timeline\.js/gu, reason: "已删除的一次性时间线脚本" },
];

for (const file of files) {
  const relativeFile = path.relative(root, file);
  const content = fs.readFileSync(file, "utf8");

  for (const { pattern, reason } of stalePatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) violations.push(`${relativeFile}: ${reason}`);
  }

  for (const match of content.matchAll(/\[[^\]]*\]\((?!https?:|mailto:|#)([^)]+)\)/g)) {
    const rawTarget = match[1].replace(/^<|>$/g, "").split("#", 1)[0];
    if (!rawTarget) continue;
    const target = path.resolve(path.dirname(file), rawTarget);
    if (!fs.existsSync(target)) {
      violations.push(`${relativeFile}: 本地链接不存在：${match[1]}`);
    }
  }

  for (const match of content.matchAll(/npm run ([a-zA-Z0-9:_-]+)/g)) {
    if (!packageScripts.has(match[1])) {
      violations.push(`${relativeFile}: package.json 中不存在 npm run ${match[1]}`);
    }
  }
}

console.log(JSON.stringify({
  scannedFiles: files.length,
  packageScripts: packageScripts.size,
  violations,
}, null, 2));

if (violations.length > 0) process.exitCode = 1;
