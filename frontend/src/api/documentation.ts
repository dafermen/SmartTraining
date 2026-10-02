import { apiClient } from "./client";
import type {
  ApiResponse,
  DocumentationDocument,
  DocumentationSummary,
} from "../types/api";

export const documentationApi = {
  async list(): Promise<DocumentationSummary[]> {
    const response =
      await apiClient.get<ApiResponse<{ documents: DocumentationSummary[] }>>(
        "/documentation",
      );
    return response.data.data.documents;
  },

  async get(documentId: string): Promise<DocumentationDocument> {
    const response = await apiClient.get<
      ApiResponse<{ document: DocumentationDocument }>
    >(`/documentation/${documentId}`);
    return response.data.data.document;
  },
};
