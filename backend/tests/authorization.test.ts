import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { authenticate } from "../src/middleware/authenticate.js";
import { authorizeRoles } from "../src/middleware/authorize-roles.js";
import { errorHandler } from "../src/middleware/error-handler.js";

describe("role authorization middleware", () => {
  it("rejects a learner from an administrator-only route", async () => {
    const loginResponse = await request(createApp())
      .post("/api/auth/login")
      .send({ username: "learner", password: "comillas22" });

    const protectedApp = express();
    protectedApp.get(
      "/admin-only",
      authenticate,
      authorizeRoles("ADMIN"),
      (_request, response) => response.status(200).json({ success: true }),
    );
    protectedApp.use(errorHandler);

    const response = await request(protectedApp)
      .get("/admin-only")
      .set("Authorization", `Bearer ${loginResponse.body.data.token}`)
      .expect(403);

    expect(response.body.errorCode).toBe("AUTHORIZATION_FAILED");
  });
});
