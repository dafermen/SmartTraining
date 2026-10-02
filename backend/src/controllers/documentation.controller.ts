import type { RequestHandler } from "express";
import { ValidationError } from "../errors/validation-error.js";
import { documentationService } from "../services/documentation.service.js";

const documentIdPattern = /^\d{2}-[a-z0-9-]+$/;

export const listDocumentation: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const documents = await documentationService.list(request.user!.role);
    response.status(200).json({
      success: true,
      message: "Documentation retrieved",
      data: { documents },
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentation: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const documentId = request.params.documentId;
    if (typeof documentId !== "string" || !documentIdPattern.test(documentId))
      throw new ValidationError("A valid document identifier is required");
    const document = await documentationService.get(
      documentId,
      request.user!.role,
    );
    response.status(200).json({
      success: true,
      message: "Document retrieved",
      data: { document },
    });
  } catch (error) {
    next(error);
  }
};
