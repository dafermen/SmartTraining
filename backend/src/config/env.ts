import "dotenv/config";
import { z } from "zod";

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    FRONTEND_URL: z.url().default("http://127.0.0.1:5173"),
    JWT_SECRET: z
      .string()
      .min(32)
      .default("development-only-secret-change-me-now"),
    JWT_EXPIRES_IN: z.string().min(2).default("8h"),
    MAX_VIDEO_SIZE_MB: z.coerce.number().positive().default(500),
    VIDEO_STORAGE_PATH: z.string().min(1).default("./storage/videos"),
    THUMBNAIL_STORAGE_PATH: z.string().min(1).default("./storage/thumbnails"),
    DATA_STORAGE_PATH: z.string().min(1).default("./data"),
    USER_DATABASE_PATH: z.string().min(1).default("./data/users.sqlite"),
    DOCUMENTATION_PATH: z.string().min(1).default("../docs"),
    FFMPEG_PATH: z.string().default(""),
    FFPROBE_PATH: z.string().default(""),
    VIDEO_COMPLETION_PERCENTAGE: z.coerce.number().min(1).max(100).default(80),
    PROGRESS_SAVE_INTERVAL_SECONDS: z.coerce
      .number()
      .int()
      .min(5)
      .max(60)
      .default(10),
  })
  .superRefine((configuration, context) => {
    if (
      configuration.NODE_ENV === "production" &&
      configuration.JWT_SECRET === "development-only-secret-change-me-now"
    ) {
      context.addIssue({
        code: "custom",
        path: ["JWT_SECRET"],
        message: "A production JWT secret must be provided explicitly.",
      });
    }
  });

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const issues = parsedEnvironment.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsedEnvironment.data;
