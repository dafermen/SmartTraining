import type { TrainingStatus } from "./content.js";

export interface TrainingAssignment {
  id: string;
  userId: string;
  trainingId: string;
  assignedBy: string;
  assignedAt: string;
  dueDate: string | null;
  updatedAt: string;
}

export interface AdminTrainingAssignment extends TrainingAssignment {
  userDisplayName: string;
  username: string;
  userActive: boolean;
  trainingTitle: string;
  trainingStatus: TrainingStatus;
}
