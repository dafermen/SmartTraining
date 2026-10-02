import { AppError } from "./app-error.js";

export class VideoProcessingError extends AppError {
  public constructor(message: string) {
    super(message, 500, "VIDEO_PROCESSING_ERROR");
  }
}
