import { AppError } from "./app-error.js";

export class ConflictError extends AppError {
  public constructor(message: string, errorCode = "RESOURCE_CONFLICT") {
    super(message, 409, errorCode);
  }
}
