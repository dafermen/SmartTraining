import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { contentApi } from "../api/content";
import { progressApi } from "../api/progress";
import { videosApi } from "../api/videos";
import type {
  Training,
  TrainingModule,
  TrainingProgressSummary,
  TrainingVideo,
  VideoProgress,
} from "../types/api";

interface ModuleWithVideos extends TrainingModule {
  videos: TrainingVideo[];
}

export function TrainingDetailPage() {
  const { trainingId = "" } = useParams();
  const [training, setTraining] = useState<Training>();
  const [modules, setModules] = useState<ModuleWithVideos[]>([]);
  const [records, setRecords] = useState<VideoProgress[]>([]);
  const [summary, setSummary] = useState<TrainingProgressSummary>();
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      contentApi.getTraining(trainingId),
      contentApi.listModules(trainingId),
      progressApi.forTraining(trainingId),
    ])
      .then(async ([trainingResult, moduleResults, progressResult]) => {
        setTraining(trainingResult);
        setRecords(progressResult.records);
        setSummary(progressResult.summary);
        setModules(
          await Promise.all(
            moduleResults.map(async (module) => ({
              ...module,
              videos: await videosApi.list(module.id),
            })),
          ),
        );
      })
      .catch(() => setError("No pudimos abrir esta capacitación."));
  }, [trainingId]);

  if (error)
    return (
      <main className="mx-auto max-w-5xl px-5 py-10 text-red-700">{error}</main>
    );
  if (!training)
    return (
      <main className="mx-auto max-w-5xl px-5 py-10 text-slate-600">
        Cargando capacitación…
      </main>
    );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <Link className="text-sm font-bold text-indigo-700" to="/learn">
        ← Volver al catálogo
      </Link>
      <section className="mt-4 rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-950 p-5 text-white shadow-xl sm:mt-5 sm:rounded-3xl sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wider text-amber-300">
          Capacitación
        </p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">
          {training.title}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">
          {training.description}
        </p>
        <div className="mt-6 max-w-lg">
          <div className="h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-400"
              style={{ width: `${summary?.percentage ?? 0}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {summary?.completedVideos ?? 0} de {summary?.totalVideos ?? 0}{" "}
            videos completados · {summary?.percentage ?? 0}%
          </p>
        </div>
      </section>
      <section className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
        {modules.map((module, moduleIndex) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            key={module.id}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Módulo {moduleIndex + 1}
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              {module.title}
            </h2>
            {module.description ? (
              <p className="mt-2 text-sm text-slate-600">
                {module.description}
              </p>
            ) : null}
            <div className="mt-5 space-y-3">
              {module.videos.map((video, videoIndex) => {
                const progress = records.find(
                  (record) => record.videoId === video.id,
                );
                return (
                  <Link
                    className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition active:bg-indigo-50 hover:border-indigo-400 hover:bg-indigo-50 sm:gap-4 sm:p-4"
                    key={video.id}
                    to={`/learn/trainings/${training.id}/videos/${video.id}`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">
                        {videoIndex + 1}. {video.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {video.duration
                          ? `${Math.ceil(video.duration / 60)} min`
                          : "Duración pendiente"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${progress?.status === "COMPLETED" ? "bg-indigo-100 text-indigo-800" : progress ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}
                    >
                      {progress?.status === "COMPLETED"
                        ? "Completado"
                        : progress
                          ? `${progress.percentage}%`
                          : "Comenzar"}
                    </span>
                  </Link>
                );
              })}
              {module.videos.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Este módulo aún no tiene videos disponibles.
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
