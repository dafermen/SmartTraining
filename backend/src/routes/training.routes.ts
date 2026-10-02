import { Router } from "express";
import {
  createTraining,
  deleteTraining,
  getTraining,
  listTrainings,
  updateTraining,
  updateTrainingStatus,
} from "../controllers/training.controller.js";
import { createModule, listModules } from "../controllers/module.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorize-roles.js";

export const trainingRouter = Router();

trainingRouter.use(authenticate);
trainingRouter.get("/", listTrainings);
trainingRouter.post("/", authorizeRoles("ADMIN"), createTraining);
trainingRouter.get("/:trainingId/modules", listModules);
trainingRouter.post(
  "/:trainingId/modules",
  authorizeRoles("ADMIN"),
  createModule,
);
trainingRouter.get("/:id", getTraining);
trainingRouter.put("/:id", authorizeRoles("ADMIN"), updateTraining);
trainingRouter.delete("/:id", authorizeRoles("ADMIN"), deleteTraining);
trainingRouter.patch(
  "/:id/status",
  authorizeRoles("ADMIN"),
  updateTrainingStatus,
);
