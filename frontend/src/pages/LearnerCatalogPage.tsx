import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assignmentsApi } from "../api/assignments";
import { contentApi } from "../api/content";
import { progressApi } from "../api/progress";
import type {
  Training,
  TrainingAssignment,
  TrainingProgressSummary,
} from "../types/api";

export function LearnerCatalogPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [summaries, setSummaries] = useState<
    Record<string, TrainingProgressSummary>
  >({});
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([contentApi.listTrainings(), assignmentsApi.mine()])
      .then(async ([items, loadedAssignments]) => {
        setTrainings(items);
        setAssignments(loadedAssignments);
        const results = await Promise.all(
          items.map(
            async (training) =>
              [
                training.id,
                (await progressApi.forTraining(training.id)).summary,
              ] as const,
          ),
        );
        setSummaries(Object.fromEntries(results));
      })
      .catch(() => setError("No pudimos cargar las capacitaciones."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-indigo-700">
          Aprendizaje
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
          Mis capacitaciones
        </h1>
        <p className="mt-2 text-slate-600">
          Elige un curso, continúa donde quedaste y revisa tu avance.
        </p>
      </div>
      {loading ? (
        <p className="mt-8 text-slate-600">Cargando catálogo…</p>
      ) : null}
      {error ? (
        <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
      ) : null}
      {!loading && !error && trainings.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            No hay capacitaciones publicadas
          </h2>
          <p className="mt-2 text-slate-600">
            Cuando un administrador te asigne una capacitación publicada,
            aparecerá aquí.
          </p>
        </section>
      ) : null}
      <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {trainings.map((training) => {
          const summary = summaries[training.id];
          const assignment = assignments.find(
            (candidate) => candidate.trainingId === training.id,
          );
          return (
            <article
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              key={training.id}
            >
              <span className="w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                PUBLICADA
              </span>
              <h2 className="mt-4 text-xl font-black text-slate-900">
                {training.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {training.description}
              </p>
              {assignment?.dueDate ? (
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                  Fecha límite:{" "}
                  {new Intl.DateTimeFormat("es", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(`${assignment.dueDate}T00:00:00Z`))}
                </p>
              ) : null}
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${summary?.percentage ?? 0}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {summary?.completedVideos ?? 0} de {summary?.totalVideos ?? 0}{" "}
                videos · {summary?.percentage ?? 0}%
              </p>
              <Link
                className="mt-5 rounded-xl bg-indigo-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-indigo-800"
                to={`/learn/trainings/${training.id}`}
              >
                {summary?.startedVideos
                  ? "Continuar capacitación"
                  : "Comenzar capacitación"}
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}
