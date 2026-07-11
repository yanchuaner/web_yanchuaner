const fs = require("node:fs");
const path = require("node:path");

const root = path.join(process.cwd(), "src");
const extensions = new Set([".ts", ".tsx", ".css"]);
const legacyBudget = 787;

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(fullPath);
    return extensions.has(path.extname(entry.name)) ? [fullPath] : [];
  });
}

let hexCount = 0;
let legacyLightCount = 0;
for (const file of filesIn(root)) {
  const source = fs.readFileSync(file, "utf8");
  hexCount += source.match(/#[0-9a-f]{6,8}/gi)?.length || 0;
  legacyLightCount +=
    source.match(/\b(?:bg-white|text-gray-\d+|border-gray-\d+)\b/g)?.length || 0;
}

const total = hexCount + legacyLightCount;
console.log(JSON.stringify({ hexCount, legacyLightCount, total, legacyBudget }));
if (total > legacyBudget) {
  console.error("UI token debt increased. Use semantic design tokens for new code.");
  process.exitCode = 1;
}
