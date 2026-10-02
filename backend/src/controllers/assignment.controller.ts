import type { RequestHandler } from "express";
import { z } from "zod";
import { ValidationError } from "../errors/validation-error.js";
import { assignmentService } from "../services/assignment.service.js";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from "../validators/assignment.schemas.js";

const assignmentIdSchema = z.uuid();

const parseId = (value: string | string[] | undefined): string => {
  const parsed = assignmentIdSchema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError("A valid assignment identifier is required");
  }
  return parsed.data;
};

export const listAssignments: RequestHandler = async (
  _request,
  response,
  next,
) => {
  try {
    const assignments = await assignmentService.listAdmin();
    response.status(200).json({
      success: true,
      message: "Assignments retrieved",
      data: { assignments },
    });
  } catch (error) {
    next(error);
  }
};

export const listMyAssignments: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const assignments = await assignmentService.listMine(request.user!.id);
    response.status(200).json({
      success: true,
      message: "Participant assignments retrieved",
      data: { assignments },
    });
  } catch (error) {
    next(error);
  }
};

export const createAssignment: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const input = createAssignmentSchema.safeParse(request.body);
    if (!input.success) {
      throw new ValidationError(
        input.error.issues[0]?.message ?? "Invalid assignment information",
      );
    }
    const assignment = await assignmentService.create(
      input.data,
      request.user!.id,
    );
    response.status(201).json({
      success: true,
      message: "Training assigned",
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAssignment: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const input = updateAssignmentSchema.safeParse(request.body);
    if (!input.success) {
      throw new ValidationError(
        input.error.issues[0]?.message ?? "Invalid due date",
      );
    }
    const assignment = await assignmentService.updateDueDate(
      parseId(request.params.id),
      input.data.dueDate,
      request.user!.id,
    );
    response.status(200).json({
      success: true,
      message: "Assignment updated",
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAssignment: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    await assignmentService.delete(
      parseId(request.params.id),
      request.user!.id,
    );
    response.status(200).json({
      success: true,
      message: "Training unassigned",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
