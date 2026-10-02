import type { RequestHandler } from "express";
import { z } from "zod";
import { ValidationError } from "../errors/validation-error.js";
import { progressService } from "../services/progress.service.js";
import {
  idParameterSchema,
  updateProgressSchema,
} from "../validators/content.schemas.js";

const parseId = (value: string | string[] | undefined): string => {
  const parsed = idParameterSchema.safeParse(value);
  if (!parsed.success)
    throw new ValidationError("A valid resource identifier is required");
  return parsed.data;
};

const userIdSchema = z.string().trim().min(1).max(100);

const parseUserId = (value: string | string[] | undefined): string => {
  const parsed = userIdSchema.safeParse(value);
  if (!parsed.success)
    throw new ValidationError("A valid user identifier is required");
  return parsed.data;
};

export const listMyProgress: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const records = await progressService.listMine(request.user!.id);
    response.status(200).json({
      success: true,
      message: "Progress retrieved",
      data: { records },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrainingProgress: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const result = await progressService.getTraining(
      request.user!.id,
      parseId(request.params.trainingId),
    );
    response.status(200).json({
      success: true,
      message: "Training progress retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVideoProgress: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const input = updateProgressSchema.safeParse(request.body);
    if (!input.success)
      throw new ValidationError("Valid video progress is required");
    const progress = await progressService.update(
      request.user!.id,
      parseId(request.params.videoId),
      input.data,
    );
    response.status(200).json({
      success: true,
      message: "Progress saved",
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
};

export const listAdminProgress: RequestHandler = async (
  _request,
  response,
  next,
) => {
  try {
    const records = await progressService.listAdmin();
    response.status(200).json({
      success: true,
      message: "Participant progress retrieved",
      data: { records },
    });
  } catch (error) {
    next(error);
  }
};

export const resetUserVideoProgress: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    await progressService.resetVideo(
      request.user!.id,
      parseUserId(request.params.userId),
      parseId(request.params.videoId),
    );
    response.status(200).json({
      success: true,
      message: "Video progress reset",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
