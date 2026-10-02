import { useState } from "react";
import { API_BASE_URL } from "../../api/client";

export function ProtectedVideoPreview({
  videoId,
  initiallyVisible = false,
}: {
  videoId: string;
  initiallyVisible?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const [error, setError] = useState("");

  if (isVisible)
    return (
      <div className="mt-4">
        <video
          className="max-h-96 w-full rounded-xl bg-black"
          controls
          crossOrigin="use-credentials"
          onCanPlay={() => setError("")}
          onError={() =>
            setError(
              "El navegador no pudo reproducir el video. Recarga la página e inténtalo nuevamente.",
            )
          }
          poster={`${API_BASE_URL}/videos/${videoId}/thumbnail`}
          preload="metadata"
          src={`${API_BASE_URL}/videos/${videoId}/stream`}
        >
          Tu navegador no puede reproducir este video.
        </video>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    );

  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-center">
      <button
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        onClick={() => setIsVisible(true)}
        type="button"
      >
        Reproducir vista previa protegida
      </button>
      <p className="mt-2 text-xs text-slate-500">
        El video se transmite por partes y no se descarga completo.
      </p>
    </div>
  );
}
