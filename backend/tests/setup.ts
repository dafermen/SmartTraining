import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll } from "vitest";

const isolatedDataPath = mkdtempSync(join(tmpdir(), "smart-training-tests-"));
const isolatedMediaPath = mkdtempSync(
  join(tmpdir(), "smart-training-media-tests-"),
);
mkdirSync(isolatedDataPath, { recursive: true });
mkdirSync(join(isolatedMediaPath, "videos"), { recursive: true });
mkdirSync(join(isolatedMediaPath, "thumbnails"), { recursive: true });

for (const filename of [
  "users.json",
  "trainings.json",
  "modules.json",
  "videos.json",
  "progress.json",
  "development-phases.json",
  "development-tasks.json",
]) {
  copyFileSync(resolve("data", filename), join(isolatedDataPath, filename));
}

// Media fixtures are created by each test and must not depend on local user uploads.
writeFileSync(join(isolatedDataPath, "videos.json"), "[]\n", "utf8");
writeFileSync(join(isolatedDataPath, "progress.json"), "[]\n", "utf8");

process.env.DATA_STORAGE_PATH = isolatedDataPath;
process.env.USER_DATABASE_PATH = join(isolatedDataPath, "users.sqlite");
process.env.VIDEO_STORAGE_PATH = join(isolatedMediaPath, "videos");
process.env.THUMBNAIL_STORAGE_PATH = join(isolatedMediaPath, "thumbnails");
process.env.TEST_MEDIA_ROOT = isolatedMediaPath;
process.env.NODE_ENV = "test";

beforeAll(async () => {
  // Preserve access to the original media fixtures while new tests verify that
  // subsequently published training remains private until explicitly assigned.
  await import("../src/repositories/user.repository.js");
  const { assignmentRepository } =
    await import("../src/repositories/assignment.repository.js");
  const now = new Date().toISOString();
  if (
    !(await assignmentRepository.isAssigned(
      "seed-learner",
      "10000000-0000-4000-8000-000000000001",
    ))
  ) {
    await assignmentRepository.create(
      {
        id: "50000000-0000-4000-8000-000000000001",
        userId: "seed-learner",
        trainingId: "10000000-0000-4000-8000-000000000001",
        assignedBy: "seed-admin",
        assignedAt: now,
        dueDate: null,
        updatedAt: now,
      },
      "seed-admin",
    );
  }
});

afterAll(async () => {
  const { assignmentRepository } =
    await import("../src/repositories/assignment.repository.js");
  const { userRepository } =
    await import("../src/repositories/user.repository.js");
  assignmentRepository.close();
  userRepository.close();
  rmSync(isolatedDataPath, { recursive: true, force: true });
  rmSync(isolatedMediaPath, { recursive: true, force: true });
});
