import { AppError } from "./app-error.js";

export class AuthenticationError extends AppError {
  public constructor(message = "Invalid username or password") {
    super(message, 401, "AUTHENTICATION_FAILED");
  }
}
