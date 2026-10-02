import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

const login = async (username = "admin", password = "comillas22") => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ username, password })
    .expect(200);
  return response.body.data.token as string;
};

describe("administrator user management", () => {
  it("creates, lists and audits users without exposing credential data", async () => {
    const token = await login();
    const created = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        username: "new.learner",
        displayName: "Nueva Participante",
        role: "LEARNER",
        password: "a-secure-demo-password",
      })
      .expect(201);

    expect(created.body.data.user).toMatchObject({
      username: "new.learner",
      displayName: "Nueva Participante",
      role: "LEARNER",
      active: true,
    });
    expect(created.body.data.user.passwordHash).toBeUndefined();
    expect(created.body.data.user.authVersion).toBeUndefined();

    const listed = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(
      listed.body.data.users.some(
        (user: { username: string }) => user.username === "new.learner",
      ),
    ).toBe(true);

    const audit = await request(app)
      .get("/api/users/audit")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(audit.body.data.events[0]).toMatchObject({ action: "USER_CREATED" });
  });

  it("rejects duplicate usernames, weak passwords and learner access", async () => {
    const adminToken = await login();
    const learnerToken = await login("learner");

    await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        username: "new.learner",
        displayName: "Duplicada",
        role: "LEARNER",
        password: "another-secure-password",
      })
      .expect(409)
      .expect(({ body }) =>
        expect(body.errorCode).toBe("USERNAME_ALREADY_EXISTS"),
      );

    await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        username: "weak-user",
        displayName: "Clave Débil",
        role: "LEARNER",
        password: "short",
      })
      .expect(400);

    await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(403);
  });

  it("revokes previous sessions after resetting a password", async () => {
    const adminToken = await login();
    const oldUserToken = await login("new.learner", "a-secure-demo-password");
    const users = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const managedUser = users.body.data.users.find(
      (user: { username: string }) => user.username === "new.learner",
    ) as { id: string };

    await request(app)
      .put(`/api/users/${managedUser.id}/password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: "a-new-secure-password" })
      .expect(200);

    await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${oldUserToken}`)
      .expect(401);
    await login("new.learner", "a-new-secure-password");
  });

  it("prevents an administrator from demoting or deactivating itself", async () => {
    const token = await login();
    const users = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const admin = users.body.data.users.find(
      (user: { username: string }) => user.username === "admin",
    ) as { id: string; displayName: string };

    const response = await request(app)
      .put(`/api/users/${admin.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        displayName: admin.displayName,
        role: "LEARNER",
        active: false,
      })
      .expect(409);
    expect(response.body.errorCode).toBe("CANNOT_DEACTIVATE_SELF");
  });
});
