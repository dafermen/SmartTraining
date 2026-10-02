import { z } from "zod";

export const userSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  passwordHash: z.string().startsWith("$2"),
  role: z.enum(["ADMIN", "LEARNER"]),
  displayName: z.string().min(1),
  active: z.boolean(),
  authVersion: z.number().int().nonnegative().default(0),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const usersSchema = z.array(userSchema);

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

const managedUsernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(40)
  .transform((username) => username.toLocaleLowerCase("en-US"))
  .pipe(
    z
      .string()
      .regex(
        /^[a-z0-9][a-z0-9._-]*$/,
        "Username must use lowercase letters, numbers, dots, underscores or hyphens",
      ),
  );

const managedPasswordSchema = z
  .string()
  .min(12)
  .max(72)
  .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
    message: "Password must not exceed 72 UTF-8 bytes",
  });

export const createUserSchema = z.object({
  username: managedUsernameSchema,
  displayName: z.string().trim().min(2).max(100),
  role: z.enum(["ADMIN", "LEARNER"]),
  password: managedPasswordSchema,
});

export const updateUserSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  role: z.enum(["ADMIN", "LEARNER"]),
  active: z.boolean(),
});

export const resetUserPasswordSchema = z.object({
  password: managedPasswordSchema,
});
