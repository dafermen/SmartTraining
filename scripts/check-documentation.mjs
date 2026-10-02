import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([
  ".git",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);

const requiredFiles = [
  "AGENTS.md",
  "README.md",
  "CURRENT_STATUS.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "THIRD_PARTY_LICENSES.md",
  "docs/README.md",
  "docs/API.md",
  "docs/ARCHITECTURE.md",
  "docs/DEVELOPMENT.md",
  "docs/TESTING.md",
  "docs/DEPLOYMENT.md",
  "docs/OPERATIONS.md",
  "docs/SECURITY.md",
  "docs/TROUBLESHOOTING.md",
];

const misplacedFiles = [
  "docs/AGENTS.md",
  "docs/CHANGELOG.md",
  "docs/CONTRIBUTING.md",
  "docs/CURRENT_STATUS.md",
  "docs/THIRD_PARTY_LICENSES.md",
];

const markdownFiles = [];
const visit = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) visit(absolutePath);
    else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      markdownFiles.push(absolutePath);
    }
  }
};

const errors = [];

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(repositoryRoot, relativePath))) {
    errors.push(`Falta el archivo obligatorio: ${relativePath}`);
  }
}

for (const relativePath of misplacedFiles) {
  if (existsSync(resolve(repositoryRoot, relativePath))) {
    errors.push(`Archivo ubicado fuera de su lugar canónico: ${relativePath}`);
  }
}

visit(repositoryRoot);

const markdownLinkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
for (const markdownFile of markdownFiles) {
  const content = readFileSync(markdownFile, "utf8");
  for (const match of content.matchAll(markdownLinkPattern)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (!rawTarget || /^(?:https?:|mailto:|#)/i.test(rawTarget)) continue;

    const targetWithoutAnchor = rawTarget.split("#", 1)[0];
    if (!targetWithoutAnchor) continue;
    const targetPath = resolve(dirname(markdownFile), targetWithoutAnchor);
    if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
      const source = markdownFile.slice(repositoryRoot.length + 1);
      errors.push(`Enlace roto en ${source}: ${rawTarget}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Documentación verificada: ${markdownFiles.length} archivos Markdown, estructura y enlaces relativos correctos.`,
  );
}
