import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./api/auth", () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  },
}));

describe("App authentication routes", () => {
  beforeEach(() => sessionStorage.clear());

  it("renders the login form on the public route", async () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole(
        "heading",
        { name: /iniciar sesión/i },
        { timeout: 4_000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it("redirects an unauthenticated visitor to login", async () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole(
        "heading",
        { name: /iniciar sesión/i },
        { timeout: 4_000 },
      ),
    ).toBeInTheDocument();
  });
});
