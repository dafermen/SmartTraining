import { z } from "zod";

export const trainingStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const trainingSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(150),
  description: z.string().max(2_000),
  thumbnail: z.string().min(1).optional(),
  status: trainingStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  createdBy: z.string().min(1),
  moduleIds: z.array(z.uuid()),
});

export const trainingModuleSchema = z.object({
  id: z.uuid(),
  trainingId: z.uuid(),
  title: z.string().min(1).max(150),
  description: z.string().max(2_000).optional(),
  order: z.number().int().nonnegative(),
  videoIds: z.array(z.uuid()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const createTrainingSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(3).max(2_000),
});

export const updateTrainingSchema = createTrainingSchema;

export const updateTrainingStatusSchema = z.object({
  status: trainingStatusSchema,
});

export const createModuleSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2_000).optional().default(""),
});

export const updateModuleSchema = createModuleSchema;

export const reorderModulesSchema = z.object({
  trainingId: z.uuid(),
  moduleIds: z.array(z.uuid()).min(1),
});

export const idParameterSchema = z.uuid();

export const trainingVideoSchema = z.object({
  id: z.uuid(),
  moduleId: z.uuid(),
  title: z.string().min(1).max(150),
  description: z.string().max(2_000).optional(),
  originalFilename: z.string().min(1).max(255),
  storedFilename: z.string().regex(/^[0-9a-f-]+\.(mp4|webm)$/i),
  mimeType: z.enum(["video/mp4", "video/webm"]),
  fileSize: z.number().int().positive(),
  duration: z.number().positive().optional(),
  thumbnailFilename: z
    .string()
    .regex(/^[0-9a-f-]+\.(jpg|jpeg|png|webp)$/i)
    .optional(),
  order: z.number().int().nonnegative(),
  status: z.enum(["PROCESSING", "READY", "ERROR"]),
  processingError: z.string().min(1).max(500).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  uploadedBy: z.string().min(1),
});

export const updateVideoSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2_000).optional().default(""),
});

export const reorderVideosSchema = z.object({
  moduleId: z.uuid(),
  videoIds: z.array(z.uuid()).min(1),
});

export const videoProgressSchema = z.object({
  id: z.uuid(),
  userId: z.string().min(1),
  trainingId: z.uuid(),
  moduleId: z.uuid(),
  videoId: z.uuid(),
  currentTime: z.number().nonnegative(),
  duration: z.number().positive(),
  percentage: z.number().min(0).max(100),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  startedAt: z.iso.datetime(),
  lastViewedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().optional(),
});

export const updateProgressSchema = z.object({
  currentTime: z.number().finite().nonnegative(),
  duration: z.number().finite().positive(),
});
