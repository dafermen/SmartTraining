import axios from "axios";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { videosApi } from "../api/videos";
import { API_BASE_URL } from "../api/client";
import { useToast } from "../contexts/ToastContext";
import { ProtectedVideoPreview } from "../features/videos/ProtectedVideoPreview";
import type { TrainingVideo } from "../types/api";

const getError = (error: unknown) =>
  axios.isAxiosError<{ message?: string }>(error)
    ? (error.response?.data.message ?? "No fue posible completar la operación.")
    : "No fue posible completar la operación.";

const statusLabel = {
  PROCESSING: "Procesando",
  READY: "Listo",
  ERROR: "Error",
} as const;

type UploadStatus = "PENDING" | "UPLOADING" | "COMPLETED" | "ERROR";

interface UploadQueueItem {
  id: string;
  file: File;
  title: string;
  description: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

let uploadSequence = 0;

const titleFromFilename = (filename: string) =>
  filename
    .replace(/\.(mp4|webm)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);

const isSupportedVideo = (file: File) => {
  const extension = file.name.toLowerCase().split(".").at(-1);
  return (
    (file.type === "video/mp4" && extension === "mp4") ||
    (file.type === "video/webm" && extension === "webm")
  );
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return "Duración pendiente";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatFileSize = (bytes: number) =>
  `${(bytes / 1_048_576).toFixed(1)} MB`;

export function AdminVideosPage() {
  const { notify } = useToast();
  const { moduleId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [videoDraft, setVideoDraft] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const moduleTitle = searchParams.get("title") ?? "Módulo seleccionado";

  const refresh = async () => {
    try {
      setVideos(await videosApi.list(moduleId));
    } catch (requestError) {
      setError(getError(requestError));
    }
  };

  useEffect(() => {
    void refresh();
  }, [moduleId]);

  useEffect(() => {
    if (!videos.some((video) => video.status === "PROCESSING")) return;
    const timer = window.setInterval(() => void refresh(), 2_000);
    return () => window.clearInterval(timer);
  }, [videos, moduleId]);

  const pendingUploads = uploadQueue.filter(
    (item) => item.status === "PENDING" || item.status === "ERROR",
  ).length;

  const addFiles = (files: File[]) => {
    const supportedFiles = files.filter(isSupportedVideo);
    if (supportedFiles.length !== files.length) {
      setError(
        "Algunos archivos se omitieron. Selecciona solamente MP4 o WebM con extensión coincidente.",
      );
    } else {
      setError("");
    }
    setUploadQueue((items) => [
      ...items,
      ...supportedFiles.map((selectedFile) => ({
        id: `${Date.now()}-${uploadSequence++}`,
        file: selectedFile,
        title: titleFromFilename(selectedFile.name),
        description: "",
        progress: 0,
        status: "PENDING" as const,
      })),
    ]);
  };

  const updateUploadItem = (
    id: string,
    updater: (item: UploadQueueItem) => UploadQueueItem,
  ) => {
    setUploadQueue((items) =>
      items.map((item) => (item.id === id ? updater(item) : item)),
    );
  };

  const handleUpload = async (event: FormEvent) => {
    event.preventDefault();
    const itemsToUpload = uploadQueue.filter(
      (item) => item.status === "PENDING" || item.status === "ERROR",
    );
    if (itemsToUpload.length === 0) {
      return setError("Selecciona al menos un archivo MP4 o WebM.");
    }
    if (itemsToUpload.some((item) => item.title.trim().length < 3)) {
      return setError(
        "Cada video necesita un título de al menos 3 caracteres.",
      );
    }
    setIsUploading(true);
    setError("");
    let uploadedCount = 0;
    let failedCount = 0;
    for (const item of itemsToUpload) {
      updateUploadItem(item.id, (current) => ({
        ...current,
        status: "UPLOADING",
        progress: 0,
        error: undefined,
      }));
      try {
        const video = await videosApi.upload(
          moduleId,
          {
            title: item.title.trim(),
            description: item.description.trim(),
            file: item.file,
          },
          (progress) =>
            updateUploadItem(item.id, (current) => ({
              ...current,
              progress,
            })),
        );
        setVideos((items) => [...items, video]);
        uploadedCount += 1;
        updateUploadItem(item.id, (current) => ({
          ...current,
          status: "COMPLETED",
          progress: 100,
        }));
      } catch (requestError) {
        failedCount += 1;
        updateUploadItem(item.id, (current) => ({
          ...current,
          status: "ERROR",
          error: getError(requestError),
        }));
      }
    }
    setIsUploading(false);
    if (uploadedCount > 0) {
      notify(
        `${uploadedCount} ${uploadedCount === 1 ? "video transferido" : "videos transferidos"} y enviado${uploadedCount === 1 ? "" : "s"} a procesamiento.`,
      );
    }
    if (failedCount > 0) {
      notify(
        `${failedCount} ${failedCount === 1 ? "archivo necesita" : "archivos necesitan"} reintento.`,
        "ERROR",
      );
    }
  };

  const startEditingVideo = (video: TrainingVideo) => {
    setVideoDraft({
      id: video.id,
      title: video.title,
      description: video.description ?? "",
    });
    setActiveMenuId(null);
  };

  const saveVideo = async () => {
    if (!videoDraft) return;
    try {
      const updated = await videosApi.update(videoDraft.id, {
        title: videoDraft.title,
        description: videoDraft.description,
      });
      setVideos((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      setVideoDraft(null);
      notify("Información del video guardada.");
    } catch (requestError) {
      setError(getError(requestError));
    }
  };

  const deleteVideo = async (video: TrainingVideo) => {
    if (!window.confirm(`¿Eliminar el video "${video.title}" y su miniatura?`))
      return;
    try {
      await videosApi.delete(video.id);
      setVideos((items) => items.filter((item) => item.id !== video.id));
      if (videoDraft?.id === video.id) setVideoDraft(null);
      if (previewVideoId === video.id) setPreviewVideoId(null);
      setActiveMenuId(null);
      notify("Video eliminado.", "INFO");
    } catch (requestError) {
      setError(getError(requestError));
    }
  };

  const retryVideo = async (video: TrainingVideo) => {
    setRetryingId(video.id);
    setError("");
    try {
      const updated = await videosApi.retry(video.id);
      setVideos((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      notify("Reprocesamiento iniciado.", "INFO");
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setRetryingId(null);
    }
  };

  const moveVideo = async (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= videos.length) return;
    const reordered = [...videos];
    [reordered[index], reordered[destination]] = [
      reordered[destination]!,
      reordered[index]!,
    ];
    setVideos(reordered);
    try {
      setVideos(
        await videosApi.reorder(
          moduleId,
          reordered.map((video) => video.id),
        ),
      );
    } catch (requestError) {
      setVideos(videos);
      setError(getError(requestError));
    }
  };

  const replaceThumbnail = async (
    video: TrainingVideo,
    thumbnail: File | undefined,
  ) => {
    if (!thumbnail) return;
    try {
      const updated = await videosApi.replaceThumbnail(video.id, thumbnail);
      setVideos((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      setActiveMenuId(null);
      notify("Miniatura actualizada.");
    } catch (requestError) {
      setError(getError(requestError));
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <Link
        className="text-sm font-semibold text-indigo-700"
        to="/admin/content"
      >
        ← Volver a capacitaciones
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-700">
            Administración de videos
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
            {moduleTitle}
          </h1>
        </div>
        <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
          {videos.length} videos
        </span>
      </div>
      {error ? (
        <div
          className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <form
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-7 sm:p-6"
        onSubmit={handleUpload}
      >
        <h2 className="text-xl font-black text-slate-900">Cargar videos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Selecciona uno o varios archivos MP4 o WebM. Puedes revisar sus
          títulos antes de iniciar.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Las transferencias se envían una por una para evitar saturar la
          conexión.
        </p>

        <label
          className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-5 py-8 text-center transition hover:bg-indigo-100"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (!isUploading) addFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <span className="grid size-11 place-items-center rounded-full bg-indigo-700 text-xl font-black text-white">
            +
          </span>
          <span className="mt-3 font-bold text-indigo-900">
            Seleccionar o arrastrar videos
          </span>
          <span className="mt-1 text-sm text-indigo-800">
            Se aceptan varios archivos MP4 y WebM
          </span>
          <input
            accept="video/mp4,video/webm"
            className="sr-only"
            disabled={isUploading}
            multiple
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>

        {uploadQueue.length > 0 ? (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900">
                Cola de carga ({uploadQueue.length})
              </h3>
              <button
                className="text-sm font-semibold text-slate-600 disabled:opacity-40"
                disabled={
                  isUploading ||
                  !uploadQueue.some((item) => item.status === "COMPLETED")
                }
                onClick={() =>
                  setUploadQueue((items) =>
                    items.filter((item) => item.status !== "COMPLETED"),
                  )
                }
                type="button"
              >
                Limpiar completados
              </button>
            </div>
            {uploadQueue.map((item, index) => (
              <article
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                key={item.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-500">
                      {index + 1}. {item.file.name} ·{" "}
                      {(item.file.size / 1_048_576).toFixed(1)} MB
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-600">
                        Título
                        <input
                          aria-label={`Título de ${item.file.name}`}
                          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100"
                          disabled={
                            item.status === "UPLOADING" ||
                            item.status === "COMPLETED"
                          }
                          maxLength={150}
                          onChange={(event) =>
                            updateUploadItem(item.id, (current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          required
                          value={item.title}
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Descripción opcional
                        <input
                          aria-label={`Descripción de ${item.file.name}`}
                          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100"
                          disabled={
                            item.status === "UPLOADING" ||
                            item.status === "COMPLETED"
                          }
                          maxLength={2000}
                          onChange={(event) =>
                            updateUploadItem(item.id, (current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          value={item.description}
                        />
                      </label>
                    </div>
                  </div>
                  <button
                    aria-label={`Quitar ${item.file.name}`}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
                    disabled={isUploading}
                    onClick={() =>
                      setUploadQueue((items) =>
                        items.filter((candidate) => candidate.id !== item.id),
                      )
                    }
                    type="button"
                  >
                    Quitar
                  </button>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full transition-all ${item.status === "ERROR" ? "bg-red-600" : item.status === "COMPLETED" ? "bg-indigo-600" : "bg-indigo-500"}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
                  <span
                    className={
                      item.status === "ERROR"
                        ? "font-semibold text-red-700"
                        : item.status === "COMPLETED"
                          ? "font-semibold text-indigo-700"
                          : "text-slate-600"
                    }
                  >
                    {item.status === "PENDING"
                      ? "Pendiente"
                      : item.status === "UPLOADING"
                        ? `Cargando ${item.progress}%`
                        : item.status === "COMPLETED"
                          ? "Transferido y enviado a procesamiento"
                          : `Falló: ${item.error ?? "vuelve a intentarlo"}`}
                  </span>
                  {item.status === "ERROR" ? (
                    <span className="text-slate-500">
                      Se reintentará al iniciar la cola nuevamente.
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <button
          className="mt-5 min-h-12 w-full rounded-xl bg-indigo-700 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={isUploading || pendingUploads === 0}
          type="submit"
        >
          {isUploading
            ? "Procesando cola…"
            : pendingUploads > 0
              ? `Cargar ${pendingUploads} ${pendingUploads === 1 ? "video" : "videos"}`
              : "Selecciona videos"}
        </button>
      </form>

      <section className="mt-7 space-y-5">
        {videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 sm:p-12">
            Todavía no hay videos. Carga el primero usando el formulario.
          </div>
        ) : null}
        {videos.map((video, index) => (
          <article
            className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
            key={video.id}
          >
            <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-slate-950 lg:w-56">
                {video.status === "READY" ? (
                  <img
                    alt={`Miniatura de ${video.title}`}
                    className="size-full object-cover"
                    loading="lazy"
                    src={`${API_BASE_URL}/videos/${video.id}/thumbnail`}
                  />
                ) : (
                  <div className="grid size-full place-items-center px-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                    {video.status === "PROCESSING"
                      ? "Generando miniatura"
                      : "Miniatura no disponible"}
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-lg bg-slate-950/80 px-2.5 py-1 text-xs font-black text-white backdrop-blur">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {video.duration ? (
                  <span className="absolute bottom-2 right-2 rounded-lg bg-slate-950/80 px-2 py-1 text-xs font-bold text-white backdrop-blur">
                    {formatDuration(video.duration)}
                  </span>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${video.status === "READY" ? "bg-indigo-100 text-indigo-800" : video.status === "ERROR" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}
                  >
                    {statusLabel[video.status]}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {formatFileSize(video.fileSize)}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-black leading-6 text-slate-900">
                  {video.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                  {video.description || "Sin descripción"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:w-52 lg:justify-end">
                {video.status === "READY" ? (
                  <button
                    className="min-h-11 flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 lg:flex-none"
                    onClick={() =>
                      setPreviewVideoId((current) =>
                        current === video.id ? null : video.id,
                      )
                    }
                    type="button"
                  >
                    {previewVideoId === video.id ? "Cerrar" : "Vista previa"}
                  </button>
                ) : null}

                <div className="flex rounded-xl border border-slate-300 bg-white p-1">
                  <button
                    aria-label={`Subir video ${video.title}`}
                    className="grid size-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-25"
                    disabled={index === 0}
                    onClick={() => moveVideo(index, -1)}
                    title="Mover hacia arriba"
                    type="button"
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Bajar video ${video.title}`}
                    className="grid size-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-25"
                    disabled={index === videos.length - 1}
                    onClick={() => moveVideo(index, 1)}
                    title="Mover hacia abajo"
                    type="button"
                  >
                    ↓
                  </button>
                </div>

                <div
                  className="relative"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setActiveMenuId(null);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setActiveMenuId(null);
                  }}
                >
                  <button
                    aria-controls={`video-actions-${video.id}`}
                    aria-expanded={activeMenuId === video.id}
                    aria-haspopup="menu"
                    aria-label={`Más acciones para ${video.title}`}
                    className="grid size-11 place-items-center rounded-xl border border-slate-300 bg-white text-xl font-black text-slate-700 hover:bg-slate-50"
                    onClick={() =>
                      setActiveMenuId((current) =>
                        current === video.id ? null : video.id,
                      )
                    }
                    type="button"
                  >
                    ⋯
                  </button>
                  {activeMenuId === video.id ? (
                    <div
                      className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                      id={`video-actions-${video.id}`}
                      role="menu"
                    >
                      <button
                        className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        onClick={() => startEditingVideo(video)}
                        role="menuitem"
                        type="button"
                      >
                        Editar información
                      </button>
                      <label
                        className="block cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        htmlFor={`thumbnail-${video.id}`}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            document
                              .getElementById(`thumbnail-${video.id}`)
                              ?.click();
                          }
                        }}
                        role="menuitem"
                        tabIndex={0}
                      >
                        Reemplazar miniatura
                        <input
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          id={`thumbnail-${video.id}`}
                          onChange={(event) =>
                            replaceThumbnail(video, event.target.files?.[0])
                          }
                          type="file"
                        />
                      </label>
                      <button
                        className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                        onClick={() => deleteVideo(video)}
                        role="menuitem"
                        type="button"
                      >
                        Eliminar video
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {videoDraft?.id === video.id ? (
              <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Título del video
                    <input
                      className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-600"
                      maxLength={150}
                      onChange={(event) =>
                        setVideoDraft({
                          ...videoDraft,
                          title: event.target.value,
                        })
                      }
                      value={videoDraft.title}
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Descripción
                    <input
                      className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-600"
                      maxLength={2000}
                      onChange={(event) =>
                        setVideoDraft({
                          ...videoDraft,
                          description: event.target.value,
                        })
                      }
                      value={videoDraft.description}
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700"
                    onClick={() => setVideoDraft(null)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="min-h-11 rounded-xl bg-slate-900 px-5 py-2.5 font-bold text-white disabled:opacity-50"
                    disabled={videoDraft.title.trim().length < 3}
                    onClick={saveVideo}
                    type="button"
                  >
                    Guardar video
                  </button>
                </div>
              </div>
            ) : null}

            {previewVideoId === video.id && video.status === "READY" ? (
              <div className="border-t border-slate-200 p-4 sm:p-5">
                <ProtectedVideoPreview videoId={video.id} initiallyVisible />
              </div>
            ) : null}
            {video.status === "PROCESSING" ? (
              <div className="border-t border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:px-5">
                <p className="font-semibold">Preparando el video…</p>
                <p className="mt-1">
                  Estamos validando el archivo, optimizando la reproducción y
                  generando su miniatura.
                </p>
              </div>
            ) : null}
            {video.status === "ERROR" ? (
              <div className="border-t border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700 sm:px-5">
                <p className="font-semibold">No pudimos preparar este video.</p>
                <p className="mt-1">
                  {video.processingError ??
                    "Corrige la configuración de procesamiento y vuelve a intentarlo."}
                </p>
                <button
                  className="mt-3 min-h-10 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                  disabled={retryingId === video.id}
                  onClick={() => retryVideo(video)}
                  type="button"
                >
                  {retryingId === video.id
                    ? "Iniciando…"
                    : "Reintentar procesamiento"}
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
