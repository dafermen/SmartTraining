export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface HealthStatus {
  status: "ok";
  service: string;
  timestamp: string;
}

export type UserRole = "ADMIN" | "LEARNER";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export interface UserAuditEvent {
  id: number;
  actorId: string;
  targetUserId: string;
  action: "USER_CREATED" | "USER_UPDATED" | "PASSWORD_RESET" | string;
  details: string;
  createdAt: string;
}

export type TrainingStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Training {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  status: TrainingStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  moduleIds: string[];
}

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

export interface TrainingModule {
  id: string;
  trainingId: string;
  title: string;
  description?: string;
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
  description?: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: "video/mp4" | "video/webm";
  fileSize: number;
  duration?: number;
  thumbnailFilename?: string;
  order: number;
  status: VideoStatus;
  processingError?: string;
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
  completedAt?: string;
}

export interface TrainingProgressSummary {
  totalVideos: number;
  startedVideos: number;
  completedVideos: number;
  percentage: number;
}

export interface AdminProgressRow extends VideoProgress {
  userDisplayName: string;
  username: string;
  trainingTitle: string;
  videoTitle: string;
}

export interface DocumentationSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  audience: "ADMIN" | "ALL";
}

export interface DocumentationDocument extends DocumentationSummary {
  content: string;
}
