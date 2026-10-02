import { Router } from "express";
import {
  deleteVideo,
  getVideo,
  reorderVideos,
  replaceThumbnail,
  retryVideoProcessing,
  serveThumbnail,
  streamVideo,
  updateVideo,
} from "../controllers/video.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorize-roles.js";
import { uploadThumbnail } from "../middleware/media-upload.js";

export const videoRouter = Router();

videoRouter.use(authenticate);
videoRouter.patch("/reorder", authorizeRoles("ADMIN"), reorderVideos);
videoRouter.get("/:id/stream", streamVideo);
videoRouter.get("/:id/thumbnail", serveThumbnail);
videoRouter.post(
  "/:id/thumbnail",
  authorizeRoles("ADMIN"),
  uploadThumbnail.single("thumbnail"),
  replaceThumbnail,
);
videoRouter.get("/:id", getVideo);
videoRouter.post("/:id/retry", authorizeRoles("ADMIN"), retryVideoProcessing);
videoRouter.put("/:id", authorizeRoles("ADMIN"), updateVideo);
videoRouter.delete("/:id", authorizeRoles("ADMIN"), deleteVideo);
