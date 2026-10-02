import { apiClient } from "./client";
import type {
  AdminProgressRow,
  ApiResponse,
  TrainingProgressSummary,
  VideoProgress,
} from "../types/api";

export const progressApi = {
  async mine(): Promise<VideoProgress[]> {
    const response =
      await apiClient.get<ApiResponse<{ records: VideoProgress[] }>>(
        "/progress/me",
      );
    return response.data.data.records;
  },

  async forTraining(trainingId: string): Promise<{
    records: VideoProgress[];
    summary: TrainingProgressSummary;
  }> {
    const response = await apiClient.get<
      ApiResponse<{
        records: VideoProgress[];
        summary: TrainingProgressSummary;
      }>
    >(`/progress/trainings/${trainingId}`);
    return response.data.data;
  },

  async updateVideo(
    videoId: string,
    currentTime: number,
    duration: number,
  ): Promise<VideoProgress> {
    const response = await apiClient.put<
      ApiResponse<{ progress: VideoProgress }>
    >(`/progress/videos/${videoId}`, { currentTime, duration });
    return response.data.data.progress;
  },

  async adminList(): Promise<AdminProgressRow[]> {
    const response =
      await apiClient.get<ApiResponse<{ records: AdminProgressRow[] }>>(
        "/admin/progress",
      );
    return response.data.data.records;
  },

  async resetVideo(userId: string, videoId: string): Promise<void> {
    await apiClient.delete(`/admin/progress/users/${userId}/videos/${videoId}`);
  },
};
