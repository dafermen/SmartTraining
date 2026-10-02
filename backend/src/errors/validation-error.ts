import { AppError } from "./app-error.js";

export class ValidationError extends AppError {
  public constructor(message = "The request data is invalid") {
    super(message, 400, "VALIDATION_ERROR");
  }
}
