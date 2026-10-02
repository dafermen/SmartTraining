import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AUTH_COOKIE_NAME } from "../constants/auth.js";
import { ValidationError } from "../errors/validation-error.js";
import { authService } from "../services/auth.service.js";
import { loginSchema } from "../validators/user.schemas.js";

export const login: RequestHandler = async (request, response, next) => {
  try {
    const parsedCredentials = loginSchema.safeParse(request.body);
    if (!parsedCredentials.success)
      throw new ValidationError("Username and password are required");

    const result = await authService.login(
      parsedCredentials.data.username,
      parsedCredentials.data.password,
    );

    response.cookie(AUTH_COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/api",
    });
    response
      .status(200)
      .json({ success: true, message: "Login successful", data: result });
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (request, response, next) => {
  try {
    const user = await authService.getActiveUser(request.user!.id);
    const bearerToken = request
      .header("authorization")
      ?.match(/^Bearer\s+([^\s]+)$/)?.[1];
    if (bearerToken) {
      response.cookie(AUTH_COOKIE_NAME, bearerToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        path: "/api",
      });
    }
    response
      .status(200)
      .json({ success: true, message: "Authenticated user", data: { user } });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = (_request, response) => {
  response.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/api",
  });
  response.status(200).json({
    success: true,
    message: "Logout successful",
    data: null,
  });
};
