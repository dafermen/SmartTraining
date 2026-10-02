import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../api/client";
import { contentApi } from "../api/content";
import { videosApi } from "../api/videos";
import { ProtectedVideoPreview } from "../features/videos/ProtectedVideoPreview";
import { StatusBadge } from "../features/trainings/StatusBadge";
import type { Training, TrainingModule, TrainingVideo } from "../types/api";

interface PreviewModule extends TrainingModule {
  videos: TrainingVideo[];
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return "Duración pendiente";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export function AdminTrainingPreviewPage() {
  const { trainingId = "" } = useParams();
  const [training, setTraining] = useState<Training>();
  const [modules, setModules] = useState<PreviewModule[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      contentApi.getTraining(trainingId),
      contentApi.listModules(trainingId),
    ])
      .then(async ([trainingResult, moduleResults]) => {
        setTraining(trainingResult);
        setModules(
          await Promise.all(
            moduleResults.map(async (module) => ({
              ...module,
              videos: await videosApi.list(module.id),
            })),
          ),
        );
      })
      .catch(() =>
        setError("No fue posible generar la vista previa de la capacitación."),
      );
  }, [trainingId]);

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <Link className="font-semibold text-indigo-700" to="/admin/content">
          ← Volver al editor
        </Link>
        <p className="mt-6 rounded-2xl bg-red-50 p-5 text-red-700">{error}</p>
      </main>
    );
  }

  if (!training) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 text-slate-600 sm:px-8">
        Preparando vista previa…
      </main>
    );
  }

  const totalVideos = modules.reduce(
    (total, module) => total + module.videos.length,
    0,
  );
  const readyVideos = modules.reduce(
    (total, module) =>
      total + module.videos.filter((video) => video.status === "READY").length,
    0,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="font-semibold text-indigo-700" to="/admin/content">
          ← Volver al editor
        </Link>
        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-800">
          Vista previa del participante
        </span>
      </div>

      <section className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 to-indigo-950 p-6 text-white shadow-xl sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-300">
            Capacitación
          </p>
          <StatusBadge status={training.status} />
        </div>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          {training.title}
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">
          {training.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
          <span className="rounded-full bg-white/10 px-4 py-2">
            {modules.length} {modules.length === 1 ? "módulo" : "módulos"}
          </span>
          <span className="rounded-full bg-white/10 px-4 py-2">
            {readyVideos} de {totalVideos} videos disponibles
          </span>
        </div>
      </section>

      <section className="mt-7 space-y-5">
        {modules.map((module, moduleIndex) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            key={module.id}
          >
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-sm font-black text-white">
                {String(moduleIndex + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {module.title}
                </h2>
                {module.description ? (
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {module.description}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {module.videos.map((video, videoIndex) => (
                <div
                  className="overflow-hidden rounded-2xl border border-slate-200"
                  key={video.id}
                >
                  <div className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:p-4">
                    <div className="aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-slate-900 sm:w-40">
                      {video.status === "READY" ? (
                        <img
                          alt=""
                          className="size-full object-cover"
                          src={`${API_BASE_URL}/videos/${video.id}/thumbnail`}
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                          No disponible
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                        Video {videoIndex + 1}
                      </p>
                      <h3 className="mt-1 font-bold text-slate-900">
                        {video.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDuration(video.duration)}
                      </p>
                    </div>
                    <button
                      className="min-h-11 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      disabled={video.status !== "READY"}
                      onClick={() =>
                        setSelectedVideoId((current) =>
                          current === video.id ? null : video.id,
                        )
                      }
                      type="button"
                    >
                      {video.status !== "READY"
                        ? "No disponible"
                        : selectedVideoId === video.id
                          ? "Cerrar vista previa"
                          : "Reproducir"}
                    </button>
                  </div>
                  {selectedVideoId === video.id ? (
                    <div className="border-t border-slate-200 p-3 sm:p-4">
                      <ProtectedVideoPreview
                        videoId={video.id}
                        initiallyVisible
                      />
                    </div>
                  ) : null}
                </div>
              ))}
              {module.videos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Este módulo todavía no tiene videos.
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
