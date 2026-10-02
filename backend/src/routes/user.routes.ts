import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createUser,
  listUserAudit,
  listUsers,
  resetUserPassword,
  updateUser,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorize-roles.js";

const sensitiveUserActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const userRouter = Router();

userRouter.use(authenticate, authorizeRoles("ADMIN"));
userRouter.get("/", listUsers);
userRouter.get("/audit", listUserAudit);
userRouter.post("/", sensitiveUserActionLimiter, createUser);
userRouter.put("/:id", updateUser);
userRouter.put("/:id/password", sensitiveUserActionLimiter, resetUserPassword);
