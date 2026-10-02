import axios from "axios";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { assignmentsApi } from "../api/assignments";
import { contentApi } from "../api/content";
import { usersApi } from "../api/users";
import { useToast } from "../contexts/ToastContext";
import type { AdminTrainingAssignment, AuthUser, Training } from "../types/api";

const PAGE_SIZE = 10;

type DueState = "ALL" | "OVERDUE" | "DUE_SOON" | "ON_TRACK" | "NO_DUE_DATE";

const errorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error)
    ? (error.response?.data.message ?? fallback)
    : fallback;

const today = () => new Date().toISOString().slice(0, 10);

const dueState = (dueDate: string | null): Exclude<DueState, "ALL"> => {
  if (!dueDate) return "NO_DUE_DATE";
  const current = new Date(`${today()}T00:00:00`);
  const due = new Date(`${dueDate}T00:00:00`);
  if (due < current) return "OVERDUE";
  const days = Math.ceil((due.getTime() - current.getTime()) / 86_400_000);
  return days <= 7 ? "DUE_SOON" : "ON_TRACK";
};

const duePresentation = (dueDate: string | null) => {
  const state = dueState(dueDate);
  if (state === "OVERDUE")
    return { label: "Vencida", className: "bg-red-100 text-red-800" };
  if (state === "DUE_SOON")
    return { label: "Próxima", className: "bg-amber-100 text-amber-900" };
  if (state === "ON_TRACK")
    return { label: "En plazo", className: "bg-indigo-100 text-indigo-800" };
  return { label: "Sin fecha", className: "bg-slate-100 text-slate-600" };
};

const displayDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value}T00:00:00Z`))
    : "Sin fecha límite";

export function AdminAssignmentsPage() {
  const { notify } = useToast();
  const [assignments, setAssignments] = useState<AdminTrainingAssignment[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [userId, setUserId] = useState("");
  const [trainingId, setTrainingId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DueState>("ALL");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminTrainingAssignment | null>(null);
  const [editDueDate, setEditDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setError("");
    try {
      const [loadedAssignments, loadedUsers, loadedTrainings] =
        await Promise.all([
          assignmentsApi.list(),
          usersApi.list(),
          contentApi.listTrainings(),
        ]);
      setAssignments(loadedAssignments);
      setUsers(loadedUsers);
      setTrainings(loadedTrainings);
    } catch (requestError) {
      setError(
        errorMessage(requestError, "No pudimos cargar las asignaciones."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const learners = useMemo(
    () => users.filter((user) => user.role === "LEARNER" && user.active),
    [users],
  );
  const publishedTrainings = useMemo(
    () => trainings.filter((training) => training.status === "PUBLISHED"),
    [trainings],
  );
  const selectedTrainingIds = useMemo(
    () =>
      new Set(
        assignments
          .filter((assignment) => assignment.userId === userId)
          .map((assignment) => assignment.trainingId),
      ),
    [assignments, userId],
  );
  const availableTrainings = publishedTrainings.filter(
    (training) => !selectedTrainingIds.has(training.id),
  );

  useEffect(() => {
    if (trainingId && selectedTrainingIds.has(trainingId)) setTrainingId("");
  }, [selectedTrainingIds, trainingId]);

  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return assignments.filter((assignment) => {
      const matchesText =
        !term ||
        assignment.userDisplayName.toLocaleLowerCase("es").includes(term) ||
        assignment.username.toLocaleLowerCase("es").includes(term) ||
        assignment.trainingTitle.toLocaleLowerCase("es").includes(term);
      return (
        matchesText &&
        (filter === "ALL" || dueState(assignment.dueDate) === filter)
      );
    });
  }, [assignments, filter, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssignments.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const visibleAssignments = filteredAssignments.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => setPage(1), [filter, search]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId || !trainingId) return;
    setIsSaving(true);
    try {
      const created = await assignmentsApi.create({
        userId,
        trainingId,
        dueDate: dueDate || null,
      });
      setAssignments((items) => [created, ...items]);
      setTrainingId("");
      setDueDate("");
      notify("Capacitación asignada correctamente.");
    } catch (requestError) {
      notify(
        errorMessage(requestError, "No fue posible crear la asignación."),
        "ERROR",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openEditor = (assignment: AdminTrainingAssignment) => {
    setEditing(assignment);
    setEditDueDate(assignment.dueDate ?? "");
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setIsSaving(true);
    try {
      const updated = await assignmentsApi.updateDueDate(
        editing.id,
        editDueDate || null,
      );
      setAssignments((items) =>
        items.map((assignment) =>
          assignment.id === updated.id
            ? { ...assignment, ...updated }
            : assignment,
        ),
      );
      setEditing(null);
      notify("Fecha límite actualizada.");
    } catch (requestError) {
      notify(
        errorMessage(requestError, "No fue posible actualizar la asignación."),
        "ERROR",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (assignment: AdminTrainingAssignment) => {
    if (
      !window.confirm(
        `¿Retirar “${assignment.trainingTitle}” de ${assignment.userDisplayName}? Su progreso se conservará.`,
      )
    )
      return;
    try {
      await assignmentsApi.remove(assignment.id);
      setAssignments((items) =>
        items.filter((candidate) => candidate.id !== assignment.id),
      );
      notify("Asignación retirada. El progreso quedó conservado.");
    } catch (requestError) {
      notify(
        errorMessage(requestError, "No fue posible retirar la asignación."),
        "ERROR",
      );
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 sm:text-sm">
          Administración
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
          Asignaciones
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Decide qué capacitación puede ver cada participante y establece una
          fecha límite cuando sea necesario.
        </p>
      </div>

      <form
        className="mt-6 rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm sm:p-6"
        onSubmit={handleCreate}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Nueva asignación
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Solo se muestran participantes activos y capacitaciones
              publicadas.
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800">
            {assignments.length} activas
          </span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_0.7fr_auto] lg:items-end">
          <label>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Participante
            </span>
            <select
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
              onChange={(event) => setUserId(event.target.value)}
              required
              value={userId}
            >
              <option value="">Seleccionar participante…</option>
              {learners.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName} · @{user.username}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Capacitación
            </span>
            <select
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 disabled:bg-slate-100"
              disabled={!userId}
              onChange={(event) => setTrainingId(event.target.value)}
              required
              value={trainingId}
            >
              <option value="">
                {userId
                  ? "Seleccionar capacitación…"
                  : "Elige un participante primero"}
              </option>
              {availableTrainings.map((training) => (
                <option key={training.id} value={training.id}>
                  {training.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Fecha límite
            </span>
            <input
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
              onChange={(event) => setDueDate(event.target.value)}
              type="date"
              value={dueDate}
            />
          </label>
          <button
            className="min-h-11 rounded-xl bg-indigo-700 px-5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
            disabled={isSaving || !userId || !trainingId}
            type="submit"
          >
            {isSaving ? "Asignando…" : "Asignar"}
          </button>
        </div>
        {userId && availableTrainings.length === 0 ? (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Este participante ya tiene todas las capacitaciones publicadas.
          </p>
        ) : null}
      </form>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              aria-label="Buscar asignaciones"
              className="min-h-11 rounded-xl border border-slate-300 px-3"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar participante o capacitación…"
              type="search"
              value={search}
            />
            <select
              aria-label="Filtrar por vencimiento"
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-3"
              onChange={(event) => setFilter(event.target.value as DueState)}
              value={filter}
            >
              <option value="ALL">Todos los plazos</option>
              <option value="OVERDUE">Vencidas</option>
              <option value="DUE_SOON">Próximas 7 días</option>
              <option value="ON_TRACK">En plazo</option>
              <option value="NO_DUE_DATE">Sin fecha límite</option>
            </select>
          </div>
        </div>

        {error ? (
          <p className="m-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
        ) : null}
        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Cargando asignaciones…
          </p>
        ) : null}
        {!isLoading && !error && visibleAssignments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h2 className="font-bold text-slate-900">No hay asignaciones</h2>
            <p className="mt-2 text-sm text-slate-500">
              Crea la primera o ajusta los filtros de búsqueda.
            </p>
          </div>
        ) : null}

        <div className="space-y-3 p-4 md:hidden">
          {visibleAssignments.map((assignment) => {
            const presentation = duePresentation(assignment.dueDate);
            return (
              <article
                className="rounded-xl border border-slate-200 p-4"
                key={assignment.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">
                      {assignment.trainingTitle}
                    </h3>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {assignment.userDisplayName} · @{assignment.username}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${presentation.className}`}
                  >
                    {presentation.label}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {displayDate(assignment.dueDate)}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    className="min-h-11 rounded-xl border border-slate-300 text-sm font-bold"
                    onClick={() => openEditor(assignment)}
                    type="button"
                  >
                    Cambiar fecha
                  </button>
                  <button
                    className="min-h-11 rounded-xl border border-red-200 text-sm font-bold text-red-700"
                    onClick={() => void handleRemove(assignment)}
                    type="button"
                  >
                    Retirar
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Participante</th>
                <th className="px-5 py-3">Capacitación</th>
                <th className="px-5 py-3">Fecha límite</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleAssignments.map((assignment) => {
                const presentation = duePresentation(assignment.dueDate);
                return (
                  <tr className="hover:bg-slate-50" key={assignment.id}>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">
                        {assignment.userDisplayName}
                      </p>
                      <p className="text-xs text-slate-500">
                        @{assignment.username}
                      </p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      {assignment.trainingTitle}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {displayDate(assignment.dueDate)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${presentation.className}`}
                      >
                        {presentation.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                          onClick={() => openEditor(assignment)}
                          type="button"
                        >
                          Fecha
                        </button>
                        <button
                          className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700"
                          onClick={() => void handleRemove(assignment)}
                          type="button"
                        >
                          Retirar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm sm:px-5">
          <span className="text-slate-500">
            Página {safePage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 font-semibold disabled:opacity-40"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              type="button"
            >
              Anterior
            </button>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 font-semibold disabled:opacity-40"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      {editing ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/50 sm:place-items-center sm:p-4"
          role="presentation"
        >
          <form
            aria-label="Cambiar fecha límite"
            aria-modal="true"
            className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
            onSubmit={handleUpdate}
            role="dialog"
          >
            <h2 className="text-xl font-black text-slate-950">
              Cambiar fecha límite
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {editing.userDisplayName} · {editing.trainingTitle}
            </p>
            <label className="mt-5 block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Nueva fecha
              </span>
              <input
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
                onChange={(event) => setEditDueDate(event.target.value)}
                type="date"
                value={editDueDate}
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">
              Deja el campo vacío para quitar la fecha límite.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="min-h-11 rounded-xl border border-slate-300 font-bold"
                onClick={() => setEditing(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="min-h-11 rounded-xl bg-slate-950 font-bold text-white disabled:opacity-50"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
