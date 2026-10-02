import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import { open, stat, unlink } from "node:fs/promises";
import { AuthorizationError } from "../errors/authorization-error.js";
import { ConflictError } from "../errors/conflict-error.js";
import { FileUploadError } from "../errors/file-upload-error.js";
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
  progressRepository,
  type ProgressRepository,
} from "../repositories/progress.repository.js";
import {
  trainingRepository,
  type TrainingRepository,
} from "../repositories/training.repository.js";
import {
  videoRepository,
  type VideoRepository,
} from "../repositories/video.repository.js";
import type { TrainingVideo } from "../types/content.js";
import {
  safeMediaPath,
  thumbnailStorageRoot,
  videoStorageRoot,
} from "../utils/media-paths.js";
import {
  mediaProcessorService,
  type MediaProcessorService,
} from "./media-processor.service.js";
import type { AuthenticatedIdentity } from "./token.service.js";

const unlinkIfPresent = async (path: string) => {
  await unlink(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
};

export class VideoService {
  public constructor(
    private readonly videos: VideoRepository = videoRepository,
    private readonly modules: ModuleRepository = moduleRepository,
    private readonly trainings: TrainingRepository = trainingRepository,
    private readonly progress: ProgressRepository = progressRepository,
    private readonly processor: MediaProcessorService = mediaProcessorService,
    private readonly assignments: AssignmentRepository = assignmentRepository,
  ) {}

  public async list(
    moduleId: string,
    identity: AuthenticatedIdentity,
  ): Promise<TrainingVideo[]> {
    await this.authorizeModule(moduleId, identity);
    const videos = await this.videos.listByModule(moduleId);
    return identity.role === "ADMIN"
      ? videos
      : videos.filter((video) => video.status === "READY");
  }

  public async get(
    id: string,
    identity: AuthenticatedIdentity,
  ): Promise<TrainingVideo> {
    const video = await this.requireVideo(id);
    await this.authorizeModule(video.moduleId, identity);
    if (identity.role === "LEARNER" && video.status !== "READY") {
      throw new NotFoundError("Video not found", "VIDEO_NOT_FOUND");
    }
    return video;
  }

  public async create(
    moduleId: string,
    input: { title: string; description?: string },
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<TrainingVideo> {
    const module = await this.modules.findById(moduleId);
    if (!module) {
      await unlinkIfPresent(file.path);
      throw new NotFoundError("Module not found", "MODULE_NOT_FOUND");
    }
    await this.validateVideoSignature(file);
    const existingVideos = await this.videos.listByModule(moduleId);
    const now = new Date().toISOString();
    const video: TrainingVideo = {
      id: randomUUID(),
      moduleId,
      title: input.title,
      description: input.description ?? "",
      originalFilename: basename(file.originalname).slice(0, 255),
      storedFilename: file.filename,
      mimeType: file.mimetype,
      fileSize: file.size,
      order: existingVideos.length,
      status: "PROCESSING",
      createdAt: now,
      updatedAt: now,
      uploadedBy,
    };

    await this.videos.create(video);
    try {
      await this.modules.update(moduleId, (current) => ({
        ...current,
        videoIds: [...current.videoIds, video.id],
        updatedAt: now,
      }));
    } catch (error) {
      await this.videos.delete(video.id);
      await unlinkIfPresent(file.path);
      throw error;
    }
    return video;
  }

  public async process(id: string): Promise<void> {
    const video = await this.requireVideo(id);
    const videoPath = safeMediaPath(videoStorageRoot, video.storedFilename);
    let playbackPath = videoPath;
    let optimizedFilename: string | undefined;
    let optimizedPath: string | undefined;
    const thumbnailFilename = `${randomUUID()}.jpg`;
    const thumbnailPath = safeMediaPath(
      thumbnailStorageRoot,
      thumbnailFilename,
    );

    try {
      const duration = await this.processor.probeDuration(videoPath);
      if (video.mimeType === "video/mp4") {
        optimizedFilename = `${randomUUID()}.mp4`;
        optimizedPath = safeMediaPath(videoStorageRoot, optimizedFilename);
        await this.processor.optimizeMp4ForBrowser(videoPath, optimizedPath);
        playbackPath = optimizedPath;
      }
      const playbackStats = await stat(playbackPath);
      await this.processor.createThumbnail(
        playbackPath,
        thumbnailPath,
        duration,
      );
      await this.videos.update(id, (current) => ({
        ...this.withoutProcessingError(current),
        storedFilename: optimizedFilename ?? current.storedFilename,
        fileSize: playbackStats.size,
        duration,
        thumbnailFilename,
        status: "READY",
        updatedAt: new Date().toISOString(),
      }));
      if (optimizedPath) await unlinkIfPresent(videoPath);
    } catch (error) {
      const processingError =
        error instanceof Error
          ? error.message
          : "The video could not be processed";
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          operation: "video-processing",
          videoId: id,
          message: processingError,
        }),
      );
      if (optimizedPath) await unlinkIfPresent(optimizedPath);
      await unlinkIfPresent(thumbnailPath);
      await this.videos.update(id, (current) => ({
        ...current,
        status: "ERROR",
        processingError,
        updatedAt: new Date().toISOString(),
      }));
    }
  }

  public async retryProcessing(id: string): Promise<TrainingVideo> {
    const video = await this.requireVideo(id);
    if (video.status !== "ERROR") {
      throw new ConflictError(
        "Only failed videos can be reprocessed",
        "VIDEO_NOT_FAILED",
      );
    }
    const path = safeMediaPath(videoStorageRoot, video.storedFilename);
    const fileStats = await stat(path).catch(() => undefined);
    if (!fileStats?.isFile()) {
      throw new NotFoundError("Video file not found", "VIDEO_FILE_NOT_FOUND");
    }
    return (await this.videos.update(id, (current) => ({
      ...this.withoutProcessingError(current),
      status: "PROCESSING",
      updatedAt: new Date().toISOString(),
    })))!;
  }

  public async update(
    id: string,
    input: { title: string; description?: string },
  ): Promise<TrainingVideo> {
    await this.requireVideo(id);
    return (await this.videos.update(id, (video) => ({
      ...video,
      title: input.title,
      description: input.description ?? "",
      updatedAt: new Date().toISOString(),
    })))!;
  }

  public async replaceThumbnail(
    id: string,
    file: Express.Multer.File,
  ): Promise<TrainingVideo> {
    const video = await this.requireVideo(id);
    await this.validateImageSignature(file);
    const updated = (await this.videos.update(id, (current) => ({
      ...current,
      thumbnailFilename: file.filename,
      updatedAt: new Date().toISOString(),
    })))!;
    if (video.thumbnailFilename) {
      await unlinkIfPresent(
        safeMediaPath(thumbnailStorageRoot, video.thumbnailFilename),
      );
    }
    return updated;
  }

  public async reorder(
    moduleId: string,
    videoIds: string[],
  ): Promise<TrainingVideo[]> {
    const module = await this.modules.findById(moduleId);
    if (!module)
      throw new NotFoundError("Module not found", "MODULE_NOT_FOUND");
    const currentVideos = await this.videos.listByModule(moduleId);
    const currentIds = new Set(currentVideos.map((video) => video.id));
    if (
      videoIds.length !== currentIds.size ||
      new Set(videoIds).size !== currentIds.size
    ) {
      throw new ConflictError(
        "The complete unique video order is required",
        "INVALID_VIDEO_ORDER",
      );
    }
    if (videoIds.some((id) => !currentIds.has(id))) {
      throw new ConflictError(
        "Video order contains an unrelated video",
        "INVALID_VIDEO_ORDER",
      );
    }
    const now = new Date().toISOString();
    await this.videos.reorder(moduleId, videoIds, now);
    await this.modules.update(moduleId, (current) => ({
      ...current,
      videoIds,
      updatedAt: now,
    }));
    return this.videos.listByModule(moduleId);
  }

  public async delete(id: string): Promise<void> {
    const video = await this.requireVideo(id);
    await this.videos.delete(id);
    await this.modules.update(video.moduleId, (module) => ({
      ...module,
      videoIds: module.videoIds.filter((videoId) => videoId !== id),
      updatedAt: new Date().toISOString(),
    }));
    await this.progress.deleteByVideo(id);
    await unlinkIfPresent(
      safeMediaPath(videoStorageRoot, video.storedFilename),
    );
    if (video.thumbnailFilename) {
      await unlinkIfPresent(
        safeMediaPath(thumbnailStorageRoot, video.thumbnailFilename),
      );
    }
  }

  public async mediaPath(id: string, identity: AuthenticatedIdentity) {
    const video = await this.get(id, identity);
    if (video.status !== "READY")
      throw new ConflictError("Video is not ready", "VIDEO_NOT_READY");
    const path = safeMediaPath(videoStorageRoot, video.storedFilename);
    const fileStats = await stat(path).catch(() => undefined);
    if (!fileStats?.isFile())
      throw new NotFoundError("Video file not found", "VIDEO_FILE_NOT_FOUND");
    return { video, path, size: fileStats.size };
  }

  public async thumbnailPath(id: string, identity: AuthenticatedIdentity) {
    const video = await this.get(id, identity);
    if (!video.thumbnailFilename)
      throw new NotFoundError("Thumbnail not found", "THUMBNAIL_NOT_FOUND");
    const path = safeMediaPath(thumbnailStorageRoot, video.thumbnailFilename);
    const fileStats = await stat(path).catch(() => undefined);
    if (!fileStats?.isFile())
      throw new NotFoundError("Thumbnail not found", "THUMBNAIL_NOT_FOUND");
    return { video, path, size: fileStats.size };
  }

  private async authorizeModule(
    moduleId: string,
    identity: AuthenticatedIdentity,
  ) {
    const module = await this.modules.findById(moduleId);
    if (!module)
      throw new NotFoundError("Module not found", "MODULE_NOT_FOUND");
    const training = await this.trainings.findById(module.trainingId);
    if (!training)
      throw new NotFoundError("Training not found", "TRAINING_NOT_FOUND");
    if (
      identity.role === "LEARNER" &&
      (training.status !== "PUBLISHED" ||
        !(await this.assignments.isAssigned(identity.id, training.id)))
    ) {
      throw new AuthorizationError("This training is not assigned to you");
    }
  }

  private async requireVideo(id: string) {
    const video = await this.videos.findById(id);
    if (!video) throw new NotFoundError("Video not found", "VIDEO_NOT_FOUND");
    return video;
  }

  private async validateVideoSignature(file: Express.Multer.File) {
    const header = await this.readHeader(file.path);
    const isMp4 =
      file.mimetype === "video/mp4" &&
      header.subarray(4, 8).toString("ascii") === "ftyp";
    const isWebm =
      file.mimetype === "video/webm" &&
      header.length >= 4 &&
      header[0] === 0x1a &&
      header[1] === 0x45 &&
      header[2] === 0xdf &&
      header[3] === 0xa3;
    if (!isMp4 && !isWebm) {
      await unlinkIfPresent(file.path);
      throw new FileUploadError(
        "The uploaded file signature does not match its video type",
        415,
        "INVALID_VIDEO_SIGNATURE",
      );
    }
  }

  private async validateImageSignature(file: Express.Multer.File) {
    const header = await this.readHeader(file.path);
    const isJpeg =
      header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const isPng = header.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
    const isWebp =
      header.subarray(0, 4).toString("ascii") === "RIFF" &&
      header.subarray(8, 12).toString("ascii") === "WEBP";
    if (!isJpeg && !isPng && !isWebp) {
      await unlinkIfPresent(file.path);
      throw new FileUploadError(
        "The uploaded thumbnail has an invalid signature",
        415,
        "INVALID_IMAGE_SIGNATURE",
      );
    }
  }

  private async readHeader(path: string): Promise<Buffer> {
    const handle = await open(path, "r");
    try {
      const header = Buffer.alloc(16);
      const { bytesRead } = await handle.read(header, 0, header.length, 0);
      return header.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  }

  private withoutProcessingError(video: TrainingVideo): TrainingVideo {
    const sanitized = { ...video };
    delete sanitized.processingError;
    return sanitized;
  }
}

export const videoService = new VideoService();
