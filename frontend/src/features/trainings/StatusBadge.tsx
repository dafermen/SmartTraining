import type { TrainingStatus } from "../../types/api";

const statusStyles: Record<TrainingStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  PUBLISHED: "bg-indigo-100 text-indigo-800",
  ARCHIVED: "bg-slate-200 text-slate-700",
};

const statusLabels: Record<TrainingStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicada",
  ARCHIVED: "Archivada",
};

export function StatusBadge({ status }: { status: TrainingStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
