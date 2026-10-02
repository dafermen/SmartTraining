import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "../contexts/AuthContext";
import { AppLayout } from "./AppLayout";

vi.mock("../contexts/AuthContext", () => ({ useAuth: vi.fn() }));

const admin = {
  id: "admin-id",
  username: "admin",
  role: "ADMIN" as const,
  displayName: "Administrador de demostración",
  active: true,
  createdAt: "2026-07-17T00:00:00.000Z",
  updatedAt: "2026-07-17T00:00:00.000Z",
};

describe("AppLayout responsive navigation", () => {
  it("keeps every primary administrator destination in the mobile navigation", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: admin,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/admin" element={<p>Contenido</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Navegación móvil",
    });
    expect(
      within(mobileNavigation).getByRole("link", { name: /panel/i }),
    ).toHaveAttribute("href", "/admin");
    expect(
      within(mobileNavigation).getByRole("link", { name: /cursos/i }),
    ).toHaveAttribute("href", "/admin/content");
    expect(
      within(mobileNavigation).getByRole("link", { name: /progreso/i }),
    ).toHaveAttribute("href", "/admin/progress");
    expect(
      within(mobileNavigation).getByRole("link", { name: /usuarios/i }),
    ).toHaveAttribute("href", "/admin/users");
    expect(
      within(mobileNavigation).getByRole("link", { name: /ayuda/i }),
    ).toHaveAttribute("href", "/docs");
    expect(screen.getByRole("button", { name: /salir/i })).toBeInTheDocument();
  });
});
