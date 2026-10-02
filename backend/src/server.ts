import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { assignmentRepository } from "./repositories/assignment.repository.js";
import { userRepository } from "./repositories/user.repository.js";

const app = createApp();

const server = app.listen(env.PORT, "127.0.0.1", () => {
  console.log(`SmartTraining API listening on http://127.0.0.1:${env.PORT}`);
});

let isShuttingDown = false;
const shutdown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}; shutting down.`);
  server.close((error) => {
    assignmentRepository.close();
    userRepository.close();
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
