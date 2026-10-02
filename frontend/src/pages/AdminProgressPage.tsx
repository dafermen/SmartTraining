import axios from "axios";
import { useEffect, useState } from "react";
import { progressApi } from "../api/progress";
import { useToast } from "../contexts/ToastContext";
import type { AdminProgressRow } from "../types/api";

const statusClass = (status: AdminProgressRow["status"]) =>
  `rounded-full px-3 py-1 text-xs font-bold ${
    status === "COMPLETED"
      ? "bg-indigo-100 text-indigo-800"
      : "bg-amber-100 text-amber-800"
  }`;

export function AdminProgressPage() {
  const { notify } = useToast();
  const [records, setRecords] = useState<AdminProgressRow[]>([]);
  const [error, setError] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);

  useEffect(() => {
    progressApi
      .adminList()
      .then(setRecords)
      .catch(() => setError("No pudimos cargar el progreso."));
  }, []);

  const resetProgress = async (record: AdminProgressRow) => {
    const confirmed = window.confirm(
      `¿Reiniciar el video "${record.videoTitle}" para ${record.userDisplayName}? El participante comenzará nuevamente desde cero.`,
    );
    if (!confirmed) return;

    setError("");
    setResettingId(record.id);
    try {
      await progressApi.resetVideo(record.userId, record.videoId);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      notify("El progreso del video fue reiniciado.");
    } catch (requestError) {
      setError(
        axios.isAxiosError<{ message?: string }>(requestError)
          ? (requestError.response?.data.message ??
              "No pudimos reiniciar el progreso.")
          : "No pudimos reiniciar el progreso.",
      );
    } finally {
      setResettingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 sm:text-sm">
        Administración
      </p>
      <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
        Progreso de participantes
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
        Consulta quién está avanzando y qué videos ya completó.
      </p>
      {error ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
      ) : null}

      <section className="mt-6 space-y-3 md:hidden" aria-label="Progreso">
        {records.map((record) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            key={record.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-bold text-slate-900">
                  {record.userDisplayName}
                </h2>
                <p className="text-xs text-slate-500">@{record.username}</p>
              </div>
              <span className={statusClass(record.status)}>
                {record.status === "COMPLETED" ? "Completado" : "En progreso"}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-slate-500">Capacitación</dt>
              <dd className="min-w-0 text-right font-semibold text-slate-800">
                {record.trainingTitle}
              </dd>
              <dt className="text-slate-500">Video</dt>
              <dd className="min-w-0 text-right font-semibold text-slate-800">
                {record.videoTitle}
              </dd>
              <dt className="text-slate-500">Avance</dt>
              <dd className="text-right font-black text-indigo-700">
                {record.percentage}%
              </dd>
              <dt className="text-slate-500">Actividad</dt>
              <dd className="text-right text-xs text-slate-600">
                {new Date(record.lastViewedAt).toLocaleString("es")}
              </dd>
            </dl>
            <button
              aria-label={`Reiniciar ${record.videoTitle} para ${record.userDisplayName}`}
              className="mt-4 min-h-11 w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={resettingId === record.id}
              onClick={() => void resetProgress(record)}
              type="button"
            >
              {resettingId === record.id ? "Reiniciando…" : "Reiniciar video"}
            </button>
          </article>
        ))}
      </section>

      <div className="mt-7 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4">Participante</th>
              <th className="px-5 py-4">Capacitación</th>
              <th className="px-5 py-4">Video</th>
              <th className="px-5 py-4">Avance</th>
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4">Última actividad</th>
              <th className="px-5 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id}>
                <td className="px-5 py-4">
                  <p className="font-bold text-slate-900">
                    {record.userDisplayName}
                  </p>
                  <p className="text-xs text-slate-500">{record.username}</p>
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {record.trainingTitle}
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {record.videoTitle}
                </td>
                <td className="px-5 py-4 font-bold text-slate-900">
                  {record.percentage}%
                </td>
                <td className="px-5 py-4">
                  <span className={statusClass(record.status)}>
                    {record.status === "COMPLETED"
                      ? "Completado"
                      : "En progreso"}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {new Date(record.lastViewedAt).toLocaleString("es")}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    aria-label={`Reiniciar ${record.videoTitle} para ${record.userDisplayName}`}
                    className="min-h-10 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={resettingId === record.id}
                    onClick={() => void resetProgress(record)}
                    type="button"
                  >
                    {resettingId === record.id ? "Reiniciando…" : "Reiniciar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!error && records.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Todavía no hay actividad registrada.
        </p>
      ) : null}
    </main>
  );
}
