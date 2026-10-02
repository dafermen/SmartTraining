import { resolve } from "node:path";
import bcrypt from "bcrypt";
import { z } from "zod";
import { env } from "../src/config/env.js";
import { assignmentRepository } from "../src/repositories/assignment.repository.js";
import { JsonStore } from "../src/repositories/json-store.js";
import { userRepository } from "../src/repositories/user.repository.js";
import type { Training, TrainingModule } from "../src/types/content.js";
import type { User } from "../src/types/user.js";
import {
  trainingModuleSchema,
  trainingSchema,
} from "../src/validators/content.schemas.js";

const trainingsStore = new JsonStore<Training[]>(
  resolve(env.DATA_STORAGE_PATH, "trainings.json"),
  z.array(trainingSchema),
  [],
);
const modulesStore = new JsonStore<TrainingModule[]>(
  resolve(env.DATA_STORAGE_PATH, "modules.json"),
  z.array(trainingModuleSchema),
  [],
);
const now = new Date().toISOString();
const demoPassword = "comillas22";
const passwordHash = await bcrypt.hash(demoPassword, 12);
const demoTrainingId = "10000000-0000-4000-8000-000000000001";
const demoModules: TrainingModule[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    trainingId: demoTrainingId,
    title: "Introducción a la seguridad laboral",
    description: "Conceptos y responsabilidades fundamentales.",
    order: 0,
    videoIds: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    trainingId: demoTrainingId,
    title: "Identificación de riesgos",
    description: "Reconocimiento inicial de peligros en el trabajo.",
    order: 1,
    videoIds: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    trainingId: demoTrainingId,
    title: "Prevención de accidentes",
    description:
      "Prácticas para reducir incidentes y responder de forma segura.",
    order: 2,
    videoIds: [],
    createdAt: now,
    updatedAt: now,
  },
];

const existingAdmin = await userRepository.findByUsername("admin");
const existingLearner = await userRepository.findByUsername("learner");
const demoUsers: User[] = [
  {
    id: existingAdmin?.id ?? "seed-admin",
    username: "admin",
    passwordHash,
    role: "ADMIN",
    displayName: "Administrador de demostración",
    active: true,
    authVersion: existingAdmin?.authVersion ?? 0,
    createdAt: existingAdmin?.createdAt ?? now,
    updatedAt: now,
  },
  {
    id: existingLearner?.id ?? "seed-learner",
    username: "learner",
    passwordHash,
    role: "LEARNER",
    displayName: "Participante de demostración",
    active: true,
    authVersion: existingLearner?.authVersion ?? 0,
    createdAt: existingLearner?.createdAt ?? now,
    updatedAt: now,
  },
];

for (const user of demoUsers) await userRepository.upsertSeedUser(user);

await modulesStore.update((existingModules) => {
  const existingIds = new Set(existingModules.map((module) => module.id));
  return [
    ...existingModules,
    ...demoModules.filter((module) => !existingIds.has(module.id)),
  ];
});

await trainingsStore.update((existingTrainings) => {
  const demoModuleIds = demoModules.map((module) => module.id);
  const existing = existingTrainings.find(
    (training) => training.id === demoTrainingId,
  );
  if (!existing) {
    return [
      ...existingTrainings,
      {
        id: demoTrainingId,
        title: "Seguridad y salud en el trabajo",
        description:
          "Capacitación demostrativa sobre prevención de riesgos, prácticas seguras y responsabilidades del trabajador.",
        status: "PUBLISHED",
        createdAt: now,
        updatedAt: now,
        createdBy: "seed-admin",
        moduleIds: demoModuleIds,
      },
    ];
  }

  const missingModuleIds = demoModuleIds.filter(
    (moduleId) => !existing.moduleIds.includes(moduleId),
  );
  if (missingModuleIds.length === 0) return existingTrainings;
  return existingTrainings.map((training) =>
    training.id === demoTrainingId
      ? {
          ...training,
          moduleIds: [...training.moduleIds, ...missingModuleIds],
          updatedAt: now,
        }
      : training,
  );
});

const learnerId = demoUsers.find((user) => user.username === "learner")!.id;
const adminId = demoUsers.find((user) => user.username === "admin")!.id;
if (!(await assignmentRepository.isAssigned(learnerId, demoTrainingId))) {
  await assignmentRepository.create(
    {
      id: "50000000-0000-4000-8000-000000000001",
      userId: learnerId,
      trainingId: demoTrainingId,
      assignedBy: adminId,
      assignedAt: now,
      dueDate: null,
      updatedAt: now,
    },
    adminId,
  );
}

console.log(
  "Seed completed: demo users, assignment, training and modules are ready without replacing existing content.",
);

assignmentRepository.close();
userRepository.close();
