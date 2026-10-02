import cors from "cors";
import express from "express";
import helmet from "helmet";
import { assignmentRouter } from "./routes/assignment.routes.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { authRouter } from "./routes/auth.routes.js";
import { documentationRouter } from "./routes/documentation.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { moduleRouter } from "./routes/module.routes.js";
import {
  adminProgressRouter,
  progressRouter,
} from "./routes/progress.routes.js";
import { trainingRouter } from "./routes/training.routes.js";
import { videoRouter } from "./routes/video.routes.js";
import { userRouter } from "./routes/user.routes.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  if (env.NODE_ENV === "production") app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/assignments", assignmentRouter);
  app.use("/api/documentation", documentationRouter);
  app.use("/api/trainings", trainingRouter);
  app.use("/api/modules", moduleRouter);
  app.use("/api/videos", videoRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/admin/progress", adminProgressRouter);
  app.use("/api/users", userRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
