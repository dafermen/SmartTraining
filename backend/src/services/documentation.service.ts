import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { env } from "../config/env.js";
import { NotFoundError } from "../errors/not-found-error.js";
import type {
  DocumentationAudience,
  DocumentationDocument,
  DocumentationSummary,
} from "../types/documentation.js";
import type { UserRole } from "../types/user.js";

const safeFilenamePattern = /^\d{2}-[a-z0-9-]+\.md$/;
const learnerDocumentIds = new Set(["12-user-manual", "21-glossary"]);

const productDocuments = new Set([
  "01-project-overview",
  "02-functional-requirements",
  "11-admin-manual",
  "12-user-manual",
  "14-student-guide",
  "15-troubleshooting",
  "21-glossary",
]);
const deliveryDocuments = new Set([
  "18-deployment-guide",
  "19-roadmap",
  "24-mvp-acceptance-criteria",
  "26-demo-guide",
  "27-release-notes",
]);
const managementDocuments = new Set([
  "16-development-phases",
  "20-changelog",
  "22-risks-and-limitations",
  "23-implementation-plan",
  "28-code-review",
  "29-documentation-review",
]);

const categoryFor = (id: string): string => {
  if (productDocuments.has(id)) return "Producto";
  if (deliveryDocuments.has(id)) return "Entrega";
  if (managementDocuments.has(id)) return "Gestión del proyecto";
  return "Arquitectura y desarrollo";
};

const categoryOrder = [
  "Producto",
  "Arquitectura y desarrollo",
  "Entrega",
  "Gestión del proyecto",
];

const firstDescription = (content: string): string => {
  const line = content
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find(
      (item) =>
        item.length > 0 &&
        !item.startsWith("#") &&
        !item.startsWith("```") &&
        !item.startsWith("|"),
    );
  return (line ?? "Documento de referencia de SmartTraining")
    .replace(/^>\s*/, "")
    .replace(/[*_`]/g, "")
    .slice(0, 220);
};

export class DocumentationService {
  private readonly root = resolve(env.DOCUMENTATION_PATH);

  public async list(role: UserRole): Promise<DocumentationSummary[]> {
    const filenames = (await readdir(this.root, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && safeFilenamePattern.test(entry.name))
      .map((entry) => entry.name)
      .sort();

    const documents = await Promise.all(
      filenames.map(async (filename) => {
        const id = filename.slice(0, -3);
        const content = await readFile(resolve(this.root, filename), "utf8");
        return this.summary(id, content);
      }),
    );
    return documents
      .filter((document) => role === "ADMIN" || document.audience === "ALL")
      .sort((left, right) => {
        const categoryDifference =
          categoryOrder.indexOf(left.category) -
          categoryOrder.indexOf(right.category);
        return categoryDifference || left.id.localeCompare(right.id);
      });
  }

  public async get(id: string, role: UserRole): Promise<DocumentationDocument> {
    const available = await this.list(role);
    const summary = available.find((document) => document.id === id);
    if (!summary)
      throw new NotFoundError("Document not found", "DOCUMENT_NOT_FOUND");
    const content = await readFile(resolve(this.root, `${id}.md`), "utf8");
    return { ...summary, content };
  }

  private summary(id: string, content: string): DocumentationSummary {
    const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const audience: DocumentationAudience = learnerDocumentIds.has(id)
      ? "ALL"
      : "ADMIN";
    return {
      id,
      title: heading ?? id,
      description: firstDescription(content),
      category: categoryFor(id),
      audience,
    };
  }
}

export const documentationService = new DocumentationService();
