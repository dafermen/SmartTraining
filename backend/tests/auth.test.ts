import request from "supertest";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";

describe("authentication API", () => {
  it("logs in an administrator without returning the password hash", async () => {
    const response = await request(createApp())
      .post("/api/auth/login")
      .send({ username: "admin", password: "comillas22" })
      .expect(200);

    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user).toMatchObject({
      username: "admin",
      role: "ADMIN",
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.headers["set-cookie"]?.[0]).toContain(
      "smart_training_session=",
    );
    expect(response.headers["set-cookie"]?.[0]).toContain("HttpOnly");
  });

  it("rejects invalid credentials with a generic error", async () => {
    const response = await request(createApp())
      .post("/api/auth/login")
      .send({ username: "admin", password: "incorrect" })
      .expect(401);

    expect(response.body.errorCode).toBe("AUTHENTICATION_FAILED");
    expect(response.body.message).toBe("Invalid username or password");
  });

  it("requires a valid token for the current user endpoint", async () => {
    await request(createApp()).get("/api/auth/me").expect(401);

    const loginResponse = await request(createApp())
      .post("/api/auth/login")
      .send({ username: "learner", password: "comillas22" });

    const response = await request(createApp())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.data.token}`)
      .expect(200);

    expect(response.body.data.user).toMatchObject({
      username: "learner",
      role: "LEARNER",
    });
    expect(response.headers["set-cookie"]?.[0]).toContain(
      "smart_training_session=",
    );
  });

  it("rejects malformed and expired tokens with the same safe response", async () => {
    const app = createApp();
    const malformed = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer this-is-not-a-jwt")
      .expect(401);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "comillas22" })
      .expect(200);
    const user = loginResponse.body.data.user as {
      id: string;
      username: string;
      role: "ADMIN";
    };
    const expiredToken = jwt.sign(
      { username: user.username, role: user.role },
      env.JWT_SECRET,
      { subject: user.id, expiresIn: -1 },
    );
    const expired = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(401);

    expect(malformed.body).toMatchObject({
      errorCode: "AUTHENTICATION_FAILED",
      message: "Your session is invalid or has expired",
    });
    expect(expired.body).toMatchObject({
      errorCode: "AUTHENTICATION_FAILED",
      message: "Your session is invalid or has expired",
    });
  });

  it("supports the protected media cookie and clears it on logout", async () => {
    const app = createApp();
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ username: "learner", password: "comillas22" })
      .expect(200);
    const cookie = loginResponse.headers["set-cookie"]?.[0]?.split(";")[0];
    expect(cookie).toContain("smart_training_session=");

    await request(app).get("/api/auth/me").set("Cookie", cookie!).expect(200);
    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie!)
      .expect(200);
    expect(logout.headers["set-cookie"]?.[0]).toContain(
      "smart_training_session=;",
    );
  });
});
