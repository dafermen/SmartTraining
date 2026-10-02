import { Link } from "react-router-dom";

export function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-5 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-red-600">
          Acceso denegado
        </p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">
          No tienes permiso para ver esta página
        </h1>
        <Link
          className="mt-6 inline-flex rounded-xl bg-indigo-700 px-5 py-3 font-bold text-white"
          to="/app"
        >
          Volver al panel
        </Link>
      </div>
    </main>
  );
}
