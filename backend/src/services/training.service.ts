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
import type { Training, TrainingStatus } from "../types/content.js";
import type { AuthenticatedIdentity } from "./token.service.js";

export class TrainingService {
  public constructor(
    private readonly trainings: TrainingRepository = trainingRepository,
    private readonly modules: ModuleRepository = moduleRepository,
    private readonly assignments: AssignmentRepository = assignmentRepository,
  ) {}

  public async list(identity: AuthenticatedIdentity): Promise<Training[]> {
    const trainings = await this.trainings.list();
    if (identity.role === "ADMIN") return trainings;
    const assignments = await this.assignments.listByUser(identity.id);
    const assignedTrainingIds = new Set(
      assignments.map((assignment) => assignment.trainingId),
    );
    return trainings.filter(
      (training) =>
        training.status === "PUBLISHED" && assignedTrainingIds.has(training.id),
    );
  }

  public async get(
    id: string,
    identity: AuthenticatedIdentity,
  ): Promise<Training> {
    const training = await this.trainings.findById(id);
    const learnerCanAccess =
      identity.role === "LEARNER" &&
      training?.status === "PUBLISHED" &&
      (await this.assignments.isAssigned(identity.id, id));
    if (!training || (identity.role === "LEARNER" && !learnerCanAccess)) {
      throw new NotFoundError("Training not found", "TRAINING_NOT_FOUND");
    }
    return training;
  }

  public async create(
    input: { title: string; description: string },
    createdBy: string,
  ): Promise<Training> {
    const now = new Date().toISOString();
    return this.trainings.create({
      id: randomUUID(),
      title: input.title,
      description: input.description,
      status: "DRAFT",
      createdAt: now,
      updatedAt: now,
      createdBy,
      moduleIds: [],
    });
  }

  public async update(
    id: string,
    input: { title: string; description: string },
  ): Promise<Training> {
    await this.requireTraining(id);
    return (await this.trainings.update(id, (training) => ({
      ...training,
      ...input,
      updatedAt: new Date().toISOString(),
    })))!;
  }

  public async updateStatus(
    id: string,
    status: TrainingStatus,
  ): Promise<Training> {
    await this.requireTraining(id);
    return (await this.trainings.update(id, (training) => ({
      ...training,
      status,
      updatedAt: new Date().toISOString(),
    })))!;
  }

  public async delete(id: string): Promise<void> {
    await this.requireTraining(id);
    const modules = await this.modules.listByTraining(id);
    if (modules.some((module) => module.videoIds.length > 0)) {
      throw new ConflictError(
        "Training contains videos and must be removed through the video cascade",
        "TRAINING_HAS_VIDEOS",
      );
    }
    await this.modules.deleteByTraining(id);
    await this.trainings.delete(id);
    await this.assignments.deleteByTraining(id);
  }

  private async requireTraining(id: string): Promise<Training> {
    const training = await this.trainings.findById(id);
    if (!training)
      throw new NotFoundError("Training not found", "TRAINING_NOT_FOUND");
    return training;
  }
}

export const trainingService = new TrainingService();
