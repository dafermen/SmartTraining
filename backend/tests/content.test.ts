import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const login = async (username: "admin" | "learner") => {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ username, password: "comillas22" })
    .expect(200);
  return response.body.data.token as string;
};

describe("training and module API", () => {
  it("supports the ADMIN lifecycle and hides drafts from LEARNER", async () => {
    const app = createApp();
    const adminToken = await login("admin");
    const learnerToken = await login("learner");

    const createResponse = await request(app)
      .post("/api/trainings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Temporary training",
        description: "Created by the integration test",
      })
      .expect(201);
    const trainingId = createResponse.body.data.training.id as string;

    await request(app)
      .post("/api/trainings")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({
        title: "Forbidden training",
        description: "A learner cannot create this",
      })
      .expect(403);

    const draftList = await request(app)
      .get("/api/trainings")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(200);
    expect(
      draftList.body.data.trainings.some(
        (training: { id: string }) => training.id === trainingId,
      ),
    ).toBe(false);

    const firstModule = await request(app)
      .post(`/api/trainings/${trainingId}/modules`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "First module", description: "Initial order" })
      .expect(201);
    const secondModule = await request(app)
      .post(`/api/trainings/${trainingId}/modules`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Second module", description: "Initial order" })
      .expect(201);

    const reorderResponse = await request(app)
      .patch("/api/modules/reorder")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        trainingId,
        moduleIds: [
          secondModule.body.data.module.id,
          firstModule.body.data.module.id,
        ],
      })
      .expect(200);
    expect(reorderResponse.body.data.modules[0].id).toBe(
      secondModule.body.data.module.id,
    );

    await request(app)
      .patch(`/api/trainings/${trainingId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PUBLISHED" })
      .expect(200);

    await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ userId: "seed-learner", trainingId, dueDate: null })
      .expect(201);

    const publishedList = await request(app)
      .get("/api/trainings")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(200);
    expect(
      publishedList.body.data.trainings.some(
        (training: { id: string }) => training.id === trainingId,
      ),
    ).toBe(true);

    await request(app)
      .delete(`/api/modules/${firstModule.body.data.module.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    await request(app)
      .delete(`/api/trainings/${trainingId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
  });
});
