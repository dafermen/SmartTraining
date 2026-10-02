import { AppError } from "./app-error.js";

export class NotFoundError extends AppError {
  public constructor(message: string, errorCode = "RESOURCE_NOT_FOUND") {
    super(message, 404, errorCode);
  }
}
