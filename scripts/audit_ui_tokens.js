const fs = require("node:fs");
const path = require("node:path");

const root = path.join(process.cwd(), "src");
const extensions = new Set([".ts", ".tsx", ".css"]);
const tokenSource = path.normalize(path.join(root, "app", "globals.css"));

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(fullPath);
    return extensions.has(path.extname(entry.name)) ? [fullPath] : [];
  });
}

const rules = [
  { name: "hex", pattern: /#[0-9a-f]{3,8}\b/gi },
  { name: "numericColor", pattern: /\b(?:rgb|rgba|hsl|hsla)\(\s*[\d.]/gi },
  {
    name: "concreteTailwindPalette",
    pattern:
      /\b(?:bg|text|border|from|via|to|ring|shadow)-(?:white|black|gray|slate|zinc|neutral|stone|red|rose|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink)(?:-\d{2,3}|\/\d{1,3})?\b/g,
  },
];

const violations = [];
let scannedFiles = 0;
for (const file of filesIn(root)) {
  if (path.normalize(file) === tokenSource) continue;
  scannedFiles += 1;
  const source = fs.readFileSync(file, "utf8");
  for (const rule of rules) {
    const count = source.match(rule.pattern)?.length || 0;
    if (count > 0) {
      violations.push({
        file: path.relative(process.cwd(), file).replaceAll(path.sep, "/"),
        rule: rule.name,
        count,
      });
    }
  }
}

const total = violations.reduce((sum, violation) => sum + violation.count, 0);
console.log(JSON.stringify({ scannedFiles, total, violations }, null, 2));
if (total > 0) {
  console.error("Hardcoded UI colors found. Use semantic design tokens from globals.css.");
  process.exitCode = 1;
}
