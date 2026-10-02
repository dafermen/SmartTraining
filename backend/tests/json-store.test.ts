import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { JsonStore } from "../src/repositories/json-store.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true })),
  );
});

describe("JsonStore", () => {
  it("creates, validates and atomically updates an array", async () => {
    const directory = await mkdtemp(join(tmpdir(), "smart-training-"));
    temporaryDirectories.push(directory);
    const filePath = join(directory, "items.json");
    const store = new JsonStore(filePath, z.array(z.string()), []);

    expect(await store.read()).toEqual([]);
    await store.update((items) => [...items, "first"]);

    expect(await store.read()).toEqual(["first"]);
    expect(JSON.parse(await readFile(`${filePath}.bak`, "utf8"))).toEqual([]);
  });

  it("reports corrupted JSON without exposing its contents", async () => {
    const directory = await mkdtemp(join(tmpdir(), "smart-training-"));
    temporaryDirectories.push(directory);
    const filePath = join(directory, "private-items.json");
    await writeFile(filePath, '{"secret":"incomplete"', "utf8");
    const store = new JsonStore(filePath, z.array(z.string()), []);

    await expect(store.read()).rejects.toMatchObject({
      statusCode: 500,
      errorCode: "JSON_STORAGE_READ_ERROR",
      message: "Unable to read validated JSON data from private-items.json",
    });
  });
});
