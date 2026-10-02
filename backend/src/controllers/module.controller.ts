import type { RequestHandler } from "express";
import { ValidationError } from "../errors/validation-error.js";
import { moduleService } from "../services/module.service.js";
import {
  createModuleSchema,
  idParameterSchema,
  reorderModulesSchema,
  updateModuleSchema,
} from "../validators/content.schemas.js";

const parseId = (value: string | string[] | undefined): string => {
  const parsed = idParameterSchema.safeParse(value);
  if (!parsed.success)
    throw new ValidationError("A valid resource identifier is required");
  return parsed.data;
};

export const listModules: RequestHandler = async (request, response, next) => {
  try {
    const modules = await moduleService.list(
      parseId(request.params.trainingId),
      request.user!,
    );
    response
      .status(200)
      .json({ success: true, message: "Modules retrieved", data: { modules } });
  } catch (error) {
    next(error);
  }
};

export const createModule: RequestHandler = async (request, response, next) => {
  try {
    const input = createModuleSchema.safeParse(request.body);
    if (!input.success) throw new ValidationError("A module title is required");
    const module = await moduleService.create(
      parseId(request.params.trainingId),
      input.data,
    );
    response
      .status(201)
      .json({ success: true, message: "Module created", data: { module } });
  } catch (error) {
    next(error);
  }
};

export const updateModule: RequestHandler = async (request, response, next) => {
  try {
    const input = updateModuleSchema.safeParse(request.body);
    if (!input.success) throw new ValidationError("A module title is required");
    const module = await moduleService.update(
      parseId(request.params.id),
      input.data,
    );
    response
      .status(200)
      .json({ success: true, message: "Module updated", data: { module } });
  } catch (error) {
    next(error);
  }
};

export const deleteModule: RequestHandler = async (request, response, next) => {
  try {
    await moduleService.delete(parseId(request.params.id));
    response
      .status(200)
      .json({ success: true, message: "Module deleted", data: null });
  } catch (error) {
    next(error);
  }
};

export const reorderModules: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const input = reorderModulesSchema.safeParse(request.body);
    if (!input.success)
      throw new ValidationError("A complete module order is required");
    const modules = await moduleService.reorder(
      input.data.trainingId,
      input.data.moduleIds,
    );
    response
      .status(200)
      .json({ success: true, message: "Modules reordered", data: { modules } });
  } catch (error) {
    next(error);
  }
};
