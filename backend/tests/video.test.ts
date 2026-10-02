import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { errorHandler } from "../src/middleware/error-handler.js";
import { createVideoUpload } from "../src/middleware/media-upload.js";
import { progressRepository } from "../src/repositories/progress.repository.js";

const login = async (username: "admin" | "learner") => {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ username, password: "comillas22" })
    .expect(200);
  return response.body.data.token as string;
};

const loginWithSession = async (username: "admin" | "learner") => {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ username, password: "comillas22" })
    .expect(200);
  return {
    token: response.body.data.token as string,
    cookie: response.headers["set-cookie"]?.[0]?.split(";")[0] ?? "",
  };
};

describe("video upload, processing and protected streaming", () => {
  it("rejects files above the configured upload limit and removes partial data", async () => {
    const sizeLimitApp = express();
    sizeLimitApp.post(
      "/upload",
      createVideoUpload(10).single("video"),
      (_request, response) => response.status(204).end(),
    );
    sizeLimitApp.use(errorHandler);

    const response = await request(sizeLimitApp)
      .post("/upload")
      .attach("video", Buffer.alloc(11), {
        filename: "oversized.mp4",
        contentType: "video/mp4",
      })
      .expect(413);

    expect(response.body.errorCode).toBe("LIMIT_FILE_SIZE");
    expect(
      readdirSync(join(process.env.TEST_MEDIA_ROOT!, "videos")),
    ).toHaveLength(0);
  });

  it("rejects a file whose signature does not match MP4", async () => {
    const adminToken = await login("admin");
    const response = await request(createApp())
      .post("/api/modules/20000000-0000-4000-8000-000000000001/videos")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("title", "Invalid video")
      .field("description", "Invalid signature")
      .attach("video", Buffer.from("this is not an mp4"), {
        filename: "invalid.mp4",
        contentType: "video/mp4",
      })
      .expect(415);

    expect(response.body.errorCode).toBe("INVALID_VIDEO_SIGNATURE");
    expect(
      readdirSync(join(process.env.TEST_MEDIA_ROOT!, "videos")),
    ).toHaveLength(0);
  });

  it("preserves a failed upload reason and allows reprocessing", async () => {
    const adminToken = await login("admin");
    const app = createApp();
    const invalidMediaWithMp4Signature = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
      0x00, 0x00, 0x00, 0x00,
    ]);

    const upload = await request(app)
      .post("/api/modules/20000000-0000-4000-8000-000000000001/videos")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("title", "Failed processing fixture")
      .attach("video", invalidMediaWithMp4Signature, {
        filename: "broken.mp4",
        contentType: "video/mp4",
      })
      .expect(202);
    const videoId = upload.body.data.video.id as string;

    let failedVideo = upload.body.data.video;
    for (
      let attempt = 0;
      attempt < 20 && failedVideo.status === "PROCESSING";
      attempt += 1
    ) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const response = await request(app)
        .get(`/api/videos/${videoId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      failedVideo = response.body.data.video;
    }
    expect(failedVideo.status).toBe("ERROR");
    expect(failedVideo.processingError).toMatch(/FFprobe/i);

    const retry = await request(app)
      .post(`/api/videos/${videoId}/retry`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(202);
    expect(retry.body.data.video.status).toBe("PROCESSING");
    expect(retry.body.data.video.processingError).toBeUndefined();

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const response = await request(app)
        .get(`/api/videos/${videoId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      if (response.body.data.video.status === "ERROR") break;
    }
    await request(app)
      .delete(`/api/videos/${videoId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
  });

  it("processes a real MP4 and supports protected byte ranges", async () => {
    const sourcePath = join(process.env.TEST_MEDIA_ROOT!, "source.mp4");
    execFileSync(ffmpegInstaller.path, [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=green:s=320x180:d=1",
      "-pix_fmt",
      "yuv420p",
      sourcePath,
    ]);
    const adminToken = await login("admin");
    const learnerSession = await loginWithSession("learner");
    const app = createApp();

    const upload = await request(app)
      .post("/api/modules/20000000-0000-4000-8000-000000000001/videos")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("title", "Generated safety video")
      .field("description", "One-second fixture")
      .attach("video", sourcePath, { contentType: "video/mp4" })
      .expect(202);
    const videoId = upload.body.data.video.id as string;

    let video = upload.body.data.video;
    for (
      let attempt = 0;
      attempt < 40 && video.status === "PROCESSING";
      attempt += 1
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const response = await request(app)
        .get(`/api/videos/${videoId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      video = response.body.data.video;
    }
    expect(video.status).toBe("READY");
    expect(video.duration).toBeGreaterThan(0);

    await request(app).get(`/api/videos/${videoId}/stream`).expect(401);

    const fullVideo = await request(app)
      .get(`/api/videos/${videoId}/stream`)
      .set("Cookie", learnerSession.cookie)
      .expect(200);
    expect(fullVideo.headers["accept-ranges"]).toBe("bytes");
    expect(Number(fullVideo.headers["content-length"])).toBeGreaterThan(0);

    const range = await request(app)
      .get(`/api/videos/${videoId}/stream`)
      .set("Cookie", learnerSession.cookie)
      .set("Range", "bytes=0-99")
      .expect(206);
    expect(range.headers["accept-ranges"]).toBe("bytes");
    expect(range.headers["content-range"]).toMatch(/^bytes 0-99\//);
    expect(Number(range.headers["content-length"])).toBe(100);

    await request(app)
      .get(`/api/videos/${videoId}/stream`)
      .set("Authorization", `Bearer ${learnerSession.token}`)
      .set("Range", "bytes=999999999-")
      .expect(416);

    await request(app)
      .get("/api/videos/00000000-0000-4000-8000-000000000099/stream")
      .set("Cookie", learnerSession.cookie)
      .expect(404);

    await request(app)
      .get(`/api/videos/${videoId}/thumbnail`)
      .set("Cookie", learnerSession.cookie)
      .expect(200)
      .expect("Content-Type", /image\/jpeg/);

    const almostCompleted = await request(app)
      .put(`/api/progress/videos/${videoId}`)
      .set("Cookie", learnerSession.cookie)
      .send({ currentTime: video.duration * 0.796, duration: video.duration })
      .expect(200);
    expect(almostCompleted.body.data.progress).toMatchObject({
      videoId,
      percentage: 80,
      status: "IN_PROGRESS",
    });

    const completed = await request(app)
      .put(`/api/progress/videos/${videoId}`)
      .set("Cookie", learnerSession.cookie)
      .send({ currentTime: video.duration * 0.85, duration: video.duration })
      .expect(200);
    expect(completed.body.data.progress).toMatchObject({
      videoId,
      status: "COMPLETED",
    });
    expect(completed.body.data.progress.percentage).toBeGreaterThanOrEqual(80);

    await request(app)
      .put(`/api/progress/videos/${videoId}`)
      .set("Cookie", learnerSession.cookie)
      .send({ currentTime: video.duration, duration: video.duration + 10 })
      .expect(400);

    const trainingProgress = await request(app)
      .get("/api/progress/trainings/10000000-0000-4000-8000-000000000001")
      .set("Cookie", learnerSession.cookie)
      .expect(200);
    expect(trainingProgress.body.data.summary).toMatchObject({
      totalVideos: 1,
      completedVideos: 1,
      percentage: 100,
    });

    const regressed = await request(app)
      .put(`/api/progress/videos/${videoId}`)
      .set("Cookie", learnerSession.cookie)
      .send({ currentTime: video.duration * 0.1, duration: video.duration })
      .expect(200);
    expect(regressed.body.data.progress.status).toBe("COMPLETED");

    const adminProgress = await request(app)
      .get("/api/admin/progress")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(adminProgress.body.data.records[0]).toMatchObject({
      videoId,
      username: "learner",
      status: "COMPLETED",
    });

    const learnerProgress = adminProgress.body.data.records[0];
    await progressRepository.upsert({
      ...learnerProgress,
      id: "90000000-0000-4000-8000-000000000001",
      userId: "another-learner",
    });
    await request(app)
      .delete(
        `/api/admin/progress/users/${learnerProgress.userId}/videos/${videoId}`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(
      await progressRepository.findByUserAndVideo("another-learner", videoId),
    ).toBeDefined();

    const resetTrainingProgress = await request(app)
      .get("/api/progress/trainings/10000000-0000-4000-8000-000000000001")
      .set("Cookie", learnerSession.cookie)
      .expect(200);
    expect(resetTrainingProgress.body.data).toMatchObject({
      records: [],
      summary: {
        totalVideos: 1,
        startedVideos: 0,
        completedVideos: 0,
        percentage: 0,
      },
    });

    const resetAudit = await request(app)
      .get("/api/users/audit")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(resetAudit.body.data.events[0]).toMatchObject({
      targetUserId: learnerProgress.userId,
      action: "VIDEO_PROGRESS_RESET",
    });
    expect(JSON.parse(resetAudit.body.data.events[0].details)).toMatchObject({
      videoId,
      previousStatus: "COMPLETED",
    });

    await request(app)
      .delete(
        `/api/admin/progress/users/${learnerProgress.userId}/videos/${videoId}`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);

    await request(app)
      .get("/api/admin/progress")
      .set("Cookie", learnerSession.cookie)
      .expect(403);

    const storedVideoPath = join(
      process.env.TEST_MEDIA_ROOT!,
      "videos",
      video.storedFilename,
    );
    const storedThumbnailPath = join(
      process.env.TEST_MEDIA_ROOT!,
      "thumbnails",
      video.thumbnailFilename,
    );
    expect(existsSync(storedVideoPath)).toBe(true);
    expect(existsSync(storedThumbnailPath)).toBe(true);

    await request(app)
      .delete(`/api/videos/${videoId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(existsSync(storedVideoPath)).toBe(false);
    expect(existsSync(storedThumbnailPath)).toBe(false);
  }, 20_000);
});
