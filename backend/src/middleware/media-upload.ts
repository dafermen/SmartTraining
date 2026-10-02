import { extname } from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { env } from "../config/env.js";
import { FileUploadError } from "../errors/file-upload-error.js";
import {
  thumbnailStorageRoot,
  videoStorageRoot,
} from "../utils/media-paths.js";

const videoTypes = new Map([
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
]);

const imageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const createStorage = (destination: string, types: Map<string, string>) =>
  multer.diskStorage({
    destination,
    filename: (_request, file, callback) => {
      const extension = types.get(file.mimetype);
      callback(
        null,
        `${randomUUID()}${extension ?? extname(file.originalname).toLowerCase()}`,
      );
    },
  });

export const createVideoUpload = (
  maxFileSize = env.MAX_VIDEO_SIZE_MB * 1_024 * 1_024,
) =>
  multer({
    storage: createStorage(videoStorageRoot, videoTypes),
    limits: { fileSize: maxFileSize, files: 1 },
    fileFilter: (_request, file, callback) => {
      const expectedExtension = videoTypes.get(file.mimetype);
      if (
        !expectedExtension ||
        extname(file.originalname).toLowerCase() !== expectedExtension
      ) {
        callback(
          new FileUploadError(
            "Only matching MP4 and WebM video files are allowed",
          ),
        );
        return;
      }
      callback(null, true);
    },
  });

export const uploadVideo = createVideoUpload();

export const uploadThumbnail = multer({
  storage: createStorage(thumbnailStorageRoot, imageTypes),
  limits: { fileSize: 5 * 1_024 * 1_024, files: 1 },
  fileFilter: (_request, file, callback) => {
    const expectedExtension = imageTypes.get(file.mimetype);
    if (
      !expectedExtension ||
      ![".jpg", ".jpeg", ".png", ".webp"].includes(
        extname(file.originalname).toLowerCase(),
      )
    ) {
      callback(
        new FileUploadError("Only JPEG, PNG and WebP thumbnails are allowed"),
      );
      return;
    }
    callback(null, true);
  },
});
