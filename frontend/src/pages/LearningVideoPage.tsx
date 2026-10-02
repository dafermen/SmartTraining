import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { progressApi } from "../api/progress";
import { videosApi } from "../api/videos";
import { VideoPlayer } from "../features/videos/VideoPlayer";
import type { TrainingVideo, VideoProgress } from "../types/api";

export function LearningVideoPage() {
  const { trainingId = "", videoId = "" } = useParams();
  const [video, setVideo] = useState<TrainingVideo>();
  const [progress, setProgress] = useState<VideoProgress>();
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([videosApi.get(videoId), progressApi.forTraining(trainingId)])
      .then(([videoResult, progressResult]) => {
        setVideo(videoResult);
        setProgress(
          progressResult.records.find((record) => record.videoId === videoId),
        );
      })
      .catch(() => setError("No pudimos abrir este video."));
  }, [trainingId, videoId]);

  if (error)
    return (
      <main className="mx-auto max-w-5xl px-5 py-10 text-red-700">{error}</main>
    );
  if (!video)
    return (
      <main className="mx-auto max-w-5xl px-5 py-10 text-slate-600">
        Preparando video…
      </main>
    );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <Link
        className="text-sm font-bold text-indigo-700"
        to={`/learn/trainings/${trainingId}`}
      >
        ← Volver a la capacitación
      </Link>
      <div className="-mx-4 mt-4 sm:mx-0 sm:mt-5">
        <VideoPlayer
          initialProgress={progress}
          onProgress={setProgress}
          video={video}
        />
      </div>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:mt-7 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          Lección en video
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">
          {video.title}
        </h1>
        {video.description ? (
          <p className="mt-3 leading-7 text-slate-600">{video.description}</p>
        ) : null}
        <p className="mt-5 text-sm text-slate-500">
          Tu posición se guarda cada 10 segundos, al pausar y al salir. Al
          volver, el video continúa donde lo dejaste.
        </p>
      </section>
    </main>
  );
}
