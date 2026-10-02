import type { ErrorRequestHandler } from "express";
import { MulterError } from "multer";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  _next,
) => {
  const appError =
    error instanceof AppError
      ? error
      : error instanceof MulterError
        ? new AppError(
            error.code === "LIMIT_FILE_SIZE"
              ? "The uploaded file exceeds the configured size limit"
              : "Invalid file upload",
            error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
            error.code,
          )
        : new AppError("Unexpected server error");

  const logContext = {
    timestamp: new Date().toISOString(),
    level: "error",
    method: request.method,
    path: request.path,
    errorCode: appError.errorCode,
    message: error instanceof Error ? error.message : "Unknown error",
    ...(env.NODE_ENV === "development" && error instanceof Error
      ? { stack: error.stack }
      : {}),
  };

  console.error(JSON.stringify(logContext));

  response.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    errorCode: appError.errorCode,
  });
};
