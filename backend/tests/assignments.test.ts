import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

const login = async (username: "admin" | "learner") => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ username, password: "comillas22" })
    .expect(200);
  return response.body.data.token as string;
};

describe("training assignments", () => {
  it("limits a learner catalog and direct access to assigned trainings", async () => {
    const adminToken = await login("admin");
    const learnerToken = await login("learner");

    const createdTraining = await request(app)
      .post("/api/trainings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Assigned compliance course",
        description: "Visible only after an explicit assignment",
      })
      .expect(201);
    const trainingId = createdTraining.body.data.training.id as string;
    const createdModule = await request(app)
      .post(`/api/trainings/${trainingId}/modules`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Assigned module", description: "Protected lessons" })
      .expect(201);
    const moduleId = createdModule.body.data.module.id as string;

    await request(app)
      .patch(`/api/trainings/${trainingId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PUBLISHED" })
      .expect(200);

    await request(app)
      .get(`/api/trainings/${trainingId}`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(404);
    await request(app)
      .get(`/api/trainings/${trainingId}/modules`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(404);
    await request(app)
      .get(`/api/modules/${moduleId}/videos`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(403);
    await request(app)
      .get(`/api/progress/trainings/${trainingId}`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(404);

    const createdAssignment = await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: "seed-learner",
        trainingId,
        dueDate: "2026-12-31",
      })
      .expect(201);
    expect(createdAssignment.body.data.assignment).toMatchObject({
      userId: "seed-learner",
      trainingId,
      dueDate: "2026-12-31",
      username: "learner",
      trainingTitle: "Assigned compliance course",
    });

    await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ userId: "seed-learner", trainingId, dueDate: null })
      .expect(409)
      .expect(({ body }) =>
        expect(body.errorCode).toBe("ASSIGNMENT_ALREADY_EXISTS"),
      );

    const catalog = await request(app)
      .get("/api/trainings")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(200);
    expect(
      catalog.body.data.trainings.some(
        (training: { id: string }) => training.id === trainingId,
      ),
    ).toBe(true);

    await request(app)
      .get(`/api/trainings/${trainingId}/modules`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(200);
    await request(app)
      .get(`/api/modules/${moduleId}/videos`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(200);
    await request(app)
      .get(`/api/progress/trainings/${trainingId}`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(200);

    const mine = await request(app)
      .get("/api/assignments/me")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(200);
    expect(
      mine.body.data.assignments.some(
        (assignment: { trainingId: string }) =>
          assignment.trainingId === trainingId,
      ),
    ).toBe(true);

    const assignmentId = createdAssignment.body.data.assignment.id as string;
    await request(app)
      .put(`/api/assignments/${assignmentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ dueDate: null })
      .expect(200)
      .expect(({ body }) => expect(body.data.assignment.dueDate).toBeNull());

    await request(app)
      .delete(`/api/assignments/${assignmentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    await request(app)
      .get(`/api/trainings/${trainingId}`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(404);
  });

  it("rejects learner administration and invalid assignment targets", async () => {
    const adminToken = await login("admin");
    const learnerToken = await login("learner");

    await request(app)
      .get("/api/assignments")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(403);

    await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: "seed-admin",
        trainingId: "10000000-0000-4000-8000-000000000001",
        dueDate: null,
      })
      .expect(404);

    await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: "seed-learner",
        trainingId: "10000000-0000-4000-8000-000000000001",
        dueDate: "2026-02-30",
      })
      .expect(400);
  });
});
