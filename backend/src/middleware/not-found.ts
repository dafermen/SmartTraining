import type { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    success: false,
    message: "Route not found",
    errorCode: "ROUTE_NOT_FOUND",
    data: { method: request.method, path: request.path },
  });
};
