import type { AxiosProgressEvent } from "axios";
import { apiClient } from "./client";
import type { ApiResponse, TrainingVideo } from "../types/api";

export const videosApi = {
  async get(id: string): Promise<TrainingVideo> {
    const response = await apiClient.get<ApiResponse<{ video: TrainingVideo }>>(
      `/videos/${id}`,
    );
    return response.data.data.video;
  },

  async list(moduleId: string): Promise<TrainingVideo[]> {
    const response = await apiClient.get<
      ApiResponse<{ videos: TrainingVideo[] }>
    >(`/modules/${moduleId}/videos`);
    return response.data.data.videos;
  },

  async upload(
    moduleId: string,
    input: { title: string; description: string; file: File },
    onProgress: (percentage: number) => void,
  ): Promise<TrainingVideo> {
    const form = new FormData();
    form.append("title", input.title);
    form.append("description", input.description);
    form.append("video", input.file);
    const response = await apiClient.post<
      ApiResponse<{ video: TrainingVideo }>
    >(`/modules/${moduleId}/videos`, form, {
      // Large uploads must not inherit the short timeout used by regular API calls.
      timeout: 0,
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (event.total)
          onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return response.data.data.video;
  },

  async update(
    id: string,
    input: { title: string; description: string },
  ): Promise<TrainingVideo> {
    const response = await apiClient.put<ApiResponse<{ video: TrainingVideo }>>(
      `/videos/${id}`,
      input,
    );
    return response.data.data.video;
  },

  async retry(id: string): Promise<TrainingVideo> {
    const response = await apiClient.post<
      ApiResponse<{ video: TrainingVideo }>
    >(`/videos/${id}/retry`);
    return response.data.data.video;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/videos/${id}`);
  },

  async reorder(
    moduleId: string,
    videoIds: string[],
  ): Promise<TrainingVideo[]> {
    const response = await apiClient.patch<
      ApiResponse<{ videos: TrainingVideo[] }>
    >("/videos/reorder", { moduleId, videoIds });
    return response.data.data.videos;
  },

  async replaceThumbnail(id: string, file: File): Promise<TrainingVideo> {
    const form = new FormData();
    form.append("thumbnail", file);
    const response = await apiClient.post<
      ApiResponse<{ video: TrainingVideo }>
    >(`/videos/${id}/thumbnail`, form);
    return response.data.data.video;
  },
};
