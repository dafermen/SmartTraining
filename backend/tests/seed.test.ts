import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("demo seed", () => {
  it("is idempotent and creates corporate demo data without videos", async () => {
    const dataPath = await mkdtemp(join(tmpdir(), "smart-training-seed-"));
    temporaryDirectories.push(dataPath);
    await Promise.all(
      ["users.json", "trainings.json", "modules.json"].map((filename) =>
        writeFile(join(dataPath, filename), "[]\n", "utf8"),
      ),
    );
    const runSeed = () =>
      execFileSync(
        process.execPath,
        [resolve("node_modules/tsx/dist/cli.mjs"), resolve("scripts/seed.ts")],
        {
          cwd: resolve("."),
          env: {
            ...process.env,
            DATA_STORAGE_PATH: dataPath,
            USER_DATABASE_PATH: join(dataPath, "users.sqlite"),
            NODE_ENV: "test",
          },
          stdio: "pipe",
        },
      );

    runSeed();
    runSeed();

    const database = new DatabaseSync(join(dataPath, "users.sqlite"), {
      readOnly: true,
    });
    const users = database.prepare("SELECT id FROM users").all();
    const assignments = database
      .prepare("SELECT id, user_id, training_id FROM training_assignments")
      .all();
    database.close();
    const trainings = JSON.parse(
      await readFile(join(dataPath, "trainings.json"), "utf8"),
    ) as Array<{ moduleIds: string[] }>;
    const modules = JSON.parse(
      await readFile(join(dataPath, "modules.json"), "utf8"),
    ) as unknown[];

    expect(users).toHaveLength(2);
    expect(assignments).toHaveLength(1);
    expect(trainings).toHaveLength(1);
    expect(trainings[0]?.moduleIds).toHaveLength(3);
    expect(modules).toHaveLength(3);
  }, 10_000);
});
