import type { RequestHandler } from "express";
import { AuthenticationError } from "../errors/authentication-error.js";
import { AuthorizationError } from "../errors/authorization-error.js";
import type { UserRole } from "../types/user.js";

/** Restricts an authenticated route to one or more explicit roles. */
export const authorizeRoles = (...allowedRoles: UserRole[]): RequestHandler => {
  return (request, _response, next) => {
    if (!request.user)
      return next(new AuthenticationError("Authentication is required"));
    if (!allowedRoles.includes(request.user.role))
      return next(new AuthorizationError());
    return next();
  };
};
