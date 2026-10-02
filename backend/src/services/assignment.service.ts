import { randomUUID } from "node:crypto";
import { ConflictError } from "../errors/conflict-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import {
  assignmentRepository,
  type AssignmentRepository,
} from "../repositories/assignment.repository.js";
import {
  trainingRepository,
  type TrainingRepository,
} from "../repositories/training.repository.js";
import {
  userRepository,
  type UserRepository,
} from "../repositories/user.repository.js";
import type {
  AdminTrainingAssignment,
  TrainingAssignment,
} from "../types/assignment.js";

export class AssignmentService {
  public constructor(
    private readonly assignments: AssignmentRepository = assignmentRepository,
    private readonly users: UserRepository = userRepository,
    private readonly trainings: TrainingRepository = trainingRepository,
  ) {}

  public async listAdmin(): Promise<AdminTrainingAssignment[]> {
    const [assignments, users, trainings] = await Promise.all([
      this.assignments.list(),
      this.users.list(),
      this.trainings.list(),
    ]);

    return assignments.flatMap((assignment) => {
      const user = users.find(
        (candidate) => candidate.id === assignment.userId,
      );
      const training = trainings.find(
        (candidate) => candidate.id === assignment.trainingId,
      );
      if (!user || !training) return [];
      return [
        {
          ...assignment,
          userDisplayName: user.displayName,
          username: user.username,
          userActive: user.active,
          trainingTitle: training.title,
          trainingStatus: training.status,
        },
      ];
    });
  }

  public async listMine(userId: string): Promise<TrainingAssignment[]> {
    const assignments = await this.assignments.listByUser(userId);
    const trainings = await this.trainings.list();
    const publishedIds = new Set(
      trainings
        .filter((training) => training.status === "PUBLISHED")
        .map((training) => training.id),
    );
    return assignments.filter((assignment) =>
      publishedIds.has(assignment.trainingId),
    );
  }

  public async create(
    input: { userId: string; trainingId: string; dueDate: string | null },
    actorId: string,
  ): Promise<AdminTrainingAssignment> {
    const [user, training] = await Promise.all([
      this.users.findById(input.userId),
      this.trainings.findById(input.trainingId),
    ]);
    if (!user || user.role !== "LEARNER") {
      throw new NotFoundError("Participant not found", "USER_NOT_FOUND");
    }
    if (!user.active) {
      throw new ConflictError(
        "An inactive participant cannot receive assignments",
        "PARTICIPANT_INACTIVE",
      );
    }
    if (!training || training.status !== "PUBLISHED") {
      throw new NotFoundError(
        "Published training not found",
        "TRAINING_NOT_FOUND",
      );
    }

    const now = new Date().toISOString();
    const assignment: TrainingAssignment = {
      id: randomUUID(),
      userId: user.id,
      trainingId: training.id,
      assignedBy: actorId,
      assignedAt: now,
      dueDate: input.dueDate,
      updatedAt: now,
    };
    try {
      await this.assignments.create(assignment, actorId);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("UNIQUE constraint failed")
      ) {
        throw new ConflictError(
          "This training is already assigned to the participant",
          "ASSIGNMENT_ALREADY_EXISTS",
        );
      }
      throw error;
    }
    return {
      ...assignment,
      userDisplayName: user.displayName,
      username: user.username,
      userActive: user.active,
      trainingTitle: training.title,
      trainingStatus: training.status,
    };
  }

  public async updateDueDate(
    id: string,
    dueDate: string | null,
    actorId: string,
  ): Promise<TrainingAssignment> {
    const assignment = await this.assignments.updateDueDate(
      id,
      dueDate,
      actorId,
    );
    if (!assignment) {
      throw new NotFoundError("Assignment not found", "ASSIGNMENT_NOT_FOUND");
    }
    return assignment;
  }

  public async delete(id: string, actorId: string): Promise<void> {
    if (!(await this.assignments.delete(id, actorId))) {
      throw new NotFoundError("Assignment not found", "ASSIGNMENT_NOT_FOUND");
    }
  }
}

export const assignmentService = new AssignmentService();
