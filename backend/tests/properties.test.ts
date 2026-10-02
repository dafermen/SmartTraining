import { resolve, sep } from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  createTrainingSchema,
  reorderModulesSchema,
  updateProgressSchema,
} from "../src/validators/content.schemas.js";
import { safeMediaPath } from "../src/utils/media-paths.js";

describe("content properties and invariants", () => {
  it("accepts every finite non-negative progress pair", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.integer({ min: 1, max: 10_000_000 }),
        (currentTime, duration) => {
          expect(
            updateProgressSchema.safeParse({ currentTime, duration }).success,
          ).toBe(true);
        },
      ),
    );
  });

  it("rejects every generated negative progress value", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10_000_000, max: -1 }),
        fc.integer({ min: 1, max: 10_000_000 }),
        (currentTime, duration) => {
          expect(
            updateProgressSchema.safeParse({ currentTime, duration }).success,
          ).toBe(false);
        },
      ),
    );
  });

  it("accepts generated UUID orders without changing their values", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 30 }),
        (trainingId, moduleIds) => {
          const result = reorderModulesSchema.parse({ trainingId, moduleIds });
          expect(result).toEqual({ trainingId, moduleIds });
        },
      ),
    );
  });

  it("always trims generated valid training text", () => {
    const validText = fc
      .string({ minLength: 3, maxLength: 120 })
      .filter((value) => value.trim().length >= 3);

    fc.assert(
      fc.property(validText, validText, (title, description) => {
        const result = createTrainingSchema.parse({
          title: `  ${title}  `,
          description: `  ${description}  `,
        });
        expect(result.title).toBe(title.trim());
        expect(result.description).toBe(description.trim());
      }),
    );
  });

  it("keeps generated media filenames inside the approved root", () => {
    const root = resolve("test-results", "property-media");
    const stem = fc
      .array(fc.constantFrom(..."0123456789abcdef-"), {
        minLength: 1,
        maxLength: 80,
      })
      .map((characters) => characters.join(""));
    const filename = fc
      .tuple(stem, fc.constantFrom("mp4", "webm", "jpg", "png", "webp"))
      .map(([name, extension]) => `${name}.${extension}`);

    fc.assert(
      fc.property(filename, (generatedFilename) => {
        const result = safeMediaPath(root, generatedFilename);
        expect(result.startsWith(`${root}${sep}`)).toBe(true);
      }),
    );
  });

  it("rejects generated filenames that do not match the internal format", () => {
    const root = resolve("test-results", "property-media");
    const allowed = /^[0-9a-f-]+\.(mp4|webm|jpg|jpeg|png|webp)$/i;

    fc.assert(
      fc.property(
        fc.string({ maxLength: 100 }).filter((value) => !allowed.test(value)),
        (generatedFilename) => {
          expect(() => safeMediaPath(root, generatedFilename)).toThrow();
        },
      ),
    );
  });
});
