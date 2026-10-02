import { AppError } from "./app-error.js";

export class FileUploadError extends AppError {
  public constructor(
    message: string,
    statusCode = 400,
    errorCode = "FILE_UPLOAD_ERROR",
  ) {
    super(message, statusCode, errorCode);
  }
}
