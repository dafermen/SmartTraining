import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    hookTimeout: 20_000,
    include: ["tests/**/*.test.ts"],
    maxWorkers: 2,
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 20_000,
  },
});
