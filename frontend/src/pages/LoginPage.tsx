import axios from "axios";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && user) {
    const authenticatedHome = user.role === "ADMIN" ? "/admin" : "/learn";
    return <Navigate to={authenticatedHome} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const authenticatedUser = await login(username, password);
      const requestedPath = (
        location.state as { from?: { pathname?: string } } | null
      )?.from?.pathname;
      const roleHome = authenticatedUser.role === "ADMIN" ? "/admin" : "/learn";
      navigate(requestedPath ?? roleHome, { replace: true });
    } catch (requestError) {
      const message = axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data.message
        : undefined;
      setError(
        message ??
          "No fue posible iniciar sesión. Verifica que la API esté activa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-dvh bg-[radial-gradient(circle_at_top_left,_#e0e7ff,_transparent_42%),radial-gradient(circle_at_bottom_right,_#fef3c7,_transparent_38%),linear-gradient(135deg,#fafaf9,#f5f3ff)] px-4 py-6 sm:px-5 sm:py-10 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-20">
      <section className="mx-auto hidden max-w-xl lg:block">
        <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
          Plataforma de formación
        </span>
        <h1 className="mt-6 text-5xl font-black leading-tight text-slate-950">
          Aprende, avanza y continúa donde quedaste.
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          Accede con el usuario asignado por tu organización. Administradores
          gestionan contenido y participantes consultan su capacitación.
        </p>
      </section>

      <section className="mx-auto w-full max-w-md rounded-2xl border border-white/80 bg-white/95 p-5 shadow-[0_30px_90px_rgba(49,46,129,0.16)] backdrop-blur sm:rounded-3xl sm:p-10">
        <div className="flex items-center gap-4">
          <img
            alt=""
            className="size-14 object-contain"
            src="/smarttraining-logo.png"
          />
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-700">
              SmartTraining
            </p>
            <p className="text-sm text-slate-500">Acceso seguro</p>
          </div>
        </div>

        <h2 className="mt-6 text-2xl font-black text-slate-900 sm:mt-8 sm:text-3xl">
          Iniciar sesión
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Usuarios de demostración: <strong>admin</strong> y{" "}
          <strong>learner</strong>. Usa la contraseña indicada en el README.
        </p>

        <form
          className="mt-6 space-y-4 sm:mt-7 sm:space-y-5"
          onSubmit={handleSubmit}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Usuario
            </span>
            <input
              autoComplete="username"
              autoFocus
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Contraseña
            </span>
            <input
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? (
            <p
              className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            className="w-full rounded-xl bg-indigo-700 px-5 py-3.5 font-bold text-white shadow-lg shadow-indigo-900/15 transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}
