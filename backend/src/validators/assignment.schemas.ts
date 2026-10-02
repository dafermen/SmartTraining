import { z } from "zod";

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must use YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year!, month! - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month! - 1 &&
      parsed.getUTCDate() === day
    );
  }, "Due date must be a valid calendar date");

export const createAssignmentSchema = z.object({
  userId: z.string().trim().min(1).max(100),
  trainingId: z.uuid(),
  dueDate: dueDateSchema.nullable().optional().default(null),
});

export const updateAssignmentSchema = z.object({
  dueDate: dueDateSchema.nullable(),
});
