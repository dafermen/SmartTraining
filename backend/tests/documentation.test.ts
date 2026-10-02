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

describe("documentation API", () => {
  it("requires authentication", async () => {
    await request(createApp()).get("/api/documentation").expect(401);
  });

  it("shows the complete safe catalog to administrators", async () => {
    const token = await login("admin");
    const response = await request(createApp())
      .get("/api/documentation")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.documents.length).toBeGreaterThanOrEqual(25);
    expect(response.body.data.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "10-security",
          audience: "ADMIN",
        }),
      ]),
    );
    expect(response.body.data.documents[0]).toEqual(
      expect.objectContaining({
        id: "01-project-overview",
        category: "Producto",
      }),
    );
  });

  it("limits learners to their manual and glossary", async () => {
    const token = await login("learner");
    const app = createApp();
    const list = await request(app)
      .get("/api/documentation")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(
      list.body.data.documents.map((item: { id: string }) => item.id),
    ).toEqual(["12-user-manual", "21-glossary"]);

    const manual = await request(app)
      .get("/api/documentation/12-user-manual")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(manual.body.data.document.content).toContain(
      "# Manual del participante",
    );

    await request(app)
      .get("/api/documentation/10-security")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });

  it("rejects identifiers outside the documented filename format", async () => {
    const token = await login("admin");
    await request(createApp())
      .get("/api/documentation/not_a_document")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
  });
});
