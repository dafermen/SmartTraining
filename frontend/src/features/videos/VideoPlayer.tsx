import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../../api/client";
import { progressApi } from "../../api/progress";
import type { TrainingVideo, VideoProgress } from "../../types/api";

const SAVE_INTERVAL_MS = 10_000;

export function VideoPlayer({
  video,
  initialProgress,
  onProgress,
}: {
  video: TrainingVideo;
  initialProgress?: VideoProgress;
  onProgress?: (progress: VideoProgress) => void;
}) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(initialProgress?.currentTime ?? 0);
  const [progress, setProgress] = useState(initialProgress);
  const [message, setMessage] = useState("");

  const save = useCallback(async () => {
    const player = playerRef.current;
    if (!player || !Number.isFinite(player.duration) || player.duration <= 0)
      return;
    if (Math.abs(player.currentTime - lastSavedRef.current) < 0.5) return;
    try {
      const updated = await progressApi.updateVideo(
        video.id,
        player.currentTime,
        player.duration,
      );
      lastSavedRef.current = updated.currentTime;
      setProgress(updated);
      setMessage(
        updated.status === "COMPLETED" ? "Video completado" : "Avance guardado",
      );
      onProgress?.(updated);
    } catch {
      setMessage(
        "No se pudo guardar el avance. Se reintentará automáticamente.",
      );
    }
  }, [onProgress, video.id]);

  useEffect(() => {
    const interval = window.setInterval(() => void save(), SAVE_INTERVAL_MS);
    const flush = () => {
      const player = playerRef.current;
      if (!player || !Number.isFinite(player.duration) || player.duration <= 0)
        return;
      void fetch(`${API_BASE_URL}/progress/videos/${video.id}`, {
        method: "PUT",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTime: player.currentTime,
          duration: player.duration,
        }),
      });
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", flush);
      void save();
    };
  }, [save, video.id]);

  const resume = () => {
    const player = playerRef.current;
    if (!player || !initialProgress?.currentTime) return;
    const safeResumeTime = Math.min(
      initialProgress.currentTime,
      Math.max(0, player.duration - 0.25),
    );
    player.currentTime = safeResumeTime;
  };

  return (
    <section aria-label={`Reproductor de ${video.title}`}>
      <div className="overflow-hidden bg-black shadow-xl sm:rounded-2xl">
        <video
          className="aspect-video w-full"
          controls
          crossOrigin="use-credentials"
          onLoadedMetadata={resume}
          onPause={() => void save()}
          onEnded={() => void save()}
          poster={`${API_BASE_URL}/videos/${video.id}/thumbnail`}
          preload="metadata"
          ref={playerRef}
          src={`${API_BASE_URL}/videos/${video.id}/stream`}
        >
          Tu navegador no puede reproducir este video.
        </video>
      </div>
      <div className="mt-4 flex flex-col gap-2 px-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-0">
        <div className="w-full min-w-0 flex-1 sm:min-w-52">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${progress?.percentage ?? 0}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {progress?.percentage ?? 0}% visto · Se completa al 80%
          </p>
        </div>
        <p aria-live="polite" className="text-sm text-indigo-700">
          {message}
        </p>
      </div>
    </section>
  );
}
