import { AppError } from "./app-error.js";

export class AuthorizationError extends AppError {
  public constructor(
    message = "You do not have permission to perform this action",
  ) {
    super(message, 403, "AUTHORIZATION_FAILED");
  }
}
