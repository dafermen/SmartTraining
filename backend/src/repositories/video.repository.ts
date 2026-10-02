import { resolve } from "node:path";
import { z } from "zod";
import { env } from "../config/env.js";
import type { TrainingVideo } from "../types/content.js";
import { trainingVideoSchema } from "../validators/content.schemas.js";
import { JsonStore } from "./json-store.js";

export class VideoRepository {
  private readonly store = new JsonStore<TrainingVideo[]>(
    resolve(env.DATA_STORAGE_PATH, "videos.json"),
    z.array(trainingVideoSchema),
    [],
  );

  public async listByModule(moduleId: string): Promise<TrainingVideo[]> {
    return (await this.store.read())
      .filter((video) => video.moduleId === moduleId)
      .sort((left, right) => left.order - right.order);
  }

  public async findById(id: string): Promise<TrainingVideo | undefined> {
    return (await this.store.read()).find((video) => video.id === id);
  }

  public async create(video: TrainingVideo): Promise<TrainingVideo> {
    await this.store.update((videos) => [...videos, video]);
    return video;
  }

  public async update(
    id: string,
    updater: (video: TrainingVideo) => TrainingVideo,
  ): Promise<TrainingVideo | undefined> {
    let updated: TrainingVideo | undefined;
    await this.store.update((videos) =>
      videos.map((video) => {
        if (video.id !== id) return video;
        updated = updater(video);
        return updated;
      }),
    );
    return updated;
  }

  public async reorder(
    moduleId: string,
    videoIds: string[],
    updatedAt: string,
  ): Promise<void> {
    const orderById = new Map(videoIds.map((id, order) => [id, order]));
    await this.store.update((videos) =>
      videos.map((video) =>
        video.moduleId === moduleId
          ? { ...video, order: orderById.get(video.id)!, updatedAt }
          : video,
      ),
    );
  }

  public async delete(id: string): Promise<boolean> {
    let deleted = false;
    await this.store.update((videos) =>
      videos.filter((video) => {
        if (video.id !== id) return true;
        deleted = true;
        return false;
      }),
    );
    return deleted;
  }
}

export const videoRepository = new VideoRepository();
