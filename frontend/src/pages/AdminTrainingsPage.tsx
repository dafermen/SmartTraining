import axios from "axios";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { contentApi } from "../api/content";
import { videosApi } from "../api/videos";
import { useToast } from "../contexts/ToastContext";
import { StatusBadge } from "../features/trainings/StatusBadge";
import type {
  Training,
  TrainingModule,
  TrainingStatus,
  TrainingVideo,
} from "../types/api";

const emptyForm = { title: "", description: "" };
const TRAININGS_PER_PAGE = 8;

type TrainingSortKey = "title" | "status" | "modules" | "updatedAt";
type SortDirection = "asc" | "desc";

const errorMessage = (error: unknown) =>
  axios.isAxiosError<{ message?: string }>(error)
    ? (error.response?.data.message ?? "No fue posible completar la operación.")
    : "No fue posible completar la operación.";

export function AdminTrainingsPage() {
  const { notify } = useToast();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [videosByModule, setVideosByModule] = useState<
    Record<string, TrainingVideo[]>
  >({});
  const [newTraining, setNewTraining] = useState(emptyForm);
  const [newModule, setNewModule] = useState(emptyForm);
  const [moduleQuery, setModuleQuery] = useState("");
  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [openModuleMenuId, setOpenModuleMenuId] = useState<string | null>(null);
  const [isPublicationOpen, setIsPublicationOpen] = useState(false);
  const [isInformationOpen, setIsInformationOpen] = useState(false);
  const [trainingQuery, setTrainingQuery] = useState("");
  const [trainingStatus, setTrainingStatus] = useState<"ALL" | TrainingStatus>(
    "ALL",
  );
  const [trainingSort, setTrainingSort] =
    useState<TrainingSortKey>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [trainingPage, setTrainingPage] = useState(1);
  const [moduleDraft, setModuleDraft] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTraining = useMemo(
    () => trainings.find((training) => training.id === selectedId) ?? null,
    [selectedId, trainings],
  );
  const filteredTrainings = useMemo(() => {
    const normalizedQuery = trainingQuery.trim().toLocaleLowerCase("es");
    return trainings.filter(
      (training) =>
        (trainingStatus === "ALL" || training.status === trainingStatus) &&
        (normalizedQuery.length === 0 ||
          training.title.toLocaleLowerCase("es").includes(normalizedQuery) ||
          training.description
            .toLocaleLowerCase("es")
            .includes(normalizedQuery)),
    );
  }, [trainingQuery, trainingStatus, trainings]);
  const sortedTrainings = useMemo(
    () =>
      [...filteredTrainings].sort((left, right) => {
        const comparison =
          trainingSort === "modules"
            ? left.moduleIds.length - right.moduleIds.length
            : trainingSort === "updatedAt"
              ? left.updatedAt.localeCompare(right.updatedAt)
              : left[trainingSort].localeCompare(right[trainingSort], "es", {
                  sensitivity: "base",
                });
        return sortDirection === "asc" ? comparison : -comparison;
      }),
    [filteredTrainings, sortDirection, trainingSort],
  );
  const totalTrainingPages = Math.max(
    1,
    Math.ceil(sortedTrainings.length / TRAININGS_PER_PAGE),
  );
  const visibleTrainings = useMemo(() => {
    const start = (trainingPage - 1) * TRAININGS_PER_PAGE;
    return sortedTrainings.slice(start, start + TRAININGS_PER_PAGE);
  }, [sortedTrainings, trainingPage]);
  const moduleVideos = useMemo(
    () => modules.flatMap((module) => videosByModule[module.id] ?? []),
    [modules, videosByModule],
  );
  const visibleModules = useMemo(() => {
    const normalizedQuery = moduleQuery.trim().toLocaleLowerCase("es");
    return modules
      .map((module, index) => ({ module, index }))
      .filter(
        ({ module }) =>
          normalizedQuery.length === 0 ||
          module.title.toLocaleLowerCase("es").includes(normalizedQuery) ||
          (module.description ?? "")
            .toLocaleLowerCase("es")
            .includes(normalizedQuery),
      );
  }, [moduleQuery, modules]);
  const totalVideos = moduleVideos.length;
  const readyVideos = moduleVideos.filter(
    (video) => video.status === "READY",
  ).length;
  const allModulesHaveReadyVideos =
    modules.length > 0 &&
    modules.every((module) => {
      const videos = videosByModule[module.id] ?? [];
      return (
        videos.length > 0 && videos.every((video) => video.status === "READY")
      );
    });
  const publicationSteps = useMemo(
    () => [
      {
        label: "Información",
        detail: "Título y descripción",
        complete: Boolean(
          selectedTraining &&
          selectedTraining.title.trim().length >= 3 &&
          selectedTraining.description.trim().length >= 3,
        ),
      },
      {
        label: "Módulos",
        detail: `${modules.length} creados`,
        complete: modules.length > 0,
      },
      {
        label: "Videos",
        detail:
          totalVideos === 0
            ? "Sin videos"
            : `${readyVideos} de ${totalVideos} listos`,
        complete: allModulesHaveReadyVideos,
      },
    ],
    [
      allModulesHaveReadyVideos,
      modules.length,
      readyVideos,
      selectedTraining,
      totalVideos,
    ],
  );
  const canPublish = publicationSteps.every((step) => step.complete);

  useEffect(() => {
    setTrainingPage(1);
  }, [trainingQuery, trainingStatus]);

  useEffect(() => {
    if (trainingPage > totalTrainingPages) {
      setTrainingPage(totalTrainingPages);
    }
  }, [totalTrainingPages, trainingPage]);

  useEffect(() => {
    contentApi
      .listTrainings()
      .then((items) => {
        setTrainings(items);
      })
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setModuleDraft(null);
    setModuleQuery("");
    setIsModuleFormOpen(false);
    setOpenModuleMenuId(null);
    setIsPublicationOpen(false);
    setIsInformationOpen(false);
    if (!selectedId) {
      setModules([]);
      setVideosByModule({});
      return;
    }
    contentApi
      .listModules(selectedId)
      .then(async (items) => {
        setModules(items);
        const entries = await Promise.all(
          items.map(
            async (module) =>
              [module.id, await videosApi.list(module.id)] as const,
          ),
        );
        setVideosByModule(Object.fromEntries(entries));
      })
      .catch((requestError) => setError(errorMessage(requestError)));
  }, [selectedId]);

  const replaceTraining = (updated: Training) => {
    setTrainings((items) =>
      items.map((training) =>
        training.id === updated.id ? updated : training,
      ),
    );
  };

  const handleCreateTraining = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const created = await contentApi.createTraining(newTraining);
      setTrainings((items) => [...items, created]);
      setSelectedId(created.id);
      setNewTraining(emptyForm);
      notify("Capacitación creada correctamente.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const updateSelectedField = (
    field: "title" | "description",
    value: string,
  ) => {
    if (!selectedTraining) return;
    replaceTraining({ ...selectedTraining, [field]: value });
  };

  const saveTraining = async () => {
    if (!selectedTraining) return;
    setIsSaving(true);
    setError("");
    try {
      replaceTraining(
        await contentApi.updateTraining(selectedTraining.id, {
          title: selectedTraining.title,
          description: selectedTraining.description,
        }),
      );
      notify("Cambios de la capacitación guardados.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const changeStatus = async (status: TrainingStatus) => {
    if (!selectedTraining) return;
    try {
      replaceTraining(
        await contentApi.updateStatus(selectedTraining.id, status),
      );
      notify(
        status === "PUBLISHED"
          ? "Capacitación publicada para los participantes."
          : "Estado de la capacitación actualizado.",
      );
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  const deleteTraining = async () => {
    if (
      !selectedTraining ||
      !window.confirm(`¿Eliminar "${selectedTraining.title}" y sus módulos?`)
    )
      return;
    try {
      await contentApi.deleteTraining(selectedTraining.id);
      const remaining = trainings.filter(
        (training) => training.id !== selectedTraining.id,
      );
      setTrainings(remaining);
      setSelectedId(null);
      notify("Capacitación eliminada.", "INFO");
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  const createModule = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTraining) return;
    try {
      const created = await contentApi.createModule(
        selectedTraining.id,
        newModule,
      );
      setModules((items) => [...items, created]);
      setVideosByModule((items) => ({ ...items, [created.id]: [] }));
      replaceTraining({
        ...selectedTraining,
        moduleIds: [...selectedTraining.moduleIds, created.id],
      });
      setNewModule(emptyForm);
      setIsModuleFormOpen(false);
      notify("Módulo agregado.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  const startEditingModule = (module: TrainingModule) => {
    setOpenModuleMenuId(null);
    setModuleDraft({
      id: module.id,
      title: module.title,
      description: module.description ?? "",
    });
  };

  const saveModule = async () => {
    if (!moduleDraft) return;
    try {
      const updated = await contentApi.updateModule(moduleDraft.id, {
        title: moduleDraft.title,
        description: moduleDraft.description,
      });
      setModules((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      setModuleDraft(null);
      notify("Módulo actualizado.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  const deleteModule = async (module: TrainingModule) => {
    if (!window.confirm(`¿Eliminar el módulo "${module.title}"?`)) return;
    try {
      setOpenModuleMenuId(null);
      await contentApi.deleteModule(module.id);
      if (moduleDraft?.id === module.id) setModuleDraft(null);
      setModules((items) => items.filter((item) => item.id !== module.id));
      setVideosByModule((items) => {
        const updated = { ...items };
        delete updated[module.id];
        return updated;
      });
      if (selectedTraining) {
        replaceTraining({
          ...selectedTraining,
          moduleIds: selectedTraining.moduleIds.filter(
            (id) => id !== module.id,
          ),
        });
      }
      notify("Módulo eliminado.", "INFO");
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  const moveModule = async (index: number, direction: -1 | 1) => {
    if (!selectedTraining) return;
    const destination = index + direction;
    if (destination < 0 || destination >= modules.length) return;
    const reordered = [...modules];
    [reordered[index], reordered[destination]] = [
      reordered[destination]!,
      reordered[index]!,
    ];
    setModules(reordered);
    try {
      setModules(
        await contentApi.reorderModules(
          selectedTraining.id,
          reordered.map((module) => module.id),
        ),
      );
      replaceTraining({
        ...selectedTraining,
        moduleIds: reordered.map((module) => module.id),
      });
    } catch (requestError) {
      setModules(modules);
      setError(errorMessage(requestError));
    }
  };

  const toggleTrainingSort = (key: TrainingSortKey) => {
    if (trainingSort === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }
    setTrainingSort(key);
    setSortDirection(key === "updatedAt" ? "desc" : "asc");
  };

  const sortIndicator = (key: TrainingSortKey) =>
    trainingSort === key ? (sortDirection === "asc" ? " ↑" : " ↓") : "";

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-7">
        <p className="text-sm font-bold uppercase tracking-wider text-indigo-700">
          Administración
        </p>
        <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
          Capacitaciones y módulos
        </h1>
        <p className="mt-2 text-slate-600">
          Crea la estructura, agrega los videos y publica cuando el contenido
          esté listo.
        </p>
      </div>

      {error ? (
        <div
          className="mb-5 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {error}
          <button onClick={() => setError("")} type="button">
            Cerrar
          </button>
        </div>
      ) : null}

      <form
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        onSubmit={handleCreateTraining}
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-bold text-slate-900">Nueva capacitación</h2>
            <p className="mt-1 text-sm text-slate-500">
              Crea el registro y luego completa su ruta de publicación.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.6fr_auto] md:items-end">
          <label className="text-sm font-semibold text-slate-700">
            Título
            <input
              className="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-600"
              onChange={(event) =>
                setNewTraining({ ...newTraining, title: event.target.value })
              }
              placeholder="Ej. Inducción corporativa"
              required
              value={newTraining.title}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Descripción
            <input
              className="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-600"
              onChange={(event) =>
                setNewTraining({
                  ...newTraining,
                  description: event.target.value,
                })
              }
              placeholder="Objetivo principal de la capacitación"
              required
              value={newTraining.description}
            />
          </label>
          <button
            className="min-h-11 rounded-xl bg-indigo-700 px-5 py-2.5 font-bold text-white disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            + Crear
          </button>
        </div>
      </form>

      <section
        aria-label="Listado de capacitaciones"
        className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Capacitaciones
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Selecciona una fila para administrar su contenido.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {filteredTrainings.length} de {trainings.length}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <label>
              <span className="sr-only">Buscar capacitaciones</span>
              <input
                className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-600"
                onChange={(event) => setTrainingQuery(event.target.value)}
                placeholder="Buscar por título o descripción…"
                type="search"
                value={trainingQuery}
              />
            </label>
            <label>
              <span className="sr-only">Filtrar por estado</span>
              <select
                className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-600"
                onChange={(event) =>
                  setTrainingStatus(
                    event.target.value as "ALL" | TrainingStatus,
                  )
                }
                value={trainingStatus}
              >
                <option value="ALL">Todos los estados</option>
                <option value="DRAFT">Borradores</option>
                <option value="PUBLISHED">Publicadas</option>
                <option value="ARCHIVED">Archivadas</option>
              </select>
            </label>
          </div>
        </div>

        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Cargando…</p>
        ) : null}
        {!isLoading && trainings.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Crea la primera capacitación.
          </p>
        ) : null}
        {!isLoading &&
        trainings.length > 0 &&
        filteredTrainings.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <p className="font-semibold text-slate-700">
              No encontramos coincidencias
            </p>
            <button
              className="mt-2 font-semibold text-indigo-700"
              onClick={() => {
                setTrainingQuery("");
                setTrainingStatus("ALL");
              }}
              type="button"
            >
              Limpiar filtros
            </button>
          </div>
        ) : null}

        {!isLoading && visibleTrainings.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-bold" scope="col">
                      <button
                        className="font-bold hover:text-slate-900"
                        onClick={() => toggleTrainingSort("title")}
                        type="button"
                      >
                        Capacitación{sortIndicator("title")}
                      </button>
                    </th>
                    <th className="px-5 py-3 font-bold" scope="col">
                      <button
                        className="font-bold hover:text-slate-900"
                        onClick={() => toggleTrainingSort("status")}
                        type="button"
                      >
                        Estado{sortIndicator("status")}
                      </button>
                    </th>
                    <th className="px-5 py-3 text-center font-bold" scope="col">
                      <button
                        className="font-bold hover:text-slate-900"
                        onClick={() => toggleTrainingSort("modules")}
                        type="button"
                      >
                        Módulos{sortIndicator("modules")}
                      </button>
                    </th>
                    <th className="px-5 py-3 font-bold" scope="col">
                      <button
                        className="font-bold hover:text-slate-900"
                        onClick={() => toggleTrainingSort("updatedAt")}
                        type="button"
                      >
                        Actualizada{sortIndicator("updatedAt")}
                      </button>
                    </th>
                    <th className="px-5 py-3 text-right font-bold" scope="col">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleTrainings.map((training) => (
                    <tr
                      className={
                        selectedId === training.id
                          ? "bg-indigo-50"
                          : "hover:bg-slate-50"
                      }
                      key={training.id}
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">
                          {training.title}
                        </p>
                        <p className="mt-1 max-w-xl truncate text-xs text-slate-500">
                          {training.description}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={training.status} />
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-slate-700">
                        {training.moduleIds.length}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {new Date(training.updatedAt).toLocaleDateString("es")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 hover:border-indigo-600 hover:text-indigo-700"
                          onClick={() => setSelectedId(training.id)}
                          type="button"
                        >
                          {selectedId === training.id
                            ? "Seleccionada"
                            : "Abrir"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {visibleTrainings.map((training) => (
                <article
                  className={`p-4 ${selectedId === training.id ? "bg-indigo-50" : ""}`}
                  key={training.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900">
                        {training.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {training.description}
                      </p>
                    </div>
                    <StatusBadge status={training.status} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-500">
                      {training.moduleIds.length} módulos · Actualizada{" "}
                      {new Date(training.updatedAt).toLocaleDateString("es")}
                    </span>
                    <button
                      className="min-h-10 shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"
                      onClick={() => setSelectedId(training.id)}
                      type="button"
                    >
                      {selectedId === training.id ? "Seleccionada" : "Abrir"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <nav
              aria-label="Paginación de capacitaciones"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-5"
            >
              <p className="text-sm text-slate-500">
                Página {trainingPage} de {totalTrainingPages}
              </p>
              <div className="flex gap-2">
                <button
                  className="min-h-10 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                  disabled={trainingPage === 1}
                  onClick={() => setTrainingPage((page) => page - 1)}
                  type="button"
                >
                  Anterior
                </button>
                <button
                  className="min-h-10 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                  disabled={trainingPage === totalTrainingPages}
                  onClick={() => setTrainingPage((page) => page + 1)}
                  type="button"
                >
                  Siguiente
                </button>
              </div>
            </nav>
          </>
        ) : null}
      </section>

      <div className="mt-6">
        {selectedTraining ? (
          <section className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-indigo-700">
                    Ruta de publicación
                  </p>
                  <h2 className="mt-1 text-lg font-black text-slate-900">
                    Completa el contenido paso a paso
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${canPublish ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"}`}
                  >
                    {canPublish
                      ? "Listo para publicar"
                      : "Preparando contenido"}
                  </span>
                  <button
                    aria-expanded={isPublicationOpen}
                    className="grid size-10 place-items-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
                    onClick={() => setIsPublicationOpen((open) => !open)}
                    title={isPublicationOpen ? "Ocultar ruta" : "Mostrar ruta"}
                    type="button"
                  >
                    {isPublicationOpen ? "−" : "+"}
                  </button>
                </div>
              </div>
              {isPublicationOpen ? (
                <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-3">
                  {publicationSteps.map((step, index) => (
                    <div
                      className={`rounded-xl border px-3 py-2.5 ${step.complete ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}
                      key={step.label}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`grid size-7 place-items-center rounded-full text-xs font-black ${step.complete ? "bg-indigo-700 text-white" : "bg-white text-slate-500"}`}
                        >
                          {step.complete ? "✓" : index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {step.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Información general
                  </h2>
                  <p className="mt-1 max-w-2xl truncate text-sm text-slate-500">
                    {selectedTraining.title} · {selectedTraining.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedTraining.status} />
                  <button
                    aria-expanded={isInformationOpen}
                    className="grid size-10 place-items-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
                    onClick={() => setIsInformationOpen((open) => !open)}
                    title={
                      isInformationOpen
                        ? "Ocultar información"
                        : "Editar información"
                    }
                    type="button"
                  >
                    {isInformationOpen ? "−" : "+"}
                  </button>
                </div>
              </div>
              {isInformationOpen ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <label className="block text-sm font-semibold text-slate-700">
                    Título
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    onChange={(event) =>
                      updateSelectedField("title", event.target.value)
                    }
                    value={selectedTraining.title}
                  />
                  <label className="mt-4 block text-sm font-semibold text-slate-700">
                    Descripción
                  </label>
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3"
                    onChange={(event) =>
                      updateSelectedField("description", event.target.value)
                    }
                    value={selectedTraining.description}
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white sm:w-auto"
                      onClick={saveTraining}
                      type="button"
                    >
                      Guardar cambios
                    </button>
                    <Link
                      className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                      to={`/admin/trainings/${selectedTraining.id}/preview`}
                    >
                      Vista previa
                    </Link>
                    {selectedTraining.status !== "PUBLISHED" ? (
                      <button
                        className="min-h-11 w-full rounded-xl bg-indigo-700 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        disabled={!canPublish}
                        onClick={() => changeStatus("PUBLISHED")}
                        title={
                          canPublish
                            ? "Publicar capacitación"
                            : "Agrega al menos un módulo y un video antes de publicar"
                        }
                        type="button"
                      >
                        Publicar
                      </button>
                    ) : (
                      <button
                        className="min-h-11 w-full rounded-xl bg-amber-100 px-4 py-2.5 font-semibold text-amber-900 sm:w-auto"
                        onClick={() => changeStatus("DRAFT")}
                        type="button"
                      >
                        Volver a borrador
                      </button>
                    )}
                    <button
                      className="min-h-11 w-full rounded-xl border border-red-200 px-4 py-2.5 font-semibold text-red-700 sm:ml-auto sm:w-auto"
                      onClick={deleteTraining}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Link
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                    to={`/admin/trainings/${selectedTraining.id}/preview`}
                  >
                    Vista previa
                  </Link>
                  {selectedTraining.status !== "PUBLISHED" ? (
                    <button
                      className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      disabled={!canPublish}
                      onClick={() => changeStatus("PUBLISHED")}
                      type="button"
                    >
                      Publicar
                    </button>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-indigo-700">
                    Contenido
                  </p>
                  <h2 className="mt-1 text-lg font-black text-slate-900">
                    Módulos ({modules.length})
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {totalVideos} videos en total
                  </span>
                  <button
                    className="min-h-10 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white"
                    onClick={() => setIsModuleFormOpen((open) => !open)}
                    type="button"
                  >
                    {isModuleFormOpen ? "Cancelar" : "+ Agregar módulo"}
                  </button>
                </div>
              </div>

              {isModuleFormOpen ? (
                <form
                  className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4"
                  onSubmit={createModule}
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
                    <label className="text-sm font-semibold text-slate-700">
                      Nombre
                      <input
                        autoFocus
                        className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-indigo-600"
                        onChange={(event) =>
                          setNewModule({
                            ...newModule,
                            title: event.target.value,
                          })
                        }
                        placeholder="Ej. Introducción"
                        required
                        value={newModule.title}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Descripción opcional
                      <input
                        className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-indigo-600"
                        onChange={(event) =>
                          setNewModule({
                            ...newModule,
                            description: event.target.value,
                          })
                        }
                        placeholder="Qué aprenderá el participante"
                        value={newModule.description}
                      />
                    </label>
                    <button
                      className="min-h-11 rounded-xl bg-indigo-700 px-5 py-2.5 font-bold text-white"
                      type="submit"
                    >
                      Agregar
                    </button>
                  </div>
                </form>
              ) : null}

              {modules.length > 4 ? (
                <label className="mt-4 block">
                  <span className="sr-only">Buscar módulos</span>
                  <input
                    className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-600"
                    onChange={(event) => setModuleQuery(event.target.value)}
                    placeholder="Buscar módulos por nombre o descripción…"
                    type="search"
                    value={moduleQuery}
                  />
                </label>
              ) : null}

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                {modules.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-500">
                    Agrega el primer módulo para organizar los videos.
                  </p>
                ) : null}
                {modules.length > 0 ? (
                  <div className="hidden grid-cols-[48px_minmax(0,1fr)_110px_250px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
                    <span>Orden</span>
                    <span>Módulo</span>
                    <span>Contenido</span>
                    <span className="text-right">Acciones</span>
                  </div>
                ) : null}
                <div className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto overscroll-contain">
                  {visibleModules.map(({ module, index }) => (
                    <article className="relative bg-white" key={module.id}>
                      <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-2 px-3 py-2.5 md:grid-cols-[48px_minmax(0,1fr)_110px_250px] md:items-center">
                        <span className="grid size-8 place-items-center rounded-lg bg-slate-900 text-xs font-black text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-slate-900">
                            {module.title}
                          </h3>
                          <p
                            className="truncate text-xs text-slate-500"
                            title={module.description || "Sin descripción"}
                          >
                            {module.description || "Sin descripción"}
                          </p>
                        </div>
                        <div className="col-start-2 flex flex-wrap items-center gap-1.5 md:col-auto">
                          <span className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-bold text-indigo-800">
                            {module.videoIds.length}{" "}
                            {module.videoIds.length === 1 ? "video" : "videos"}
                          </span>
                          {(videosByModule[module.id] ?? []).some(
                            (video) => video.status !== "READY",
                          ) ? (
                            <span
                              className="size-2 rounded-full bg-amber-500"
                              title="Requiere revisión"
                            />
                          ) : null}
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5 md:col-auto md:justify-end">
                          <Link
                            className="min-h-9 flex-1 rounded-lg bg-indigo-700 px-3 py-2 text-center text-xs font-bold text-white sm:flex-none"
                            to={`/admin/modules/${module.id}/videos?title=${encodeURIComponent(module.title)}`}
                          >
                            Videos
                          </Link>
                          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
                            <button
                              aria-label={`Subir módulo ${module.title}`}
                              className="grid size-8 place-items-center rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-25"
                              disabled={index === 0}
                              onClick={() => moveModule(index, -1)}
                              title="Mover hacia arriba"
                              type="button"
                            >
                              ↑
                            </button>
                            <button
                              aria-label={`Bajar módulo ${module.title}`}
                              className="grid size-8 place-items-center rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-25"
                              disabled={index === modules.length - 1}
                              onClick={() => moveModule(index, 1)}
                              title="Mover hacia abajo"
                              type="button"
                            >
                              ↓
                            </button>
                          </div>
                          <div>
                            <button
                              aria-expanded={openModuleMenuId === module.id}
                              aria-haspopup="menu"
                              aria-label={`Más acciones para ${module.title}`}
                              className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white font-black text-slate-700 hover:bg-slate-50"
                              onClick={() =>
                                setOpenModuleMenuId((openId) =>
                                  openId === module.id ? null : module.id,
                                )
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Escape")
                                  setOpenModuleMenuId(null);
                              }}
                              type="button"
                            >
                              ⋯
                            </button>
                          </div>
                        </div>
                      </div>

                      {openModuleMenuId === module.id ? (
                        <div
                          className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2"
                          onKeyDown={(event) => {
                            if (event.key === "Escape")
                              setOpenModuleMenuId(null);
                          }}
                          role="menu"
                        >
                          <button
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                            onClick={() => startEditingModule(module)}
                            role="menuitem"
                            type="button"
                          >
                            Editar información
                          </button>
                          <button
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                            onClick={() => deleteModule(module)}
                            role="menuitem"
                            type="button"
                          >
                            Eliminar módulo
                          </button>
                        </div>
                      ) : null}

                      {moduleDraft?.id === module.id ? (
                        <div className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="text-sm font-semibold text-slate-700">
                              Nombre del módulo
                              <input
                                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-600"
                                maxLength={150}
                                onChange={(event) =>
                                  setModuleDraft({
                                    ...moduleDraft,
                                    title: event.target.value,
                                  })
                                }
                                required
                                value={moduleDraft.title}
                              />
                            </label>
                            <label className="text-sm font-semibold text-slate-700">
                              Descripción
                              <input
                                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-600"
                                maxLength={2000}
                                onChange={(event) =>
                                  setModuleDraft({
                                    ...moduleDraft,
                                    description: event.target.value,
                                  })
                                }
                                value={moduleDraft.description}
                              />
                            </label>
                          </div>
                          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                              className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700"
                              onClick={() => setModuleDraft(null)}
                              type="button"
                            >
                              Cancelar
                            </button>
                            <button
                              className="min-h-11 rounded-xl bg-slate-900 px-5 py-2.5 font-bold text-white disabled:opacity-50"
                              disabled={moduleDraft.title.trim().length < 3}
                              onClick={saveModule}
                              type="button"
                            >
                              Guardar módulo
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  ))}
                  {modules.length > 0 && visibleModules.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      <p>No encontramos módulos.</p>
                      <button
                        className="mt-2 font-semibold text-indigo-700"
                        onClick={() => setModuleQuery("")}
                        type="button"
                      >
                        Limpiar búsqueda
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </section>
        ) : (
          <section className="grid min-h-96 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center text-slate-500">
            Selecciona o crea una capacitación.
          </section>
        )}
      </div>
    </main>
  );
}
