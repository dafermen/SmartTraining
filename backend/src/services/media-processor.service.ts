import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import { env } from "../config/env.js";
import { VideoProcessingError } from "../errors/video-processing-error.js";

const execFileAsync = promisify(execFile);

interface ProbeOutput {
  format?: { duration?: string };
}

/** Runs bundled FFmpeg tools without invoking a shell or accepting user-built arguments. */
export class MediaProcessorService {
  private readonly ffmpegPath = env.FFMPEG_PATH || ffmpegInstaller.path;
  private readonly ffprobePath = env.FFPROBE_PATH || ffprobeInstaller.path;

  public async probeDuration(videoPath: string): Promise<number> {
    try {
      const { stdout } = await execFileAsync(
        this.ffprobePath,
        [
          "-v",
          "error",
          "-show_entries",
          "format=duration",
          "-of",
          "json",
          videoPath,
        ],
        { windowsHide: true, timeout: 60_000, maxBuffer: 1_000_000 },
      );
      const output = JSON.parse(stdout) as ProbeOutput;
      const duration = Number(output.format?.duration);
      if (!Number.isFinite(duration) || duration <= 0)
        throw new Error("Invalid duration");
      return duration;
    } catch {
      throw new VideoProcessingError(
        "FFprobe could not determine the video duration",
      );
    }
  }

  public async createThumbnail(
    videoPath: string,
    outputPath: string,
    duration: number,
  ): Promise<void> {
    const captureSecond = Math.min(5, Math.max(0, duration / 2));
    try {
      await execFileAsync(
        this.ffmpegPath,
        [
          "-y",
          "-ss",
          captureSecond.toFixed(3),
          "-i",
          videoPath,
          "-frames:v",
          "1",
          "-q:v",
          "2",
          outputPath,
        ],
        { windowsHide: true, timeout: 120_000, maxBuffer: 2_000_000 },
      );
    } catch {
      throw new VideoProcessingError(
        "FFmpeg could not create the video thumbnail",
      );
    }
  }

  public async optimizeMp4ForBrowser(
    videoPath: string,
    outputPath: string,
  ): Promise<void> {
    try {
      await execFileAsync(
        this.ffmpegPath,
        [
          "-y",
          "-i",
          videoPath,
          "-map",
          "0:v:0",
          "-map",
          "0:a?",
          "-c",
          "copy",
          "-movflags",
          "+faststart",
          outputPath,
        ],
        { windowsHide: true, timeout: 10 * 60_000, maxBuffer: 2_000_000 },
      );
    } catch {
      throw new VideoProcessingError(
        "FFmpeg could not optimize the MP4 for browser playback",
      );
    }
  }
}

export const mediaProcessorService = new MediaProcessorService();
