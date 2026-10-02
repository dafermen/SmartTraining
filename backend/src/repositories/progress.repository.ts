import { resolve } from "node:path";
import { z } from "zod";
import { env } from "../config/env.js";
import type { VideoProgress } from "../types/content.js";
import { videoProgressSchema } from "../validators/content.schemas.js";
import { JsonStore } from "./json-store.js";

export class ProgressRepository {
  private readonly store = new JsonStore<VideoProgress[]>(
    resolve(env.DATA_STORAGE_PATH, "progress.json"),
    z.array(videoProgressSchema),
    [],
  );

  public listAll(): Promise<VideoProgress[]> {
    return this.store.read();
  }

  public async listByUser(userId: string): Promise<VideoProgress[]> {
    return (await this.store.read()).filter(
      (record) => record.userId === userId,
    );
  }

  public async listByUserAndTraining(
    userId: string,
    trainingId: string,
  ): Promise<VideoProgress[]> {
    return (await this.store.read()).filter(
      (record) => record.userId === userId && record.trainingId === trainingId,
    );
  }

  public async findByUserAndVideo(
    userId: string,
    videoId: string,
  ): Promise<VideoProgress | undefined> {
    return (await this.store.read()).find(
      (record) => record.userId === userId && record.videoId === videoId,
    );
  }

  public async upsert(record: VideoProgress): Promise<VideoProgress> {
    await this.store.update((records) => {
      const existingIndex = records.findIndex(
        (item) =>
          item.userId === record.userId && item.videoId === record.videoId,
      );
      if (existingIndex < 0) return [...records, record];
      return records.map((item, index) =>
        index === existingIndex ? record : item,
      );
    });
    return record;
  }

  public async deleteByVideo(videoId: string): Promise<void> {
    await this.store.update((records) =>
      records.filter((record) => record.videoId !== videoId),
    );
  }

  public async deleteByUserAndVideo(
    userId: string,
    videoId: string,
  ): Promise<boolean> {
    let deleted = false;
    await this.store.update((records) =>
      records.filter((record) => {
        const matches = record.userId === userId && record.videoId === videoId;
        if (matches) deleted = true;
        return !matches;
      }),
    );
    return deleted;
  }
}

export const progressRepository = new ProgressRepository();
