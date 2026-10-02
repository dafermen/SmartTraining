import { mkdirSync } from "node:fs";
import { resolve, sep } from "node:path";
import { env } from "../config/env.js";
import { FileUploadError } from "../errors/file-upload-error.js";

export const videoStorageRoot = resolve(env.VIDEO_STORAGE_PATH);
export const thumbnailStorageRoot = resolve(env.THUMBNAIL_STORAGE_PATH);

mkdirSync(videoStorageRoot, { recursive: true });
mkdirSync(thumbnailStorageRoot, { recursive: true });

/** Resolves a generated filename under its approved root and rejects traversal. */
export const safeMediaPath = (root: string, filename: string): string => {
  if (!/^[0-9a-f-]+\.(mp4|webm|jpg|jpeg|png|webp)$/i.test(filename)) {
    throw new FileUploadError(
      "Invalid internal media filename",
      400,
      "INVALID_MEDIA_PATH",
    );
  }
  const resolvedPath = resolve(root, filename);
  if (!resolvedPath.startsWith(`${root}${sep}`)) {
    throw new FileUploadError("Invalid media path", 400, "INVALID_MEDIA_PATH");
  }
  return resolvedPath;
};
