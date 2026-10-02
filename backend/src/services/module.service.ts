import { randomUUID } from "node:crypto";
import { ConflictError } from "../errors/conflict-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import {
  assignmentRepository,
  type AssignmentRepository,
} from "../repositories/assignment.repository.js";
import {
  moduleRepository,
  type ModuleRepository,
} from "../repositories/module.repository.js";
import {
  trainingRepository,
  type TrainingRepository,
} from "../repositories/training.repository.js";
import type { TrainingModule } from "../types/content.js";
import type { AuthenticatedIdentity } from "./token.service.js";

export class ModuleService {
  public constructor(
    private readonly modules: ModuleRepository = moduleRepository,
    private readonly trainings: TrainingRepository = trainingRepository,
    private readonly assignments: AssignmentRepository = assignmentRepository,
  ) {}

  public async list(
    trainingId: string,
    identity: AuthenticatedIdentity,
  ): Promise<TrainingModule[]> {
    const training = await this.trainings.findById(trainingId);
    const learnerCanAccess =
      identity.role === "LEARNER" &&
      training?.status === "PUBLISHED" &&
      (await this.assignments.isAssigned(identity.id, trainingId));
    if (!training || (identity.role === "LEARNER" && !learnerCanAccess)) {
      throw new NotFoundError("Training not found", "TRAINING_NOT_FOUND");
    }
    return this.modules.listByTraining(trainingId);
  }

  public async create(
    trainingId: string,
    input: { title: string; description?: string },
  ): Promise<TrainingModule> {
    await this.requireTraining(trainingId);
    const existingModules = await this.modules.listByTraining(trainingId);
    const now = new Date().toISOString();
    const module: TrainingModule = {
      id: randomUUID(),
      trainingId,
      title: input.title,
      description: input.description ?? "",
      order: existingModules.length,
      videoIds: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.modules.create(module);
    try {
      await this.trainings.update(trainingId, (current) => ({
        ...current,
        moduleIds: [...current.moduleIds, module.id],
        updatedAt: now,
      }));
    } catch (error) {
      await this.modules.delete(module.id);
      throw error;
    }
    return module;
  }

  public async update(
    id: string,
    input: { title: string; description?: string },
  ): Promise<TrainingModule> {
    await this.requireModule(id);
    return (await this.modules.update(id, (module) => ({
      ...module,
      title: input.title,
      description: input.description ?? "",
      updatedAt: new Date().toISOString(),
    })))!;
  }

  public async delete(id: string): Promise<void> {
    const module = await this.requireModule(id);
    if (module.videoIds.length > 0) {
      throw new ConflictError("Module contains videos", "MODULE_HAS_VIDEOS");
    }
    await this.modules.delete(id);
    await this.trainings.update(module.trainingId, (training) => ({
      ...training,
      moduleIds: training.moduleIds.filter((moduleId) => moduleId !== id),
      updatedAt: new Date().toISOString(),
    }));
  }

  public async reorder(
    trainingId: string,
    moduleIds: string[],
  ): Promise<TrainingModule[]> {
    const training = await this.requireTraining(trainingId);
    const currentModules = await this.modules.listByTraining(trainingId);
    const currentIds = new Set(currentModules.map((module) => module.id));
    if (
      moduleIds.length !== currentIds.size ||
      new Set(moduleIds).size !== currentIds.size
    ) {
      throw new ConflictError(
        "The complete unique module order is required",
        "INVALID_MODULE_ORDER",
      );
    }
    if (moduleIds.some((id) => !currentIds.has(id))) {
      throw new ConflictError(
        "Module order contains an unrelated module",
        "INVALID_MODULE_ORDER",
      );
    }

    const now = new Date().toISOString();
    await this.modules.reorder(trainingId, moduleIds, now);
    await this.trainings.update(training.id, (current) => ({
      ...current,
      moduleIds,
      updatedAt: now,
    }));
    return this.modules.listByTraining(trainingId);
  }

  private async requireTraining(id: string) {
    const training = await this.trainings.findById(id);
    if (!training)
      throw new NotFoundError("Training not found", "TRAINING_NOT_FOUND");
    return training;
  }

  private async requireModule(id: string) {
    const module = await this.modules.findById(id);
    if (!module)
      throw new NotFoundError("Module not found", "MODULE_NOT_FOUND");
    return module;
  }
}

export const moduleService = new ModuleService();
