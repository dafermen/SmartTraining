import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { extname } from "node:path";
import type { RequestHandler } from "express";
import { FileUploadError } from "../errors/file-upload-error.js";
import { ValidationError } from "../errors/validation-error.js";
import { videoService } from "../services/video.service.js";
import {
  idParameterSchema,
  reorderVideosSchema,
  updateVideoSchema,
} from "../validators/content.schemas.js";

const parseId = (value: string | string[] | undefined): string => {
  const parsed = idParameterSchema.safeParse(value);
  if (!parsed.success)
    throw new ValidationError("A valid resource identifier is required");
  return parsed.data;
};

const processVideoInBackground = (videoId: string) => {
  setImmediate(() => {
    void videoService.process(videoId).catch((error: unknown) => {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          operation: "video-processing-background",
          videoId,
          message:
            error instanceof Error
              ? error.message
              : "Unexpected video processing failure",
        }),
      );
    });
  });
};

export const listVideos: RequestHandler = async (request, response, next) => {
  try {
    const videos = await videoService.list(
      parseId(request.params.moduleId),
      request.user!,
    );
    response
      .status(200)
      .json({ success: true, message: "Videos retrieved", data: { videos } });
  } catch (error) {
    next(error);
  }
};

export const getVideo: RequestHandler = async (request, response, next) => {
  try {
    const video = await videoService.get(
      parseId(request.params.id),
      request.user!,
    );
    response
      .status(200)
      .json({ success: true, message: "Video retrieved", data: { video } });
  } catch (error) {
    next(error);
  }
};

export const uploadVideo: RequestHandler = async (request, response, next) => {
  try {
    if (!request.file) throw new FileUploadError("A video file is required");
    const input = updateVideoSchema.safeParse(request.body);
    if (!input.success) {
      await unlink(request.file.path).catch(() => undefined);
      throw new ValidationError("A video title is required");
    }
    const video = await videoService.create(
      parseId(request.params.moduleId),
      input.data,
      request.file,
      request.user!.id,
    );
    processVideoInBackground(video.id);
    response.status(202).json({
      success: true,
      message: "Video uploaded and processing",
      data: { video },
    });
  } catch (error) {
    next(error);
  }
};

export const updateVideo: RequestHandler = async (request, response, next) => {
  try {
    const input = updateVideoSchema.safeParse(request.body);
    if (!input.success) throw new ValidationError("A video title is required");
    const video = await videoService.update(
      parseId(request.params.id),
      input.data,
    );
    response
      .status(200)
      .json({ success: true, message: "Video updated", data: { video } });
  } catch (error) {
    next(error);
  }
};

export const retryVideoProcessing: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const video = await videoService.retryProcessing(
      parseId(request.params.id),
    );
    processVideoInBackground(video.id);
    response.status(202).json({
      success: true,
      message: "Video reprocessing started",
      data: { video },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVideo: RequestHandler = async (request, response, next) => {
  try {
    await videoService.delete(parseId(request.params.id));
    response
      .status(200)
      .json({ success: true, message: "Video deleted", data: null });
  } catch (error) {
    next(error);
  }
};

export const reorderVideos: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const input = reorderVideosSchema.safeParse(request.body);
    if (!input.success)
      throw new ValidationError("A complete video order is required");
    const videos = await videoService.reorder(
      input.data.moduleId,
      input.data.videoIds,
    );
    response
      .status(200)
      .json({ success: true, message: "Videos reordered", data: { videos } });
  } catch (error) {
    next(error);
  }
};

export const replaceThumbnail: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    if (!request.file)
      throw new FileUploadError("A thumbnail file is required");
    const video = await videoService.replaceThumbnail(
      parseId(request.params.id),
      request.file,
    );
    response
      .status(200)
      .json({ success: true, message: "Thumbnail updated", data: { video } });
  } catch (error) {
    next(error);
  }
};

export const streamVideo: RequestHandler = async (request, response, next) => {
  try {
    const media = await videoService.mediaPath(
      parseId(request.params.id),
      request.user!,
    );
    const range = request.header("range");
    response.setHeader("Accept-Ranges", "bytes");
    response.setHeader("Content-Type", media.video.mimeType);
    response.setHeader("Cache-Control", "private, no-store");

    if (!range) {
      response.status(200).setHeader("Content-Length", media.size);
      createReadStream(media.path).pipe(response);
      return;
    }
    if (!range.startsWith("bytes=") || range.includes(",")) {
      response
        .status(416)
        .setHeader("Content-Range", `bytes */${media.size}`)
        .end();
      return;
    }
    const [rawStart = "", rawEnd = ""] = range.slice(6).split("-");
    let start: number;
    let end: number;
    if (rawStart === "") {
      const suffixLength = Number(rawEnd);
      if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
        response
          .status(416)
          .setHeader("Content-Range", `bytes */${media.size}`)
          .end();
        return;
      }
      start = Math.max(0, media.size - suffixLength);
      end = media.size - 1;
    } else {
      start = Number(rawStart);
      end = rawEnd === "" ? media.size - 1 : Number(rawEnd);
    }
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      end < start ||
      start >= media.size
    ) {
      response
        .status(416)
        .setHeader("Content-Range", `bytes */${media.size}`)
        .end();
      return;
    }
    end = Math.min(end, media.size - 1);
    response
      .status(206)
      .setHeader("Content-Range", `bytes ${start}-${end}/${media.size}`)
      .setHeader("Content-Length", end - start + 1);
    createReadStream(media.path, { start, end }).pipe(response);
  } catch (error) {
    next(error);
  }
};

export const serveThumbnail: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const media = await videoService.thumbnailPath(
      parseId(request.params.id),
      request.user!,
    );
    const mimeByExtension: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    response
      .status(200)
      .setHeader(
        "Content-Type",
        mimeByExtension[extname(media.path).toLowerCase()] ??
          "application/octet-stream",
      )
      .setHeader("Content-Length", media.size)
      .setHeader("Cache-Control", "private, max-age=300");
    createReadStream(media.path).pipe(response);
  } catch (error) {
    next(error);
  }
};
