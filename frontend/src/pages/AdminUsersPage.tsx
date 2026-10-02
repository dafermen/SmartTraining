import axios from "axios";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi, type CreateUserInput } from "../api/users";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import type { AuthUser, UserAuditEvent, UserRole } from "../types/api";

const PAGE_SIZE = 10;
const emptyCreateForm: CreateUserInput = {
  username: "",
  displayName: "",
  role: "LEARNER",
  password: "",
};

const errorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error)
    ? (error.response?.data.message ?? fallback)
    : fallback;

const roleLabel = (role: UserRole) =>
  role === "ADMIN" ? "Administrador" : "Participante";

const auditLabel = (action: string) => {
  if (action === "USER_CREATED") return "Usuario creado";
  if (action === "USER_UPDATED") return "Acceso actualizado";
  if (action === "PASSWORD_RESET") return "Contraseña restablecida";
  if (action === "VIDEO_PROGRESS_RESET") return "Progreso de video reiniciado";
  return action;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
      {children}
    </span>
  );
}

export function AdminUsersPage() {
  const { user: currentUser, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [audit, setAudit] = useState<UserAuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [page, setPage] = useState(1);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createConfirmation, setCreateConfirmation] = useState("");
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: "",
    role: "LEARNER" as UserRole,
    active: true,
  });
  const [passwordUser, setPasswordUser] = useState<AuthUser | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setError("");
    try {
      const [loadedUsers, loadedAudit] = await Promise.all([
        usersApi.list(),
        usersApi.audit(),
      ]);
      setUsers(loadedUsers);
      setAudit(loadedAudit);
    } catch (requestError) {
      setError(errorMessage(requestError, "No pudimos cargar los usuarios."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return users.filter((candidate) => {
      const matchesText =
        !term ||
        candidate.displayName.toLocaleLowerCase("es").includes(term) ||
        candidate.username.toLocaleLowerCase("es").includes(term);
      const matchesRole = roleFilter === "ALL" || candidate.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? candidate.active : !candidate.active);
      return matchesText && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleUsers = filteredUsers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => setPage(1), [roleFilter, search, statusFilter]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (createForm.password !== createConfirmation) {
      notify("Las contraseñas no coinciden.", "ERROR");
      return;
    }
    if (new TextEncoder().encode(createForm.password).length > 72) {
      notify("La contraseña no puede superar 72 bytes.", "ERROR");
      return;
    }

    setIsCreating(true);
    try {
      const created = await usersApi.create(createForm);
      setUsers((items) => [...items, created]);
      setCreateForm(emptyCreateForm);
      setCreateConfirmation("");
      setShowCreate(false);
      notify("Usuario creado correctamente.");
      const loadedAudit = await usersApi.audit();
      setAudit(loadedAudit);
    } catch (requestError) {
      notify(
        errorMessage(requestError, "No fue posible crear el usuario."),
        "ERROR",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const openEditor = (selected: AuthUser) => {
    setEditing(selected);
    setEditForm({
      displayName: selected.displayName,
      role: selected.role,
      active: selected.active,
    });
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (
      editing.active &&
      !editForm.active &&
      !window.confirm(
        `¿Desactivar a ${editing.displayName}? Ya no podrá iniciar sesión.`,
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await usersApi.update(editing.id, editForm);
      setUsers((items) =>
        items.map((candidate) =>
          candidate.id === updated.id ? updated : candidate,
        ),
      );
      setEditing(null);
      notify("Acceso actualizado. Sus sesiones anteriores fueron revocadas.");
      setAudit(await usersApi.audit());
    } catch (requestError) {
      notify(
        errorMessage(requestError, "No fue posible actualizar el usuario."),
        "ERROR",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openPasswordReset = (selected: AuthUser) => {
    setPasswordUser(selected);
    setPassword("");
    setPasswordConfirmation("");
  };

  const handlePasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwordUser) return;
    if (password !== passwordConfirmation) {
      notify("Las contraseñas no coinciden.", "ERROR");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      notify("La contraseña no puede superar 72 bytes.", "ERROR");
      return;
    }

    setIsSaving(true);
    try {
      await usersApi.resetPassword(passwordUser.id, password);
      notify(
        "Contraseña actualizada. Las sesiones anteriores fueron revocadas.",
      );
      if (passwordUser.id === currentUser?.id) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }
      setPasswordUser(null);
      setAudit(await usersApi.audit());
    } catch (requestError) {
      notify(
        errorMessage(requestError, "No fue posible restablecer la contraseña."),
        "ERROR",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 sm:text-sm">
            Administración
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
            Usuarios y accesos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Crea cuentas, asigna permisos y revoca accesos sin eliminar su
            historial.
          </p>
        </div>
        <button
          className="min-h-11 rounded-xl bg-indigo-700 px-5 text-sm font-bold text-white shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          onClick={() => setShowCreate((visible) => !visible)}
          type="button"
        >
          {showCreate ? "Cancelar" : "+ Nuevo usuario"}
        </button>
      </div>

      {showCreate ? (
        <form
          className="mt-6 rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm sm:p-6"
          onSubmit={handleCreate}
        >
          <div>
            <h2 className="text-lg font-black text-slate-900">Crear usuario</h2>
            <p className="mt-1 text-sm text-slate-600">
              La contraseña debe tener entre 12 y 72 caracteres.
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label>
              <FieldLabel>Nombre completo</FieldLabel>
              <input
                autoComplete="name"
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                maxLength={100}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    displayName: event.target.value,
                  }))
                }
                required
                value={createForm.displayName}
              />
            </label>
            <label>
              <FieldLabel>Usuario</FieldLabel>
              <input
                autoCapitalize="none"
                autoComplete="username"
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                maxLength={40}
                minLength={3}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    username: event.target.value,
                  }))
                }
                pattern="[A-Za-z0-9][A-Za-z0-9._-]*"
                required
                value={createForm.username}
              />
            </label>
            <label>
              <FieldLabel>Rol</FieldLabel>
              <select
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    role: event.target.value as UserRole,
                  }))
                }
                value={createForm.role}
              >
                <option value="LEARNER">Participante</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
            <label>
              <FieldLabel>Contraseña temporal</FieldLabel>
              <input
                autoComplete="new-password"
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                minLength={12}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    password: event.target.value,
                  }))
                }
                required
                type="password"
                value={createForm.password}
              />
            </label>
            <label>
              <FieldLabel>Confirmar contraseña</FieldLabel>
              <input
                autoComplete="new-password"
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                minLength={12}
                onChange={(event) => setCreateConfirmation(event.target.value)}
                required
                type="password"
                value={createConfirmation}
              />
            </label>
          </div>
          <button
            className="mt-5 min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white disabled:opacity-50"
            disabled={isCreating}
            type="submit"
          >
            {isCreating ? "Creando…" : "Crear cuenta"}
          </button>
        </form>
      ) : null}

      {error ? (
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800"
          role="alert"
        >
          <span>{error}</span>
          <button
            className="underline"
            onClick={() => void loadData()}
            type="button"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-900">Cuentas</h2>
              <p className="mt-1 text-xs text-slate-500">
                {filteredUsers.length} de {users.length} usuarios
              </p>
            </div>
            <button
              className="rounded-lg px-3 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50"
              onClick={() => setShowAudit((visible) => !visible)}
              type="button"
            >
              {showAudit ? "Ocultar actividad" : "Ver actividad"}
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
            <label>
              <span className="sr-only">Buscar usuarios</span>
              <input
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o usuario…"
                type="search"
                value={search}
              />
            </label>
            <label>
              <span className="sr-only">Filtrar por rol</span>
              <select
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
                onChange={(event) =>
                  setRoleFilter(event.target.value as typeof roleFilter)
                }
                value={roleFilter}
              >
                <option value="ALL">Todos los roles</option>
                <option value="ADMIN">Administradores</option>
                <option value="LEARNER">Participantes</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filtrar por estado</span>
              <select
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
                onChange={(event) =>
                  setStatusFilter(event.target.value as typeof statusFilter)
                }
                value={statusFilter}
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </label>
          </div>
        </div>

        {showAudit ? (
          <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
            <h3 className="text-sm font-black text-slate-900">
              Actividad reciente
            </h3>
            <ul className="mt-3 grid gap-2 lg:grid-cols-2">
              {audit.slice(0, 10).map((event) => {
                const target = users.find(
                  (candidate) => candidate.id === event.targetUserId,
                );
                return (
                  <li
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    key={event.id}
                  >
                    <span className="font-bold text-slate-800">
                      {auditLabel(event.action)}
                    </span>
                    <span className="text-slate-500">
                      {" · "}
                      {target?.displayName ?? event.targetUserId}
                      {" · "}
                      {new Date(event.createdAt).toLocaleString("es")}
                    </span>
                  </li>
                );
              })}
              {audit.length === 0 ? (
                <li className="text-sm text-slate-500">
                  No hay actividad registrada.
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        <div className="space-y-3 p-4 md:hidden">
          {visibleUsers.map((candidate) => (
            <article
              className="rounded-xl border border-slate-200 p-4"
              key={candidate.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-slate-900">
                    {candidate.displayName}
                  </h3>
                  <p className="truncate text-sm text-slate-500">
                    @{candidate.username}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${candidate.active ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 text-slate-600"}`}
                >
                  {candidate.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                {roleLabel(candidate.role)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  className="min-h-11 rounded-xl border border-slate-300 text-sm font-bold"
                  onClick={() => openEditor(candidate)}
                  type="button"
                >
                  Editar acceso
                </button>
                <button
                  className="min-h-11 rounded-xl border border-slate-300 text-sm font-bold"
                  onClick={() => openPasswordReset(candidate)}
                  type="button"
                >
                  Contraseña
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Actualizado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((candidate) => (
                <tr className="hover:bg-slate-50" key={candidate.id}>
                  <td className="px-5 py-3">
                    <p className="font-bold text-slate-900">
                      {candidate.displayName}
                    </p>
                    <p className="text-xs text-slate-500">
                      @{candidate.username}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {roleLabel(candidate.role)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${candidate.active ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 text-slate-600"}`}
                    >
                      {candidate.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(candidate.updatedAt).toLocaleDateString("es")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-2 font-semibold hover:bg-slate-50"
                        onClick={() => openEditor(candidate)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-2 font-semibold hover:bg-slate-50"
                        onClick={() => openPasswordReset(candidate)}
                        type="button"
                      >
                        Contraseña
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && visibleUsers.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No hay usuarios que coincidan con los filtros.
          </p>
        ) : null}
        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Cargando usuarios…
          </p>
        ) : null}

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm sm:px-5">
          <span className="shrink-0 text-slate-500">
            <span className="sm:hidden">
              {safePage} / {totalPages}
            </span>
            <span className="hidden sm:inline">
              Página {safePage} de {totalPages}
            </span>
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
          className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/50 p-0 sm:place-items-center sm:p-4"
          role="presentation"
        >
          <form
            aria-label="Editar acceso"
            aria-modal="true"
            className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
            onSubmit={handleUpdate}
            role="dialog"
          >
            <h2 className="text-xl font-black text-slate-950">Editar acceso</h2>
            <p className="mt-1 text-sm text-slate-500">@{editing.username}</p>
            <label className="mt-5 block">
              <FieldLabel>Nombre completo</FieldLabel>
              <input
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
                maxLength={100}
                onChange={(event) =>
                  setEditForm((form) => ({
                    ...form,
                    displayName: event.target.value,
                  }))
                }
                required
                value={editForm.displayName}
              />
            </label>
            <label className="mt-4 block">
              <FieldLabel>Rol</FieldLabel>
              <select
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 disabled:bg-slate-100"
                disabled={editing.id === currentUser?.id}
                onChange={(event) =>
                  setEditForm((form) => ({
                    ...form,
                    role: event.target.value as UserRole,
                  }))
                }
                value={editForm.role}
              >
                <option value="LEARNER">Participante</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
            <label className="mt-4 flex min-h-12 items-center justify-between rounded-xl border border-slate-200 px-3">
              <span>
                <span className="block text-sm font-bold text-slate-800">
                  Cuenta activa
                </span>
                <span className="block text-xs text-slate-500">
                  Permite iniciar sesión
                </span>
              </span>
              <input
                checked={editForm.active}
                className="size-5 accent-indigo-700"
                disabled={editing.id === currentUser?.id}
                onChange={(event) =>
                  setEditForm((form) => ({
                    ...form,
                    active: event.target.checked,
                  }))
                }
                type="checkbox"
              />
            </label>
            {editing.id === currentUser?.id ? (
              <p className="mt-2 text-xs text-amber-700">
                Por seguridad no puedes cambiar tu propio rol ni desactivar tu
                cuenta.
              </p>
            ) : null}
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

      {passwordUser ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/50 p-0 sm:place-items-center sm:p-4"
          role="presentation"
        >
          <form
            aria-label="Restablecer contraseña"
            aria-modal="true"
            className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
            onSubmit={handlePasswordReset}
            role="dialog"
          >
            <h2 className="text-xl font-black text-slate-950">
              Restablecer contraseña
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {passwordUser.displayName} · @{passwordUser.username}
            </p>
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              Al guardar, todas las sesiones actuales de esta cuenta serán
              revocadas.
            </p>
            <label className="mt-5 block">
              <FieldLabel>Nueva contraseña</FieldLabel>
              <input
                autoComplete="new-password"
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
                minLength={12}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            <label className="mt-4 block">
              <FieldLabel>Confirmar contraseña</FieldLabel>
              <input
                autoComplete="new-password"
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
                minLength={12}
                onChange={(event) =>
                  setPasswordConfirmation(event.target.value)
                }
                required
                type="password"
                value={passwordConfirmation}
              />
            </label>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="min-h-11 rounded-xl border border-slate-300 font-bold"
                onClick={() => setPasswordUser(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="min-h-11 rounded-xl bg-slate-950 font-bold text-white disabled:opacity-50"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Guardando…" : "Restablecer"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
