import { describe, expect, it } from "vitest";
import {
  createTrainingSchema,
  reorderModulesSchema,
  updateProgressSchema,
} from "../src/validators/content.schemas.js";

describe("content validators", () => {
  it("normalizes valid training text", () => {
    expect(
      createTrainingSchema.parse({
        title: "  Seguridad industrial  ",
        description: "  Curso obligatorio  ",
      }),
    ).toEqual({
      title: "Seguridad industrial",
      description: "Curso obligatorio",
    });
  });

  it("rejects incomplete reorder lists and invalid identifiers", () => {
    expect(
      reorderModulesSchema.safeParse({ trainingId: "invalid", moduleIds: [] })
        .success,
    ).toBe(false);
  });

  it("rejects negative, infinite and zero-duration progress", () => {
    for (const input of [
      { currentTime: -1, duration: 100 },
      { currentTime: Number.POSITIVE_INFINITY, duration: 100 },
      { currentTime: 10, duration: 0 },
    ]) {
      expect(updateProgressSchema.safeParse(input).success).toBe(false);
    }
  });
});
