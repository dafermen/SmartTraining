import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();
let adminToken = "";
let learnerToken = "";

describe("critical REST contracts", () => {
  beforeAll(async () => {
    const [admin, learner] = await Promise.all([
      request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "comillas22" }),
      request(app)
        .post("/api/auth/login")
        .send({ username: "learner", password: "comillas22" }),
    ]);
    adminToken = admin.body.data.token;
    learnerToken = learner.body.data.token;
  });

  it("uses the common success envelope for authenticated collections", async () => {
    const response = await request(app)
      .get("/api/trainings")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: { trainings: expect.any(Array) },
    });
  });

  it("returns a safe validation contract for malformed payloads and ids", async () => {
    const invalidPayload = await request(app)
      .post("/api/trainings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "x", description: "" })
      .expect(400);
    const invalidId = await request(app)
      .get("/api/trainings/not-a-uuid")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);

    expect(invalidPayload.body).toMatchObject({
      success: false,
      errorCode: "VALIDATION_ERROR",
    });
    expect(invalidId.body).toMatchObject({
      success: false,
      errorCode: "VALIDATION_ERROR",
    });
  });

  it("enforces the administrator and learner permission matrix on real endpoints", async () => {
    const learnerMutations = [
      request(app)
        .post("/api/trainings")
        .send({ title: "No permitido", description: "No permitido" }),
      request(app)
        .put("/api/trainings/10000000-0000-4000-8000-000000000001")
        .send({ title: "No permitido", description: "No permitido" }),
      request(app)
        .patch("/api/modules/reorder")
        .send({
          trainingId: "10000000-0000-4000-8000-000000000001",
          moduleIds: ["20000000-0000-4000-8000-000000000001"],
        }),
    ];

    for (const mutation of learnerMutations) {
      const response = await mutation
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(403);
      expect(response.body.errorCode).toBe("AUTHORIZATION_FAILED");
    }

    await request(app)
      .get("/api/admin/progress")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(403);
    await request(app)
      .delete(
        "/api/admin/progress/users/seed-learner/videos/00000000-0000-4000-8000-000000000001",
      )
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(403);
    await request(app)
      .get("/api/progress/me")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(403);
  });
});
