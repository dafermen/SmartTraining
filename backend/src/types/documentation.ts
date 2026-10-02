export type DocumentationAudience = "ADMIN" | "ALL";

export interface DocumentationSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  audience: DocumentationAudience;
}

export interface DocumentationDocument extends DocumentationSummary {
  content: string;
}
