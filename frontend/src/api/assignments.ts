import type {
  AdminTrainingAssignment,
  ApiResponse,
  TrainingAssignment,
} from "../types/api";
import { apiClient } from "./client";

export const assignmentsApi = {
  async list(): Promise<AdminTrainingAssignment[]> {
    const response =
      await apiClient.get<
        ApiResponse<{ assignments: AdminTrainingAssignment[] }>
      >("/assignments");
    return response.data.data.assignments;
  },

  async mine(): Promise<TrainingAssignment[]> {
    const response =
      await apiClient.get<ApiResponse<{ assignments: TrainingAssignment[] }>>(
        "/assignments/me",
      );
    return response.data.data.assignments;
  },

  async create(input: {
    userId: string;
    trainingId: string;
    dueDate: string | null;
  }): Promise<AdminTrainingAssignment> {
    const response = await apiClient.post<
      ApiResponse<{ assignment: AdminTrainingAssignment }>
    >("/assignments", input);
    return response.data.data.assignment;
  },

  async updateDueDate(
    id: string,
    dueDate: string | null,
  ): Promise<TrainingAssignment> {
    const response = await apiClient.put<
      ApiResponse<{ assignment: TrainingAssignment }>
    >(`/assignments/${encodeURIComponent(id)}`, { dueDate });
    return response.data.data.assignment;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/assignments/${encodeURIComponent(id)}`);
  },
};
