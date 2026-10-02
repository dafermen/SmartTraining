import { Router } from "express";
import {
  createAssignment,
  deleteAssignment,
  listAssignments,
  listMyAssignments,
  updateAssignment,
} from "../controllers/assignment.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorize-roles.js";

export const assignmentRouter = Router();

assignmentRouter.use(authenticate);
assignmentRouter.get("/me", authorizeRoles("LEARNER"), listMyAssignments);
assignmentRouter.get("/", authorizeRoles("ADMIN"), listAssignments);
assignmentRouter.post("/", authorizeRoles("ADMIN"), createAssignment);
assignmentRouter.put("/:id", authorizeRoles("ADMIN"), updateAssignment);
assignmentRouter.delete("/:id", authorizeRoles("ADMIN"), deleteAssignment);
