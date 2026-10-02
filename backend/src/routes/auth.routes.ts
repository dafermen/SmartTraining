import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again later.",
      errorCode: "LOGIN_RATE_LIMITED",
    });
  },
});

export const authRouter = Router();

authRouter.post("/login", loginLimiter, login);
authRouter.get("/me", authenticate, me);
authRouter.post("/logout", authenticate, logout);
