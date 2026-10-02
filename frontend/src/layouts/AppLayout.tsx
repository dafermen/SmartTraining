import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
    isActive
      ? "bg-indigo-50 text-indigo-800"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-xs font-bold transition focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
    isActive
      ? "bg-indigo-100 text-indigo-900"
      : "text-slate-600 active:bg-slate-100"
  }`;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";
  const panelPath = isAdmin ? "/admin" : "/learn";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fffdf9]/95 backdrop-blur md:static">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-8 md:py-3">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              aria-label="Ir al panel de SmartTraining"
              className="flex min-w-0 items-center gap-2.5 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100"
              to={panelPath}
            >
              <img
                alt=""
                className="size-10 shrink-0 object-contain md:size-11"
                src="/smarttraining-logo.png"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold tracking-wide text-slate-900 sm:text-base">
                  SmartTraining
                </span>
                <span className="hidden text-xs text-slate-500 sm:block">
                  Capacitación corporativa
                </span>
              </span>
            </Link>

            <nav
              aria-label="Navegación principal"
              className="hidden items-center border-l border-slate-200 pl-4 md:flex"
            >
              <NavLink className={desktopLinkClass} end to={panelPath}>
                Panel
              </NavLink>
              {isAdmin ? (
                <>
                  <NavLink className={desktopLinkClass} to="/admin/content">
                    Capacitaciones
                  </NavLink>
                  <NavLink className={desktopLinkClass} to="/admin/users">
                    Usuarios
                  </NavLink>
                  <NavLink className={desktopLinkClass} to="/admin/assignments">
                    Asignaciones
                  </NavLink>
                  <NavLink className={desktopLinkClass} to="/admin/progress">
                    Progreso
                  </NavLink>
                </>
              ) : null}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="mr-1 hidden text-right lg:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.displayName}
              </p>
              <p className="text-xs text-slate-500">
                {isAdmin ? "Administrador" : "Participante"}
              </p>
            </div>
            <NavLink
              className={({ isActive }) =>
                `${desktopLinkClass({ isActive })} hidden md:inline-flex`
              }
              to="/docs"
            >
              Documentación
            </NavLink>
            <button
              className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:px-4"
              onClick={handleLogout}
              type="button"
            >
              <span className="hidden sm:inline">Cerrar sesión</span>
              <span className="sm:hidden">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <Outlet />

      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-[#fffdf9]/95 px-2 pt-2 shadow-[0_-8px_24px_rgba(49,46,129,0.10)] backdrop-blur md:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div
          className={`mx-auto grid max-w-lg ${isAdmin ? "grid-cols-5" : "grid-cols-2"} gap-1`}
        >
          <NavLink className={mobileLinkClass} end to={panelPath}>
            <span aria-hidden="true" className="text-lg leading-none">
              ⌂
            </span>
            Panel
          </NavLink>
          {isAdmin ? (
            <>
              <NavLink className={mobileLinkClass} to="/admin/content">
                <span aria-hidden="true" className="text-base leading-none">
                  ▤
                </span>
                Cursos
              </NavLink>
              <NavLink className={mobileLinkClass} to="/admin/progress">
                <span aria-hidden="true" className="text-base leading-none">
                  ✓
                </span>
                Progreso
              </NavLink>
              <NavLink className={mobileLinkClass} to="/admin/users">
                <span aria-hidden="true" className="text-base leading-none">
                  ♙
                </span>
                Usuarios
              </NavLink>
            </>
          ) : null}
          <NavLink className={mobileLinkClass} to="/docs">
            <span aria-hidden="true" className="text-base leading-none">
              ?
            </span>
            Ayuda
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
