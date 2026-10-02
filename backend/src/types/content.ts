export type TrainingStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Training {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | undefined;
  status: TrainingStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  moduleIds: string[];
}

export interface TrainingModule {
  id: string;
  trainingId: string;
  title: string;
  description?: string | undefined;
  order: number;
  videoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type VideoStatus = "PROCESSING" | "READY" | "ERROR";

export interface TrainingVideo {
  id: string;
  moduleId: string;
  title: string;
  description?: string | undefined;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  fileSize: number;
  duration?: number | undefined;
  thumbnailFilename?: string | undefined;
  order: number;
  status: VideoStatus;
  processingError?: string | undefined;
  createdAt: string;
  updatedAt: string;
  uploadedBy: string;
}

export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface VideoProgress {
  id: string;
  userId: string;
  trainingId: string;
  moduleId: string;
  videoId: string;
  currentTime: number;
  duration: number;
  percentage: number;
  status: ProgressStatus;
  startedAt: string;
  lastViewedAt: string;
  completedAt?: string | undefined;
}
