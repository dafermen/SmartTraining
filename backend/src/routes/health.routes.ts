import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "SmartTraining API is healthy",
    data: {
      status: "ok",
      service: "smart-training-api",
      timestamp: new Date().toISOString(),
    },
  });
});
