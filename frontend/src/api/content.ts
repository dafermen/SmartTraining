import { apiClient } from "./client";
import type {
  ApiResponse,
  Training,
  TrainingModule,
  TrainingStatus,
} from "../types/api";

export const contentApi = {
  async listTrainings(): Promise<Training[]> {
    const response =
      await apiClient.get<ApiResponse<{ trainings: Training[] }>>("/trainings");
    return response.data.data.trainings;
  },

  async getTraining(id: string): Promise<Training> {
    const response = await apiClient.get<ApiResponse<{ training: Training }>>(
      `/trainings/${id}`,
    );
    return response.data.data.training;
  },

  async createTraining(input: {
    title: string;
    description: string;
  }): Promise<Training> {
    const response = await apiClient.post<ApiResponse<{ training: Training }>>(
      "/trainings",
      input,
    );
    return response.data.data.training;
  },

  async updateTraining(
    id: string,
    input: { title: string; description: string },
  ): Promise<Training> {
    const response = await apiClient.put<ApiResponse<{ training: Training }>>(
      `/trainings/${id}`,
      input,
    );
    return response.data.data.training;
  },

  async updateStatus(id: string, status: TrainingStatus): Promise<Training> {
    const response = await apiClient.patch<ApiResponse<{ training: Training }>>(
      `/trainings/${id}/status`,
      { status },
    );
    return response.data.data.training;
  },

  async deleteTraining(id: string): Promise<void> {
    await apiClient.delete(`/trainings/${id}`);
  },

  async listModules(trainingId: string): Promise<TrainingModule[]> {
    const response = await apiClient.get<
      ApiResponse<{ modules: TrainingModule[] }>
    >(`/trainings/${trainingId}/modules`);
    return response.data.data.modules;
  },

  async createModule(
    trainingId: string,
    input: { title: string; description: string },
  ): Promise<TrainingModule> {
    const response = await apiClient.post<
      ApiResponse<{ module: TrainingModule }>
    >(`/trainings/${trainingId}/modules`, input);
    return response.data.data.module;
  },

  async updateModule(
    id: string,
    input: { title: string; description: string },
  ): Promise<TrainingModule> {
    const response = await apiClient.put<
      ApiResponse<{ module: TrainingModule }>
    >(`/modules/${id}`, input);
    return response.data.data.module;
  },

  async deleteModule(id: string): Promise<void> {
    await apiClient.delete(`/modules/${id}`);
  },

  async reorderModules(
    trainingId: string,
    moduleIds: string[],
  ): Promise<TrainingModule[]> {
    const response = await apiClient.patch<
      ApiResponse<{ modules: TrainingModule[] }>
    >("/modules/reorder", { trainingId, moduleIds });
    return response.data.data.modules;
  },
};
