import type { RequestHandler } from "express";
import { AUTH_COOKIE_NAME } from "../constants/auth.js";
import { AuthenticationError } from "../errors/authentication-error.js";
import { userRepository } from "../repositories/user.repository.js";
import { tokenService } from "../services/token.service.js";

const cookieValue = (header: string | undefined, name: string) =>
  header
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([cookieName]) => cookieName === name)
    ?.slice(1)
    .join("=");

/** Validates a Bearer token or protected media cookie and confirms the user remains active. */
export const authenticate: RequestHandler = async (
  request,
  _response,
  next,
) => {
  try {
    const authorization = request.header("authorization");
    const [scheme, bearerToken, extra] = authorization?.split(" ") ?? [];
    const token =
      scheme === "Bearer" && bearerToken && !extra
        ? bearerToken
        : cookieValue(request.header("cookie"), AUTH_COOKIE_NAME);

    if (!token) {
      throw new AuthenticationError("Authentication is required");
    }

    let decodedToken: string;
    try {
      decodedToken = decodeURIComponent(token);
    } catch {
      throw new AuthenticationError("Your session is invalid or has expired");
    }
    const identity = tokenService.verify(decodedToken);
    const user = await userRepository.findById(identity.id);
    if (!user?.active)
      throw new AuthenticationError("Your account is no longer active");
    if (user.authVersion !== identity.authVersion)
      throw new AuthenticationError("Your session is invalid or has expired");

    // Resolve the current role from the database instead of trusting stale JWT claims.
    request.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      authVersion: user.authVersion,
    };
    next();
  } catch (error) {
    next(error);
  }
};
