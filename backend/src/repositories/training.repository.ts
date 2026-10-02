import { resolve } from "node:path";
import { z } from "zod";
import { env } from "../config/env.js";
import type { Training } from "../types/content.js";
import { trainingSchema } from "../validators/content.schemas.js";
import { JsonStore } from "./json-store.js";

/** Persists training records while keeping JSON access outside controllers and services. */
export class TrainingRepository {
  private readonly store = new JsonStore<Training[]>(
    resolve(env.DATA_STORAGE_PATH, "trainings.json"),
    z.array(trainingSchema),
    [],
  );

  public list(): Promise<Training[]> {
    return this.store.read();
  }

  public async findById(id: string): Promise<Training | undefined> {
    return (await this.store.read()).find((training) => training.id === id);
  }

  public async create(training: Training): Promise<Training> {
    await this.store.update((trainings) => [...trainings, training]);
    return training;
  }

  public async update(
    id: string,
    updater: (training: Training) => Training,
  ): Promise<Training | undefined> {
    let updated: Training | undefined;
    await this.store.update((trainings) =>
      trainings.map((training) => {
        if (training.id !== id) return training;
        updated = updater(training);
        return updated;
      }),
    );
    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    let deleted = false;
    await this.store.update((trainings) =>
      trainings.filter((training) => {
        if (training.id !== id) return true;
        deleted = true;
        return false;
      }),
    );
    return deleted;
  }
}

export const trainingRepository = new TrainingRepository();
