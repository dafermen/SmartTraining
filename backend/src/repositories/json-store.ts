import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { ZodType } from "zod";
import { AppError } from "../errors/app-error.js";

const writeQueues = new Map<string, Promise<void>>();

const renameWithRetry = async (source: string, destination: string) => {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await rename(source, destination);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (
        attempt === 5 ||
        (code !== "EPERM" && code !== "EBUSY" && code !== "EACCES")
      ) {
        throw error;
      }
      await delay(attempt * 25);
    }
  }
};

/**
 * Provides validated JSON reads and serialized atomic writes for one file.
 * The `.bak` copy is intentionally retained for explicit operator recovery.
 */
export class JsonStore<T> {
  public constructor(
    private readonly filePath: string,
    private readonly schema: ZodType<T>,
    private readonly initialValue: T,
  ) {}

  public async read(): Promise<T> {
    await this.ensureFile();

    try {
      const rawContent = await readFile(this.filePath, "utf8");
      return this.schema.parse(JSON.parse(rawContent));
    } catch {
      throw new AppError(
        `Unable to read validated JSON data from ${this.safeFilename()}`,
        500,
        "JSON_STORAGE_READ_ERROR",
      );
    }
  }

  public async write(value: T): Promise<void> {
    const validatedValue = this.schema.parse(value);
    const previousWrite = writeQueues.get(this.filePath) ?? Promise.resolve();
    const currentWrite = previousWrite.then(() =>
      this.writeAtomic(validatedValue),
    );

    writeQueues.set(
      this.filePath,
      currentWrite.catch(() => undefined),
    );
    return currentWrite;
  }

  public async update(mutator: (current: T) => T | Promise<T>): Promise<T> {
    let updatedValue = this.initialValue;

    await this.enqueue(async () => {
      const currentValue = await this.read();
      updatedValue = this.schema.parse(await mutator(currentValue));
      await this.writeAtomic(updatedValue);
    });

    return updatedValue;
  }

  private async enqueue(operation: () => Promise<void>): Promise<void> {
    const previousWrite = writeQueues.get(this.filePath) ?? Promise.resolve();
    const currentWrite = previousWrite.then(operation);
    writeQueues.set(
      this.filePath,
      currentWrite.catch(() => undefined),
    );
    return currentWrite;
  }

  private async ensureFile(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });

    try {
      await readFile(this.filePath, "utf8");
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== "ENOENT") throw error;
      await writeFile(
        this.filePath,
        `${JSON.stringify(this.initialValue, null, 2)}\n`,
        { flag: "wx" },
      ).catch((writeError: NodeJS.ErrnoException) => {
        if (writeError.code !== "EEXIST") throw writeError;
      });
    }
  }

  private async writeAtomic(value: T): Promise<void> {
    await this.ensureFile();
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    const backupPath = `${this.filePath}.bak`;
    const serializedValue = `${JSON.stringify(value, null, 2)}\n`;

    try {
      await writeFile(temporaryPath, serializedValue, { flag: "w" });
      this.schema.parse(JSON.parse(await readFile(temporaryPath, "utf8")));
      await copyFile(this.filePath, backupPath);
      await renameWithRetry(temporaryPath, this.filePath);
    } catch {
      throw new AppError(
        `Unable to safely write JSON data to ${this.safeFilename()}`,
        500,
        "JSON_STORAGE_WRITE_ERROR",
      );
    }
  }

  private safeFilename(): string {
    return this.filePath.split(/[\\/]/).at(-1) ?? "unknown.json";
  }
}
