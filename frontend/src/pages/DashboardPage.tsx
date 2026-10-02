import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const adminActions = [
  {
    title: "Asignaciones",
    description:
      "Entrega capacitaciones a participantes y define sus fechas límite.",
    label: "Asignar capacitaciones",
    href: "/admin/assignments",
  },
  {
    title: "Usuarios y accesos",
    description: "Crear cuentas, asignar permisos y controlar su acceso.",
    label: "Administrar usuarios",
    href: "/admin/users",
  },
  {
    title: "Capacitaciones y módulos",
    description: "Crear, organizar y publicar contenido corporativo.",
    label: "Administrar contenido",
    href: "/admin/content",
  },
  {
    title: "Progreso de participantes",
    description: "Consultar avance y finalización de las capacitaciones.",
    label: "Ver progreso",
    href: "/admin/progress",
  },
];

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <section className="rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-950 px-5 py-7 text-white shadow-xl sm:rounded-3xl sm:px-10 sm:py-9">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-300">
          {isAdmin ? "Panel administrativo" : "Panel del participante"}
        </p>
        <h1 className="mt-3 text-2xl font-black sm:text-4xl">
          Bienvenido, {user?.displayName}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          {isAdmin
            ? "Administra capacitaciones, carga videos y consulta el progreso de los participantes desde un solo lugar."
            : "Consulta las capacitaciones que te asignaron, continúa donde quedaste y revisa tu progreso."}
        </p>
      </section>

      {isAdmin ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-indigo-700">
                Administración
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                ¿Qué deseas gestionar?
              </h2>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
              Administrador
            </span>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {adminActions.map((action) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                key={action.title}
              >
                <div className="grid size-11 place-items-center rounded-xl bg-amber-100 font-black text-amber-900">
                  →
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {action.title}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                  {action.description}
                </p>
                {action.href ? (
                  <Link
                    className="mt-5 block w-full rounded-xl bg-indigo-700 px-4 py-3 text-center text-sm font-semibold text-white"
                    to={action.href}
                  >
                    {action.label}
                  </Link>
                ) : (
                  <button
                    className="mt-5 w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500"
                    disabled
                    type="button"
                  >
                    {action.label}
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Aún no hay capacitaciones disponibles
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-slate-600">
            Cuando un administrador te asigne una capacitación publicada,
            aparecerá aquí.
          </p>
        </section>
      )}
    </main>
  );
}
