import { afterEach, describe, expect, it, vi } from "vitest";
import { assignmentRepository } from "../src/repositories/assignment.repository.js";
import { moduleRepository } from "../src/repositories/module.repository.js";
import { trainingRepository } from "../src/repositories/training.repository.js";
import { TrainingService } from "../src/services/training.service.js";
import type { Training, TrainingModule } from "../src/types/content.js";

const publishedTraining: Training = {
  id: "10000000-0000-4000-8000-000000000001",
  title: "Seguridad corporativa",
  description: "Capacitación publicada",
  status: "PUBLISHED",
  createdAt: "2026-07-18T00:00:00.000Z",
  updatedAt: "2026-07-18T00:00:00.000Z",
  createdBy: "seed-admin",
  moduleIds: [],
};

const draftTraining: Training = {
  ...publishedTraining,
  id: "10000000-0000-4000-8000-000000000002",
  title: "Borrador privado",
  status: "DRAFT",
};

describe("TrainingService", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns every status to administrators and assigned published content to learners", async () => {
    vi.spyOn(trainingRepository, "list").mockResolvedValue([
      publishedTraining,
      draftTraining,
    ]);
    vi.spyOn(assignmentRepository, "listByUser").mockResolvedValue([
      {
        id: "50000000-0000-4000-8000-000000000001",
        userId: "learner",
        trainingId: publishedTraining.id,
        assignedBy: "admin",
        assignedAt: publishedTraining.createdAt,
        dueDate: null,
        updatedAt: publishedTraining.updatedAt,
      },
    ]);
    const service = new TrainingService();

    await expect(
      service.list({ id: "admin", username: "admin", role: "ADMIN" }),
    ).resolves.toHaveLength(2);
    await expect(
      service.list({ id: "learner", username: "learner", role: "LEARNER" }),
    ).resolves.toEqual([publishedTraining]);
  });

  it("hides a draft behind the same not-found response used for missing content", async () => {
    vi.spyOn(trainingRepository, "findById").mockResolvedValue(draftTraining);
    const service = new TrainingService();

    await expect(
      service.get(draftTraining.id, {
        id: "learner",
        username: "learner",
        role: "LEARNER",
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      errorCode: "TRAINING_NOT_FOUND",
    });
  });

  it("prevents deleting a training while one of its modules contains videos", async () => {
    const moduleWithVideo: TrainingModule = {
      id: "20000000-0000-4000-8000-000000000001",
      trainingId: publishedTraining.id,
      title: "Módulo",
      order: 0,
      videoIds: ["30000000-0000-4000-8000-000000000001"],
      createdAt: publishedTraining.createdAt,
      updatedAt: publishedTraining.updatedAt,
    };
    vi.spyOn(trainingRepository, "findById").mockResolvedValue(
      publishedTraining,
    );
    vi.spyOn(moduleRepository, "listByTraining").mockResolvedValue([
      moduleWithVideo,
    ]);
    const deleteTraining = vi.spyOn(trainingRepository, "delete");
    const service = new TrainingService();

    await expect(service.delete(publishedTraining.id)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: "TRAINING_HAS_VIDEOS",
    });
    expect(deleteTraining).not.toHaveBeenCalled();
  });
});
