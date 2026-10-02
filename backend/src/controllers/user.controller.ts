import type { RequestHandler } from "express";
import { ValidationError } from "../errors/validation-error.js";
import { userManagementService } from "../services/user-management.service.js";
import {
  createUserSchema,
  resetUserPasswordSchema,
  updateUserSchema,
} from "../validators/user.schemas.js";
import { z } from "zod";

const userIdSchema = z.string().trim().min(1).max(100);
const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const parseUserId = (value: string | string[] | undefined): string => {
  const parsed = userIdSchema.safeParse(value);
  if (!parsed.success)
    throw new ValidationError("A valid user identifier is required");
  return parsed.data;
};

export const listUsers: RequestHandler = async (_request, response, next) => {
  try {
    const users = await userManagementService.list();
    response.status(200).json({
      success: true,
      message: "Users retrieved",
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

export const createUser: RequestHandler = async (request, response, next) => {
  try {
    const input = createUserSchema.safeParse(request.body);
    if (!input.success)
      throw new ValidationError(
        input.error.issues[0]?.message ?? "Invalid user information",
      );
    const user = await userManagementService.create(
      input.data,
      request.user!.id,
    );
    response.status(201).json({
      success: true,
      message: "User created",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser: RequestHandler = async (request, response, next) => {
  try {
    const input = updateUserSchema.safeParse(request.body);
    if (!input.success)
      throw new ValidationError(
        input.error.issues[0]?.message ?? "Invalid user information",
      );
    const user = await userManagementService.update(
      parseUserId(request.params.id),
      input.data,
      request.user!.id,
    );
    response.status(200).json({
      success: true,
      message: "User updated",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const input = resetUserPasswordSchema.safeParse(request.body);
    if (!input.success)
      throw new ValidationError(
        input.error.issues[0]?.message ?? "Invalid password",
      );
    await userManagementService.resetPassword(
      parseUserId(request.params.id),
      input.data.password,
      request.user!.id,
    );
    response.status(200).json({
      success: true,
      message: "Password reset and active sessions revoked",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const listUserAudit: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const query = auditQuerySchema.safeParse(request.query);
    if (!query.success) throw new ValidationError("Invalid audit limit");
    const events = await userManagementService.listAudit(query.data.limit);
    response.status(200).json({
      success: true,
      message: "User audit events retrieved",
      data: { events },
    });
  } catch (error) {
    next(error);
  }
};
