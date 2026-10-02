import type { RequestHandler } from "express";
import { ValidationError } from "../errors/validation-error.js";
import { trainingService } from "../services/training.service.js";
import {
  createTrainingSchema,
  idParameterSchema,
  updateTrainingSchema,
  updateTrainingStatusSchema,
} from "../validators/content.schemas.js";

const parseId = (value: string | string[] | undefined): string => {
  const parsed = idParameterSchema.safeParse(value);
  if (!parsed.success)
    throw new ValidationError("A valid resource identifier is required");
  return parsed.data;
};

export const listTrainings: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const trainings = await trainingService.list(request.user!);
    response.status(200).json({
      success: true,
      message: "Trainings retrieved",
      data: { trainings },
    });
  } catch (error) {
    next(error);
  }
};

export const getTraining: RequestHandler = async (request, response, next) => {
  try {
    const training = await trainingService.get(
      parseId(request.params.id),
      request.user!,
    );
    response.status(200).json({
      success: true,
      message: "Training retrieved",
      data: { training },
    });
  } catch (error) {
    next(error);
  }
};

export const createTraining: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const input = createTrainingSchema.safeParse(request.body);
    if (!input.success)
      throw new ValidationError("Title and description are required");
    const training = await trainingService.create(input.data, request.user!.id);
    response
      .status(201)
      .json({ success: true, message: "Training created", data: { training } });
  } catch (error) {
    next(error);
  }
};

export const updateTraining: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const input = updateTrainingSchema.safeParse(request.body);
    if (!input.success)
      throw new ValidationError("Title and description are required");
    const training = await trainingService.update(
      parseId(request.params.id),
      input.data,
    );
    response
      .status(200)
      .json({ success: true, message: "Training updated", data: { training } });
  } catch (error) {
    next(error);
  }
};

export const updateTrainingStatus: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const input = updateTrainingStatusSchema.safeParse(request.body);
    if (!input.success)
      throw new ValidationError("A valid training status is required");
    const training = await trainingService.updateStatus(
      parseId(request.params.id),
      input.data.status,
    );
    response.status(200).json({
      success: true,
      message: "Training status updated",
      data: { training },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTraining: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    await trainingService.delete(parseId(request.params.id));
    response
      .status(200)
      .json({ success: true, message: "Training deleted", data: null });
  } catch (error) {
    next(error);
  }
};
