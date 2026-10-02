import { Router } from "express";
import {
  deleteModule,
  reorderModules,
  updateModule,
} from "../controllers/module.controller.js";
import {
  listVideos,
  uploadVideo as uploadVideoController,
} from "../controllers/video.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorize-roles.js";
import { uploadVideo } from "../middleware/media-upload.js";

export const moduleRouter = Router();

moduleRouter.get("/:moduleId/videos", authenticate, listVideos);
moduleRouter.post(
  "/:moduleId/videos",
  authenticate,
  authorizeRoles("ADMIN"),
  uploadVideo.single("video"),
  uploadVideoController,
);
moduleRouter.use(authenticate, authorizeRoles("ADMIN"));
moduleRouter.patch("/reorder", reorderModules);
moduleRouter.put("/:id", updateModule);
moduleRouter.delete("/:id", deleteModule);
