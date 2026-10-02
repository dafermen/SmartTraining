import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { ValidationError } from "../errors/validation-error.js";
import { assignmentRepository } from "../repositories/assignment.repository.js";
import { moduleRepository } from "../repositories/module.repository.js";
import { progressRepository } from "../repositories/progress.repository.js";
import { trainingRepository } from "../repositories/training.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { videoRepository } from "../repositories/video.repository.js";
import type { VideoProgress } from "../types/content.js";

export interface TrainingProgressSummary {
  totalVideos: number;
  startedVideos: number;
  completedVideos: number;
  percentage: number;
}

export interface AdminProgressRow extends VideoProgress {
  userDisplayName: string;
  username: string;
  trainingTitle: string;
  videoTitle: string;
}

export class ProgressService {
  public listMine(userId: string): Promise<VideoProgress[]> {
    return progressRepository.listByUser(userId);
  }

  public async getTraining(userId: string, trainingId: string) {
    const training = await trainingRepository.findById(trainingId);
    if (
      !training ||
      training.status !== "PUBLISHED" ||
      !(await assignmentRepository.isAssigned(userId, trainingId))
    ) {
      throw new NotFoundError("Training not found", "TRAINING_NOT_FOUND");
    }
    const records = await progressRepository.listByUserAndTraining(
      userId,
      trainingId,
    );
    const modules = await moduleRepository.listByTraining(trainingId);
    const videos = (
      await Promise.all(
        modules.map((module) => videoRepository.listByModule(module.id)),
      )
    )
      .flat()
      .filter((video) => video.status === "READY");
    const completedVideos = records.filter(
      (record) => record.status === "COMPLETED",
    ).length;
    const startedVideos = records.filter(
      (record) => record.status !== "NOT_STARTED",
    ).length;
    const summary: TrainingProgressSummary = {
      totalVideos: videos.length,
      startedVideos,
      completedVideos,
      percentage:
        videos.length === 0
          ? 0
          : Math.round((completedVideos / videos.length) * 100),
    };
    return { records, summary };
  }

  public async update(
    userId: string,
    videoId: string,
    input: { currentTime: number; duration: number },
  ): Promise<VideoProgress> {
    const video = await videoRepository.findById(videoId);
    if (!video || video.status !== "READY" || !video.duration) {
      throw new NotFoundError("Video not found", "VIDEO_NOT_FOUND");
    }
    const module = await moduleRepository.findById(video.moduleId);
    const training = module
      ? await trainingRepository.findById(module.trainingId)
      : undefined;
    if (!module || !training || training.status !== "PUBLISHED") {
      throw new NotFoundError("Video not found", "VIDEO_NOT_FOUND");
    }
    if (!(await assignmentRepository.isAssigned(userId, training.id))) {
      throw new NotFoundError("Video not found", "VIDEO_NOT_FOUND");
    }

    const tolerance = Math.max(2, video.duration * 0.05);
    if (
      Math.abs(input.duration - video.duration) > tolerance ||
      input.currentTime > video.duration + tolerance
    ) {
      throw new ValidationError("Progress does not match the protected video");
    }

    const existing = await progressRepository.findByUserAndVideo(
      userId,
      videoId,
    );
    const now = new Date().toISOString();
    const currentTime = Math.min(input.currentTime, video.duration);
    const rawPercentage = (currentTime / video.duration) * 100;
    const percentage = Math.min(100, Math.round(rawPercentage));
    const completed =
      existing?.status === "COMPLETED" ||
      rawPercentage >= env.VIDEO_COMPLETION_PERCENTAGE;
    return progressRepository.upsert({
      id: existing?.id ?? randomUUID(),
      userId,
      trainingId: training.id,
      moduleId: module.id,
      videoId,
      currentTime: completed
        ? Math.max(existing?.currentTime ?? 0, currentTime)
        : currentTime,
      duration: video.duration,
      percentage: completed
        ? Math.max(existing?.percentage ?? 0, percentage)
        : percentage,
      status: completed
        ? "COMPLETED"
        : currentTime > 0
          ? "IN_PROGRESS"
          : "NOT_STARTED",
      startedAt: existing?.startedAt ?? now,
      lastViewedAt: now,
      completedAt: completed ? (existing?.completedAt ?? now) : undefined,
    });
  }

  public async listAdmin(): Promise<AdminProgressRow[]> {
    const [records, users, trainings] = await Promise.all([
      progressRepository.listAll(),
      userRepository.list(),
      trainingRepository.list(),
    ]);
    const rows = await Promise.all(
      records.map(async (record) => {
        const user = users.find((item) => item.id === record.userId);
        const training = trainings.find(
          (item) => item.id === record.trainingId,
        );
        const video = await videoRepository.findById(record.videoId);
        return {
          ...record,
          userDisplayName: user?.displayName ?? "Usuario eliminado",
          username: user?.username ?? "—",
          trainingTitle: training?.title ?? "Capacitación eliminada",
          videoTitle: video?.title ?? "Video eliminado",
        };
      }),
    );
    return rows.sort((left, right) =>
      right.lastViewedAt.localeCompare(left.lastViewedAt),
    );
  }

  public async resetVideo(
    actorId: string,
    userId: string,
    videoId: string,
  ): Promise<void> {
    const [user, video, progress] = await Promise.all([
      userRepository.findById(userId),
      videoRepository.findById(videoId),
      progressRepository.findByUserAndVideo(userId, videoId),
    ]);

    if (!user || user.role !== "LEARNER") {
      throw new NotFoundError("Participant not found", "USER_NOT_FOUND");
    }
    if (!video) throw new NotFoundError("Video not found", "VIDEO_NOT_FOUND");
    if (!progress) {
      throw new NotFoundError(
        "Video progress not found",
        "VIDEO_PROGRESS_NOT_FOUND",
      );
    }

    const deleted = await progressRepository.deleteByUserAndVideo(
      userId,
      videoId,
    );
    if (!deleted) {
      throw new NotFoundError(
        "Video progress not found",
        "VIDEO_PROGRESS_NOT_FOUND",
      );
    }

    userRepository.recordAudit(actorId, userId, "VIDEO_PROGRESS_RESET", {
      videoId,
      trainingId: progress.trainingId,
      moduleId: progress.moduleId,
      previousStatus: progress.status,
      previousPercentage: progress.percentage,
    });
  }
}

export const progressService = new ProgressService();
