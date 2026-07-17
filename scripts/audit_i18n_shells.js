const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const seedFiles = [
  "src/app/(front)/login/page.tsx",
  "src/app/(front)/register/page.tsx",
  "src/app/(front)/reset-password/page.tsx",
  "src/app/(front)/verify-email/page.tsx",
  "src/app/(front)/alumni/university-map/page.tsx",
  "src/app/(front)/alumni/correction/page.tsx",
  "src/app/(front)/alumni/certificate/page.tsx",
  "src/app/(front)/alumni/stories/page.tsx",
  "src/app/(front)/me/edit/page.tsx",
  "src/app/(front)/me/posts/page.tsx",
  "src/app/(front)/me/submit/page.tsx",
  "src/app/(front)/me/change-password/page.tsx",
  "src/app/(front)/events/page.tsx",
  "src/app/(front)/events/[id]/page.tsx",
  "src/app/(front)/news/page.tsx",
  "src/app/(front)/news/[id]/page.tsx",
  "src/app/(front)/contact/page.tsx",
  "src/app/(front)/teachers/page.tsx",
  "src/components/HomeClientPage.tsx",
  "src/components/EcosystemClientPage.tsx",
  "src/components/PrivacyClientPage.tsx",
  "src/components/ui/ChannelTV.tsx",
  "src/components/AlumniSignalField.tsx",
  "src/components/AlumniSearch.tsx",
  "src/components/CityMapRenderer.tsx",
  "src/components/EventRegistrationForm.tsx",
  "src/components/LocalizedText.tsx",
  "src/components/LocalizedDate.tsx",
  "src/components/MeClientPage.tsx",
  "src/components/auth/AccountStatusPanel.tsx",
  "src/app/(admin)/layout.tsx",
  "src/app/(admin)/admin/page.tsx",
  "src/app/(admin)/admin/users/page.tsx",
  "src/components/admin/AdminBreadcrumb.tsx",
  "src/components/admin/AdminDashboardClient.tsx",
  "src/components/admin/AdminPagination.tsx",
  "src/components/admin/AdminQuickAction.tsx",
  "src/components/admin/CrudManager.tsx",
];

function collectTsxFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTsxFiles(absolute);
    return entry.isFile() && entry.name.endsWith(".tsx")
      ? [path.relative(process.cwd(), absolute).replaceAll("\\", "/")]
      : [];
  });
}

const files = [...new Set([
  ...seedFiles,
  ...collectTsxFiles(path.join(process.cwd(), "src/app/(admin)")),
  ...collectTsxFiles(path.join(process.cwd(), "src/components/admin")),
])];

const allowedLiterals = new Set(["粤ICP备2026024784号-2"]);
const adminCopySource = fs.readFileSync(
  path.join(process.cwd(), "src/components/admin/AdminLocalizedText.tsx"),
  "utf8",
);
const adminKnownCopy = new Set(
  [...adminCopySource.matchAll(/^\s*"([^"]+)":\s*"/gm)].map((match) => match[1]),
);
const dataVariables = new Set([
  "MAJOR_CITIES",
  "storyTagKeys",
  "CORE_MEMBERS",
  "initialDraft",
  "metadata",
  "FIELDS",
  "PAGES",
  "ICONS",
  "STATUS_TABS",
  "STATUS_BADGE",
  "STATUS_BADGES",
  "MATCH_BADGES",
  "IDENTITY_LABELS",
  "statusLabel",
  "typeLabel",
  "actionLabel",
  "fields",
  "header",
]);
const violations = [];

function isLocalizeArgument(node) {
  let current = node.parent;
  while (current) {
    if (
      ts.isCallExpression(current) &&
      ts.isIdentifier(current.expression) &&
      current.expression.text === "localize"
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function isNonUiLiteral(node, relativeFile) {
  if (relativeFile.endsWith("/AdminLocalizedText.tsx")) return true;
  let current = node.parent;
  while (current) {
    if (
      ts.isCallExpression(current) &&
      ts.isIdentifier(current.expression) &&
      current.expression.text === "localize"
    ) {
      return true;
    }
    if (ts.isConditionalExpression(current)) return true;
    if (ts.isJsxAttribute(current) && ts.isIdentifier(current.name)) {
      const opening = current.parent?.parent;
      if (
        opening &&
        ts.isJsxOpeningElement(opening) &&
        ts.isIdentifier(opening.tagName) &&
        opening.tagName.text === "AdminPageShell" &&
        ["title", "description"].includes(current.name.text)
      ) {
        return true;
      }
    }
    if (
      ts.isVariableDeclaration(current) &&
      ts.isIdentifier(current.name) &&
      dataVariables.has(current.name.text)
    ) {
      return true;
    }
    if (
      (ts.isFunctionDeclaration(current) || ts.isFunctionExpression(current)) &&
      ["generateMetadata", "normalizeYear"].includes(current.name?.text)
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

for (const relativeFile of files) {
  const file = path.join(process.cwd(), relativeFile);
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  function visit(node) {
    if (ts.isStringLiteralLike(node) || ts.isJsxText(node)) {
      const text = node.text.trim();
      const hasHan = /\p{Script=Han}/u.test(text);
      if (
        hasHan &&
        relativeFile.includes("/(admin)/") &&
        isLocalizeArgument(node) &&
        !adminKnownCopy.has(text)
      ) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push({ file: relativeFile, line: line + 1, text, reason: "missing admin English mapping" });
      } else if (hasHan && !allowedLiterals.has(text) && !isNonUiLiteral(node, relativeFile)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push({ file: relativeFile, line: line + 1, text });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

console.log(JSON.stringify({ scannedFiles: files.length, violations }, null, 2));
if (violations.length > 0) {
  console.error("Hardcoded Chinese UI copy found in a global locale surface.");
  process.exitCode = 1;
}
