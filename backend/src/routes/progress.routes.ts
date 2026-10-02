import { Router } from "express";
import {
  getTrainingProgress,
  listAdminProgress,
  listMyProgress,
  resetUserVideoProgress,
  updateVideoProgress,
} from "../controllers/progress.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorize-roles.js";

export const progressRouter = Router();
progressRouter.use(authenticate, authorizeRoles("LEARNER"));
progressRouter.get("/me", listMyProgress);
progressRouter.get("/trainings/:trainingId", getTrainingProgress);
progressRouter.put("/videos/:videoId", updateVideoProgress);

export const adminProgressRouter = Router();
adminProgressRouter.use(authenticate, authorizeRoles("ADMIN"));
adminProgressRouter.get("/", listAdminProgress);
adminProgressRouter.delete(
  "/users/:userId/videos/:videoId",
  resetUserVideoProgress,
);
