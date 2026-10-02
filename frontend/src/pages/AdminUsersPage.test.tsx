import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usersApi } from "../api/users";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import type { AuthUser } from "../types/api";
import { AdminUsersPage } from "./AdminUsersPage";

vi.mock("../api/users", () => ({
  usersApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    resetPassword: vi.fn(),
    audit: vi.fn(),
  },
}));
vi.mock("../contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../contexts/ToastContext", () => ({ useToast: vi.fn() }));

const admin: AuthUser = {
  id: "seed-admin",
  username: "admin",
  displayName: "Administradora",
  role: "ADMIN",
  active: true,
  createdAt: "2026-07-18T00:00:00.000Z",
  updatedAt: "2026-07-18T00:00:00.000Z",
};

describe("AdminUsersPage", () => {
  const notify = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: admin,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(useToast).mockReturnValue({ notify });
    vi.mocked(usersApi.list).mockResolvedValue([admin]);
    vi.mocked(usersApi.audit).mockResolvedValue([]);
  });

  it("shows the secured user directory", async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /usuarios y accesos/i }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText("Administradora")).not.toHaveLength(0);
    expect(screen.getAllByText("Administrador")).not.toHaveLength(0);
    expect(
      screen.getByPlaceholderText(/buscar por nombre/i),
    ).toBeInTheDocument();
  });

  it("creates a participant with password confirmation", async () => {
    const created: AuthUser = {
      ...admin,
      id: "new-id",
      username: "maria.perez",
      displayName: "María Pérez",
      role: "LEARNER",
    };
    vi.mocked(usersApi.create).mockResolvedValue(created);
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );
    await screen.findAllByText("Administradora");

    fireEvent.click(screen.getByRole("button", { name: /nuevo usuario/i }));
    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: "María Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/^usuario$/i), {
      target: { value: "maria.perez" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña temporal/i), {
      target: { value: "secure-password-123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "secure-password-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() =>
      expect(usersApi.create).toHaveBeenCalledWith({
        username: "maria.perez",
        displayName: "María Pérez",
        role: "LEARNER",
        password: "secure-password-123",
      }),
    );
    expect(notify).toHaveBeenCalledWith("Usuario creado correctamente.");
  });
});
