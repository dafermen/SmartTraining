import { resolve } from "node:path";
import { z } from "zod";
import { env } from "../config/env.js";
import type { TrainingModule } from "../types/content.js";
import { trainingModuleSchema } from "../validators/content.schemas.js";
import { JsonStore } from "./json-store.js";

/** Persists module records and their order as one validated JSON collection. */
export class ModuleRepository {
  private readonly store = new JsonStore<TrainingModule[]>(
    resolve(env.DATA_STORAGE_PATH, "modules.json"),
    z.array(trainingModuleSchema),
    [],
  );

  public async listByTraining(trainingId: string): Promise<TrainingModule[]> {
    return (await this.store.read())
      .filter((module) => module.trainingId === trainingId)
      .sort((left, right) => left.order - right.order);
  }

  public async findById(id: string): Promise<TrainingModule | undefined> {
    return (await this.store.read()).find((module) => module.id === id);
  }

  public async create(module: TrainingModule): Promise<TrainingModule> {
    await this.store.update((modules) => [...modules, module]);
    return module;
  }

  public async update(
    id: string,
    updater: (module: TrainingModule) => TrainingModule,
  ): Promise<TrainingModule | undefined> {
    let updated: TrainingModule | undefined;
    await this.store.update((modules) =>
      modules.map((module) => {
        if (module.id !== id) return module;
        updated = updater(module);
        return updated;
      }),
    );
    return updated;
  }

  public async reorder(
    trainingId: string,
    moduleIds: string[],
    updatedAt: string,
  ): Promise<void> {
    const orderById = new Map(moduleIds.map((id, order) => [id, order]));
    await this.store.update((modules) =>
      modules.map((module) =>
        module.trainingId === trainingId
          ? { ...module, order: orderById.get(module.id)!, updatedAt }
          : module,
      ),
    );
  }

  public async delete(id: string): Promise<boolean> {
    let deleted = false;
    await this.store.update((modules) =>
      modules.filter((module) => {
        if (module.id !== id) return true;
        deleted = true;
        return false;
      }),
    );
    return deleted;
  }

  public async deleteByTraining(trainingId: string): Promise<void> {
    await this.store.update((modules) =>
      modules.filter((module) => module.trainingId !== trainingId),
    );
  }
}

export const moduleRepository = new ModuleRepository();
