import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("GET /api/health", () => {
  it("returns a successful health response with security headers", async () => {
    const response = await request(createApp()).get("/api/health").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("returns a consistent response for unknown routes", async () => {
    const response = await request(createApp()).get("/api/unknown").expect(404);
    expect(response.body.errorCode).toBe("ROUTE_NOT_FOUND");
  });
});
